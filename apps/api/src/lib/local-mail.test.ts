import { mkdtemp, readdir, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect, it, vi } from 'vitest';
import { localMailbox } from './local-mail.js';

it('writes only to a private local inbox and refuses production delivery', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'gameidle-mail-'));
  try {
    vi.stubEnv('LOCAL_PROTOTYPE', 'true'); vi.stubEnv('NODE_ENV', 'test');
    const deliver = localMailbox(directory);
    const message = { to: 'fixture@example.test', purpose: 'VERIFY_EMAIL' as const, code: 'fixture-code', expiresAt: new Date() };
    await deliver(message);
    const files = await readdir(directory);
    expect(files).toHaveLength(1);
    expect(JSON.parse(await readFile(join(directory, files[0]), 'utf8'))).toMatchObject({ to: message.to, code: message.code });
    vi.stubEnv('NODE_ENV', 'production');
    await expect(deliver(message)).rejects.toThrow('Local mailbox');
  } finally { vi.unstubAllEnvs(); await rm(directory, { recursive: true, force: true }); }
});
