import type { AccountTokenPurpose, PrismaClient } from '@prisma/client';
import { ApiError, hashPassword, newToken, tokenHash } from '../../lib/security.js';
import { lockUser } from './auth.service.js';

export type AccountMessage = { to: string; purpose: AccountTokenPurpose; code: string; expiresAt: Date };
export type DeliverMessage = (message: AccountMessage) => Promise<void>;
export const requestMessage = 'Se a conta estiver elegível, uma mensagem será disponibilizada. Confira a caixa local de testes.';
const invalid = () => new ApiError(400, 'Código inválido ou expirado. Solicite uma nova mensagem.');

export function accountService(db: PrismaClient, deliver: DeliverMessage) {
  async function issue(email: string, purpose: AccountTokenPurpose) {
    const candidate = await db.user.findUnique({ where: { email } });
    if (!candidate) return;
    await db.$transaction(async tx => {
      await lockUser(tx, candidate.id);
      const user = await tx.user.findUniqueOrThrow({ where: { id: candidate.id } });
      if (user.isBanned || (purpose === 'VERIFY_EMAIL' && user.emailVerified)) return;
      const previous = await tx.accountToken.findUnique({ where: { userId_purpose: { userId: user.id, purpose } } });
      if (previous && Date.now() - previous.createdAt.getTime() < 60000) return;
      const code = newToken();
      const expiresAt = new Date(Date.now() + (purpose === 'VERIFY_EMAIL' ? 86400000 : 1800000));
      await tx.accountToken.upsert({
        where: { userId_purpose: { userId: user.id, purpose } },
        create: { userId: user.id, purpose, tokenHash: tokenHash(code), expiresAt },
        update: { tokenHash: tokenHash(code), expiresAt, createdAt: new Date() },
      });
      // Local delivery is awaited: a failed write rolls back issuance. No real email transport here.
      await deliver({ to: user.email, purpose, code, expiresAt });
    });
  }
  async function consume(code: string, purpose: AccountTokenPurpose, passwordHash?: string) {
    const hash = tokenHash(code);
    const candidate = await db.accountToken.findUnique({ where: { tokenHash: hash } });
    if (!candidate || candidate.purpose !== purpose) throw invalid();
    await db.$transaction(async tx => {
      await lockUser(tx, candidate.userId);
      const record = await tx.accountToken.findUnique({ where: { tokenHash: hash }, include: { user: true } });
      if (!record || record.purpose !== purpose || record.expiresAt <= new Date() || record.user.isBanned) throw invalid();
      if (purpose === 'VERIFY_EMAIL') {
        await tx.user.update({ where: { id: record.userId }, data: { emailVerified: true } });
        await tx.accountToken.delete({ where: { id: record.id } });
      } else {
        await tx.user.update({ where: { id: record.userId }, data: { passwordHash } });
        await tx.session.deleteMany({ where: { userId: record.userId } });
        await tx.accountToken.deleteMany({ where: { userId: record.userId } });
      }
    });
  }
  return {
    requestReset: (email: string) => issue(email, 'RESET_PASSWORD'),
    async requestVerification(userId: string) {
      const user = await db.user.findUniqueOrThrow({ where: { id: userId } });
      await issue(user.email, 'VERIFY_EMAIL');
    },
    verify: (code: string) => consume(code, 'VERIFY_EMAIL'),
    async reset(code: string, password: string) { await consume(code, 'RESET_PASSWORD', await hashPassword(password)); },
  };
}
