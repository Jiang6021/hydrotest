import { BuffType, ActionType } from './constants';

/**
 * Models (Equivalent to *_model.dart)
 */

export interface Player {
  id: string;
  name: string;
  hp: number; // Lives
  activeBuff: BuffType;
  todayWaterMl: number;
}

export interface Boss {
  name: string;
  currentHp: number;
  maxHp: number;
}

export interface GameLog {
  id: string;
  timestamp: number;
  userId: string;
  actionType: ActionType;
  value: number | string; // ml for drink, text for gratitude
  damageDealt: number;
  message: string;
}

export interface DailyEvent {
  type: string;
  description: string;
  multiplier: number;
}

export interface RoomData {
  boss: Boss;
  players: Record<string, Player>;
  logs: Record<string, GameLog>;
  dailyEvent?: DailyEvent;
}

export interface GameState {
  room: RoomData;
  loading: boolean;
  error: string | null;
}