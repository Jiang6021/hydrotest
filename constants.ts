/**
 * game_constants.dart Equivalent
 */

export const DAMAGE_PER_DRINK = 100; // Base damage for a standard water intake
export const MAX_PLAYER_LIVES = 3;
export const BOSS_MAX_HP = 1000; // Reduced from 5000 for testing
export const BOSS_HP_PER_PLAYER = 500; // Reduced from 2000 for testing
export const DAILY_WATER_GOAL = 2000; // 每日目標 2000ml

export enum BuffType {
  NONE = 'NONE',
  CRITICAL_x3 = 'CRITICAL_x3',
  HEAL_LIFE = 'HEAL_LIFE',
  DOUBLE_DMG = 'DOUBLE_DMG',
}

export enum ActionType {
  DRINK = 'DRINK',
  GRATITUDE = 'GRATITUDE',
  QUEST = 'QUEST',
}

export const BUFF_DESCRIPTIONS: Record<BuffType, string> = {
  [BuffType.NONE]: '',
  [BuffType.CRITICAL_x3]: 'Next Drink: 3x Damage!',
  [BuffType.HEAL_LIFE]: 'Next Drink: Restores 1 Heart (0 Dmg)',
  [BuffType.DOUBLE_DMG]: 'Next Drink: 2x Damage',
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