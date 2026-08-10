import { PrismaClient, Profession, Alignment, Difficulty, MissionType, SkillCategory, BuffType, BuffTier } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // ==========================================
  // 1. INIMIGOS BASE (4)
  // ==========================================
  console.log('Creating Enemy Definitions...');
  const enemies = [
    {
      id: 'enemy_thief_petty',
      name: 'Punguista de Rua',
      description: 'Um batedor de carteiras ágil mas fraco.',
      profession: Profession.POLICE,
      baseHp: 80,
      baseAttack: 8,
      baseDefense: 5,
      expReward: 15,
      goldMin: 10,
      goldMax: 30,
      isBoss: false,
      spriteKey: 'enemy_thief_petty',
      weakTo: ['attrPrecision', 'attrStrength'],
      resistantTo: ['attrStealth'],
    },
    {
      id: 'enemy_thief_boss',
      name: 'Chefe da Gangue de Rua',
      description: 'Líder local forte e agressivo.',
      profession: Profession.POLICE,
      baseHp: 450,
      baseAttack: 35,
      baseDefense: 25,
      expReward: 150,
      goldMin: 200,
      goldMax: 500,
      isBoss: true,
      spriteKey: 'enemy_thief_boss',
      weakTo: ['attrAuthority', 'attrInvestigation'],
      resistantTo: ['attrStrength'],
    },
    {
      id: 'enemy_police_guard',
      name: 'Guarda de Segurança Privada',
      description: 'Segurança treinado armado com cassetete.',
      profession: Profession.THIEF,
      baseHp: 150,
      baseAttack: 15,
      baseDefense: 15,
      expReward: 35,
      goldMin: 30,
      goldMax: 80,
      isBoss: false,
      spriteKey: 'enemy_police_guard',
      weakTo: ['attrStealth', 'attrAgility'],
      resistantTo: ['attrCharisma'],
    },
    {
      id: 'enemy_police_detective',
      name: 'Detetive da Polícia',
      description: 'Agente da lei focado em investigação e combate tático.',
      profession: Profession.THIEF,
      baseHp: 220,
      baseAttack: 22,
      baseDefense: 20,
      expReward: 65,
      goldMin: 50,
      goldMax: 150,
      isBoss: false,
      spriteKey: 'enemy_police_detective',
      weakTo: ['attrStealth', 'attrIntelligence'],
      resistantTo: ['attrCharisma', 'attrPrecision'],
    },
  ];

  for (const enemy of enemies) {
    await prisma.enemyDefinition.upsert({
      where: { id: enemy.id },
      update: enemy,
      create: enemy,
    });
  }

  // ==========================================
  // 2. BUFFS MÉDICOS (3)
  // ==========================================
  console.log('Creating Medical Buff Definitions...');
  const buffs = [
    {
      id: 'buff_adrenaline',
      name: 'Estimulante Adrenal',
      description: 'Aumenta a Vida Máxima do paciente.',
      type: BuffType.HP_MAX_PERCENT,
      tier: BuffTier.COMMON,
      valueMin: 10.0,
      valueMax: 15.0,
      durationHours: 4,
      minDoctorLevel: 1,
    },
    {
      id: 'buff_mental_focus',
      name: 'Foco Mental',
      description: 'Aumenta a Inteligência temporariamente.',
      type: BuffType.ATTR_INTELLIGENCE,
      tier: BuffTier.COMMON,
      valueMin: 5.0,
      valueMax: 8.0,
      durationHours: 2,
      minDoctorLevel: 10,
    },
    {
      id: 'buff_regen',
      name: 'Regeneração Acelerada',
      description: 'Aumenta a regeneração de vida por hora.',
      type: BuffType.HP_REGEN_HOUR,
      tier: BuffTier.UNCOMMON,
      valueMin: 15.0,
      valueMax: 25.0,
      durationHours: 6,
      minDoctorLevel: 15,
    },
  ];

  for (const buff of buffs) {
    await prisma.medicalBuffDefinition.upsert({
      where: { id: buff.id },
      update: buff,
      create: buff,
    });
  }

  // ==========================================
  // 3. SKILLS BÁSICAS (para associar em recompensas)
  // ==========================================
  console.log('Creating Skill Definitions...');
  const skills = [
    {
      id: 'skill_hand_to_hand',
      name: 'Combate Corpo a Corpo',
      description: 'Eficácia em lutas corporais físicas.',
      professions: ['ALL'],
      category: SkillCategory.COMBAT,
      baseTrainRate: 50.0,
    },
    {
      id: 'skill_lockpicking',
      name: 'Lockpicking',
      description: 'Habilidade de abrir portas e fechaduras trancadas.',
      professions: ['THIEF'],
      category: SkillCategory.STEALTH,
      baseTrainRate: 40.0,
    },
    {
      id: 'skill_first_aid',
      name: 'Primeiros Socorros',
      description: 'Capacidade de estancar sangramentos e tratar feridos rapidamente.',
      professions: ['DOCTOR', 'POLICE'],
      category: SkillCategory.MEDICAL,
      baseTrainRate: 45.0,
    },
  ];

  for (const skill of skills) {
    await prisma.skillDefinition.upsert({
      where: { id: skill.id },
      update: skill,
      create: skill,
    });
  }

  // ==========================================
  // 4. MISSÕES (5 por profissão)
  // ==========================================
  console.log('Creating Mission Definitions...');
  const missions = [
    // --- POLICIAL ---
    {
      id: 'miss_police_patrol',
      name: 'Patrulha Escolar',
      description: 'Garantir a segurança dos estudantes e do tráfego nas proximidades da escola.',
      profession: Profession.POLICE,
      minLevel: 1,
      maxLevel: 10,
      type: MissionType.IDLE,
      durationBase: 60,
      goldMin: 20,
      goldMax: 50,
      expBase: 15,
      skillXpRewards: { skill_first_aid: 5 },
      pvpChance: 0.05,
      hasStages: false,
      stageCount: 0,
      isActive: true,
    },
    {
      id: 'miss_police_investigation',
      name: 'Investigar Beco Suspeito',
      description: 'Procurar pistas de atividades ilícitas no beco atrás da boate.',
      profession: Profession.POLICE,
      minLevel: 10,
      maxLevel: 25,
      type: MissionType.IDLE,
      durationBase: 120,
      goldMin: 80,
      goldMax: 150,
      expBase: 50,
      skillXpRewards: { skill_hand_to_hand: 8 },
      pvpChance: 0.15,
      hasStages: false,
      stageCount: 0,
      isActive: true,
    },
    {
      id: 'miss_police_raid',
      name: 'Invasão a esconderijo de vândalos',
      description: 'Liderar uma incursão tática para limpar um armazém tomado pela criminalidade.',
      profession: Profession.POLICE,
      minLevel: 20,
      type: MissionType.STAGE,
      durationBase: 300,
      goldMin: 300,
      goldMax: 600,
      expBase: 250,
      skillXpRewards: { skill_hand_to_hand: 20, skill_first_aid: 10 },
      pvpChance: 0.0,
      hasStages: true,
      stageCount: 5,
      isActive: true,
    },
    {
      id: 'miss_police_escort',
      name: 'Escolta Bancária VIP',
      description: 'Garantir a chegada segura de um carro-forte até a tesouraria central.',
      profession: Profession.POLICE,
      minLevel: 30,
      type: MissionType.IDLE,
      durationBase: 600,
      goldMin: 500,
      goldMax: 900,
      expBase: 350,
      skillXpRewards: { skill_hand_to_hand: 15 },
      pvpChance: 0.25,
      hasStages: false,
      stageCount: 0,
      isActive: true,
    },
    {
      id: 'miss_police_undercover',
      name: 'Infiltração Tática',
      description: 'Trabalho de inteligência sob disfarce para desmantelar cartéis econômicos.',
      profession: Profession.POLICE,
      minLevel: 50,
      type: MissionType.IDLE,
      durationBase: 1200,
      goldMin: 1200,
      goldMax: 2200,
      expBase: 800,
      skillXpRewards: { skill_first_aid: 25 },
      pvpChance: 0.1,
      hasStages: false,
      stageCount: 0,
      isActive: true,
    },

    // --- LADRÃO ---
    {
      id: 'miss_thief_pickpocket',
      name: 'Bater Carteiras na Feira',
      description: 'Aproveitar a distração de compradores para subtrair pequenas carteiras.',
      profession: Profession.THIEF,
      minLevel: 1,
      maxLevel: 10,
      type: MissionType.IDLE,
      durationBase: 45,
      goldMin: 25,
      goldMax: 60,
      expBase: 12,
      skillXpRewards: { skill_lockpicking: 4 },
      pvpChance: 0.08,
      hasStages: false,
      stageCount: 0,
      isActive: true,
    },
    {
      id: 'miss_thief_burglary',
      name: 'Invadir Casa de Veraneio',
      description: 'Entrar silenciosamente em uma casa vazia e roubar eletrodomésticos leves.',
      profession: Profession.THIEF,
      minLevel: 10,
      maxLevel: 25,
      type: MissionType.IDLE,
      durationBase: 150,
      goldMin: 120,
      goldMax: 250,
      expBase: 65,
      skillXpRewards: { skill_lockpicking: 12 },
      pvpChance: 0.2,
      hasStages: false,
      stageCount: 0,
      isActive: true,
    },
    {
      id: 'miss_thief_heist',
      name: 'Roubo à Joalheria Central',
      description: 'Quebrar vitrines e desarmar alarmes táticos para roubar diamantes e ouro.',
      profession: Profession.THIEF,
      minLevel: 25,
      type: MissionType.STAGE,
      durationBase: 360,
      goldMin: 600,
      goldMax: 1200,
      expBase: 400,
      skillXpRewards: { skill_lockpicking: 25, skill_hand_to_hand: 15 },
      pvpChance: 0.0,
      hasStages: true,
      stageCount: 6,
      isActive: true,
    },
    {
      id: 'miss_thief_bank',
      name: 'Invasão a Banco Comercial',
      description: 'Perfurar o cofre de um banco de médio porte sob a escuridão da noite.',
      profession: Profession.THIEF,
      minLevel: 40,
      type: MissionType.STAGE,
      durationBase: 720,
      goldMin: 1500,
      goldMax: 3000,
      expBase: 900,
      skillXpRewards: { skill_lockpicking: 40 },
      pvpChance: 0.0,
      hasStages: true,
      stageCount: 8,
      isActive: true,
    },
    {
      id: 'miss_thief_cargo',
      name: 'Interceptar Carga Tecnológica',
      description: 'Subtrair chips e equipamentos eletrônicos de um contêiner no porto.',
      profession: Profession.THIEF,
      minLevel: 60,
      type: MissionType.IDLE,
      durationBase: 1500,
      goldMin: 2500,
      goldMax: 5000,
      expBase: 1500,
      skillXpRewards: { skill_hand_to_hand: 35 },
      pvpChance: 0.35,
      hasStages: false,
      stageCount: 0,
      isActive: true,
    },

    // --- MÉDICO ---
    {
      id: 'miss_doctor_clinic',
      name: 'Plantão Clínico Municipal',
      description: 'Atender resfriados, alergias e pequenas contusões no posto local.',
      profession: Profession.DOCTOR,
      minLevel: 1,
      maxLevel: 12,
      type: MissionType.IDLE,
      durationBase: 60,
      goldMin: 30,
      goldMax: 70,
      expBase: 20,
      skillXpRewards: { skill_first_aid: 8 },
      pvpChance: 0.0,
      hasStages: false,
      stageCount: 0,
      isActive: true,
    },
    {
      id: 'miss_doctor_er',
      name: 'Emergência de Trauma',
      description: 'Trabalho sob pressão no pronto-socorro para estabilizar pacientes críticos.',
      profession: Profession.DOCTOR,
      minLevel: 15,
      maxLevel: 35,
      type: MissionType.IDLE,
      durationBase: 180,
      goldMin: 150,
      goldMax: 300,
      expBase: 90,
      skillXpRewards: { skill_first_aid: 18 },
      pvpChance: 0.0,
      hasStages: false,
      stageCount: 0,
      isActive: true,
    },
    {
      id: 'miss_doctor_rescue',
      name: 'Resgate de Ambulância de Risco',
      description: 'Atender feridos no meio de tiroteios e acidentes em vias expressas.',
      profession: Profession.DOCTOR,
      minLevel: 30,
      type: MissionType.IDLE,
      durationBase: 480,
      goldMin: 450,
      goldMax: 800,
      expBase: 300,
      skillXpRewards: { skill_first_aid: 30, skill_hand_to_hand: 10 },
      pvpChance: 0.0,
      hasStages: false,
      stageCount: 0,
      isActive: true,
    },
    {
      id: 'miss_doctor_research',
      name: 'Pesquisar Soro Sintético',
      description: 'Isolar compostos químicos em laboratório para produzir remédios potentes.',
      profession: Profession.DOCTOR,
      minLevel: 50,
      type: MissionType.IDLE,
      durationBase: 900,
      goldMin: 1000,
      goldMax: 1800,
      expBase: 650,
      skillXpRewards: { skill_first_aid: 45 },
      pvpChance: 0.0,
      hasStages: false,
      stageCount: 0,
      isActive: true,
    },
    {
      id: 'miss_doctor_vip',
      name: 'Cirurgia Vip Reconstrutiva',
      description: 'Atendimento estético de alta complexidade para celebridades e oficiais influentes.',
      profession: Profession.DOCTOR,
      minLevel: 75,
      type: MissionType.IDLE,
      durationBase: 1800,
      goldMin: 3000,
      goldMax: 6000,
      expBase: 2000,
      skillXpRewards: { skill_first_aid: 70 },
      pvpChance: 0.0,
      hasStages: false,
      stageCount: 0,
      isActive: true,
    },
  ];

  for (const mission of missions) {
    await prisma.missionDefinition.upsert({
      where: { id: mission.id },
      update: mission,
      create: mission,
    });
  }

  // ==========================================
  // VINCULAR INIMIGOS ÀS MISSÕES DE STAGE
  // ==========================================
  console.log('Binding Enemies to Stage Missions...');
  const poolBinds = [
    { id: 'bind_raid_petty', missionId: 'miss_police_raid', enemyId: 'enemy_thief_petty', weight: 80, minStage: 1, maxStage: 4 },
    { id: 'bind_raid_boss', missionId: 'miss_police_raid', enemyId: 'enemy_thief_boss', weight: 100, minStage: 5, maxStage: 5 },
    { id: 'bind_heist_guard', missionId: 'miss_thief_heist', enemyId: 'enemy_police_guard', weight: 90, minStage: 1, maxStage: 5 },
    { id: 'bind_heist_det', missionId: 'miss_thief_heist', enemyId: 'enemy_police_detective', weight: 100, minStage: 6, maxStage: 6 },
  ];

  for (const bind of poolBinds) {
    await prisma.missionEnemyPool.upsert({
      where: { id: bind.id },
      update: bind,
      create: bind,
    });
  }

  console.log('✅ Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
