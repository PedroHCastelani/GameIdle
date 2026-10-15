import { mkdir, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { join, resolve } from 'node:path';
import type { DeliverMessage } from '../modules/auth/account.service.js';

// No HTTP endpoint exposes this inbox. It is available only to the local OS user.
export function localMailbox(directory = resolve(process.cwd(), '../../.local-mail')): DeliverMessage {
  return async message => {
    if (process.env.LOCAL_PROTOTYPE !== 'true' || process.env.NODE_ENV === 'production') throw new Error('Local mailbox requires local prototype');
    await mkdir(directory, { recursive: true, mode: 0o700 });
    await writeFile(join(directory, `${Date.now()}-${randomUUID()}.json`), JSON.stringify(message, null, 2), { mode: 0o600, flag: 'wx' });
  };
}
