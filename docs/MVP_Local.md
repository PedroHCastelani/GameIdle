# MVP local — escopo acordado em 15/10/2026

O usuário confirmou MVP local completo e teste como jogador. Este recorte é uma campanha solo jogável, com começo, progressão e conclusão; não é a Fase 1 integral do MMORPG descrito no GDD.

## Critérios de conclusão
- Cadastro, login e progresso persistente; três profissões com missões e narrativa próprias.
- Três níveis de missões locais (ciclos de 10 segundos) para validar o loop em uma sessão curta. Relógio, EXP, gold e resultados calculados exclusivamente no servidor. Cap offline preservado.
- Skill de carreira cresce nas coletas; nível libera novas missões. A interface mostra EXP necessária, próximo objetivo, recompensas e tempo do ciclo.
- Inventário, compras com gold, drops determinísticos por cinco ciclos, equipar/substituir e vender itens não equipados. Loja NPC local, sem mercado entre jogadores.
- Três desafios por profissão, com exigência de nível/poder, resultado por etapa, stamina, recompensa única e conclusão da campanha. Desafio insuficiente falha e consome stamina; preparação recomendada visível antes de confirmar. Regeneração gratuita: 1 a cada 2,4h, teto 10.
- Uma vitória por capítulo, serializada no banco; repetição/concorrência não duplica recompensas. Não há compra de stamina ou dinheiro real. Após conclusão, missões e equipamentos continuam acessíveis.
- Onboarding, recuperação de erros, estado vazio, mobile, persistência após reload e relatório de teste como jogador pela interface, sem alterar saldo/relógio para declarar vitória.

## Decisões de balanceamento locais
Curva de nível preservada: próximo nível exige 100 × nível² de EXP acumulada. Missões locais rendem 20/40/60 EXP e 15/25/40 gold por ciclo. Desafios são operações de três etapas com poder determinístico (nível, skill e equipamentos); médico resolve emergências em vez de combater pacientes. Uma dificuldade de campanha e três capítulos. Regras econômicas e narrativas são provisórias para o MVP e não substituem o balanceamento do GDD.

## Fora deste recorte
Publicação online, identidade/CPF, provedor externo de e-mail, LGPD pública, múltiplos personagens, talentos completos, quatro dificuldades/filas de stages, prisão/propina, morte/PvP, serviços médicos entre jogadores, banco, mercado entre jogadores, social/guild, premium e produção artística final. Não apresentar esses itens como implementados.
