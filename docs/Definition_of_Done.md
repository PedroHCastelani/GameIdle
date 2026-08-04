# ✅ Definition of Done — The Life
**Versão:** 1.0  
**Data:** Julho 2026

---

## O que é o Definition of Done

O DoD é o contrato que define quando uma task está **realmente** concluída. Não é subjetivo. Não depende de opinião. É uma lista checável — ou todos os itens aplicáveis estão marcados, ou a task não está pronta.

Nenhum Tech Lead aprova um PR sem DoD completo. Nenhum agente move uma task para Done sem confirmar cada item.

---

## DoD Universal — Toda task, sem exceção

```
[ ] O código implementa exatamente o que está nos critérios de aceite do card no Notion
[ ] Nenhum secret, CPF, token ou dado sensível aparece em logs ou código
[ ] pnpm lint passa sem erros ou warnings novos
[ ] pnpm typecheck passa sem erros novos
[ ] pnpm test passa sem falhas (nenhum teste existente quebrado)
[ ] TASKS.md atualizado: status, arquivos modificados, data de conclusão
[ ] Card no Notion atualizado: PR linkado, status movido para In Review
[ ] Tech Lead do escopo (Produto ou Infra) revisou e aprovou o PR
[ ] Branch mergeada em staging e deploy de staging bem-sucedido
```

---

## DoD por Tipo de Task

### Backend

```
[ ] Rota implementada com validação de schema via Zod
[ ] Autenticação verificada via middleware JWT (se rota protegida)
[ ] Rate limiting configurado no endpoint
[ ] Lógica de negócio no arquivo .service.ts, não na rota
[ ] Transação atômica via db.$transaction() onde múltiplas tabelas são afetadas
[ ] Log econômico criado (INSERT em economy_logs) para toda movimentação de gold ou créditos
[ ] Teste unitário do service (cobertura de linha ≥ 80% no módulo)
[ ] Teste de integração da rota:
    - Happy path: retorna 200 com dados corretos
    - Sem token: retorna 401
    - Token de outro usuário: retorna 403
    - Dados inválidos: retorna 400 com mensagem descritiva
    - Caso de borda relevante para a feature (ver lista no prompt do DEV-QA)
[ ] Nenhum console.log, console.error ou debugger no código mergeado
```

### Frontend

```
[ ] Funciona em viewport mobile 375px (testado, não apenas "responsivo no papel")
[ ] Funciona em viewport desktop 1280px
[ ] Loading state implementado para toda operação assíncrona
[ ] Error state implementado — usuário nunca vê tela branca ou erro não tratado
[ ] Zero lógica de negócio no componente (cálculos, validações de regra de jogo)
[ ] Token de acesso nunca em localStorage ou sessionStorage — apenas em memória (Zustand)
[ ] Chamadas de API exclusivamente via services/ — sem fetch direto em componente
[ ] Teste de componente:
    - Renderiza sem erros
    - Interação principal funciona (click, input, submit)
    - Estado de loading visível durante chamada
    - Estado de erro visível quando API falha
[ ] Sem console.error ou warning no browser durante uso normal
[ ] Acessibilidade básica: labels em inputs, alt em imagens, contraste mínimo AA
```

### Database

```
[ ] Migration criada com nome descritivo no formato YYYYMMDD_descricao_curta
[ ] Migration testada com prisma migrate dev em banco local limpo
[ ] Down migration escrita e testada — reverter a migration não perde dados existentes
[ ] Schema_Banco_de_Dados.md atualizado para refletir a mudança
[ ] Índices criados para toda query identificada nos agentes de operação ou rotas frequentes
[ ] prisma generate executado sem erros após a migration
[ ] Seed atualizado se a migration adicionou tabelas com dados de referência
[ ] Se a tabela é economy_logs ou security_logs: confirmado que não há DELETE ou UPDATE no serviço
[ ] Estimativa de crescimento documentada se a tabela pode ultrapassar 1M de registros
```

### DevOps / Infraestrutura

```
[ ] Configuração testada em staging — nunca ir direto para produção
[ ] Nenhum secret em repositório, Dockerfile ou logs de CI
[ ] Health check respondendo no novo serviço ou endpoint
[ ] Pipeline de CI passa (lint + typecheck + test + build) com a mudança
[ ] Alertas de monitoramento configurados para o novo componente (se aplicável)
[ ] Runbook atualizado se um novo processo operacional foi adicionado
[ ] Down procedure documentado: como reverter esta mudança de infra se der errado
[ ] Aprovação explícita do DEV-TL-INFRA antes de qualquer execução em produção
```

### Segurança

```
[ ] OWASP Top 10 checado para a feature:
    - A01 Broken Access Control: rotas verificam ownership dos recursos
    - A02 Cryptographic Failures: dados sensíveis hasheados, HTTPS obrigatório
    - A03 Injection: inputs validados com Zod antes de qualquer query
    - A07 Auth Failures: sessão única, refresh token rotation
    - A09 Logging Failures: sem dados sensíveis em logs
[ ] pnpm audit sem vulnerabilidades críticas ou altas
[ ] Rate limiting presente em toda rota pública ou sensível
[ ] CPF nunca aparece em nenhum log (verificado em staging com search de padrão /\d{3}\.\d{3}\.\d{3}-\d{2}/)
[ ] Token nunca aparece em nenhum log
[ ] Teste: rota rejeita request sem token (401) e com token de outro usuário (403)
[ ] Se a feature toca em dados de pagamento: confirmado que nenhum dado de cartão chega ao servidor
```

### QA / Testes

```
[ ] Todos os critérios de aceite do card testados com resultado documentado
[ ] Casos de borda do The Life cobertos (ver lista abaixo)
[ ] Nenhum teste existente quebrado (regressão zero)
[ ] Cobertura de linha ≥ 80% no módulo testado (relatório anexado ao card no Notion)
[ ] Se encontrou bug: card [BUG] criado no Notion com steps para reproduzir
[ ] Task marcada como PASSED ou FAILED_WITH_ISSUES no TASKS.md
```

### Agentes de Operação

```
[ ] Job é idempotente: rodar duas vezes não causa efeito duplo
[ ] Timeout configurado: job não trava indefinidamente
[ ] Retry com backoff exponencial configurado (máx 3 tentativas)
[ ] Resultado registrado em log a cada execução (sucesso ou falha)
[ ] Teste em staging: job executado manualmente e resultado verificado
[ ] Alerta configurado: se job falhar 3 vezes consecutivas, equipe é notificada
[ ] Job não toma nenhuma decisão irreversível sem validação humana
```

---

## Casos de Borda Obrigatórios para o The Life

Todo agente DEV-QA deve verificar os casos abaixo na task correspondente:

### Autenticação e Conta
```
[ ] CPF duplicado → rejeitado com erro claro (não vaza qual CPF está cadastrado)
[ ] CPF com formato inválido → rejeitado antes de qualquer processamento
[ ] E-mail duplicado → erro claro
[ ] Login com e-mail não verificado → bloqueado com instrução para verificar
[ ] Token expirado → refresh automático funciona; se refresh também expirou → 401
[ ] Segundo login no mesmo dispositivo → sessão anterior encerrada, notificação enviada
[ ] Login em dispositivo novo → dispositivo anterior deslogado imediatamente
[ ] Conta banida → login rejeitado, CPF bloqueado para nova conta
```

### Personagem e Progressão
```
[ ] Criar personagem de facção diferente da conta → rejeitado
[ ] Criar 2 médicos na mesma conta de Lei ou Crime → rejeitado
[ ] Criar personagem quando todos os slots estão ocupados → rejeitado com mensagem clara
[ ] Level up com EXP negativa (bug de cálculo) → nunca deve acontecer; se acontecer, logar e não aplicar
[ ] Distribuir mais pontos de atributo do que disponível → rejeitado
```

### Economia e Moedas
```
[ ] Comprar item no mercado com gold insuficiente → rejeitado antes de debitar
[ ] Comprar item que outro player comprou ao mesmo tempo (race condition) → transação atômica garante que só um compra
[ ] Depositar no banco com gold em mãos insuficiente → rejeitado
[ ] Gold em mãos negativo após penalidade de morte → floor em 0, nunca negativo
[ ] Créditos negativos → impossível; verificar antes de qualquer operação de débito
```

### Missão e Idle
```
[ ] Delta time negativo → rejeitado, flag NEGATIVE_DELTA, log de segurança
[ ] Delta time > 7 dias → flag EXCESSIVE_DELTA, cap aplicado, processado normalmente
[ ] Personagem preso tenta iniciar missão → rejeitado
[ ] Personagem preso recebe progresso offline → não recebe (verificar ao liberar)
[ ] Missão de stage sem stamina suficiente → rejeitado antes de consumir qualquer stamina
[ ] Enfileirar mais execuções que o limite (3 free / 10 premium) → rejeitado
```

### Prisão e Propina
```
[ ] Personagem preso é atacado → ataque bloqueado, imunidade garantida
[ ] Personagem preso no Top 5 Hunted → mantém posição, flag IMMUNE, não atacável
[ ] Propina para delegado que não aceita → gold perdido, tempo aumentado em 50%
[ ] Propina quando não há delegados disponíveis → gold perdido (BribeOutcome.NO_DELEGATE_AVAILABLE)
[ ] Propina com gold insuficiente → rejeitado antes de qualquer débito
[ ] Pena expira enquanto bribe está pendente → Prison Warden não libera (aguarda resolução)
[ ] Debuff de furtividade expira corretamente → campo furtivityDebuffUntil <= now → sem efeito
```

### Médico e Buffs
```
[ ] Mudar alinhamento sem gold → penalidade de reset de nível aplicada (1 free / 10 premium)
[ ] Mudar alinhamento dentro do cooldown → rejeitado com mensagem e tempo restante
[ ] Consultar médico dentro do cooldown de recontratação → rejeitado
[ ] Buff expirado não afeta cálculos → verificar expiresAt antes de aplicar modificador
[ ] Scroll usado em slot sem buff → rejeitado
[ ] Limite diário de scrolls (2/dia) ultrapassado → rejeitado
[ ] Médico sai do modo atendimento sem atender ninguém → stamina devolvida parcialmente
```

### PvP e Vingança
```
[ ] Atacar player com menos de 7 dias de conta → bloqueado
[ ] Usar direito de vingança duas vezes → segundo uso rejeitado (isUsed = true)
[ ] Direito de vingança expirado (> 72h) → uso rejeitado
[ ] Membros da mesma guild não ativam encontro em missão entre si → verificar antes do cálculo
[ ] Ataque sem stamina suficiente → rejeitado
[ ] Ataque sem janela de vingança ativa e alvo fora do Top 5 → rejeitado
```

---

## O que NÃO é Definition of Done

Para eliminar qualquer ambiguidade:

| ❌ Não é DoD | ✅ O que é DoD |
|---|---|
| "Funciona na minha máquina" | Pipeline de CI passa no repositório |
| "O happy path funciona" | Happy path + error cases + casos de borda testados |
| "Está no repositório" | PR revisado e aprovado pelo Tech Lead |
| "O Tech Lead sabe o que fiz" | TASKS.md e Notion atualizados com detalhes |
| "A lógica está certa" | Testes automatizados confirmam que está certa |
| "Não quebrou nada óbvio" | pnpm test passa com zero regressões |
| "A migration foi criada" | Down migration testada e documentada |
| "É seguro" | Checklist de segurança completo, pnpm audit limpo |

---

## Fluxo de Aprovação

```
Agente implementa
       ↓
Agente auto-verifica DoD (marca cada item)
       ↓
Abre PR com DoD checklist no corpo do PR
       ↓
DEV-QA valida (testes, casos de borda, cobertura)
       ↓
       ├── FAILED: card volta para In Progress com descrição do problema
       └── PASSED: DEV-QA marca TASKS.md como QA_APPROVED
                        ↓
              Tech Lead revisa (arquitetura, padrões, segurança, DoD)
                        ↓
              ├── CHANGES_REQUESTED: agente corrige e resubmete
              └── APPROVED: merge + move card para Done no Notion
                                  ↓
                        TASKS.md: status = DONE, data preenchida
```

---

## Responsabilidade por Tipo de Aprovação

| Tipo de task | Quem valida QA | Quem faz review final |
|---|---|---|
| Backend (gameplay, economia) | DEV-QA | DEV-TL-PRODUTO |
| Frontend | DEV-QA | DEV-TL-PRODUTO |
| Database (schema, migrations) | DEV-QA (down migration) | DEV-TL-INFRA |
| DevOps / CI-CD / Deploy | DEV-TL-INFRA | DEV-TL-INFRA |
| Segurança / LGPD | DEV-SEGURANÇA | DEV-TL-INFRA |
| Agentes de operação | DEV-QA | DEV-TL-PRODUTO + DEV-TL-INFRA |

---

## DoD para Tasks de Asset Visual

### DEV-ASSET-LEAD (direção e validação)
```
[ ] ASSET_GUIDELINES.md criado com: paleta oficial, tamanho de sprite, regras de perspectiva,
    convenção de nomenclatura, regras de animação e o que é proibido
[ ] Decisões D-010, D-011 e D-012 resolvidas e registradas no Notion
[ ] Estrutura de pastas criada em apps/web/public/assets/
[ ] Ferramenta de geração escolhida e documentada
[ ] Paleta oficial com máximo 32 cores, exportada como palette.png
[ ] TASKS.md atualizado
```

### DEV-ASSET-CHAR (personagens)
```
[ ] ASSET_GUIDELINES.md lido e seguido — task não inicia sem ele
[ ] Usa apenas cores da paleta oficial
[ ] Tamanho de sprite correto para a categoria
[ ] Perspectiva top-down consistente com os demais assets
[ ] 4 direções geradas para personagens móveis (N, S, L, O)
[ ] Outline de 1px presente
[ ] Sem cópia de elementos visuais do GTA original (Rockstar Games)
[ ] Arquivo PNG com transparência (canal alpha)
[ ] Nomenclatura correta conforme ASSET_GUIDELINES.md
[ ] Organizado na pasta correta (apps/web/public/assets/sprites/)
[ ] DEV-ASSET-LEAD aprovou o asset
[ ] TASKS.md atualizado com arquivos criados
```

### DEV-ASSET-ENV (ambientação)
```
[ ] ASSET_GUIDELINES.md lido e seguido — task não inicia sem ele
[ ] Usa apenas cores da paleta oficial
[ ] Tamanho de tile correto e consistente
[ ] Tiles são modulares (combinam sem costuras visíveis)
[ ] Mínimo de 2 variações por tile base
[ ] Sem cópia de elementos visuais do GTA original
[ ] Formato PNG correto
[ ] Nomenclatura correta
[ ] Organizado em apps/web/public/assets/tilesets/
[ ] DEV-ASSET-LEAD aprovou
[ ] TASKS.md atualizado
```

### DEV-ASSET-ANIM (animação)
```
[ ] ASSET_GUIDELINES.md lido e seguido — task não inicia sem ele
[ ] Sprites base aprovados pelo DEV-ASSET-LEAD antes de animar
[ ] Spritesheet em grid uniforme (todos os frames do mesmo tamanho)
[ ] JSON de metadados criado para cada animação (frameWidth, frameHeight, frameCount, fps, loop)
[ ] Frame rate dentro dos padrões (idle 4–6fps, walk 8fps, run 12fps, effects 12–15fps)
[ ] Loop sem pulo visual entre último e primeiro frame
[ ] Nomenclatura correta
[ ] Organizado em apps/web/public/assets/animations/
[ ] DEV-ASSET-LEAD aprovou
[ ] TASKS.md atualizado
[ ] Mapeamento de som futuro documentado em ASSET_GUIDELINES.md (seção "Mapeamento de Som")
```

### O que NÃO é DoD para assets
| ❌ Não é DoD | ✅ O que é DoD |
|---|---|
| "O sprite ficou bonito" | DEV-ASSET-LEAD aprovou formalmente |
| "Usei cores parecidas" | Apenas cores da paleta oficial (arquivo palette.png) |
| "Parece diferente do GTA" | Sem nenhum elemento copiável do GTA identificável |
| "Está na pasta certa" | Nomenclatura + pasta + formato PNG + transparência corretos |
| "A animação roda" | JSON de metadados criado e loop sem pulo visual validado |
