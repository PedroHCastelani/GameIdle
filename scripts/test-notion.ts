import { Client } from '@notionhq/client';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Carrega as variáveis do .env na raiz do projeto
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const notionApiKey = process.env.NOTION_API_KEY;
const databaseId = process.env.NOTION_DATABASE_ID;

async function testConnection() {
  console.log('Iniciando teste de conexão com o Notion...');

  if (!notionApiKey) {
    console.error('Erro: NOTION_API_KEY não foi encontrada no arquivo .env.');
    process.exit(1);
  }

  if (!databaseId) {
    console.error('Erro: NOTION_DATABASE_ID não foi encontrada no arquivo .env.');
    process.exit(1);
  }

  try {
    const notion = new Client({ auth: notionApiKey });

    console.log('Buscando banco de dados no Notion...');
    const response = await notion.databases.retrieve({ database_id: databaseId });
    
    console.log('Conexão realizada com sucesso!');
    console.log(`Título do Banco de Dados: "${response.title?.[0]?.plain_text || 'Sem título'}"`);
    console.log('Propriedades encontradas:');
    Object.keys(response.properties).forEach((prop) => {
      console.log(` - ${prop} (${response.properties[prop].type})`);
    });
  } catch (error: any) {
    console.error('Erro ao conectar ao Notion:', error.message || error);
    process.exit(1);
  }
}

testConnection();
