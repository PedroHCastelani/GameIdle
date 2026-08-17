# 🗄️ Schema do Banco de Dados — The Life
**Versão:** 0.5  
**Tecnologia:** PostgreSQL + Prisma ORM

---

```prisma
// ================================
// USUÁRIOS E AUTENTICAÇÃO
// ================================

model User {
  id              String    @id @default(cuid())
  email           String    @unique
  emailVerified   Boolean   @default(false)
  verifyToken     String?
  passwordHash    String
  cpfHash         String    @unique  // SHA-256 com salt — nunca texto plano
  cpfSalt         String            // salt único por conta
  accountSide     AccountSide?      // definido ao criar o primeiro personagem
  pvpProtected    Boolean   @default(true)   // false após 7 dias
  isBanned        Boolean   @default(false)
  bannedAt        DateTime?
  bannedReason    String?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  // Slots de personagem
  slot1CharId     String?   @unique
  slot2CharId     String?   @unique
  slot3CharId     String?   @unique
  slot2Unlocked   Boolean   @default(false)
  slot3Unlocked   Boolean   @default(false)

  characters      Character[]
  sessions        Session[]
  transactions    PremiumTransaction[]
  slotPurchases   SlotPurchase[]
  friendships     Friendship[]  @relation("UserFriendships")
  friendOf        Friendship[]  @relation("FriendOf")
  dataExportRequests DataExportRequest[]
  deletionRequests   AccountDeletionRequest[]

  @@map("users")
}

// Lado da conta — definido ao criar o primeiro personagem
enum AccountSide {
  LAW       // Policiais (+ médico opcional)
  CRIME     // Ladrões (+ médico opcional)
  NEUTRAL   // Somente médicos
}

model Session {
  id           String   @id @default(cuid())
  userId       String
  refreshToken String   @unique
  expiresAt    DateTime
  ipAddress    String?
  userAgent    String?
  deviceInfo   String?
  createdAt    DateTime @default(now())

  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@map("sessions")
}

model UserPremium {
  id              String    @id @default(cuid())
  userId          String    @unique
  activeUntil     DateTime?
  credits         Int       @default(0)
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  @@map("user_premium")
}

// Compra de slots extras de personagem
model SlotPurchase {
  id          String      @id @default(cuid())
  userId      String
  slot        Int         // 2 ou 3
  paidWith    CurrencyType
  goldPaid    BigInt?
  creditsPaid Int?
  purchasedAt DateTime    @default(now())

  user        User        @relation(fields: [userId], references: [id])

  @@map("slot_purchases")
}

enum CurrencyType {
  GOLD
  CREDITS
}

// ================================
// LGPD — DIREITOS DO TITULAR
// ================================

model DataExportRequest {
  id          String    @id @default(cuid())
  userId      String
  requestedAt DateTime  @default(now())
  completedAt DateTime?
  downloadUrl String?   // URL temporária do JSON exportado
  expiresAt   DateTime? // URL expira em 48h

  user        User      @relation(fields: [userId], references: [id])

  @@map("data_export_requests")
}

model AccountDeletionRequest {
  id              String    @id @default(cuid())
  userId          String    @unique
  requestedAt     DateTime  @default(now())
  scheduledFor    DateTime  // 30 dias após solicitação
  confirmedAt     DateTime?
  executedAt      DateTime?
  anonymizedAt    DateTime?

  user            User      @relation(fields: [userId], references: [id])

  @@map("account_deletion_requests")
}

// ================================
// PERSONAGEM
// ================================

model Character {
  id               String     @id @default(cuid())
  userId           String
  name             String     @unique
  profession       Profession
  isFirstCreated   Boolean    @default(false) // líder da party solo

  // Nível e EXP
  level            Int        @default(1)
  experience       BigInt     @default(0)

  // Moedas
  goldHand         BigInt     @default(100)
  goldBank         BigInt     @default(0)

  // Atributos base
  attrStrength      Int       @default(10)
  attrAgility       Int       @default(10)
  attrIntelligence  Int       @default(10)
  attrAuthority     Int       @default(10)
  attrStealth       Int       @default(10)
  attrCharisma      Int       @default(10)
  attrPrecision     Int       @default(10)
  attrInvestigation Int       @default(10)
  attributePoints   Int       @default(0)

  // Alinhamento (médico no MVP; todos na Fase 2)
  alignment             Alignment  @default(NEUTRAL)
  alignmentLockedUntil  DateTime?
  alignmentCooldownUntil DateTime?
  corruptionScore       Int        @default(0)   // Fase 2

  // Reputação (independente por personagem — userId nunca exposto)
  reputationLaw    Int        @default(0)
  reputationCrime  Int        @default(0)

  // Stamina
  staminaCurrent      Int       @default(10)
  staminaLastRegen    DateTime  @default(now())
  stimulantBoughtToday Int      @default(0)  // reset diário

  // Estado de missão
  currentMissionId    String?
  isOnMission         Boolean   @default(false)
  missionStartedAt    DateTime?
  missionDifficulty   Difficulty?
  stageQueueRemaining Int       @default(0)  // execuções enfileiradas restantes
  lastOnlineAt        DateTime  @default(now())

  // Treino de skill offline
  trainingSkillId   String?
  trainingStartedAt DateTime?

  // Prisão
  isPrisoned          Boolean   @default(false)
  prisonedAt          DateTime?
  prisonEndsAt        DateTime?
  prisonCrime         String?   // descrição do crime
  prisonGravity       Int?      // gravidade 1–5
  prisonBribeAttempts Int       @default(0)
  furtivityDebuffUntil DateTime?
  furtivityDebuffValue Int      @default(0)  // % de redução de furtividade

  // Delegado (Policial nível 81+)
  acceptsBribes    Boolean   @default(false)
  bribeCorruption  Int       @default(0)  // acumulado de propinas aceitas

  // Atendimento médico
  isAttending          Boolean   @default(false)
  attendingStartedAt   DateTime?
  attendingEndsAt      DateTime?
  consultPriceGold     BigInt?
  consultPricePercent  Float?
  attendingCooldownUntil DateTime?

  // Morte
  totalDeaths          Int       @default(0)
  lastDeathAt          DateTime?
  firstDailyDeathUsed  Boolean   @default(false)

  createdAt        DateTime   @default(now())
  updatedAt        DateTime   @updatedAt

  user             User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  skills           CharacterSkill[]
  talents          CharacterTalent[]
  equipment        CharacterEquipment?
  inventory        InventoryItem[]
  missionLogs      MissionLog[]
  stageAttempts    StageAttempt[]
  partyMemberships PartyMember[]
  pvpAsAttacker    PvPLog[]         @relation("Attacker")
  pvpAsDefender    PvPLog[]         @relation("Defender")
  vengeanceHeld    VengeanceRight[] @relation("VengeanceHolder")
  vengeanceTarget  VengeanceRight[] @relation("VengeanceTarget")
  huntedStatus     HuntedStatus?
  marketListings   MarketListing[]
  creditListings   CreditListing[]
  guildMembership  GuildMember?
  medicalBuffSlots CharacterMedicalBuffSlot[]
  consultationsAsDoctor  MedicalConsultation[] @relation("Doctor")
  consultationsAsPatient MedicalConsultation[] @relation("Patient")
  favoriteDoctors  FavoriteDoctor[] @relation("PatientFavorites")
  favoritedBy      FavoriteDoctor[] @relation("DoctorFavorites")
  bribesSent       PrisonBribe[]    @relation("BribeSender")
  bribesReceived   PrisonBribe[]    @relation("BribeReceiver")
  economyLogs      EconomyLog[]

  @@index([userId])
  @@index([profession, level])
  @@index([isAttending])
  @@index([isPrisoned, prisonEndsAt])
  @@map("characters")
}

enum Profession {
  POLICE
  THIEF
  DOCTOR
}

enum Alignment {
  GOOD
  EVIL
  NEUTRAL
}

enum Difficulty {
  EASY
  MEDIUM
  HARD
  VERY_HARD
}

// ================================
// SKILLS
// ================================

model SkillDefinition {
  id            String        @id @default(cuid())
  name          String        @unique
  description   String
  professions   String[]      // ["POLICE"] ou ["ALL"]
  category      SkillCategory
  baseTrainRate Float         // EXP de skill por hora base

  characterSkills CharacterSkill[]

  @@map("skill_definitions")
}

model CharacterSkill {
  id             String          @id @default(cuid())
  characterId    String
  skillId        String
  level          Float           @default(1.0)   // sem cap
  experience     Float           @default(0.0)
  totalTrainTime Int             @default(0)     // segundos totais treinados

  character      Character       @relation(fields: [characterId], references: [id], onDelete: Cascade)
  skill          SkillDefinition @relation(fields: [skillId], references: [id])

  @@unique([characterId, skillId])
  @@map("character_skills")
}

enum SkillCategory {
  COMBAT
  STEALTH
  INVESTIGATION
  MEDICAL
  SOCIAL
  TECHNICAL
  UNIVERSAL
}

// ================================
// TALENTOS
// ================================

model TalentTree {
  id         String       @id @default(cuid())
  profession Profession
  line       String       // "COMBAT", "STEALTH", "BUFFS", etc.
  name       String

  nodes      TalentNode[]

  @@map("talent_trees")
}

model TalentNode {
  id             String      @id @default(cuid())
  treeId         String
  name           String
  description    String
  tier           Int         // posição na linha (1, 2, 3...)
  pointCost      Int         @default(1)
  prerequisiteId String?
  effectType     String      // "BUFF_SLOT", "BUFF_PROGRESSION_RATE", "BUFF_COUNT_PER_LEVEL", etc.
  effectValue    Float       @default(0)

  tree           TalentTree  @relation(fields: [treeId], references: [id])
  prerequisite   TalentNode? @relation("TalentPrereq", fields: [prerequisiteId], references: [id])
  dependents     TalentNode[] @relation("TalentPrereq")
  characterTalents CharacterTalent[]

  @@map("talent_nodes")
}

model CharacterTalent {
  id          String     @id @default(cuid())
  characterId String
  nodeId      String
  unlockedAt  DateTime   @default(now())

  character   Character  @relation(fields: [characterId], references: [id], onDelete: Cascade)
  node        TalentNode @relation(fields: [nodeId], references: [id])

  @@unique([characterId, nodeId])
  @@map("character_talents")
}

// ================================
// STAMINA
// ================================

model StaminaLog {
  id          String   @id @default(cuid())
  characterId String
  delta       Int      // positivo = ganho, negativo = gasto
  reason      String   // "REGEN", "STAGE_ATTEMPT", "PVP_ATTACK", "STIMULANT", "ATTENDING"
  createdAt   DateTime @default(now())

  @@index([characterId, createdAt])
  @@map("stamina_logs")
}

// ================================
// MISSÕES
// ================================

model MissionDefinition {
  id             String     @id @default(cuid())
  name           String
  description    String
  profession     Profession
  minLevel       Int
  maxLevel       Int?
  type           MissionType
  durationBase   Int        // segundos por ciclo idle
  goldMin        Int
  goldMax        Int
  expBase        Int
  skillXpRewards Json       // { skillId: xpPerHour }
  pvpChance      Float      @default(0)
  hasStages      Boolean    @default(false)
  stageCount     Int        @default(0)
  isActive       Boolean    @default(true)

  logs           MissionLog[]
  stageAttempts  StageAttempt[]
  enemyPools     MissionEnemyPool[]
  drops          MissionDrop[]

  @@index([profession, minLevel])
  @@map("mission_definitions")
}

model MissionLog {
  id              String    @id @default(cuid())
  characterId     String
  missionId       String
  startedAt       DateTime
  endedAt         DateTime
  cycles          Int
  goldGained      BigInt
  expGained       BigInt
  skillXpGained   Json
  hadPvpEncounter Boolean   @default(false)
  pvpOutcome      String?

  character       Character         @relation(fields: [characterId], references: [id], onDelete: Cascade)
  mission         MissionDefinition @relation(fields: [missionId], references: [id])

  @@index([characterId, startedAt])
  @@map("mission_logs")
}

enum MissionType {
  IDLE
  STAGE
  PVP_ENCOUNTER
  ORGANIZED_ATTACK
  MEDICAL_ATTENDANCE
  CONTRACT
}

// ================================
// STAGES
// ================================

model StageAttempt {
  id             String       @id @default(cuid())
  characterId    String
  missionId      String
  partyId        String?
  difficulty     Difficulty
  queuePosition  Int          @default(1)   // posição na fila de execuções
  staminaSpent   Int
  stageReached   Int
  totalStages    Int
  outcome        StageOutcome
  goldGained     BigInt       @default(0)
  expGained      BigInt       @default(0)
  goldPenalty    BigInt       @default(0)
  itemLostId     String?
  startedAt      DateTime     @default(now())
  endedAt        DateTime?

  character      Character         @relation(fields: [characterId], references: [id], onDelete: Cascade)
  mission        MissionDefinition @relation(fields: [missionId], references: [id])
  stageResults   StageResult[]

  @@index([characterId, startedAt])
  @@map("stage_attempts")
}

model StageResult {
  id          String       @id @default(cuid())
  attemptId   String
  stageNumber Int
  enemies     Json         // [{ enemyId, name, weakTo, resistantTo }]
  goldGained  BigInt
  expGained   BigInt
  outcome     StageOutcome

  attempt     StageAttempt @relation(fields: [attemptId], references: [id], onDelete: Cascade)

  @@map("stage_results")
}

enum StageOutcome {
  SUCCESS
  FAILED
  BOSS_DEFEATED
}

// ================================
// INIMIGOS DE STAGE
// ================================

model EnemyDefinition {
  id          String     @id @default(cuid())
  name        String
  description String?
  profession  Profession // missão de qual profissão
  baseHp      Int
  baseAttack  Int
  baseDefense Int
  expReward   Int
  goldMin     Int
  goldMax     Int
  isBoss      Boolean    @default(false)
  spriteKey   String?
  weakTo      String[]   // atributos do personagem
  resistantTo String[]

  pools       MissionEnemyPool[]

  @@map("enemy_definitions")
}

model MissionEnemyPool {
  id        String            @id @default(cuid())
  missionId String
  enemyId   String
  weight    Int               @default(100)
  minStage  Int               @default(1)
  maxStage  Int?

  mission   MissionDefinition @relation(fields: [missionId], references: [id])
  enemy     EnemyDefinition   @relation(fields: [enemyId], references: [id])

  @@map("mission_enemy_pools")
)

// ================================
// BUFFS MÉDICOS
// ================================

model MedicalBuffDefinition {
  id             String   @id @default(cuid())
  name           String
  description    String
  type           BuffType
  tier           BuffTier
  valueMin       Float
  valueMax       Float
  durationHours  Int
  minDoctorLevel Int      @default(1)

  buffSlots      CharacterMedicalBuffSlot[]
  consultations  MedicalConsultation[]

  @@map("medical_buff_definitions")
}

// Cada slot de buff que o médico possui
model CharacterMedicalBuffSlot {
  id              String                 @id @default(cuid())
  characterId     String
  slotNumber      Int                    // 1, 2, 3 (baseado nos talentos)
  buffDefId       String?                // null = slot desbloqueado mas sem buff ainda
  currentValue    Float?                 // valor atual dentro do tier
  progressPercent Float                  @default(0)  // 0–100% de progressão para próximo tier
  acquiredAt      DateTime?
  lastProgressAt  DateTime?

  character       Character              @relation(fields: [characterId], references: [id], onDelete: Cascade)
  buffDef         MedicalBuffDefinition? @relation(fields: [buffDefId], references: [id])
  scrollUsages    ScrollUsageLog[]

  @@unique([characterId, slotNumber])
  @@map("character_medical_buff_slots")
}

// Buffs ativos em um personagem (paciente)
model ActiveBuff {
  id          String   @id @default(cuid())
  characterId String   // paciente
  buffType    BuffType
  value       Float
  source      String   // "CONSULTATION:{consultationId}"
  expiresAt   DateTime
  createdAt   DateTime @default(now())

  @@index([characterId, expiresAt])
  @@map("active_buffs")
}

enum BuffType {
  HP_MAX_PERCENT
  HP_REGEN_HOUR
  ATTR_STRENGTH
  ATTR_AGILITY
  ATTR_INTELLIGENCE
  ATTR_AUTHORITY
  ATTR_STEALTH
  ATTR_PRECISION
  DEATH_PENALTY_REDUCTION
  GOLD_BONUS_PERCENT
  EXP_BONUS_PERCENT
  STAMINA_REDUCTION_NEXT
  ITEM_LOSS_SHIELD
}

enum BuffTier {
  COMMON
  UNCOMMON
  RARE
  EPIC
}

// ================================
// SCROLLS
// ================================

model ScrollUsageLog {
  id          String     @id @default(cuid())
  characterId String
  scrollType  ScrollType
  slotId      String     // CharacterMedicalBuffSlot afetado
  tierBefore  BuffTier
  tierAfter   BuffTier
  valueBefore Float
  valueAfter  Float
  tierChanged Boolean    @default(false)
  usedAt      DateTime   @default(now())

  slot        CharacterMedicalBuffSlot @relation(fields: [slotId], references: [id])

  @@index([characterId, usedAt])
  @@map("scroll_usage_logs")
}

enum ScrollType {
  REROLL
  AMPLIFY
}

// ================================
// ATENDIMENTO MÉDICO
// ================================

model MedicalConsultation {
  id             String    @id @default(cuid())
  doctorId       String
  patientId      String
  priceGold      BigInt
  alignmentMatch Boolean   @default(false)
  discountApplied Float    @default(0)
  buffDefId      String
  buffValue      Float
  bonusBuffDefId String?
  bonusBuffValue Float?
  consultedAt    DateTime  @default(now())
  buffsExpireAt  DateTime

  doctor         Character             @relation("Doctor", fields: [doctorId], references: [id])
  patient        Character             @relation("Patient", fields: [patientId], references: [id])
  buff           MedicalBuffDefinition @relation(fields: [buffDefId], references: [id])

  @@index([patientId, consultedAt])
  @@index([doctorId, consultedAt])
  @@map("medical_consultations")
}

model FavoriteDoctor {
  id        String    @id @default(cuid())
  patientId String
  doctorId  String
  addedAt   DateTime  @default(now())

  patient   Character @relation("PatientFavorites", fields: [patientId], references: [id], onDelete: Cascade)
  doctor    Character @relation("DoctorFavorites", fields: [doctorId], references: [id], onDelete: Cascade)

  @@unique([patientId, doctorId])
  @@map("favorite_doctors")
}

// ================================
// PRISÃO
// ================================

model PrisonRecord {
  id             String    @id @default(cuid())
  characterId    String
  crime          String
  gravity        Int       // 1–5
  sentenceHours  Float
  startedAt      DateTime  @default(now())
  endsAt         DateTime
  endedEarlyAt   DateTime?
  endReason      PrisonEndReason @default(SERVED)
  bribeId        String?   @unique

  bribe          PrisonBribe? @relation(fields: [bribeId], references: [id])

  @@index([characterId, startedAt])
  @@map("prison_records")
}

model PrisonBribe {
  id             String    @id @default(cuid())
  prisonerId     String    // ladrão/médico preso
  delegateId     String    // policial delegado
  goldAmount     BigInt    // valor total da propina
  delegateCut    BigInt    // 5% que o delegado recebeu
  outcome        BribeOutcome
  attemptedAt    DateTime  @default(now())
  resolvedAt     DateTime?
  timeAdded      Float?    // horas adicionadas se recusado

  prisoner       Character  @relation("BribeSender", fields: [prisonerId], references: [id])
  delegate       Character  @relation("BribeReceiver", fields: [delegateId], references: [id])
  prisonRecord   PrisonRecord?

  @@index([prisonerId])
  @@index([delegateId])
  @@map("prison_bribes")
}

enum PrisonEndReason {
  SERVED      // cumpriu a pena
  BRIBE       // pagou propina
}

enum BribeOutcome {
  ACCEPTED
  REFUSED
  NO_DELEGATE_AVAILABLE
}

// ================================
// PvP E VINGANÇA
// ================================

model PvPLog {
  id              String     @id @default(cuid())
  attackerId      String
  defenderId      String
  type            PvPType
  outcome         PvPOutcome
  attackerRoll    Int
  defenderRoll    Int
  staminaSpent    Int        @default(1)
  goldTransferred BigInt     @default(0)
  itemTransferredId String?
  occurredAt      DateTime   @default(now())

  attacker        Character  @relation("Attacker", fields: [attackerId], references: [id])
  defender        Character  @relation("Defender", fields: [defenderId], references: [id])
  vengeanceRight  VengeanceRight?

  @@index([attackerId, occurredAt])
  @@index([defenderId, occurredAt])
  @@map("pvp_logs")
}

model VengeanceRight {
  id          String    @id @default(cuid())
  holderId    String
  targetId    String
  pvpLogId    String    @unique
  expiresAt   DateTime
  isUsed      Boolean   @default(false)
  usedAt      DateTime?

  holder      Character @relation("VengeanceHolder", fields: [holderId], references: [id])
  target      Character @relation("VengeanceTarget", fields: [targetId], references: [id])
  originEvent PvPLog    @relation(fields: [pvpLogId], references: [id])

  @@index([holderId, isUsed, expiresAt])
  @@map("vengeance_rights")
}

enum PvPType {
  MISSION_ENCOUNTER
  ORGANIZED_ATTACK
  VENGEANCE
  HUNTED_ATTACK
}

enum PvPOutcome {
  ATTACKER_WIN
  DEFENDER_WIN
  DRAW
  DEFENDER_ESCAPED
}

// ================================
// HUNTED — TOP 5
// ================================

model HuntedStatus {
  id          String     @id @default(cuid())
  characterId String     @unique
  profession  Profession
  rank        Int        // 1–5
  score       BigInt
  weekStart   DateTime
  enteredAt   DateTime   @default(now())

  character   Character  @relation(fields: [characterId], references: [id], onDelete: Cascade)

  @@map("hunted_status")
}

// ================================
// ITENS E INVENTÁRIO
// ================================

model ItemTemplate {
  id            String     @id @default(cuid())
  name          String
  description   String?
  type          ItemType
  rarity        ItemRarity
  slot          EquipSlot?
  professions   String[]
  isStackable   Boolean    @default(false)
  maxStack      Int        @default(1)
  baseValueGold Int

  statStrength      Int?
  statAgility       Int?
  statIntelligence  Int?
  statAuthority     Int?
  statStealth       Int?
  statPrecision     Int?
  statInvestigation Int?
  statVarianceMin   Float  @default(0.85)
  statVarianceMax   Float  @default(1.15)
  maxDurability     Int    @default(100)

  inventoryItems  InventoryItem[]
  missionDrops    MissionDrop[]

  @@map("item_templates")
}

model MissionDrop {
  id              String            @id @default(cuid())
  missionId       String
  itemTemplateId  String
  dropChance      Float
  quantityMin     Int               @default(1)
  quantityMax     Int               @default(1)
  minMissionLevel Int               @default(1)

  mission         MissionDefinition @relation(fields: [missionId], references: [id])
  itemTemplate    ItemTemplate      @relation(fields: [itemTemplateId], references: [id])

  @@map("mission_drops")
}

model InventoryItem {
  id                String       @id @default(cuid())
  characterId       String
  templateId        String
  quantity          Int          @default(1)
  isIdentified      Boolean      @default(false)
  durability        Int          @default(100)
  isEquipped        Boolean      @default(false)
  equippedSlot      EquipSlot?
  isInGuildArsenal  Boolean      @default(false)
  loanedToCharId    String?
  loanExpiresAt     DateTime?

  rolledStrength    Int?
  rolledAgility     Int?
  rolledIntelligence Int?
  rolledAuthority   Int?
  rolledStealth     Int?
  rolledPrecision   Int?
  rolledInvestigation Int?

  obtainedAt        DateTime     @default(now())
  obtainedFrom      String?      // "MISSION", "MARKET", "PVP_LOOT", "GUILD_ARSENAL"

  character         Character    @relation(fields: [characterId], references: [id], onDelete: Cascade)
  template          ItemTemplate @relation(fields: [templateId], references: [id])
  marketListing     MarketListing?

  @@index([characterId, isEquipped])
  @@map("inventory_items")
}

model CharacterEquipment {
  characterId String    @id
  headId      String?
  bodyId      String?
  legsId      String?
  bootsId     String?
  weaponId    String?
  offhandId   String?
  amuletId    String?
  ringId      String?
  specialId   String?

  character   Character @relation(fields: [characterId], references: [id], onDelete: Cascade)

  @@map("character_equipment")
}

enum ItemType {
  EQUIPMENT
  CONSUMABLE
  MATERIAL
  CONTRABAND
  DOCUMENT
  SCROLL
  CURRENCY
  COSMETIC
}

enum ItemRarity {
  COMMON
  UNCOMMON
  RARE
  EPIC
  LEGENDARY
}

enum EquipSlot {
  HEAD
  BODY
  LEGS
  BOOTS
  WEAPON
  OFFHAND
  AMULET
  RING
  SPECIAL
}

// ================================
// PARTY
// ================================

model Party {
  id        String        @id @default(cuid())
  leaderId  String        // characterId do líder
  isActive  Boolean       @default(true)
  isSolo    Boolean       @default(false)  // party dentro da mesma conta
  createdAt DateTime      @default(now())

  members   PartyMember[]

  @@map("parties")
}

model PartyMember {
  id             String    @id @default(cuid())
  partyId        String
  characterId    String
  role           PartyRole @default(MEMBER)
  isSameAccount  Boolean   @default(false)  // personagem da mesma conta do líder
  acceptedAt     DateTime?   // null = convite pendente (não se aplica a isSameAccount)
  joinedAt       DateTime  @default(now())

  party          Party     @relation(fields: [partyId], references: [id], onDelete: Cascade)
  character      Character @relation(fields: [characterId], references: [id])

  @@unique([partyId, characterId])
  @@map("party_members")
}

enum PartyRole {
  LEADER
  MEMBER
}

// ================================
// AMIGOS
// ================================

model Friendship {
  id        String           @id @default(cuid())
  userId    String
  friendId  String
  status    FriendshipStatus @default(PENDING)
  createdAt DateTime         @default(now())
  updatedAt DateTime         @updatedAt

  user      User             @relation("UserFriendships", fields: [userId], references: [id])
  friend    User             @relation("FriendOf", fields: [friendId], references: [id])

  @@unique([userId, friendId])
  @@map("friendships")
}

enum FriendshipStatus {
  PENDING
  ACCEPTED
  BLOCKED
}

// ================================
// MERCADO DE ITENS (GOLD)
// ================================

model MarketListing {
  id              String        @id @default(cuid())
  sellerId        String
  inventoryItemId String        @unique
  priceGold       BigInt
  listedAt        DateTime      @default(now())
  expiresAt       DateTime
  status          ListingStatus @default(ACTIVE)

  seller          Character     @relation(fields: [sellerId], references: [id])
  inventoryItem   InventoryItem @relation(fields: [inventoryItemId], references: [id])

  @@index([status, listedAt])
  @@map("market_listings")
}

// ================================
// MERCADO DE CRÉDITOS (player → gold)
// ================================

model CreditListing {
  id         String        @id @default(cuid())
  sellerId   String
  credits    Int
  priceGold  BigInt
  listedAt   DateTime      @default(now())
  expiresAt  DateTime
  status     ListingStatus @default(ACTIVE)

  seller     Character     @relation(fields: [sellerId], references: [id])

  @@index([status, listedAt])
  @@map("credit_listings")
}

enum ListingStatus {
  ACTIVE
  SOLD
  EXPIRED
  CANCELLED
}

// ================================
// BANCO
// ================================

model BankTransaction {
  id          String      @id @default(cuid())
  characterId String
  type        BankTxType
  amount      BigInt
  fee         BigInt      @default(0)
  channel     BankChannel
  createdAt   DateTime    @default(now())

  @@index([characterId, createdAt])
  @@map("bank_transactions")
}

enum BankTxType {
  DEPOSIT
  WITHDRAW
}

enum BankChannel {
  PHYSICAL    // taxa 0,5%
  INTERFACE   // taxa 3% depósito + 1% saque
}

// ================================
// GUILD
// ================================

model Guild {
  id          String      @id @default(cuid())
  name        String      @unique
  tag         String      @unique
  description String?
  rank        Int         @default(1)
  side        AccountSide // LAW, CRIME ou NEUTRAL — guilds não são mistas
  goldFund    BigInt      @default(0)
  founderId   String
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt

  members       GuildMember[]
  contributions GuildContribution[]
  upgradeLog    GuildUpgradeLog[]
  arsenalItems  GuildArsenalItem[]

  @@map("guilds")
}

model GuildMember {
  id          String    @id @default(cuid())
  guildId     String
  characterId String    @unique
  role        GuildRole @default(RECRUIT)
  joinedAt    DateTime  @default(now())
  weeklyGold  BigInt    @default(0)
  totalGold   BigInt    @default(0)

  guild       Guild     @relation(fields: [guildId], references: [id], onDelete: Cascade)
  character   Character @relation(fields: [characterId], references: [id])

  @@map("guild_members")
}

model GuildContribution {
  id          String   @id @default(cuid())
  guildId     String
  characterId String
  type        String   // "GOLD", "ITEM"
  goldAmount  BigInt?
  itemId      String?
  createdAt   DateTime @default(now())

  guild       Guild    @relation(fields: [guildId], references: [id])

  @@map("guild_contributions")
}

model GuildArsenalItem {
  id              String    @id @default(cuid())
  guildId         String
  inventoryItemId String    @unique
  loanedToId      String?
  loanedAt        DateTime?
  loanExpiresAt   DateTime?

  guild           Guild     @relation(fields: [guildId], references: [id])

  @@map("guild_arsenal_items")
}

model GuildUpgradeLog {
  id          String   @id @default(cuid())
  guildId     String
  fromRank    Int
  toRank      Int
  goldSpent   BigInt
  triggeredBy String
  upgradedAt  DateTime @default(now())

  guild       Guild    @relation(fields: [guildId], references: [id])

  @@map("guild_upgrade_logs")
}

enum GuildRole {
  FOUNDER
  LEADER
  OFFICER
  MEMBER
  RECRUIT
}

// ================================
// ECONOMIA — LOG IMUTÁVEL
// ================================

model EconomyLog {
  id                 String         @id @default(cuid())
  type               EconomyLogType
  characterId        String?
  relatedCharacterId String?
  itemId             String?
  goldAmount         BigInt?
  creditAmount       Int?
  feeAmount          BigInt?
  metadata           Json?
  createdAt          DateTime       @default(now())

  character          Character?     @relation(fields: [characterId], references: [id])

  // NUNCA deletar ou atualizar — particionar por mês após escala
  @@index([characterId, createdAt])
  @@index([type, createdAt])
  @@map("economy_logs")
}

enum EconomyLogType {
  MISSION_REWARD
  STAGE_REWARD
  STAGE_PENALTY
  PVP_GOLD_TRANSFER
  MARKET_SALE
  MARKET_FEE
  CREDIT_MARKET_SALE
  CREDIT_MARKET_FEE
  BANK_DEPOSIT
  BANK_WITHDRAW
  BANK_FEE
  DEATH_PENALTY_GOLD
  DEATH_PENALTY_ITEM
  GUILD_CONTRIBUTION
  GUILD_BONUS
  CONSULTATION_PAID
  CONSULTATION_RECEIVED
  STIMULANT_PURCHASE
  SCROLL_PURCHASE
  PREMIUM_PURCHASE
  SLOT_PURCHASE
  ALIGNMENT_CHANGE_FEE
  ALIGNMENT_CHANGE_PENALTY
  PRISON_BRIBE_PAID
  PRISON_BRIBE_REFUSED_PENALTY
  PRISON_BRIBE_DELEGATE_RECEIVED
  CONTRACT_PAYMENT
  CONTRACT_FEE
}

// ================================
// MONETIZAÇÃO
// ================================

model PremiumTransaction {
  id             String   @id @default(cuid())
  userId         String
  type           String   // "SUBSCRIPTION_MONTHLY", "CREDIT_PACK_100", etc.
  amountBRL      Float?
  creditsGranted Int?
  daysGranted    Int?
  gateway        String   // "STRIPE", "MERCADOPAGO"
  gatewayTxId    String?  @unique
  status         String   @default("PENDING")
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  @@map("premium_transactions")
}
```

---

## Índices Críticos de Performance

```sql
-- Personagens em missão idle (cálculo offline em batch)
CREATE INDEX idx_chars_on_mission
  ON characters(is_on_mission, last_online_at)
  WHERE is_on_mission = true;

-- Médicos disponíveis para atendimento
CREATE INDEX idx_chars_attending
  ON characters(is_attending, attending_ends_at)
  WHERE is_attending = true;

-- Personagens presos com pena em andamento
CREATE INDEX idx_chars_prisoned
  ON characters(is_prisoned, prison_ends_at)
  WHERE is_prisoned = true;

-- Debuff de furtividade ativos
CREATE INDEX idx_furtivity_debuff
  ON characters(furtivity_debuff_until)
  WHERE furtivity_debuff_until IS NOT NULL;

-- Buffs ativos não expirados
CREATE INDEX idx_active_buffs_valid
  ON active_buffs(character_id, expires_at)
  WHERE expires_at > NOW();

-- Direitos de vingança não usados e não expirados
CREATE INDEX idx_vengeance_active
  ON vengeance_rights(holder_id, expires_at)
  WHERE is_used = false;

-- Listings ativos no mercado
CREATE INDEX idx_market_active
  ON market_listings(status, listed_at DESC)
  WHERE status = 'ACTIVE';

CREATE INDEX idx_credit_market_active
  ON credit_listings(status, listed_at DESC)
  WHERE status = 'ACTIVE';

-- Top 5 da semana corrente
CREATE INDEX idx_hunted_week
  ON hunted_status(profession, rank, week_start);

-- Auditoria econômica
CREATE INDEX idx_economy_audit
  ON economy_logs(character_id, created_at DESC);

-- CPF hash (busca rápida na criação de conta)
CREATE UNIQUE INDEX idx_users_cpf_hash ON users(cpf_hash);
```

## Particionamento Futuro (após escala)
```sql
-- Após 1M registros cada:
mission_logs      → particionar por mês
stage_attempts    → particionar por mês
economy_logs      → particionar por mês (NUNCA deletar)
pvp_logs          → particionar por mês
stamina_logs      → particionar por mês
prison_records    → particionar por mês
bank_transactions → particionar por mês
```
