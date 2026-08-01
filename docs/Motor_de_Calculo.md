# ⚙️ Motor de Cálculo — The Life
**Versão:** 0.5  
**Escopo:** Lógica pura do jogo — roda exclusivamente no servidor

---

## Princípio

> O cliente renderiza. O servidor calcula. Nenhum resultado de jogo é confiado ao cliente.

---

## 1. Cálculo de Progresso Offline

Chamado no login quando `isOnMission = true` e `isPrisoned = false`.

```typescript
async function calculateIdleProgress(characterId: string) {
  const char = await db.character.findUnique({
    where: { id: characterId },
    include: { skills: true, guildMembership: { include: { guild: true } } }
  });

  // Personagem preso não progride
  if (char.isPrisoned) return { blocked: true, reason: 'PRISONED' };

  const now = new Date();
  let deltaSeconds = (now.getTime() - char.lastOnlineAt.getTime()) / 1000;

  if (deltaSeconds < 0) {
    await flagAccount(char.userId, 'NEGATIVE_DELTA');
    throw new Error('Invalid time delta');
  }

  const isPremium = await checkPremium(char.userId);
  const capSeconds = isPremium ? 86400 : 43200; // 24h ou 12h
  deltaSeconds = Math.min(deltaSeconds, capSeconds);

  const mission = await db.missionDefinition.findUnique({
    where: { id: char.currentMissionId! }
  });

  const cycles = Math.floor(deltaSeconds / mission.durationBase);
  if (cycles === 0) return emptyResult();

  const seed = `${characterId}-${char.lastOnlineAt.toISOString()}`;
  const power = computeCharacterPower(char);
  const isPremiumBool = isPremium;

  // Bônus acumulados
  const guildBonus   = getGuildExpBonus(char.guildMembership?.guild.rank ?? 0);
  const premiumBonus = isPremiumBool ? 1.20 : 1.0;

  const goldBase   = randomBetween(mission.goldMin, mission.goldMax, seed + ':gold');
  const goldGained = BigInt(Math.floor(goldBase * cycles * guildBonus));
  const expGained  = BigInt(Math.floor(mission.expBase * cycles * premiumBonus * guildBonus));

  // Skill XP — baseado em tempo real, não ciclos
  const hours = deltaSeconds / 3600;
  const trainRate = isPremiumBool ? 0.85 : 0.70;
  const skillXpGained: Record<string, number> = {};
  for (const [skillId, xpPerHour] of Object.entries(mission.skillXpRewards as Record<string, number>)) {
    skillXpGained[skillId] = xpPerHour * hours * trainRate;
  }

  const drops = await calculateDrops(mission.id, cycles, power, seed);

  return { goldGained, expGained, skillXpGained, drops,
           durationProcessed: deltaSeconds, cyclesCompleted: cycles };
}
```

---

## 2. Poder do Personagem

```typescript
function computeCharacterPower(char: CharacterWithSkills) {
  // Atributos + equipamentos
  const str  = char.attrStrength    + getEquipBonus(char, 'strength');
  const agi  = char.attrAgility     + getEquipBonus(char, 'agility');
  const int_ = char.attrIntelligence + getEquipBonus(char, 'intelligence');
  const auth = char.attrAuthority   + getEquipBonus(char, 'authority');
  const stl  = char.attrStealth     + getEquipBonus(char, 'stealth');
  const pre  = char.attrPrecision   + getEquipBonus(char, 'precision');
  const inv  = char.attrInvestigation + getEquipBonus(char, 'investigation');

  // Skills contribuem como modificadores logarítmicos (sem cap = crescimento infinito mas decrescente)
  const skillMod = (level: number) => 1 + Math.log10(Math.max(level, 1) + 1) * 0.25;
  const avgSkillMod = (categories: string[]) => {
    const relevant = char.skills.filter(s => categories.includes(s.skill?.category ?? ''));
    if (relevant.length === 0) return 1.0;
    return relevant.reduce((acc, s) => acc + skillMod(s.level), 0) / relevant.length;
  };

  // Debuff de furtividade (pós-propina)
  const stealthDebuff = char.furtivityDebuffUntil && char.furtivityDebuffUntil > new Date()
    ? (1 - char.furtivityDebuffValue / 100)
    : 1.0;

  const attack      = (str * 1.5 + pre * 1.2 + agi * 0.8) * avgSkillMod(['COMBAT']);
  const defense     = (str * 0.5 + int_ * 0.3) * avgSkillMod(['COMBAT', 'UNIVERSAL']);
  const stealth     = stl * 2 * avgSkillMod(['STEALTH']) * stealthDebuff;
  const investigation = inv * 2 * avgSkillMod(['INVESTIGATION']);
  const speed       = agi * 1.5 * avgSkillMod(['UNIVERSAL']);
  const total       = attack + defense + stealth + investigation + speed;

  return { attack, defense, stealth, investigation, speed, total };
}
```

---

## 3. Resolução de PvP

```typescript
function resolvePvPEncounter(
  attacker: CharacterWithSkills,
  defender: CharacterWithSkills,
  type: PvPType
): PvPResult {

  // Personagem preso não pode ser atacado
  if (defender.isPrisoned) {
    return { outcome: 'BLOCKED', reason: 'TARGET_PRISONED' };
  }

  const atkPower = computeCharacterPower(attacker);
  const defPower = computeCharacterPower(defender);

  const atkPartyBonus = getPartyBonus(attacker);
  const defPartyBonus = getPartyBonus(defender);

  // Rolagem D&D adaptada
  const atkRoll = Math.floor(atkPower.attack * atkPartyBonus + randomInt(1, 20));
  const defRoll = Math.floor(defPower.stealth * defPartyBonus + randomInt(1, 20));
  const diff    = atkRoll - defRoll;

  let outcome: PvPOutcome;
  if      (diff > 15) outcome = 'ATTACKER_WIN';
  else if (diff > 0)  outcome = 'DEFENDER_ESCAPED';
  else                outcome = 'DEFENDER_WIN';

  let goldTransferred = 0n;
  let itemTransferredId: string | undefined;

  if (outcome === 'ATTACKER_WIN') {
    const goldRate = getDeathGoldRate(defender.level);
    goldTransferred = BigInt(Math.floor(Number(defender.goldHand) * goldRate));

    // Chance de perda de item (nível 61+)
    if (defender.level > 60) {
      const itemChance = defender.level > 100 ? 0.10 : 0.05;
      if (Math.random() < itemChance) {
        itemTransferredId = getRandomEquippedItemId(defender);
      }
    }

    // Policial captura ladrão → mercadoria vai a leilão
    if (attacker.profession === 'POLICE' && defender.profession === 'THIEF') {
      scheduleContrabandAuction(defender.id);
    }

    // Ladrão capturado → vai para a prisão
    if (attacker.profession === 'POLICE' && defender.profession === 'THIEF') {
      schedulePrison(defender.id, 'CAPTURE', determineCrimeGravity(defender));
    }
  }

  return { outcome, attackerRoll: atkRoll, defenderRoll: defRoll,
           goldTransferred, itemTransferredId };
}
```

---

## 4. Sistema de Prisão

```typescript
async function imprisonCharacter(
  characterId: string,
  crime: string,
  gravity: number  // 1–5
): Promise<void> {

  const char = await db.character.findUnique({ where: { id: characterId } });
  const isPremium = await checkPremium(char.userId);

  let sentenceHours = (char.level * gravity) / 10;
  if (isPremium) sentenceHours *= 0.80; // -20% para premium

  const now = new Date();
  const endsAt = addHours(now, sentenceHours);

  await db.$transaction(async (tx) => {
    await tx.character.update({
      where: { id: characterId },
      data: { isPrisoned: true, prisonedAt: now, prisonEndsAt: endsAt,
              prisonCrime: crime, prisonGravity: gravity,
              isOnMission: false, isAttending: false,
              stageQueueRemaining: 0 }
    });

    await tx.prisonRecord.create({
      data: { characterId, crime, gravity, sentenceHours, startedAt: now, endsAt }
    });
  });
}

// Job que roda a cada 5 minutos — libera personagens cuja pena expirou
async function releasePrisonersJob(): Promise<void> {
  const now = new Date();
  const toRelease = await db.character.findMany({
    where: { isPrisoned: true, prisonEndsAt: { lte: now } }
  });

  for (const char of toRelease) {
    await db.character.update({
      where: { id: char.id },
      data: { isPrisoned: false, prisonedAt: null, prisonEndsAt: null,
              prisonCrime: null, prisonGravity: null }
    });
  }
}

// Tentativa de propina
async function attemptBribe(
  prisonerId: string,
  delegateId: string
): Promise<BribeResult> {

  const prisoner = await db.character.findUnique({ where: { id: prisonerId } });
  const delegate = await db.character.findUnique({ where: { id: delegateId } });

  if (!prisoner.isPrisoned) throw new BadRequestError('Personagem não está preso');
  if (delegate.profession !== 'POLICE' || delegate.level < 81) {
    throw new BadRequestError('Delegado inválido');
  }

  // Calcular valor da propina
  const hoursRemaining = (prisoner.prisonEndsAt!.getTime() - Date.now()) / 3600000;
  const bribeAmount = BigInt(Math.floor(hoursRemaining * prisoner.level * 1000));

  if (prisoner.goldHand < bribeAmount) {
    throw new BadRequestError('Gold insuficiente para propina');
  }

  // Escrow: debitar o gold do preso imediatamente
  await db.character.update({
    where: { id: prisonerId },
    data: { goldHand: { decrement: bribeAmount } }
  });

  // Verificar se delegado aceita
  if (!delegate.acceptsBribes) {
    // RECUSA — gold some + tempo adicional
    const extraHours = hoursRemaining * 0.5;
    const newEndsAt  = addHours(prisoner.prisonEndsAt!, extraHours);

    await db.$transaction(async (tx) => {
      await tx.character.update({
        where: { id: prisonerId },
        data: { prisonEndsAt: newEndsAt }
      });
      await tx.prisonBribe.create({
        data: { prisonerId, delegateId, goldAmount: bribeAmount,
                delegateCut: 0n, outcome: 'REFUSED',
                resolvedAt: new Date(), timeAdded: extraHours }
      });
      await tx.economyLog.create({
        data: { type: 'PRISON_BRIBE_REFUSED_PENALTY', characterId: prisonerId,
                relatedCharacterId: delegateId, goldAmount: bribeAmount }
      });
    });

    return { outcome: 'REFUSED', timeAdded: extraHours };
  }

  // ACEITA — preso liberado, delegado recebe 5%, resto some
  const delegateCut = bribeAmount / 20n; // 5%
  const sentenceHours = prisoner.prisonGravity
    ? (prisoner.level * prisoner.prisonGravity) / 10
    : 1;

  // Calcular debuff de furtividade baseado na pena original
  const { debuffPercent, debuffHours } = calcFurtivityDebuff(sentenceHours);
  const debuffUntil = addHours(new Date(), debuffHours);

  await db.$transaction(async (tx) => {
    // Liberar preso
    await tx.character.update({
      where: { id: prisonerId },
      data: { isPrisoned: false, prisonedAt: null, prisonEndsAt: null,
              furtivityDebuffUntil: debuffUntil, furtivityDebuffValue: debuffPercent }
    });

    // Pagar delegado
    await tx.character.update({
      where: { id: delegateId },
      data: { goldHand: { increment: delegateCut }, bribeCorruption: { increment: 1 } }
    });

    const bribe = await tx.prisonBribe.create({
      data: { prisonerId, delegateId, goldAmount: bribeAmount,
              delegateCut, outcome: 'ACCEPTED', resolvedAt: new Date() }
    });

    await tx.prisonRecord.updateMany({
      where: { characterId: prisonerId, endedEarlyAt: null },
      data: { endedEarlyAt: new Date(), endReason: 'BRIBE', bribeId: bribe.id }
    });

    await tx.economyLog.createMany({ data: [
      { type: 'PRISON_BRIBE_PAID',              characterId: prisonerId, goldAmount: bribeAmount },
      { type: 'PRISON_BRIBE_DELEGATE_RECEIVED', characterId: delegateId, goldAmount: delegateCut },
    ]});
  });

  return { outcome: 'ACCEPTED', debuffPercent, debuffHours };
}

function calcFurtivityDebuff(sentenceHours: number): { debuffPercent: number; debuffHours: number } {
  if      (sentenceHours < 6)  return { debuffPercent: 30, debuffHours: 2 };
  else if (sentenceHours < 12) return { debuffPercent: 40, debuffHours: 6 };
  else if (sentenceHours < 24) return { debuffPercent: 50, debuffHours: 12 };
  else                          return { debuffPercent: 60, debuffHours: 24 };
}
```

---

## 5. Geração de Stages

```typescript
async function generateStageConfig(
  missionId: string,
  partyPower: CharacterPower,
  difficulty: Difficulty,
  stageNumber: number,
  totalStages: number
): Promise<StageConfig> {

  const diffMult = { EASY: 0.7, MEDIUM: 1.0, HARD: 1.4, VERY_HARD: 1.9 }[difficulty];
  const stageProg = 0.8 + (stageNumber / totalStages) * 0.4;
  const powerTarget = partyPower.total * diffMult * stageProg;

  const isBossStage = stageNumber === totalStages;

  const pool = await db.missionEnemyPool.findMany({
    where: {
      missionId,
      minStage: { lte: stageNumber },
      OR: [{ maxStage: null }, { maxStage: { gte: stageNumber } }],
      enemy: { isBoss: isBossStage }
    },
    include: { enemy: true }
  });

  const count = isBossStage ? 1 : randomInt(3, 4);
  const selected = weightedSample(pool, count);
  const enemies  = selected.map(e => scaleEnemyToPower(e.enemy, powerTarget));

  return { stageNumber, enemies, isBossStage, powerTarget };
}
```

---

## 6. Progressão Automática de Buffs Médicos

```typescript
// Chamado a cada level up de médico
async function progressMedicalBuffs(characterId: string, newLevel: number): Promise<void> {
  const char = await db.character.findUnique({ where: { id: characterId } });
  if (char.profession !== 'DOCTOR') return;

  // Buscar talentos ativos que afetam progressão
  const talents = await getActiveTalents(characterId);
  const progressRate   = 0.001 + getTalentBonus(talents, 'BUFF_PROGRESSION_RATE');  // base 0,1%
  const buffsPerLevel  = 1 + getTalentBonus(talents, 'BUFF_COUNT_PER_LEVEL');        // base 1

  const slots = await db.characterMedicalBuffSlot.findMany({
    where: { characterId, buffDefId: { not: null } },
    include: { buffDef: true },
    orderBy: { slotNumber: 'asc' }
  });

  // Prioridade: slots de tier menor progridem primeiro
  const sorted = slots.sort((a, b) => tierOrder(a.buffDef!.tier) - tierOrder(b.buffDef!.tier));
  const toProgress = sorted.slice(0, buffsPerLevel);

  for (const slot of toProgress) {
    if (Math.random() > progressRate) continue; // não progrediu neste nível

    const def = slot.buffDef!;
    const maxForTier = def.valueMax;
    const currentValue = slot.currentValue ?? def.valueMin;

    if (currentValue >= maxForTier) {
      // Verificar se pode subir de tier
      await tryTierUpgrade(slot, def, newLevel);
    } else {
      // Melhorar dentro do tier atual
      const increment = (maxForTier - def.valueMin) * 0.05; // +5% do range por progressão
      const newValue  = Math.min(currentValue + increment, maxForTier);

      await db.characterMedicalBuffSlot.update({
        where: { id: slot.id },
        data: { currentValue: newValue, lastProgressAt: new Date() }
      });
    }
  }
}

async function tryTierUpgrade(slot: BuffSlot, def: BuffDef, newLevel: number): Promise<void> {
  const nextTier = getNextTier(def.tier);
  if (!nextTier) return; // já está no tier máximo (EPIC)

  // Verificar se o nível mínimo do próximo tier foi atingido
  const nextDef = await db.medicalBuffDefinition.findFirst({
    where: { type: def.type, tier: nextTier, minDoctorLevel: { lte: newLevel } }
  });

  if (!nextDef) return; // nível insuficiente para o próximo tier

  // Chance de upgrade: 10% quando valor está no máximo do tier e nível permite
  if (Math.random() > 0.10) return;

  await db.characterMedicalBuffSlot.update({
    where: { id: slot.id },
    data: { buffDefId: nextDef.id, currentValue: nextDef.valueMin, lastProgressAt: new Date() }
  });
}

function tierOrder(tier: BuffTier): number {
  return { COMMON: 0, UNCOMMON: 1, RARE: 2, EPIC: 3 }[tier];
}

function getNextTier(tier: BuffTier): BuffTier | null {
  return { COMMON: 'UNCOMMON', UNCOMMON: 'RARE', RARE: 'EPIC', EPIC: null }[tier] as BuffTier | null;
}
```

---

## 7. Mudança de Alinhamento (Médico)

```typescript
async function requestAlignmentChange(
  characterId: string,
  newAlignment: Alignment
): Promise<AlignmentChangeResult> {

  const char = await db.character.findUnique({ where: { id: characterId } });
  if (char.profession !== 'DOCTOR') throw new BadRequestError('Apenas médicos podem mudar de alinhamento');
  if (char.alignmentCooldownUntil && char.alignmentCooldownUntil > new Date()) {
    throw new BadRequestError('Cooldown de realinhamento ativo');
  }

  const isPremium = await checkPremium(char.userId);

  // Calcular patrimônio
  const equippedValue  = await estimateEquippedItemsValue(characterId);
  const totalWealth    = char.goldHand + char.goldBank + BigInt(equippedValue);
  const baseCost       = BigInt(char.level * char.level * 1000);
  let totalCost        = baseCost + totalWealth / 2n;
  if (isPremium) totalCost = (totalCost * 70n) / 100n;

  const cooldownDays   = isPremium ? 20 : 30;
  const adaptHours     = isPremium ? 24 : 48;
  const cooldownUntil  = addDays(new Date(), cooldownDays);
  const lockedUntil    = addHours(new Date(), adaptHours);

  const totalGold = char.goldHand + char.goldBank;

  if (totalGold >= totalCost) {
    // Tem gold — paga e muda
    await db.$transaction(async (tx) => {
      let remaining = totalCost;
      if (char.goldBank >= remaining) {
        await tx.character.update({ where: { id: characterId }, data: { goldBank: { decrement: remaining } } });
      } else {
        remaining -= char.goldBank;
        await tx.character.update({ where: { id: characterId },
          data: { goldBank: 0n, goldHand: { decrement: remaining } } });
      }
      await tx.character.update({ where: { id: characterId },
        data: { alignment: newAlignment, alignmentLockedUntil: lockedUntil, alignmentCooldownUntil: cooldownUntil } });
      await tx.economyLog.create({ data: { type: 'ALIGNMENT_CHANGE_FEE', characterId, goldAmount: totalCost } });
    });

    return { success: true, cost: totalCost, adaptationHours: adaptHours };

  } else {
    // Não tem gold — penalidade máxima
    const resetLevel = isPremium ? 10 : 1;

    await db.$transaction(async (tx) => {
      await tx.character.update({ where: { id: characterId }, data: {
        alignment: newAlignment, alignmentLockedUntil: lockedUntil,
        alignmentCooldownUntil: cooldownUntil,
        level: resetLevel, experience: 0n, goldHand: 0n, goldBank: 0n
      }});
      await tx.economyLog.create({ data: {
        type: 'ALIGNMENT_CHANGE_PENALTY', characterId,
        metadata: { resetToLevel: resetLevel, reason: 'INSUFFICIENT_GOLD' }
      }});
    });

    return { success: true, penalty: true, resetToLevel: resetLevel };
  }
}
```

---

## 8. Sessão Única — Invalidação Forçada

```typescript
async function loginAndInvalidatePreviousSessions(userId: string, deviceInfo: string) {
  // Buscar sessões ativas
  const existing = await db.session.findMany({ where: { userId } });

  // Notificar dispositivos via WebSocket antes de invalidar
  for (const session of existing) {
    await redis.publish(`session:terminate:${session.id}`, JSON.stringify({
      reason: 'NEW_LOGIN',
      message: 'Sua sessão foi encerrada porque um novo login foi detectado.',
      newDeviceInfo: deviceInfo
    }));
  }

  // Pequeno delay para garantir entrega da notificação
  await sleep(200);

  // Invalidar todas as sessões
  await db.session.deleteMany({ where: { userId } });
  for (const session of existing) {
    await redis.del(`session:${session.id}`);
  }

  // Log de segurança
  await db.securityLog.create({ data: {
    userId, event: 'FORCED_LOGOUT_ALL_SESSIONS',
    metadata: { sessionCount: existing.length, triggerDevice: deviceInfo }
  }});

  // Criar nova sessão
  return createNewSession(userId, deviceInfo);
}
```

---

## 9. Bônus de Party por Composição

```typescript
function getPartyBonus(party: PartyWithMembers, isPremium: boolean): PartyBonus {
  const total    = party.members.length;
  const sameAcct = party.members.filter(m => m.isSameAccount).length;
  const external = total - sameAcct - 1; // excluindo o próprio jogador

  if (total === 1) return { expMult: 1.0, goldMult: 1.0 };

  // Solo com personagem da mesma conta: nenhum bônus
  if (external === 0) return { expMult: 1.0, goldMult: 1.0 };

  // 1 player externo + personagem da conta
  if (external === 1 && sameAcct >= 1) return { expMult: 1.10, goldMult: 1.10 };

  // 1 player externo, sem personagem da conta
  if (external === 1 && sameAcct === 0) return { expMult: 1.10, goldMult: 1.10 };

  // 2 players externos (3 na party total, todos de contas diferentes)
  if (external === 2) return { expMult: 1.30, goldMult: 1.30 };

  return { expMult: 1.0, goldMult: 1.0 };
}
```
