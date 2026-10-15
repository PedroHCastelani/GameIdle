import { describe, expect, it } from 'vitest';
import { calculateIdle, levelFromExperience } from './idle.js';
const base = { since: new Date(0), now: new Date(125000), premium: false, duration: 60, goldMin: 10, goldMax: 21, exp: 7 };
describe('idle calculation', () => {
  it('preserves partial cycles and calculates integer balances', () => {
    const result = calculateIdle(base);
    expect(result).toMatchObject({ cycles: 2, gold: 30n, exp: 14n, capped: false });
    expect(result.cursor.getTime()).toBe(120000);
    expect(calculateIdle({ ...base, since: result.cursor }).cycles).toBe(0);
  });
  it.each([[false, 720], [true, 1440]])('caps premium=%s at %s cycles', (premium, cycles) => {
    const result = calculateIdle({ ...base, premium, now: new Date(8 * 86400000 + 5000) });
    expect(result.cycles).toBe(cycles); expect(result.capped).toBe(true);
    expect(result.cursor.getTime()).toBe(8 * 86400000 + 5000);
  });
  it('handles zero time, exact boundaries and negative deltas', () => {
    expect(calculateIdle({ ...base, now: new Date(0) }).cycles).toBe(0);
    expect(calculateIdle({ ...base, now: new Date(60000) }).cycles).toBe(1);
    expect(() => calculateIdle({ ...base, now: new Date(-1) })).toThrow('Relógio');
  });
  it.each([{ duration: 0 }, { duration: -1 }, { goldMin: -1 }, { exp: -1 }, { goldMax: 5 }])('rejects invalid configuration %s', override => {
    expect(() => calculateIdle({ ...base, ...override })).toThrow('configuração');
  });
  it('calculates levels without losing BigInt precision or reducing existing levels', () => {
    expect(levelFromExperience(99n, 1)).toBe(1);
    expect(levelFromExperience(100n, 1)).toBe(2);
    expect(levelFromExperience(399n, 1)).toBe(2);
    expect(levelFromExperience(400n, 1)).toBe(3);
    expect(levelFromExperience(0n, 10)).toBe(10);
    expect(levelFromExperience(10000000000000000n, 1)).toBe(10000001);
  });
});
