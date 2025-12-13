/**
 * game_constants.dart Equivalent
 */

export const DAMAGE_PER_DRINK = 100; // Base damage for a standard water intake
export const MAX_PLAYER_LIVES = 3;
export const BOSS_MAX_HP = 5000;

export enum BuffType {
  NONE = 'NONE',
  CRITICAL_x3 = 'CRITICAL_x3',
  HEAL_LIFE = 'HEAL_LIFE',
  DOUBLE_DMG = 'DOUBLE_DMG',
}

export enum ActionType {
  DRINK = 'DRINK',
  GRATITUDE = 'GRATITUDE',
}

export const BUFF_DESCRIPTIONS: Record<BuffType, string> = {
  [BuffType.NONE]: '',
  [BuffType.CRITICAL_x3]: 'Next Drink: 3x Damage!',
  [BuffType.HEAL_LIFE]: 'Next Drink: Restores 1 Heart (0 Dmg)',
  [BuffType.DOUBLE_DMG]: 'Next Drink: 2x Damage',
};