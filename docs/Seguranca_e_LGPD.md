# 🔐 Segurança e LGPD — The Life
**Versão:** 0.5  
**Prioridade:** MÁXIMA — segurança é o primeiro requisito do projeto

---

## Princípio Geral

> Segurança não é uma feature — é a fundação. Nenhuma funcionalidade de jogo é implementada sem que a camada de segurança correspondente esteja validada primeiro.

---

## 1. LGPD — Conformidade Integral

### Base Legal para Cada Dado

| Dado | Finalidade | Base Legal (LGPD Art. 7) | Retenção |
|---|---|---|---|
| E-mail | Autenticação, recuperação de conta | Execução de contrato (VII) | Conta ativa + 90 dias |
| CPF (hash) | Unicidade, prevenção de fraude | Legítimo interesse (IX) | Conta ativa + 5 anos |
| IP de login | Segurança, anti-fraude | Legítimo interesse (IX) | 90 dias |
| User-agent | Segurança de sessão | Legítimo interesse (IX) | 90 dias |
| Progresso de jogo | Prestação do serviço | Execução de contrato (V) | Conta ativa |
| Logs econômicos | Auditoria e integridade | Obrigação legal (II) | 5 anos (imutável) |
| Logs de segurança | Prevenção de fraude | Legítimo interesse (IX) | 1 ano |
| Dados de pagamento | Processamento financeiro | Execução de contrato (V) | Nunca armazenados localmente |

### Direitos do Titular (Art. 18)

```
GET  /api/account/data-export     → exporta todos os dados em JSON (Art. 18, IV)
POST /api/account/delete          → solicita exclusão (Art. 18, VI) — 30 dias de carência
POST /api/account/correct-email   → corrige dado incorreto (Art. 18, III)
GET  /api/account/processing-info → informa como os dados são usados (Art. 18, I)
```

**Fluxo de exclusão:**
```
1. Usuário solicita exclusão
2. Período de carência: 30 dias (pode cancelar dentro desse prazo)
3. Após 30 dias:
   a. Dados pessoais deletados: e-mail, CPF hash, IP logs, user-agent
   b. Logs econômicos: anonimizados (characterId substituído por UUID aleatório)
   c. Logs de segurança: anonimizados
   d. Progresso de jogo: deletado
   e. Registro de conta: deletado
   f. CPF hash permanece em tabela de banimentos por 5 anos (obrigação legal — prevenção de fraude)
```

### Consentimento e Transparência
- Política de Privacidade obrigatória antes do registro (checkbox com link)
- Linguagem simples e objetiva — sem juridiquês
- Versão datada — toda alteração notificada por e-mail 15 dias antes
- DPO (Data Protection Officer) designado antes do lançamento — pode ser terceirizado inicialmente

---

## 2. CPF — Armazenamento Seguro

O CPF **nunca é armazenado em texto plano**. Apenas seu hash é persistido.

```typescript
import { createHash, randomBytes } from 'crypto';

function hashCpf(cpf: string, salt: string): string {
  // Remove formatação (pontos e traço)
  const normalized = cpf.replace(/[.\-]/g, '');
  return createHash('sha256').update(normalized + salt).digest('hex');
}

async function registerUser(email: string, password: string, cpf: string) {
  // 1. Validar CPF (formato e dígitos verificadores)
  if (!isValidCpf(cpf)) throw new BadRequestError('CPF inválido');

  // 2. Verificar unicidade via hash
  const salt    = randomBytes(16).toString('hex');
  const cpfHash = hashCpf(cpf, salt);

  const existing = await db.user.findUnique({ where: { cpfHash } });
  if (existing) throw new ConflictError('CPF já cadastrado');

  // 3. Criar conta — CPF original descartado imediatamente após o hash
  return await db.user.create({
    data: { email, passwordHash: await bcrypt.hash(password, 12),
            cpfHash, cpfSalt: salt }
  });
}
```

**Por que SHA-256 com salt e não bcrypt para CPF?**
CPF tem espaço de busca limitado (apenas ~1 bilhão de CPFs válidos). Bcrypt é lento por design, mas salt único por conta já previne rainbow tables. SHA-256 com salt é suficiente para unicidade e previne a reversão em escala.

### Validação de CPF (formato + dígitos)
```typescript
function isValidCpf(cpf: string): boolean {
  const clean = cpf.replace(/[.\-]/g, '');
  if (clean.length !== 11 || /^(\d)\1{10}$/.test(clean)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(clean[i]) * (10 - i);
  let d1 = 11 - (sum % 11);
  if (d1 >= 10) d1 = 0;

  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(clean[i]) * (11 - i);
  let d2 = 11 - (sum % 11);
  if (d2 >= 10) d2 = 0;

  return parseInt(clean[9]) === d1 && parseInt(clean[10]) === d2;
}
```

---

## 3. AUTENTICAÇÃO

### Fluxo de Tokens
```
Login → access_token (JWT, 15min) + refresh_token (opaque, 30 dias)
           ↓
Toda requisição: Authorization: Bearer {access_token}
           ↓
Token expirado → POST /auth/refresh com cookie HttpOnly
           ↓
Refresh usado → novo access_token + NOVO refresh_token (rotation)
           ↓
Refresh antigo invalidado no Redis imediatamente
```

### Estrutura do JWT
```json
{
  "sub": "user_cuid",
  "sessionId": "sess_cuid",
  "iat": 1720000000,
  "exp": 1720000900
}
```

**Nunca no JWT:** e-mail, CPF, saldo, dados mutáveis de personagem.

### Armazenamento no Cliente
- **Access token:** memória JavaScript (Zustand store) — não em localStorage
- **Refresh token:** cookie `HttpOnly; Secure; SameSite=Strict` — inacessível via JS

### Sessão Única
```typescript
// Todo login invalida todas as sessões anteriores da conta
async function loginAndInvalidatePreviousSessions(userId: string, deviceInfo: string) {
  const existing = await db.session.findMany({ where: { userId } });

  // Notificar via WebSocket (se conectado) antes de invalidar
  for (const sess of existing) {
    await redis.publish(`session:terminate:${sess.id}`, JSON.stringify({
      reason: 'NEW_LOGIN',
      message: 'Sessão encerrada — novo login detectado em outro dispositivo.'
    }));
  }

  await sleep(200); // garantir entrega

  await db.session.deleteMany({ where: { userId } });
  for (const sess of existing) await redis.del(`session:${sess.id}`);

  await logSecurityEvent(userId, 'FORCED_LOGOUT_ALL_SESSIONS', { count: existing.length });
}
```

---

## 4. CAMADAS DE SEGURANÇA

### Camada 1 — Rede (Cloudflare)
- DDoS protection — absorve ataques antes de chegar ao servidor
- WAF — bloqueia SQLi, XSS, path traversal
- Turnstile CAPTCHA — registro de conta (invisível para humanos)
- Rate limiting por IP — nível de rede, sem custo de servidor
- IP real via `CF-Connecting-IP` — nunca confiar em `X-Forwarded-For`

### Camada 2 — Aplicação
```
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Content-Security-Policy: default-src 'self'; img-src 'self' https://cdn.thelife.gg
Referrer-Policy: no-referrer
Permissions-Policy: geolocation=(), microphone=(), camera=()
```

### Camada 3 — Lógica de Negócio (Anti-Cheat)

**Validação de delta time:**
```typescript
if (deltaSeconds < 0)      → flag NEGATIVE_DELTA, rejeitar
if (deltaSeconds > 604800) → flag EXCESSIVE_DELTA (7 dias), processar só o cap
```

**Rate limiting por conta:**
```typescript
await checkRateLimit(userId, 'hunt:start',   10, 60);  // 10/min
await checkRateLimit(userId, 'market:buy',    5, 60);  // 5/min
await checkRateLimit(userId, 'bribe:attempt', 3, 3600); // 3/hora
await checkRateLimit(userId, 'auth:login',   10, 60);  // 10/min por IP
```

**Todo cálculo de jogo é server-side:**
- Cliente apenas renderiza — nunca calcula resultado de missão, PvP ou buff
- Qualquer dado enviado pelo cliente que afete cálculo é revalidado no servidor

### Camada 4 — Auditoria e Detecção de Anomalias

**Jobs de detecção (rodam a cada hora):**
```typescript
// Gold impossível acumulado em 1 hora
SELECT character_id, SUM(gold_amount)
FROM economy_logs
WHERE type = 'MISSION_REWARD' AND created_at > NOW() - INTERVAL '1 hour'
GROUP BY character_id
HAVING SUM(gold_amount) > [threshold baseado no nível máximo × missão mais lucrativa]

// Tentativas excessivas de propina (possível bot)
SELECT prisoner_id, COUNT(*)
FROM prison_bribes
WHERE attempted_at > NOW() - INTERVAL '1 hour'
GROUP BY prisoner_id
HAVING COUNT(*) > 5

// Mudanças de alinhamento suspeitas
SELECT character_id, COUNT(*)
FROM economy_logs
WHERE type IN ('ALIGNMENT_CHANGE_FEE', 'ALIGNMENT_CHANGE_PENALTY')
  AND created_at > NOW() - INTERVAL '7 days'
GROUP BY character_id
HAVING COUNT(*) > 1  // mais de 1 mudança na semana = bypassed cooldown?
```

**Sistema de flags:**
Flags acumulam por conta/personagem. N flags = revisão manual. Banimento sempre manual — nunca automático.

---

## 5. PROTEÇÃO DE DADOS DE PAGAMENTO

- Dados de cartão **nunca chegam ao servidor** — tokenizados diretamente no gateway (Stripe.js / MercadoPago SDK)
- Servidor recebe apenas o token e o resultado do pagamento
- Certificação PCI-DSS: responsabilidade do gateway, não do jogo
- Webhook de pagamento validado via assinatura HMAC (nunca confiar em payload sem validar assinatura)

```typescript
// Validar webhook do Stripe
function validateStripeWebhook(payload: Buffer, signature: string): boolean {
  const secret  = process.env.STRIPE_WEBHOOK_SECRET!;
  const event   = stripe.webhooks.constructEvent(payload, signature, secret);
  return !!event; // lança exceção se inválido
}
```

---

## 6. SEGURANÇA DO CÓDIGO-FONTE

### Repositório
- Repositório privado (GitHub / GitLab com 2FA obrigatório para todos os colaboradores)
- Branch protection em `main` — nenhum push direto, apenas PR com review
- Secrets nunca comitados — `.env` no `.gitignore`, segredos via variáveis de ambiente do CI/CD
- Dependabot ativo — alertas de vulnerabilidades em dependências

### Secrets em Produção
- Variáveis de ambiente injetadas via plataforma de deploy (Railway, Fly.io, etc.)
- Rotação semestral de: JWT_SECRET, COOKIE_SECRET, chaves de API
- Logs de produção **nunca** registram: senhas, tokens, CPF, dados de cartão

### Revisão de Segurança
- OWASP Top 10 checado antes de cada release
- Dependências auditadas: `pnpm audit` no CI/CD (falha se vulnerabilidade crítica)
- Penetration test planejado antes do lançamento público

---

## 7. LOG DE SEGURANÇA

```typescript
// Tabela separada — eventos de segurança para auditoria
model SecurityLog {
  id        String   @id @default(cuid())
  userId    String?
  event     String   // 'LOGIN', 'FAILED_LOGIN', 'FORCED_LOGOUT', 'CPF_CONFLICT', etc.
  ipAddress String?
  metadata  Json?
  createdAt DateTime @default(now())

  @@index([userId, createdAt])
  @@index([event, createdAt])
  @@map("security_logs")
}

// Eventos registrados:
// LOGIN_SUCCESS, LOGIN_FAILED, LOGOUT, FORCED_LOGOUT_ALL_SESSIONS
// PASSWORD_CHANGED, EMAIL_CHANGED, ACCOUNT_DELETED
// CPF_DUPLICATE_ATTEMPT, BANNED_CPF_ATTEMPT
// RATE_LIMIT_EXCEEDED, ANOMALY_FLAGGED
// DATA_EXPORT_REQUESTED, DATA_EXPORT_COMPLETED
// DELETION_REQUESTED, DELETION_EXECUTED
```
