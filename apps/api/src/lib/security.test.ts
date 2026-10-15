import { describe, expect, it } from 'vitest';
import { hashPassword, verifyPassword, tokenHash, newToken, publicJson } from './security.js';
describe('credentials', () => {
  it('salts passwords and compares derived keys', async () => {
    const a = await hashPassword('test-password'); const b = await hashPassword('test-password');
    expect(a).not.toBe(b); expect(a).not.toContain('test-password');
    expect(await verifyPassword('test-password', a)).toBe(true);
    expect(await verifyPassword('wrong-password', a)).toBe(false);
    expect(await verifyPassword('test-password', 'broken')).toBe(false);
    expect(await verifyPassword('test-password', 'scrypt:salt:00')).toBe(false);
  });
  it('uses random refresh tokens and serializes large integers exactly', () => {
    const a = newToken(); expect(a).not.toBe(newToken()); expect(tokenHash(a)).not.toBe(a);
    expect(publicJson({ gold: 9007199254740993n })).toEqual({ gold: '9007199254740993' });
  });
});
