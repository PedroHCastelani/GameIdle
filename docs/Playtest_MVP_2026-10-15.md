# Teste como jogador — MVP local, 15/10/2026

Resultado: campanha Médica concluída pela interface, do cadastro até o desfecho. Nenhuma alteração de relógio, saldo ou progresso no banco foi usada no teste manual. Conta fictícia separada, personagem Doutora Aurora. As campanhas Policial e Ladrão foram concluídas por testes de integração, não por este percurso manual.

## Percurso observado

1. Cadastro, escolha de profissão e início de Triagem comunitária.
2. Compra de ferramenta e vestuário; equipamento aumenta o poder. Venda de item equipado permanece indisponível.
3. Coletas reais de ciclos de 10 segundos; nível 2, prática de Medicina e suprimentos liberados.
4. Emergência no bairro: três etapas concluídas, 100 gold/200 EXP e Kit profissional. Equipar a recompensa substitui a ferramenta; venda da ferramenta antiga acrescenta 20 gold.
5. Atender a clínica, nível 3, Resgate na estação: 200 gold/350 EXP, Uniforme especializado e redução da stamina.
6. Preparar o resgate e nível 4; poder 63 supera exigência 62. Plantão decisivo concluído: 500 gold/500 EXP, stamina 7/10 e mensagem de encerramento. Total imediatamente após vitória: 1050 gold e 1430 EXP.
7. Reload preserva campanha 3/3 e equipamentos, recupera sessão e coleta tempo pendente. Diário apresenta as três operações, etapas e recompensas; capítulos concluídos não permitem repetir.
8. Venda de sete suprimentos acrescenta exatamente 70 gold e remove a pilha do inventário. Missões continuam disponíveis após o final.

## Ajustes motivados pelo teste

- Controles de personagem e coleta passaram para antes dos capítulos.
- Missões CAMPANHA aparecem antes das EXTRA, com explicação de quais concedem prática e drops.
- Correção dos textos de compra, singular de ciclo e recompensa final (conclusão, sem inventar um sistema de títulos).
- Em celular, separar a EXP total do texto do próximo nível para melhorar leitura.

## Avaliação como jogador

O percurso tem objetivo claro e recompensas que ajudam na próxima operação. A campanha curta permite experimentar progressão, compras e troca de equipamentos em uma sessão. O aviso de poder deixa o resultado previsível: adequado para validar o MVP, mas ainda oferece pouca variedade estratégica. As três carreiras compartilham mecânica e equipamentos, com missões e narrativa diferentes. Próxima evolução recomendada: decisões e encontros variados por profissão, após feedback de outros jogadores.

## Limites

Teste responsivo em viewport de 375×812, sem transbordamento horizontal observado. Testes automatizados cobrem falhas, concorrência, ownership e repetição de recompensas. Esta sessão manual não comprova equilíbrio de longo prazo, uso multiplayer, acessibilidade integral nem prontidão pública. A campanha é o recorte acordado em MVP_Local.md; o GDD completo permanece em desenvolvimento.
