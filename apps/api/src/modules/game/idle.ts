import { ApiError } from '../../lib/security.js';

export function calculateIdle(input: {
  since: Date; now: Date; premium: boolean; duration: number; goldMin: number; goldMax: number; exp: number;
}) {
  const elapsed = input.now.getTime() - input.since.getTime();
  if (elapsed < 0) throw new ApiError(409, 'Relógio de progresso inválido.');
  if (!Number.isSafeInteger(input.duration) || input.duration <= 0 ||
      ![input.goldMin, input.goldMax, input.exp].every(n => Number.isSafeInteger(n) && n >= 0) || input.goldMax < input.goldMin) {
    throw new ApiError(409, 'Missão com configuração inválida.');
  }
  const capped = Math.min(elapsed, (input.premium ? 24 : 12) * 3600000);
  const cycleMs = input.duration * 1000;
  const cycles = Math.floor(capped / cycleMs);
  return {
    cycles,
    gold: BigInt(Math.floor((input.goldMin + input.goldMax) / 2)) * BigInt(cycles),
    exp: BigInt(input.exp) * BigInt(cycles),
    cursor: new Date(input.now.getTime() - capped % cycleMs),
    capped: elapsed > capped,
  };
}

export function levelFromExperience(experience: bigint, current: number) {
  // Integer comparisons avoid precision loss for persisted BigInt balances.
  let low = BigInt(current), high = low;
  while (100n * high * high <= experience) high *= 2n;
  while (low < high) {
    const mid = (low + high) / 2n;
    if (100n * mid * mid <= experience) low = mid + 1n;
    else high = mid;
  }
  return Number(low);
}
