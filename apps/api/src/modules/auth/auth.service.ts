import { randomUUID } from 'node:crypto';
import { Prisma, type PrismaClient } from '@prisma/client';
import { ApiError, hashPassword, newToken, tokenHash, verifyPassword } from '../../lib/security.js';

export async function lockUser(tx: Prisma.TransactionClient, id: string) {
  await tx.$queryRaw`SELECT id FROM users WHERE id = ${id} FOR UPDATE`;
}

export function authService(db: PrismaClient) {
  async function newSession(tx: Prisma.TransactionClient, userId: string) {
    await tx.session.deleteMany({ where: { userId } });
    const refresh = newToken();
    const session = await tx.session.create({ data: {
      userId, refreshToken: tokenHash(refresh), expiresAt: new Date(Date.now() + 30 * 86400000),
    } });
    return { userId, sessionId: session.id, refresh };
  }
  return {
    async register(email: string, password: string) {
      const passwordHash = await hashPassword(password);
      try {
        return await db.$transaction(async tx => {
          const user = await tx.user.create({ data: {
            email, passwordHash, cpfHash: `prototype:${randomUUID()}`, cpfSalt: 'NOT_A_CPF',
          } });
          return newSession(tx, user.id);
        });
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
          throw new ApiError(409, 'Não foi possível criar a conta com esses dados.');
        }
        throw error;
      }
    },
    async login(email: string, password: string) {
      const user = await db.user.findUnique({ where: { email } });
      // Perform a password derivation even for unknown accounts.
      const valid = user ? await verifyPassword(password, user.passwordHash) : Boolean(await hashPassword(password)) && false;
      if (!user || !valid || user.isBanned) throw new ApiError(401, 'Credenciais inválidas.');
      return db.$transaction(async tx => {
        await lockUser(tx, user.id);
        const current = await tx.user.findUniqueOrThrow({ where: { id: user.id } });
        if (current.isBanned) throw new ApiError(401, 'Credenciais inválidas.');
        return newSession(tx, user.id);
      });
    },
    async refresh(raw: string) {
      const hash = tokenHash(raw);
      const candidate = await db.session.findUnique({ where: { refreshToken: hash } });
      if (!candidate) throw new ApiError(401, 'Sessão encerrada. Entre novamente.');
      return db.$transaction(async tx => {
        await lockUser(tx, candidate.userId);
        const session = await tx.session.findUnique({ where: { refreshToken: hash }, include: { user: true } });
        if (!session || session.expiresAt <= new Date() || session.user.isBanned) {
          throw new ApiError(401, 'Sessão encerrada. Entre novamente.');
        }
        const refresh = newToken();
        await tx.session.update({ where: { id: session.id }, data: { refreshToken: tokenHash(refresh) } });
        return { userId: session.userId, sessionId: session.id, refresh };
      });
    },
    async logout(raw: string) {
      const hash = tokenHash(raw);
      const session = await db.session.findUnique({ where: { refreshToken: hash } });
      if (!session) return;
      await db.$transaction(async tx => {
        await lockUser(tx, session.userId);
        await tx.session.deleteMany({ where: { id: session.id, refreshToken: hash } });
      });
    },
  };
}
