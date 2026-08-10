# 9Router — Gateway de IA

> **Status:** Documentação para uso futuro (Fase 2+)
> **Fonte:** [9Router GitHub](https://github.com/decolua/9router)

---

## Visão Geral

9Router é um gateway de IA local/remoto que expõe uma API REST compatível com OpenAI. Funciona como um proxy unificado para múltiplos provedores de IA com uma única chave e fallback automático.

## Vantagens

- **Uma chave, muitos provedores** — Não precisa gerenciar múltiplas API keys
- **Fallback automático** — Se um provedor falha, tenta o próximo
- **Compatível com OpenAI SDK** — Drop-in replacement
- **Local ou remoto** — Pode rodar em localhost ou VPS

---

## Setup

```bash
export NINEROUTER_URL="http://localhost:20128"  # ou URL do VPS/tunnel
export NINEROUTER_KEY="sk-..."                   # do Dashboard → Keys
```

Todas as requisições: `${NINEROUTER_URL}/v1/...` com header `Authorization: Bearer ${NINEROUTER_KEY}`.

Verificar saúde:
```bash
curl $NINEROUTER_URL/api/health
# → {"ok":true}
```

---

## Descobrir Modelos

```bash
curl $NINEROUTER_URL/v1/models              # chat/LLM (default)
curl $NINEROUTER_URL/v1/models/image        # image-gen
curl $NINEROUTER_URL/v1/models/tts          # text-to-speech
curl $NINEROUTER_URL/v1/models/embedding    # embeddings
curl $NINEROUTER_URL/v1/models/web          # web search + fetch
curl $NINEROUTER_URL/v1/models/stt          # speech-to-text
curl $NINEROUTER_URL/v1/models/image-to-text # vision
```

---

## Capabilities

| Capacidade | Uso no The Life |
|---|---|
| **Chat / code-gen** | NPCs com diálogos dinâmicos, assistente in-game |
| **Image generation** | Geração de avatares, itens, assets visuais |
| **Text-to-speech** | Voz para personagens, acessibilidade |
| **Speech-to-text** | Comandos de voz, transcrição |
| **Embeddings** | Busca semântica, similaridade de itens |
| **Web search** | Pesquisa de informações em tempo real |
| **Web fetch** | Conversão de URLs para markdown |

---

## Integração no Backend (Fastify)

### Exemplo: Chat com NPC

```typescript
// apps/api/src/services/ai.service.ts
import axios from 'axios';

const NINEROUTER_URL = process.env.NINEROUTER_URL;
const NINEROUTER_KEY = process.env.NINEROUTER_KEY;

export async function chatWithNPC(prompt: string, context: string): Promise<string> {
  const response = await axios.post(
    `${NINEROUTER_URL}/v1/chat/completions`,
    {
      model: 'openai/gpt-4o-mini', // ou outro modelo disponível
      messages: [
        { role: 'system', content: context },
        { role: 'user', content: prompt },
      ],
      max_tokens: 500,
    },
    {
      headers: {
        'Authorization': `Bearer ${NINEROUTER_KEY}`,
        'Content-Type': 'application/json',
      },
    }
  );

  return response.data.choices[0].message.content;
}
```

### Exemplo: Moderação de Chat (AG-10)

```typescript
// apps/api/src/services/moderation.service.ts
export async function moderateContent(message: string): Promise<{ safe: boolean; reason?: string }> {
  const response = await axios.post(
    `${NINEROUTER_URL}/v1/chat/completions`,
    {
      model: 'openai/gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Você é um moderador de conteúdo. Analise se a mensagem contém: discurso de ódio, ameaças, conteúdo sexual, spam ou scams. Responda apenas com JSON: {"safe": boolean, "reason": string|null}',
        },
        { role: 'user', content: message },
      ],
      response_format: { type: 'json_object' },
    },
    {
      headers: {
        'Authorization': `Bearer ${NINEROUTER_KEY}`,
        'Content-Type': 'application/json',
      },
    }
  );

  return JSON.parse(response.data.choices[0].message.content);
}
```

---

## Tratamento de Erros

| Código | Ação |
|---|---|
| 401 | Verificar/renovar `NINEROUTER_KEY` |
| 400 `Invalid model format` | Verificar se modelo existe em `/v1/models/<kind>` |
| 503 `All accounts unavailable` | Aguardar `retry-after` ou adicionar outro provedor |

---

## Tasks Relacionadas

- **T-011** — AG-07 Session Guardian (pode usar embeddings)
- **T-060** — AG-10 Content Moderator (moderação com IA)
- **T-065+** — Sistema de NPCs com diálogos dinâmicos (Fase 2)
- **T-080+** — Geração de assets visuais com IA

---

## Referências

- [9Router GitHub](https://github.com/decolua/9router)
- Skills de capabilities:
  - Chat: `skills/9router-chat/SKILL.md`
  - Image: `skills/9router-image/SKILL.md`
  - TTS: `skills/9router-tts/SKILL.md`
  - Embeddings: `skills/9router-embeddings/SKILL.md`
  - Web Search: `skills/9router-web-search/SKILL.md`
