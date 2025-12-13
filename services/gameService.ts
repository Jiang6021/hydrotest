import { RoomData, GameLog, Player } from '../types';
import { BuffType, ActionType, DAMAGE_PER_DRINK, BOSS_MAX_HP, MAX_PLAYER_LIVES } from '../constants';
import { db } from '../firebaseConfig';
import { ref, onValue, runTransaction, set, push, child, get } from 'firebase/database';

/**
 * Service (Firebase Realtime Database Implementation)
 * Connects directly to Firebase logic using Realtime DB SDK.
 */

const INITIAL_ROOM_STATE: RoomData = {
  boss: {
    currentHp: BOSS_MAX_HP,
    maxHp: BOSS_MAX_HP,
    name: "Fire Demon"
  },
  players: {
    "user_1": {
      id: "user_1",
      name: "Water Warrior",
      hp: 3,
      activeBuff: BuffType.NONE,
      todayWaterMl: 0
    },
    "user_2": {
      id: "user_2",
      name: "Hydro Mage",
      hp: 3,
      activeBuff: BuffType.NONE,
      todayWaterMl: 0
    }
  },
  logs: {},
  dailyEvent: {
    type: "CRITICAL_DAY",
    multiplier: 1.5,
    description: "Global Heatwave! Damage x1.5"
  }
};

class GameService {
  private readonly ROOM_ID = 'rooms/room_001';

  /**
   * Subscribes to Realtime Updates from Firebase
   */
  subscribe(callback: (data: RoomData) => void): () => void {
    const roomRef = ref(db, this.ROOM_ID);

    const unsubscribe = onValue(roomRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // Firebase returns arrays for numeric keys or objects, ensure structure safety
        const safeData: RoomData = {
            ...data,
            players: data.players || INITIAL_ROOM_STATE.players,
            logs: data.logs || {},
            boss: data.boss || INITIAL_ROOM_STATE.boss,
            dailyEvent: data.dailyEvent || INITIAL_ROOM_STATE.dailyEvent
        };
        callback(safeData);
      } else {
        // If data is null (first run), initialize the DB
        this.initializeRoom();
        callback(INITIAL_ROOM_STATE);
      }
    });

    return () => unsubscribe();
  }

  /**
   * Initializes the room if it doesn't exist
   */
  private async initializeRoom() {
    const roomRef = ref(db, this.ROOM_ID);
    const snapshot = await get(roomRef);
    if (!snapshot.exists()) {
      await set(roomRef, INITIAL_ROOM_STATE);
    }
  }

  /**
   * Updates Boss HP safely using a Transaction to prevent race conditions.
   */
  async drinkWaterTransaction(playerId: string, mlAmount: number): Promise<{ success: boolean; dmg: number; buffUsed: BuffType }> {
    const roomRef = ref(db, this.ROOM_ID);
    
    let resultDmg = 0;
    let resultBuff = BuffType.NONE;

    try {
      await runTransaction(roomRef, (currentData: RoomData | null) => {
        if (!currentData) return INITIAL_ROOM_STATE; // Handle edge case

        const player = currentData.players[playerId];
        const boss = currentData.boss;

        if (!player || boss.currentHp <= 0) {
           // Abort transaction logic if invalid, but we return the data as is
           return; 
        }

        // --- Core Gameplay Logic (Same as before, now inside Transaction) ---
        const currentBuff = player.activeBuff;
        let finalDamage = DAMAGE_PER_DRINK;
        let healed = false;

        // 1. Apply Player Buff Logic
        if (currentBuff === BuffType.CRITICAL_x3) {
          finalDamage = DAMAGE_PER_DRINK * 3;
        } else if (currentBuff === BuffType.DOUBLE_DMG) {
          finalDamage = DAMAGE_PER_DRINK * 2;
        } else if (currentBuff === BuffType.HEAL_LIFE) {
          finalDamage = 0;
          if (player.hp < MAX_PLAYER_LIVES) {
            player.hp += 1;
            healed = true;
          }
        }

        // 2. Apply Daily Event Multiplier (if not healing)
        if (!healed && currentData.dailyEvent && currentData.dailyEvent.multiplier) {
            finalDamage = Math.floor(finalDamage * currentData.dailyEvent.multiplier);
        }

        // Capture results for return value
        resultDmg = finalDamage;
        resultBuff = currentBuff;

        // Update Boss HP
        let newBossHp = boss.currentHp - finalDamage;
        if (newBossHp < 0) newBossHp = 0;
        boss.currentHp = newBossHp;

        // Update Player Stats
        player.todayWaterMl += mlAmount;
        player.activeBuff = BuffType.NONE; // Clear buff

        // Add Log
        const logId = `log_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
        let message = "";
        if (healed) {
          message = `${player.name} drank water and HEALED a heart!`;
        } else {
          message = `${player.name} dealt ${finalDamage} DMG ${currentBuff !== BuffType.NONE ? `(${currentBuff})` : ''}`;
        }

        if (!currentData.logs) currentData.logs = {};
        currentData.logs[logId] = {
          id: logId,
          timestamp: Date.now(),
          userId: playerId,
          actionType: ActionType.DRINK,
          value: mlAmount,
          damageDealt: finalDamage,
          message: message
        };

        return currentData; // Commit the transaction
      });

      return { success: true, dmg: resultDmg, buffUsed: resultBuff };

    } catch (e) {
      console.error("Firebase Transaction Failed", e);
      return { success: false, dmg: 0, buffUsed: BuffType.NONE };
    }
  }

  /**
   * Submits Gratitude and grants a random Buff (Using Transaction).
   */
  async submitGratitudeTransaction(playerId: string, text: string): Promise<BuffType> {
    const roomRef = ref(db, this.ROOM_ID);
    let assignedBuff = BuffType.NONE;

    try {
        await runTransaction(roomRef, (currentData: RoomData | null) => {
            if (!currentData) return;

            const player = currentData.players[playerId];
            if (!player) return;

            // --- Randomizer Logic ---
            const roll = Math.random();
            let newBuff = BuffType.DOUBLE_DMG; 

            if (roll < 0.2) {
                newBuff = BuffType.HEAL_LIFE;
            } else if (roll < 0.5) {
                newBuff = BuffType.CRITICAL_x3;
            } 
            
            player.activeBuff = newBuff;
            assignedBuff = newBuff;

            // Log
            const logId = `log_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
            if (!currentData.logs) currentData.logs = {};
            currentData.logs[logId] = {
                id: logId,
                timestamp: Date.now(),
                userId: playerId,
                actionType: ActionType.GRATITUDE,
                value: text,
                damageDealt: 0,
                message: `${player.name} felt grateful: "${text}" -> Gained ${newBuff}`
            };

            return currentData;
        });
        
        return assignedBuff;
    } catch (e) {
        console.error("Gratitude Transaction Error", e);
        return BuffType.NONE;
    }
  }

  async resetGame() {
    const roomRef = ref(db, this.ROOM_ID);
    await set(roomRef, INITIAL_ROOM_STATE);
  }
}

export const gameService = new GameService();