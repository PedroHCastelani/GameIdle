-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "AccountSide" AS ENUM ('LAW', 'CRIME', 'NEUTRAL');

-- CreateEnum
CREATE TYPE "CurrencyType" AS ENUM ('GOLD', 'CREDITS');

-- CreateEnum
CREATE TYPE "Profession" AS ENUM ('POLICE', 'THIEF', 'DOCTOR');

-- CreateEnum
CREATE TYPE "Alignment" AS ENUM ('GOOD', 'EVIL', 'NEUTRAL');

-- CreateEnum
CREATE TYPE "Difficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD', 'VERY_HARD');

-- CreateEnum
CREATE TYPE "SkillCategory" AS ENUM ('COMBAT', 'STEALTH', 'INVESTIGATION', 'MEDICAL', 'SOCIAL', 'TECHNICAL', 'UNIVERSAL');

-- CreateEnum
CREATE TYPE "MissionType" AS ENUM ('IDLE', 'STAGE', 'PVP_ENCOUNTER', 'ORGANIZED_ATTACK', 'MEDICAL_ATTENDANCE', 'CONTRACT');

-- CreateEnum
CREATE TYPE "StageOutcome" AS ENUM ('SUCCESS', 'FAILED', 'BOSS_DEFEATED');

-- CreateEnum
CREATE TYPE "BuffType" AS ENUM ('HP_MAX_PERCENT', 'HP_REGEN_HOUR', 'ATTR_STRENGTH', 'ATTR_AGILITY', 'ATTR_INTELLIGENCE', 'ATTR_AUTHORITY', 'ATTR_STEALTH', 'ATTR_PRECISION', 'DEATH_PENALTY_REDUCTION', 'GOLD_BONUS_PERCENT', 'EXP_BONUS_PERCENT', 'STAMINA_REDUCTION_NEXT', 'ITEM_LOSS_SHIELD');

-- CreateEnum
CREATE TYPE "BuffTier" AS ENUM ('COMMON', 'UNCOMMON', 'RARE', 'EPIC');

-- CreateEnum
CREATE TYPE "ScrollType" AS ENUM ('REROLL', 'AMPLIFY');

-- CreateEnum
CREATE TYPE "PrisonEndReason" AS ENUM ('SERVED', 'BRIBE');

-- CreateEnum
CREATE TYPE "BribeOutcome" AS ENUM ('ACCEPTED', 'REFUSED', 'NO_DELEGATE_AVAILABLE');

-- CreateEnum
CREATE TYPE "PvPType" AS ENUM ('MISSION_ENCOUNTER', 'ORGANIZED_ATTACK', 'VENGEANCE', 'HUNTED_ATTACK');

-- CreateEnum
CREATE TYPE "PvPOutcome" AS ENUM ('ATTACKER_WIN', 'DEFENDER_WIN', 'DRAW', 'DEFENDER_ESCAPED');

-- CreateEnum
CREATE TYPE "ItemType" AS ENUM ('EQUIPMENT', 'CONSUMABLE', 'MATERIAL', 'CONTRABAND', 'DOCUMENT', 'SCROLL', 'CURRENCY', 'COSMETIC');

-- CreateEnum
CREATE TYPE "ItemRarity" AS ENUM ('COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY');

-- CreateEnum
CREATE TYPE "EquipSlot" AS ENUM ('HEAD', 'BODY', 'LEGS', 'BOOTS', 'WEAPON', 'OFFHAND', 'AMULET', 'RING', 'SPECIAL');

-- CreateEnum
CREATE TYPE "PartyRole" AS ENUM ('LEADER', 'MEMBER');

-- CreateEnum
CREATE TYPE "FriendshipStatus" AS ENUM ('PENDING', 'ACCEPTED', 'BLOCKED');

-- CreateEnum
CREATE TYPE "ListingStatus" AS ENUM ('ACTIVE', 'SOLD', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "BankTxType" AS ENUM ('DEPOSIT', 'WITHDRAW');

-- CreateEnum
CREATE TYPE "BankChannel" AS ENUM ('PHYSICAL', 'INTERFACE');

-- CreateEnum
CREATE TYPE "GuildRole" AS ENUM ('FOUNDER', 'LEADER', 'OFFICER', 'MEMBER', 'RECRUIT');

-- CreateEnum
CREATE TYPE "EconomyLogType" AS ENUM ('MISSION_REWARD', 'STAGE_REWARD', 'STAGE_PENALTY', 'PVP_GOLD_TRANSFER', 'MARKET_SALE', 'MARKET_FEE', 'CREDIT_MARKET_SALE', 'CREDIT_MARKET_FEE', 'BANK_DEPOSIT', 'BANK_WITHDRAW', 'BANK_FEE', 'DEATH_PENALTY_GOLD', 'DEATH_PENALTY_ITEM', 'GUILD_CONTRIBUTION', 'GUILD_BONUS', 'CONSULTATION_PAID', 'CONSULTATION_RECEIVED', 'STIMULANT_PURCHASE', 'SCROLL_PURCHASE', 'PREMIUM_PURCHASE', 'SLOT_PURCHASE', 'ALIGNMENT_CHANGE_FEE', 'ALIGNMENT_CHANGE_PENALTY', 'PRISON_BRIBE_PAID', 'PRISON_BRIBE_REFUSED_PENALTY', 'PRISON_BRIBE_DELEGATE_RECEIVED', 'CONTRACT_PAYMENT', 'CONTRACT_FEE');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "verifyToken" TEXT,
    "passwordHash" TEXT NOT NULL,
    "cpfHash" TEXT NOT NULL,
    "cpfSalt" TEXT NOT NULL,
    "accountSide" "AccountSide",
    "pvpProtected" BOOLEAN NOT NULL DEFAULT true,
    "isBanned" BOOLEAN NOT NULL DEFAULT false,
    "bannedAt" TIMESTAMP(3),
    "bannedReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "slot1CharId" TEXT,
    "slot2CharId" TEXT,
    "slot3CharId" TEXT,
    "slot2Unlocked" BOOLEAN NOT NULL DEFAULT false,
    "slot3Unlocked" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "deviceInfo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_premium" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "activeUntil" TIMESTAMP(3),
    "credits" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_premium_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "slot_purchases" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "slot" INTEGER NOT NULL,
    "paidWith" "CurrencyType" NOT NULL,
    "goldPaid" BIGINT,
    "creditsPaid" INTEGER,
    "purchasedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "slot_purchases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "data_export_requests" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "downloadUrl" TEXT,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "data_export_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account_deletion_requests" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "scheduledFor" TIMESTAMP(3) NOT NULL,
    "confirmedAt" TIMESTAMP(3),
    "executedAt" TIMESTAMP(3),
    "anonymizedAt" TIMESTAMP(3),

    CONSTRAINT "account_deletion_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "characters" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "profession" "Profession" NOT NULL,
    "isFirstCreated" BOOLEAN NOT NULL DEFAULT false,
    "level" INTEGER NOT NULL DEFAULT 1,
    "experience" BIGINT NOT NULL DEFAULT 0,
    "goldHand" BIGINT NOT NULL DEFAULT 100,
    "goldBank" BIGINT NOT NULL DEFAULT 0,
    "attrStrength" INTEGER NOT NULL DEFAULT 10,
    "attrAgility" INTEGER NOT NULL DEFAULT 10,
    "attrIntelligence" INTEGER NOT NULL DEFAULT 10,
    "attrAuthority" INTEGER NOT NULL DEFAULT 10,
    "attrStealth" INTEGER NOT NULL DEFAULT 10,
    "attrCharisma" INTEGER NOT NULL DEFAULT 10,
    "attrPrecision" INTEGER NOT NULL DEFAULT 10,
    "attrInvestigation" INTEGER NOT NULL DEFAULT 10,
    "attributePoints" INTEGER NOT NULL DEFAULT 0,
    "alignment" "Alignment" NOT NULL DEFAULT 'NEUTRAL',
    "alignmentLockedUntil" TIMESTAMP(3),
    "alignmentCooldownUntil" TIMESTAMP(3),
    "corruptionScore" INTEGER NOT NULL DEFAULT 0,
    "reputationLaw" INTEGER NOT NULL DEFAULT 0,
    "reputationCrime" INTEGER NOT NULL DEFAULT 0,
    "staminaCurrent" INTEGER NOT NULL DEFAULT 10,
    "staminaLastRegen" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "stimulantBoughtToday" INTEGER NOT NULL DEFAULT 0,
    "currentMissionId" TEXT,
    "isOnMission" BOOLEAN NOT NULL DEFAULT false,
    "missionStartedAt" TIMESTAMP(3),
    "missionDifficulty" "Difficulty",
    "stageQueueRemaining" INTEGER NOT NULL DEFAULT 0,
    "lastOnlineAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "trainingSkillId" TEXT,
    "trainingStartedAt" TIMESTAMP(3),
    "isPrisoned" BOOLEAN NOT NULL DEFAULT false,
    "prisonedAt" TIMESTAMP(3),
    "prisonEndsAt" TIMESTAMP(3),
    "prisonCrime" TEXT,
    "prisonGravity" INTEGER,
    "prisonBribeAttempts" INTEGER NOT NULL DEFAULT 0,
    "furtivityDebuffUntil" TIMESTAMP(3),
    "furtivityDebuffValue" INTEGER NOT NULL DEFAULT 0,
    "acceptsBribes" BOOLEAN NOT NULL DEFAULT false,
    "bribeCorruption" INTEGER NOT NULL DEFAULT 0,
    "isAttending" BOOLEAN NOT NULL DEFAULT false,
    "attendingStartedAt" TIMESTAMP(3),
    "attendingEndsAt" TIMESTAMP(3),
    "consultPriceGold" BIGINT,
    "consultPricePercent" DOUBLE PRECISION,
    "attendingCooldownUntil" TIMESTAMP(3),
    "totalDeaths" INTEGER NOT NULL DEFAULT 0,
    "lastDeathAt" TIMESTAMP(3),
    "firstDailyDeathUsed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "characters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skill_definitions" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "professions" TEXT[],
    "category" "SkillCategory" NOT NULL,
    "baseTrainRate" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "skill_definitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "character_skills" (
    "id" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "level" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "experience" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "totalTrainTime" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "character_skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "talent_trees" (
    "id" TEXT NOT NULL,
    "profession" "Profession" NOT NULL,
    "line" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "talent_trees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "talent_nodes" (
    "id" TEXT NOT NULL,
    "treeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "tier" INTEGER NOT NULL,
    "pointCost" INTEGER NOT NULL DEFAULT 1,
    "prerequisiteId" TEXT,
    "effectType" TEXT NOT NULL,
    "effectValue" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "talent_nodes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "character_talents" (
    "id" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,
    "nodeId" TEXT NOT NULL,
    "unlockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "character_talents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stamina_logs" (
    "id" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,
    "delta" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stamina_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mission_definitions" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "profession" "Profession" NOT NULL,
    "minLevel" INTEGER NOT NULL,
    "maxLevel" INTEGER,
    "type" "MissionType" NOT NULL,
    "durationBase" INTEGER NOT NULL,
    "goldMin" INTEGER NOT NULL,
    "goldMax" INTEGER NOT NULL,
    "expBase" INTEGER NOT NULL,
    "skillXpRewards" JSONB NOT NULL,
    "pvpChance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "hasStages" BOOLEAN NOT NULL DEFAULT false,
    "stageCount" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "mission_definitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mission_logs" (
    "id" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,
    "missionId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "endedAt" TIMESTAMP(3) NOT NULL,
    "cycles" INTEGER NOT NULL,
    "goldGained" BIGINT NOT NULL,
    "expGained" BIGINT NOT NULL,
    "skillXpGained" JSONB NOT NULL,
    "hadPvpEncounter" BOOLEAN NOT NULL DEFAULT false,
    "pvpOutcome" TEXT,

    CONSTRAINT "mission_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stage_attempts" (
    "id" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,
    "missionId" TEXT NOT NULL,
    "partyId" TEXT,
    "difficulty" "Difficulty" NOT NULL,
    "queuePosition" INTEGER NOT NULL DEFAULT 1,
    "staminaSpent" INTEGER NOT NULL,
    "stageReached" INTEGER NOT NULL,
    "totalStages" INTEGER NOT NULL,
    "outcome" "StageOutcome" NOT NULL,
    "goldGained" BIGINT NOT NULL DEFAULT 0,
    "expGained" BIGINT NOT NULL DEFAULT 0,
    "goldPenalty" BIGINT NOT NULL DEFAULT 0,
    "itemLostId" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),

    CONSTRAINT "stage_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stage_results" (
    "id" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "stageNumber" INTEGER NOT NULL,
    "enemies" JSONB NOT NULL,
    "goldGained" BIGINT NOT NULL,
    "expGained" BIGINT NOT NULL,
    "outcome" "StageOutcome" NOT NULL,

    CONSTRAINT "stage_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enemy_definitions" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "profession" "Profession" NOT NULL,
    "baseHp" INTEGER NOT NULL,
    "baseAttack" INTEGER NOT NULL,
    "baseDefense" INTEGER NOT NULL,
    "expReward" INTEGER NOT NULL,
    "goldMin" INTEGER NOT NULL,
    "goldMax" INTEGER NOT NULL,
    "isBoss" BOOLEAN NOT NULL DEFAULT false,
    "spriteKey" TEXT,
    "weakTo" TEXT[],
    "resistantTo" TEXT[],

    CONSTRAINT "enemy_definitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mission_enemy_pools" (
    "id" TEXT NOT NULL,
    "missionId" TEXT NOT NULL,
    "enemyId" TEXT NOT NULL,
    "weight" INTEGER NOT NULL DEFAULT 100,
    "minStage" INTEGER NOT NULL DEFAULT 1,
    "maxStage" INTEGER,

    CONSTRAINT "mission_enemy_pools_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medical_buff_definitions" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" "BuffType" NOT NULL,
    "tier" "BuffTier" NOT NULL,
    "valueMin" DOUBLE PRECISION NOT NULL,
    "valueMax" DOUBLE PRECISION NOT NULL,
    "durationHours" INTEGER NOT NULL,
    "minDoctorLevel" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "medical_buff_definitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "character_medical_buff_slots" (
    "id" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,
    "slotNumber" INTEGER NOT NULL,
    "buffDefId" TEXT,
    "currentValue" DOUBLE PRECISION,
    "progressPercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "acquiredAt" TIMESTAMP(3),
    "lastProgressAt" TIMESTAMP(3),

    CONSTRAINT "character_medical_buff_slots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "active_buffs" (
    "id" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,
    "buffType" "BuffType" NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "source" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "active_buffs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scroll_usage_logs" (
    "id" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,
    "scrollType" "ScrollType" NOT NULL,
    "slotId" TEXT NOT NULL,
    "tierBefore" "BuffTier" NOT NULL,
    "tierAfter" "BuffTier" NOT NULL,
    "valueBefore" DOUBLE PRECISION NOT NULL,
    "valueAfter" DOUBLE PRECISION NOT NULL,
    "tierChanged" BOOLEAN NOT NULL DEFAULT false,
    "usedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "scroll_usage_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medical_consultations" (
    "id" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "priceGold" BIGINT NOT NULL,
    "alignmentMatch" BOOLEAN NOT NULL DEFAULT false,
    "discountApplied" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "buffDefId" TEXT NOT NULL,
    "buffValue" DOUBLE PRECISION NOT NULL,
    "bonusBuffDefId" TEXT,
    "bonusBuffValue" DOUBLE PRECISION,
    "consultedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "buffsExpireAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "medical_consultations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "favorite_doctors" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "favorite_doctors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prison_records" (
    "id" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,
    "crime" TEXT NOT NULL,
    "gravity" INTEGER NOT NULL,
    "sentenceHours" DOUBLE PRECISION NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "endedEarlyAt" TIMESTAMP(3),
    "endReason" "PrisonEndReason" NOT NULL DEFAULT 'SERVED',
    "bribeId" TEXT,

    CONSTRAINT "prison_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prison_bribes" (
    "id" TEXT NOT NULL,
    "prisonerId" TEXT NOT NULL,
    "delegateId" TEXT NOT NULL,
    "goldAmount" BIGINT NOT NULL,
    "delegateCut" BIGINT NOT NULL,
    "outcome" "BribeOutcome" NOT NULL,
    "attemptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "timeAdded" DOUBLE PRECISION,

    CONSTRAINT "prison_bribes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pvp_logs" (
    "id" TEXT NOT NULL,
    "attackerId" TEXT NOT NULL,
    "defenderId" TEXT NOT NULL,
    "type" "PvPType" NOT NULL,
    "outcome" "PvPOutcome" NOT NULL,
    "attackerRoll" INTEGER NOT NULL,
    "defenderRoll" INTEGER NOT NULL,
    "staminaSpent" INTEGER NOT NULL DEFAULT 1,
    "goldTransferred" BIGINT NOT NULL DEFAULT 0,
    "itemTransferredId" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pvp_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vengeance_rights" (
    "id" TEXT NOT NULL,
    "holderId" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "pvpLogId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "isUsed" BOOLEAN NOT NULL DEFAULT false,
    "usedAt" TIMESTAMP(3),

    CONSTRAINT "vengeance_rights_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hunted_status" (
    "id" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,
    "profession" "Profession" NOT NULL,
    "rank" INTEGER NOT NULL,
    "score" BIGINT NOT NULL,
    "weekStart" TIMESTAMP(3) NOT NULL,
    "enteredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hunted_status_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "item_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "ItemType" NOT NULL,
    "rarity" "ItemRarity" NOT NULL,
    "slot" "EquipSlot",
    "professions" TEXT[],
    "isStackable" BOOLEAN NOT NULL DEFAULT false,
    "maxStack" INTEGER NOT NULL DEFAULT 1,
    "baseValueGold" INTEGER NOT NULL,
    "statStrength" INTEGER,
    "statAgility" INTEGER,
    "statIntelligence" INTEGER,
    "statAuthority" INTEGER,
    "statStealth" INTEGER,
    "statPrecision" INTEGER,
    "statInvestigation" INTEGER,
    "statVarianceMin" DOUBLE PRECISION NOT NULL DEFAULT 0.85,
    "statVarianceMax" DOUBLE PRECISION NOT NULL DEFAULT 1.15,
    "maxDurability" INTEGER NOT NULL DEFAULT 100,

    CONSTRAINT "item_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mission_drops" (
    "id" TEXT NOT NULL,
    "missionId" TEXT NOT NULL,
    "itemTemplateId" TEXT NOT NULL,
    "dropChance" DOUBLE PRECISION NOT NULL,
    "quantityMin" INTEGER NOT NULL DEFAULT 1,
    "quantityMax" INTEGER NOT NULL DEFAULT 1,
    "minMissionLevel" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "mission_drops_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_items" (
    "id" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "isIdentified" BOOLEAN NOT NULL DEFAULT false,
    "durability" INTEGER NOT NULL DEFAULT 100,
    "isEquipped" BOOLEAN NOT NULL DEFAULT false,
    "equippedSlot" "EquipSlot",
    "isInGuildArsenal" BOOLEAN NOT NULL DEFAULT false,
    "loanedToCharId" TEXT,
    "loanExpiresAt" TIMESTAMP(3),
    "rolledStrength" INTEGER,
    "rolledAgility" INTEGER,
    "rolledIntelligence" INTEGER,
    "rolledAuthority" INTEGER,
    "rolledStealth" INTEGER,
    "rolledPrecision" INTEGER,
    "rolledInvestigation" INTEGER,
    "obtainedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "obtainedFrom" TEXT,

    CONSTRAINT "inventory_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "character_equipment" (
    "characterId" TEXT NOT NULL,
    "headId" TEXT,
    "bodyId" TEXT,
    "legsId" TEXT,
    "bootsId" TEXT,
    "weaponId" TEXT,
    "offhandId" TEXT,
    "amuletId" TEXT,
    "ringId" TEXT,
    "specialId" TEXT,

    CONSTRAINT "character_equipment_pkey" PRIMARY KEY ("characterId")
);

-- CreateTable
CREATE TABLE "parties" (
    "id" TEXT NOT NULL,
    "leaderId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isSolo" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "parties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "party_members" (
    "id" TEXT NOT NULL,
    "partyId" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,
    "role" "PartyRole" NOT NULL DEFAULT 'MEMBER',
    "isSameAccount" BOOLEAN NOT NULL DEFAULT false,
    "acceptedAt" TIMESTAMP(3),
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "party_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "friendships" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "friendId" TEXT NOT NULL,
    "status" "FriendshipStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "friendships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "market_listings" (
    "id" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "inventoryItemId" TEXT NOT NULL,
    "priceGold" BIGINT NOT NULL,
    "listedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "status" "ListingStatus" NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "market_listings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "credit_listings" (
    "id" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "credits" INTEGER NOT NULL,
    "priceGold" BIGINT NOT NULL,
    "listedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "status" "ListingStatus" NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "credit_listings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bank_transactions" (
    "id" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,
    "type" "BankTxType" NOT NULL,
    "amount" BIGINT NOT NULL,
    "fee" BIGINT NOT NULL DEFAULT 0,
    "channel" "BankChannel" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bank_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guilds" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tag" TEXT NOT NULL,
    "description" TEXT,
    "rank" INTEGER NOT NULL DEFAULT 1,
    "side" "AccountSide" NOT NULL,
    "goldFund" BIGINT NOT NULL DEFAULT 0,
    "founderId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "guilds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guild_members" (
    "id" TEXT NOT NULL,
    "guildId" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,
    "role" "GuildRole" NOT NULL DEFAULT 'RECRUIT',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "weeklyGold" BIGINT NOT NULL DEFAULT 0,
    "totalGold" BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT "guild_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guild_contributions" (
    "id" TEXT NOT NULL,
    "guildId" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "goldAmount" BIGINT,
    "itemId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "guild_contributions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guild_arsenal_items" (
    "id" TEXT NOT NULL,
    "guildId" TEXT NOT NULL,
    "inventoryItemId" TEXT NOT NULL,
    "loanedToId" TEXT,
    "loanedAt" TIMESTAMP(3),
    "loanExpiresAt" TIMESTAMP(3),

    CONSTRAINT "guild_arsenal_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guild_upgrade_logs" (
    "id" TEXT NOT NULL,
    "guildId" TEXT NOT NULL,
    "fromRank" INTEGER NOT NULL,
    "toRank" INTEGER NOT NULL,
    "goldSpent" BIGINT NOT NULL,
    "triggeredBy" TEXT NOT NULL,
    "upgradedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "guild_upgrade_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "economy_logs" (
    "id" TEXT NOT NULL,
    "type" "EconomyLogType" NOT NULL,
    "characterId" TEXT,
    "relatedCharacterId" TEXT,
    "itemId" TEXT,
    "goldAmount" BIGINT,
    "creditAmount" INTEGER,
    "feeAmount" BIGINT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "economy_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "premium_transactions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amountBRL" DOUBLE PRECISION,
    "creditsGranted" INTEGER,
    "daysGranted" INTEGER,
    "gateway" TEXT NOT NULL,
    "gatewayTxId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "premium_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_cpfHash_key" ON "users"("cpfHash");

-- CreateIndex
CREATE UNIQUE INDEX "users_slot1CharId_key" ON "users"("slot1CharId");

-- CreateIndex
CREATE UNIQUE INDEX "users_slot2CharId_key" ON "users"("slot2CharId");

-- CreateIndex
CREATE UNIQUE INDEX "users_slot3CharId_key" ON "users"("slot3CharId");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_refreshToken_key" ON "sessions"("refreshToken");

-- CreateIndex
CREATE INDEX "sessions_userId_idx" ON "sessions"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "user_premium_userId_key" ON "user_premium"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "account_deletion_requests_userId_key" ON "account_deletion_requests"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "characters_name_key" ON "characters"("name");

-- CreateIndex
CREATE INDEX "characters_userId_idx" ON "characters"("userId");

-- CreateIndex
CREATE INDEX "characters_profession_level_idx" ON "characters"("profession", "level");

-- CreateIndex
CREATE INDEX "characters_isAttending_idx" ON "characters"("isAttending");

-- CreateIndex
CREATE INDEX "characters_isPrisoned_prisonEndsAt_idx" ON "characters"("isPrisoned", "prisonEndsAt");

-- CreateIndex
CREATE UNIQUE INDEX "skill_definitions_name_key" ON "skill_definitions"("name");

-- CreateIndex
CREATE UNIQUE INDEX "character_skills_characterId_skillId_key" ON "character_skills"("characterId", "skillId");

-- CreateIndex
CREATE UNIQUE INDEX "character_talents_characterId_nodeId_key" ON "character_talents"("characterId", "nodeId");

-- CreateIndex
CREATE INDEX "stamina_logs_characterId_createdAt_idx" ON "stamina_logs"("characterId", "createdAt");

-- CreateIndex
CREATE INDEX "mission_definitions_profession_minLevel_idx" ON "mission_definitions"("profession", "minLevel");

-- CreateIndex
CREATE INDEX "mission_logs_characterId_startedAt_idx" ON "mission_logs"("characterId", "startedAt");

-- CreateIndex
CREATE INDEX "stage_attempts_characterId_startedAt_idx" ON "stage_attempts"("characterId", "startedAt");

-- CreateIndex
CREATE UNIQUE INDEX "character_medical_buff_slots_characterId_slotNumber_key" ON "character_medical_buff_slots"("characterId", "slotNumber");

-- CreateIndex
CREATE INDEX "active_buffs_characterId_expiresAt_idx" ON "active_buffs"("characterId", "expiresAt");

-- CreateIndex
CREATE INDEX "scroll_usage_logs_characterId_usedAt_idx" ON "scroll_usage_logs"("characterId", "usedAt");

-- CreateIndex
CREATE INDEX "medical_consultations_patientId_consultedAt_idx" ON "medical_consultations"("patientId", "consultedAt");

-- CreateIndex
CREATE INDEX "medical_consultations_doctorId_consultedAt_idx" ON "medical_consultations"("doctorId", "consultedAt");

-- CreateIndex
CREATE UNIQUE INDEX "favorite_doctors_patientId_doctorId_key" ON "favorite_doctors"("patientId", "doctorId");

-- CreateIndex
CREATE UNIQUE INDEX "prison_records_bribeId_key" ON "prison_records"("bribeId");

-- CreateIndex
CREATE INDEX "prison_records_characterId_startedAt_idx" ON "prison_records"("characterId", "startedAt");

-- CreateIndex
CREATE INDEX "prison_bribes_prisonerId_idx" ON "prison_bribes"("prisonerId");

-- CreateIndex
CREATE INDEX "prison_bribes_delegateId_idx" ON "prison_bribes"("delegateId");

-- CreateIndex
CREATE INDEX "pvp_logs_attackerId_occurredAt_idx" ON "pvp_logs"("attackerId", "occurredAt");

-- CreateIndex
CREATE INDEX "pvp_logs_defenderId_occurredAt_idx" ON "pvp_logs"("defenderId", "occurredAt");

-- CreateIndex
CREATE UNIQUE INDEX "vengeance_rights_pvpLogId_key" ON "vengeance_rights"("pvpLogId");

-- CreateIndex
CREATE INDEX "vengeance_rights_holderId_isUsed_expiresAt_idx" ON "vengeance_rights"("holderId", "isUsed", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "hunted_status_characterId_key" ON "hunted_status"("characterId");

-- CreateIndex
CREATE INDEX "inventory_items_characterId_isEquipped_idx" ON "inventory_items"("characterId", "isEquipped");

-- CreateIndex
CREATE UNIQUE INDEX "party_members_partyId_characterId_key" ON "party_members"("partyId", "characterId");

-- CreateIndex
CREATE UNIQUE INDEX "friendships_userId_friendId_key" ON "friendships"("userId", "friendId");

-- CreateIndex
CREATE UNIQUE INDEX "market_listings_inventoryItemId_key" ON "market_listings"("inventoryItemId");

-- CreateIndex
CREATE INDEX "market_listings_status_listedAt_idx" ON "market_listings"("status", "listedAt");

-- CreateIndex
CREATE INDEX "credit_listings_status_listedAt_idx" ON "credit_listings"("status", "listedAt");

-- CreateIndex
CREATE INDEX "bank_transactions_characterId_createdAt_idx" ON "bank_transactions"("characterId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "guilds_name_key" ON "guilds"("name");

-- CreateIndex
CREATE UNIQUE INDEX "guilds_tag_key" ON "guilds"("tag");

-- CreateIndex
CREATE UNIQUE INDEX "guild_members_characterId_key" ON "guild_members"("characterId");

-- CreateIndex
CREATE UNIQUE INDEX "guild_arsenal_items_inventoryItemId_key" ON "guild_arsenal_items"("inventoryItemId");

-- CreateIndex
CREATE INDEX "economy_logs_characterId_createdAt_idx" ON "economy_logs"("characterId", "createdAt");

-- CreateIndex
CREATE INDEX "economy_logs_type_createdAt_idx" ON "economy_logs"("type", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "premium_transactions_gatewayTxId_key" ON "premium_transactions"("gatewayTxId");

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "slot_purchases" ADD CONSTRAINT "slot_purchases_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "data_export_requests" ADD CONSTRAINT "data_export_requests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account_deletion_requests" ADD CONSTRAINT "account_deletion_requests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "characters" ADD CONSTRAINT "characters_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "character_skills" ADD CONSTRAINT "character_skills_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "characters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "character_skills" ADD CONSTRAINT "character_skills_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "skill_definitions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "talent_nodes" ADD CONSTRAINT "talent_nodes_treeId_fkey" FOREIGN KEY ("treeId") REFERENCES "talent_trees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "talent_nodes" ADD CONSTRAINT "talent_nodes_prerequisiteId_fkey" FOREIGN KEY ("prerequisiteId") REFERENCES "talent_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "character_talents" ADD CONSTRAINT "character_talents_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "characters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "character_talents" ADD CONSTRAINT "character_talents_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "talent_nodes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mission_logs" ADD CONSTRAINT "mission_logs_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "characters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mission_logs" ADD CONSTRAINT "mission_logs_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "mission_definitions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stage_attempts" ADD CONSTRAINT "stage_attempts_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "characters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stage_attempts" ADD CONSTRAINT "stage_attempts_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "mission_definitions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stage_results" ADD CONSTRAINT "stage_results_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "stage_attempts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mission_enemy_pools" ADD CONSTRAINT "mission_enemy_pools_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "mission_definitions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mission_enemy_pools" ADD CONSTRAINT "mission_enemy_pools_enemyId_fkey" FOREIGN KEY ("enemyId") REFERENCES "enemy_definitions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "character_medical_buff_slots" ADD CONSTRAINT "character_medical_buff_slots_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "characters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "character_medical_buff_slots" ADD CONSTRAINT "character_medical_buff_slots_buffDefId_fkey" FOREIGN KEY ("buffDefId") REFERENCES "medical_buff_definitions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scroll_usage_logs" ADD CONSTRAINT "scroll_usage_logs_slotId_fkey" FOREIGN KEY ("slotId") REFERENCES "character_medical_buff_slots"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medical_consultations" ADD CONSTRAINT "medical_consultations_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "characters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medical_consultations" ADD CONSTRAINT "medical_consultations_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "characters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medical_consultations" ADD CONSTRAINT "medical_consultations_buffDefId_fkey" FOREIGN KEY ("buffDefId") REFERENCES "medical_buff_definitions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorite_doctors" ADD CONSTRAINT "favorite_doctors_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "characters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorite_doctors" ADD CONSTRAINT "favorite_doctors_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "characters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prison_records" ADD CONSTRAINT "prison_records_bribeId_fkey" FOREIGN KEY ("bribeId") REFERENCES "prison_bribes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prison_bribes" ADD CONSTRAINT "prison_bribes_prisonerId_fkey" FOREIGN KEY ("prisonerId") REFERENCES "characters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prison_bribes" ADD CONSTRAINT "prison_bribes_delegateId_fkey" FOREIGN KEY ("delegateId") REFERENCES "characters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pvp_logs" ADD CONSTRAINT "pvp_logs_attackerId_fkey" FOREIGN KEY ("attackerId") REFERENCES "characters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pvp_logs" ADD CONSTRAINT "pvp_logs_defenderId_fkey" FOREIGN KEY ("defenderId") REFERENCES "characters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vengeance_rights" ADD CONSTRAINT "vengeance_rights_holderId_fkey" FOREIGN KEY ("holderId") REFERENCES "characters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vengeance_rights" ADD CONSTRAINT "vengeance_rights_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "characters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vengeance_rights" ADD CONSTRAINT "vengeance_rights_pvpLogId_fkey" FOREIGN KEY ("pvpLogId") REFERENCES "pvp_logs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hunted_status" ADD CONSTRAINT "hunted_status_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "characters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mission_drops" ADD CONSTRAINT "mission_drops_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "mission_definitions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mission_drops" ADD CONSTRAINT "mission_drops_itemTemplateId_fkey" FOREIGN KEY ("itemTemplateId") REFERENCES "item_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "characters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "item_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "character_equipment" ADD CONSTRAINT "character_equipment_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "characters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "party_members" ADD CONSTRAINT "party_members_partyId_fkey" FOREIGN KEY ("partyId") REFERENCES "parties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "party_members" ADD CONSTRAINT "party_members_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "characters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "friendships" ADD CONSTRAINT "friendships_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "friendships" ADD CONSTRAINT "friendships_friendId_fkey" FOREIGN KEY ("friendId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "market_listings" ADD CONSTRAINT "market_listings_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "characters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "market_listings" ADD CONSTRAINT "market_listings_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "inventory_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_listings" ADD CONSTRAINT "credit_listings_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "characters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guild_members" ADD CONSTRAINT "guild_members_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "guilds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guild_members" ADD CONSTRAINT "guild_members_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "characters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guild_contributions" ADD CONSTRAINT "guild_contributions_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "guilds"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guild_arsenal_items" ADD CONSTRAINT "guild_arsenal_items_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "guilds"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guild_upgrade_logs" ADD CONSTRAINT "guild_upgrade_logs_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "guilds"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "economy_logs" ADD CONSTRAINT "economy_logs_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "characters"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "premium_transactions" ADD CONSTRAINT "premium_transactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

