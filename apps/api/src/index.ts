import { buildServer } from './server.js';

async function main() {
  const server = await buildServer();

  const port = Number(process.env.API_PORT) || 3333;
  const host = process.env.API_HOST || '0.0.0.0';

  try {
    await server.listen({ port, host });
    console.log(`🚀 API rodando em http://${host}:${port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}

main();
