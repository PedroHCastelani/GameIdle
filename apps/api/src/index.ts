import { config } from 'dotenv';
import { fileURLToPath } from 'node:url';
import { buildServer } from './server.js';

config({ path: fileURLToPath(new URL('../../../.env', import.meta.url)) });

async function main() {
  const server = await buildServer();

  const port = Number(process.env.API_PORT) || 3333;
  const host = process.env.API_HOST || '127.0.0.1';

  if (process.env.LOCAL_PROTOTYPE === 'true' && !['127.0.0.1', 'localhost', '::1'].includes(host)) throw new Error('Local prototype requires a loopback API_HOST');

  process.once('SIGINT', () => { void server.close(); });
  process.once('SIGTERM', () => { void server.close(); });

  try {
    await server.listen({ port, host });
    server.log.info({ port }, 'API ready');
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}

void main().catch(err => { console.error(err); process.exitCode = 1; });
