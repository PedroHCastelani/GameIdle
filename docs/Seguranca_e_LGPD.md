# Segurança e privacidade — estado e requisitos
Revisão: 15/10/2026. Este documento não certifica conformidade jurídica.

## Protótipo local
Cadastro somente com e-mail e senha de teste, sem CPF real. Identificador interno sintético ocupa temporariamente os campos legados de CPF. Não reutilizar essas contas em lançamento público. Modo explícito LOCAL_PROTOTYPE=true; proibido com NODE_ENV=production. Sem publicidade nem dinheiro real.

Senhas usam scrypt com salt individual. JWT de 15 minutos fica apenas na memória do cliente. Refresh opaco tem hash SHA-256 no banco, expira em 30 dias e é rotacionado sob lock por conta. Novo login invalida sessões anteriores. JWT exige sessão existente e não expirada, conta não banida. Cookie HttpOnly e SameSite=Strict; operações com cookie exigem Origin da interface. Falhas de autenticação usam mensagem genérica. Não registrar body, cookies, Authorization, CPF, senha ou erros de infraestrutura ao cliente.

## Confirmação e recuperação locais (R-004)
Confirmação por código opaco aleatório de 256 bits, validade 24 horas; recuperação de senha com código separado, validade 30 minutos. O banco armazena apenas SHA-256, finalidade, expiração e data de emissão. Há somente um código ativo por conta/finalidade; reenvio após 60 segundos substitui o anterior. Requisições de recuperação para contas desconhecidas ou banidas retornam a mesma mensagem de sucesso, sem código na resposta. Isso não constitui garantia contra análise de tempo nem liberação pública.

Consumo sob lock por conta: apenas uma tentativa concorrente pode vencer. Redefinir senha invalida todos os códigos e sessões da conta. Login recusa senha que mudou entre a verificação inicial e o lock. E-mail confirmado aparece na interface; por compatibilidade com a prévia, ainda não bloqueia o jogo local.

Entrega exclusivamente em arquivos JSON na pasta raiz `.local-mail/`, ignorada pelo Git e sem rota HTTP de leitura. Tokens brutos existem somente nessas mensagens, como existiriam em uma caixa de e-mail. Não compartilhar essa pasta; ela depende das permissões do usuário do sistema operacional. Falha ao gravar reverte a emissão no banco; se o commit falhar após gravar, a mensagem pode conter código inválido e deve ser reenviada. Adaptador de entrega real, fila/outbox, políticas de retenção e barreira de e-mail verificado para cadastro público continuam pendentes.

## Identidade futura (D-007 aberta)
Validação de dígitos não comprova identidade. Selecionar provedor somente após verificar endpoint, acesso, contrato e finalidade. A decisão anterior BrasilAPI não foi comprovada. Salt aleatório muda o hash a cada cadastro e não permite unicidade por igualdade. A proposta futura é HMAC-SHA-256 normalizado com chave fora do banco, índice único e plano de rotação. Hash de CPF continua sujeito a avaliação de privacidade.

## Antes de cadastro público
Completar e validar entrega real de confirmação/recuperação e bloquear acesso público sem e-mail verificado; o fluxo local descrito acima não completa esses requisitos. Implementar CAPTCHA/antifraude, limites de tentativas adequados ao ambiente distribuído, sessão única com notificação, exportação e exclusão. Definir finalidade, fundamento e prazo de retenção por categoria com revisão adequada; eliminar a regra contraditória de apagar e reter o mesmo CPF automaticamente. Não afirmar que logs são eternos por exigência legal. Não atribuir prazos de incidentes ou obrigações sem validação vigente.

Endpoints alvo, ainda pendentes: GET /api/account/data-export, POST /api/account/delete, POST /api/account/correct-email, GET /api/account/processing-info. Exclusão/anônimização precisa ser compatível com as FKs e com o histórico de auditoria; não substituir FK por UUID inexistente.

## Infraestrutura e operação
Repositório atualmente público. Secrets somente no ambiente, sem valores reais em exemplos. Configurar branch protection e revisão, backup e restore, HTTPS, logging com redação, monitoramento e verificação de dependências antes de lançamento. Gates do GitHub/Sonar são evidências externas, não propriedades garantidas pelo YAML. Jobs financeiros são código determinístico; nunca delegar saldos ou autorização a LLM.
