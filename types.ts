import { BuffType, ActionType } from './constants';

/**
 * Models
 */

export interface Player {
  id: string;
  name: string;
  // Role removed
  hp: number; // Lives
  activeBuff: BuffType;
  todayWaterMl: number;
  totalDamageDealt: number; // For leaderboard
  joinedAt: number;
  inventory?: string[]; // Cute trinkets collection
  completedQuests?: string[]; // Array of quest IDs completed today
}

export interface Boss {
  name: string;
  currentHp: number;
  maxHp: number;
  isDefeated: boolean;
}

export interface GameLog {
  id: string;
  timestamp: number;
  userId: string;
  userName: string; // Cache name to avoid lookups if player leaves
  actionType: ActionType;
  value: number | string;
  damageDealt: number;
  message: string;
}

export interface DailyEvent {
  type: string;
  description: string;
  multiplier: number;
}

export interface RoomData {
  roomId: string;
  status: 'ACTIVE' | 'VICTORY';
  lastActiveDate: string; // "YYYY-MM-DD"
  boss: Boss;
  players: Record<string, Player>;
  logs: Record<string, GameLog>;
  dailyEvent?: DailyEvent;
}

export interface GameState {
  room: RoomData | null;
  loading: boolean;
  error: string | null;
}