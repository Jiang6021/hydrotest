
import { BuffType, ActionType, DimensionType } from './constants';

/**
 * Models
 */

export interface TodoItem {
  id: string;
  label: string;
  note?: string;      // Optional note
  importance: number; // 1-4
  difficulty: number; // 1-4
  dimensions: DimensionType[]; 
  isCompleted: boolean;
  createdAt: number;
  source?: 'RANDOM' | 'CUSTOM'; // New: To control logging visibility
}

export interface Player {
  id: string;
  name: string;
  // Role removed
  hp: number; // Lives
  activeBuff: BuffType;
  todayWaterMl: number;
  attacksPerformed: number; // New: Tracks daily attacks used
  totalDamageDealt: number; // For leaderboard
  joinedAt: number;
  isParticipatingToday?: boolean; // New: Track daily raid participation
  inventory?: string[]; // Cute trinkets collection
  completedQuests?: string[]; // Keep for legacy or achievements
  todos?: Record<string, TodoItem>; // New: Custom Todo List
  stats?: Record<DimensionType, number>; // New: The 5 Attributes
  hasSeenTutorial?: boolean; // New: Persistent flag for tutorial
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
