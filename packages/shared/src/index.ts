// === TIPOS COMPARTILHADOS ===

export enum Profession {
  POLICE = 'POLICE',
  THIEF = 'THIEF',
  MEDIC = 'MEDIC',
}

export enum Faction {
  LAW = 'LAW',
  CRIME = 'CRIME',
  NEUTRAL = 'NEUTRAL',
}

export const FACTION_BY_PROFESSION: Record<Profession, Faction> = {
  [Profession.POLICE]: Faction.LAW,
  [Profession.THIEF]: Faction.CRIME,
  [Profession.MEDIC]: Faction.NEUTRAL,
};

// === CONSTANTES DO JOGO ===

export const GAME_CONFIG = {
  IDLE_CAP_FREE: 43_200,
  IDLE_CAP_PREMIUM: 86_400,
  IDLE_DELTA_MAX: 604_800,
  STAMINA_MAX_FREE: 10,
  STAMINA_MAX_PREMIUM: 20,
  STAMINA_REGEN_FREE: 0.417,
  STAMINA_REGEN_PREMIUM: 1.0,
  PROTECTION_NOVICE_DAYS: 7,
} as const;
