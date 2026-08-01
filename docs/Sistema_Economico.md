# 💰 Sistema Econômico — The Life
**Versão:** 0.5

---

## Duas Moedas

### Gold (moeda interna)
- Obtida em missões, PvP, serviços médicos, vendas no mercado, contratos
- Circula entre players via mercado, PvP, consultas, propinas, contratos
- Parcialmente perdida na morte, em taxas e em punições
- Usada para: equipamentos, banco, guild, hospital NPC, stimulante, slots de personagem (valor muito alto)

### Créditos (moeda premium)
- Obtida **exclusivamente com dinheiro real** via gateway de pagamento
- Pode ser vendida por outros players por Gold no mercado de créditos — preço flutua livremente
- Nunca convertível em Gold pelo sistema — apenas via transação entre players
- Usada para: scrolls de buff médico, stimulante (custo fixo), cosméticos, slots de personagem (valor acessível), vantagens premium, desconto em mudança de alinhamento

**Modelo de RMT saudável:** quando um player vende Créditos por Gold, o Gold já existia no servidor — apenas mudou de mão. O sistema não cria Gold novo. O vendedor obtém Gold sem farmar; o comprador obtém poder premium sem gastar dinheiro real.

---

## Ciclo Econômico Completo

```
╔══════════════════════════════════════╗
║           TORNEIRAS                  ║
║  Missões idle NPC                    ║
║  Salário do governo (policiais)      ║
║  Seguro médico NPC (plantão)         ║
║  Eventos temporários controlados     ║
╚══════════════════════════════════════╝
                  ↓
╔══════════════════════════════════════╗
║           CIRCULAÇÃO                 ║
║  PvP → gold transferido              ║
║  Mercado de itens                    ║
║  Mercado de Créditos                 ║
║  Consultas médicas                   ║
║  Contratos de assassinato            ║
║  Propina (parte vai ao Delegado)     ║
╚══════════════════════════════════════╝
                  ↓
╔══════════════════════════════════════╗
║           RALOS                      ║
║  Penalidade de morte (% gold em mãos)║
║  Taxa mercado de itens (8%/4%)       ║
║  Taxa mercado de Créditos (5%)       ║
║  Hospital NPC                        ║
║  Banco via interface (3% dep / 1% saque)
║  Banco físico (0,5% dep)             ║
║  Stimulante com Gold                 ║
║  Slots de personagem com Gold        ║
║  Criação e upgrade de guild          ║
║  Propina recusada (100% some)        ║
║  Propina aceita (95% some, 5% delegado)
║  Mudança de alinhamento              ║
║  Taxa de contrato (10% some)         ║
╚══════════════════════════════════════╝
```

---

## Torneiras — Detalhamento

### Missões Idle (injeção primária)
Fórmula com retorno decrescente — high-levels não acumulam ouro ilimitadamente:

```
gold_por_ciclo = gold_base × (1 + ln(nível) × 0.3)

Nível 1:   base 10  → ~10 gold
Nível 20:  base 80  → ~120 gold
Nível 50:  base 200 → ~372 gold
Nível 100: base 400 → ~876 gold
```

**Limitador global:** se a injeção total no servidor ultrapassar o threshold configurado em uma janela de 1h, as taxas de missão NPC são reduzidas em 15% por 24h automaticamente.

### Salário do Governo (policiais)
```
Fundo semanal = Σ(gold apreendido em PvP) × 40%
              + Σ(leilões de mercadoria apreendida)

Salário individual = (Fundo ÷ policiais ativos)
                   × multiplicador de capturas individuais
```

### Seguro Médico NPC
Médicos recebem pagamentos automáticos por atender NPCs no plantão idle. Volume pequeno e fixo — sustenta médicos iniciantes sem causar inflação.

---

## Ralos — Detalhamento

### Penalidade de Morte
```
Nível 1–10:   2% do gold em mãos
Nível 11–30:  5%
Nível 31–60:  8%
Nível 61–100: 10%
Nível 100+:   12%

Primeira morte do dia: -50% em tudo
Médico do bem morto:   -40% adicional
Médico do mal morto:   +20% adicional
Policial morto em serviço: -30% na EXP
```

### Sistema de Propina — Fluxo Econômico
```
Propina paga pelo preso: X gold (valor altíssimo)
  ↓
Delegado ACEITA:
  Delegado recebe: X × 5%   (entra na circulação)
  Some permanentemente: X × 95%  (ralo)

Delegado RECUSA:
  X gold some permanentemente (ralo total)
  Tempo de prisão do preso +50%
```

A propina é um dos maiores ralos individuais do jogo — o valor extremamente alto garante que remove gold significativo da circulação em cada uso.

### Slots de Personagem — Custo em Gold
O valor em Gold deve ser calibrado para representar semanas de jogo, mas não impossível:
- Slot 2: estimativa inicial de calibragem — **1 a 2 meses de gold médio diário** do nível 30–40
- Slot 3: **3 a 4 meses** de gold médio
- Valores exatos definidos após simulação da Fase 1

### Mudança de Alinhamento (médico)
```
custo_base = nível² × 1.000 gold
custo_total = custo_base + (50% do patrimônio total)

Gold removido permanentemente do servidor (ralo)
```

---

## Mercado de Créditos

```
Cenário típico:
  Player A compra 1.000 Créditos por R$20,00 reais
  Player A lista 1.000 Créditos por 500.000 gold
  Player B compra

  → Player A recebe 475.000 gold (5% de taxa some)
  → Player B recebe 1.000 Créditos
  → 25.000 gold some do servidor (ralo)
```

O preço de mercado dos Créditos flutua livremente — oferta e demanda entre players. O servidor não interfere no preço, apenas cobra a taxa de transação.

---

## Controle de Inflação de Itens

Job horário que monitora itens raros em circulação e ajusta drop rates dinamicamente:

```typescript
const targets = {
  RARE:      activePlayers * 5,    // ~5 raros por player ativo
  EPIC:      activePlayers * 1,    // ~1 épico por player ativo
  LEGENDARY: activePlayers * 0.1,  // 1 lendário para cada 10 players
};

// Se 30% acima do target → reduz drop rate em 20%
// Se 30% abaixo do target → aumenta drop rate em 15%
```

---

## Economia da Stamina

```
Free:    10 stamina/dia → máx 10 missões de stage por dia
Premium: 20 stamina/dia → máx 20 missões de stage por dia

Enfileiramento:
  Free:    3 execuções por fila (3 stamina de uma vez)
  Premium: 10 execuções por fila (10 stamina de uma vez)

Stimulante (restaura 2 stamina):
  Gold: 500 × nível do personagem (escala, nunca trivial no late game)
  Créditos: 5 Créditos fixo
  Limite: 3/dia free, 6/dia premium
```

---

## Monitoramento Econômico — Dashboard Interno

Métricas acompanhadas diariamente pela equipe:

```
Gold total em circulação (mãos + bancos + guilds)
Gold injetado nas últimas 24h (torneiras)
Gold removido nas últimas 24h (ralos)
Razão torneira/ralo → meta: 0.95 a 1.05

Créditos vendidos nas últimas 24h (mercado de créditos)
Preço médio de 1 Crédito em gold → indicador de saúde do RMT
Receita real em BRL (transações premium)

Itens raros em circulação por raridade
Preço médio de item Raro, Épico, Lendário no mercado

Players com gold > 100× a média → anomalia / bot
Volume de transações de mercado por dia
Consultas médicas por dia → saúde da profissão médico

Propinas tentadas / aceitas / recusadas por dia
Penas de prisão ativas por nível de gravidade
Mudanças de alinhamento por semana → indicador de abuso

Sessões únicas violadas (login forçando logout) → segurança
Tentativas de registro com CPF duplicado → segurança
```
