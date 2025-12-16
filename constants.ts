
/**
 * game_constants.dart Equivalent
 */

export const DAMAGE_PER_DRINK = 150; // Base damage per Attack
export const MAX_PLAYER_LIVES = 3;
export const BOSS_MAX_HP = 3000; // Increased base HP (Harder!)
export const BOSS_HP_PER_PLAYER = 1500; // Scaling
export const DAILY_WATER_GOAL = 2000; // Daily Goal 2000ml

// New Mechanics
export const WATER_PER_ATTACK_CHARGE = 500; // Every 500ml = 1 Attack
export const MAX_DAILY_ATTACKS = 5; // Max attacks per day
export const SIP_VOLUME = 50; // Small sip amount

export enum BuffType {
  NONE = 'NONE',
  CRITICAL_x3 = 'CRITICAL_x3',
  HEAL_LIFE = 'HEAL_LIFE',
  DOUBLE_DMG = 'DOUBLE_DMG',
}

export enum ActionType {
  DRINK = 'DRINK',
  ATTACK = 'ATTACK', // New Action Type
  GRATITUDE = 'GRATITUDE',
  QUEST = 'QUEST',
}

export const BUFF_DESCRIPTIONS: Record<BuffType, string> = {
  [BuffType.NONE]: '',
  [BuffType.CRITICAL_x3]: 'Next Attack: 3x Damage!',
  [BuffType.HEAL_LIFE]: 'Next Attack: Restores 1 Heart',
  [BuffType.DOUBLE_DMG]: 'Next Attack: 2x Damage',
};

// Cute drops
export const TRINKETS = [
    "☂️", // Small Umbrella
    "🥽", // Goggles
    "🦆", // Rubber Duck
    "🧊", // Ice Cube Hat
    "🍀", // Clover
    "🎀", // Ribbon
    "⭐", // Star
    "🍬", // Candy
    "🍼", // Milk Bottle
    "🧢", // Cap
    "🎈", // Balloon
    "🌻", // Sunflower
    "🧸", // Teddy
    "🎨", // Palette
    "🎸", // Guitar
    "🪴", // Potted Plant
];

export interface QuestDef {
    id: string;
    label: string;
    icon: string;
}

export const DAILY_QUESTS: QuestDef[] = [
    { id: 'q_stretch', label: 'Stretch for 1 min', icon: '🧘' },
    { id: 'q_fruit', label: 'Eat a Fruit', icon: '🍎' },
    { id: 'q_eyes', label: 'Close eyes 30s', icon: '😌' },
    { id: 'q_stand', label: 'Stand up & Move', icon: '🚶' },
    { id: 'q_clean', label: 'Tidy your desk', icon: '🧹' },
];
