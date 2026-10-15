## Entrega local vigente — 15/10/2026

R-005 implementa o MVP solo acordado em [MVP_Local.md](MVP_Local.md): três profissões, progressão, inventário/equipamentos e campanha de três capítulos. Validar o percurso completo como jogador e registrar correções em [Playtest_MVP_2026-10-15.md](Playtest_MVP_2026-10-15.md). Este recorte precede a preparação pública; as fases completas abaixo continuam no backlog.

# Blueprint de execução — The Life
Revisão: 15/10/2026

## Contratos e status
Leia Estado_do_Projeto.md e TASKS.md antes de implementar. TASKS.md é a fonte única dos IDs e status; GDD_Completo.md é o design alvo. Não inferir implementação a partir de exemplos ou tabelas do banco. Em conflito, registrar decisão e atualizar as referências. A autorização atual é reconciliar documentação, estabilizar a fundação e entregar o primeiro fluxo local jogável.

## Ordem de entrega
1. R-001: reconciliar documentos, eliminar IDs duplicados e separar design de entrega.
2. R-002 / T-009: gerar Prisma explicitamente, unificar CI, validar rotas e banco com testes reais. Remover automerge que contorna review e desabilitar deploy incompleto.
3. R-003: protótipo local fechado conforme Estado_do_Projeto.md. Conta, sessão única, um personagem por conta, missão e coleta offline atômica. UI mobile/desktop com estados de erro e espera.
4. Concluir T-010/T-011 antes de público: identidade, e-mail verificado, recuperação de senha, export/exclusão, notificações de sessão e revisão de segurança. R-004 entrega o recorte local de confirmação/recuperação e sua UI; adaptador real de e-mail e fila/outbox continuam pendentes.
5. Expandir T-012–T-018: slots/composição, atributos, skills, drops e inventário. Só então economia, stages e médicos.
6. Social/PvP/guild e produção visual depois da validação do ciclo principal. Monetização depende de decisão explícita e revisão do equilíbrio premium.

## Regras
Toda mudança de estado econômico é transacional e auditada. Servidor determina tempo, propriedade e recompensas. Consumir duas vezes o mesmo intervalo não gera ganho adicional. Cliente não calcula resultado de jogo. Testes de concorrência exigem PostgreSQL real.

Tasks: em progresso → em revisão com evidências → concluído após aprovação e gates aplicáveis. Não afirmar sincronização do Notion sem executá-la. Gerar handoff em scripts/templates/template-notion.md quando não houver conexão. Não exigir trabalho bloqueado por uma tarefa futura fora do incremento; registrar o recorte.

## Ambientes e qualidade
Local é o único alvo deste incremento. CI não equivale a deploy. Staging e produção continuam não provisionados; workflows incompletos falham explicitamente. Nenhum lançamento sem auth pública completa, testes críticos, revisão, backups/restore, observabilidade, políticas e avaliação dos requisitos de privacidade. Sonar requer configuração externa e seu resultado deve ser distinguido dos checks locais.

## Decisões e estimativas
IDs D-001 a D-013 constam uma única vez em TASKS.md. D-007 permanece aberta. Estimativas antigas de 2–3/8–10 semanas são históricas, não compromissos atuais. Reestimar depois do fluxo jogável e de medir o trabalho restante.

## Incremento autorizado R-006

Ampliar a variedade por profissão após R-005: ocorrências locais repetíveis, decisões com consequências explícitas e histórico persistido, preservando a campanha. Contrato em [Ocorrencias_Profissoes.md](Ocorrencias_Profissoes.md). Não depende da preparação de cadastro público.
