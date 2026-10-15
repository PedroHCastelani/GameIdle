import type { Prisma } from '@prisma/client';
import { ApiError } from '../../lib/security.js';
export async function lockCharacter(tx: Prisma.TransactionClient, userId: string, id: string) {
  await tx.$queryRaw`SELECT id FROM characters WHERE id = ${id} AND "userId" = ${userId} FOR UPDATE`;
  const character = await tx.character.findFirst({ where: { id, userId } });
  if (!character) throw new ApiError(404, 'Personagem não encontrado.');
  return character;
}
