import { RoomData, GameLog, Player } from '../types';
import { BuffType, ActionType, DAMAGE_PER_DRINK, BOSS_MAX_HP, BOSS_HP_PER_PLAYER, MAX_PLAYER_LIVES } from '../constants';
import { db } from '../firebaseConfig';
import { ref, onValue, runTransaction, set, get } from 'firebase/database';

/**
 * Service (Firebase Realtime Database Implementation)
 */

class GameService {
  
  subscribe(roomId: string, callback: (data: RoomData | null) => void): () => void {
    const roomRef = ref(db, `rooms/${roomId}`);

    const unsubscribe = onValue(roomRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const safeData: RoomData = {
            roomId: roomId,
            status: data.status || 'ACTIVE',
            boss: data.boss || { name: "Void Titan", currentHp: BOSS_MAX_HP, maxHp: BOSS_MAX_HP, isDefeated: false },
            players: data.players || {},
            logs: data.logs || {},
            dailyEvent: data.dailyEvent || { type: "NORMAL", description: "Standard Atmosphere", multiplier: 1 }
        };
        callback(safeData);
      } else {
        callback(null); 
      }
    });

    return () => unsubscribe();
  }

  async joinRoom(roomId: string, playerId: string, playerName: string): Promise<void> {
    const roomRef = ref(db, `rooms/${roomId}`);
    
    await runTransaction(roomRef, (currentData: any) => {
      // 1. Initialize Room if null
      if (!currentData) {
        currentData = {
          status: 'ACTIVE',
          boss: {
            currentHp: BOSS_MAX_HP,
            maxHp: BOSS_MAX_HP,
            name: "Fire Demon Legion",
            isDefeated: false
          },
          players: {},
          logs: {},
          dailyEvent: {
            type: "CRITICAL_DAY",
            multiplier: 1.5,
            description: "Community Rally! Damage x1.5"
          }
        };
      }

      if (!currentData.players) currentData.players = {};

      // 2. Initialize Player or Update Name if exists
      // NOTE: We do not reset HP or Stats if player already exists! This solves the "Relogin" issue.
      if (!currentData.players[playerId]) {
        currentData.players[playerId] = {
          id: playerId,
          name: playerName,
          hp: MAX_PLAYER_LIVES,
          activeBuff: BuffType.NONE,
          todayWaterMl: 0,
          totalDamageDealt: 0,
          joinedAt: Date.now()
        };
        
        // Increase Boss HP for new player challenge (Scaling)
        if (currentData.boss && !currentData.boss.isDefeated) {
             currentData.boss.maxHp = (currentData.boss.maxHp || BOSS_MAX_HP) + BOSS_HP_PER_PLAYER;
             currentData.boss.currentHp = (currentData.boss.currentHp || BOSS_MAX_HP) + BOSS_HP_PER_PLAYER;
        }

        // Log new player
        const logId = `sys_${Date.now()}`;
        if (!currentData.logs) currentData.logs = {};
        currentData.logs[logId] = {
            id: logId,
            timestamp: Date.now(),
            userId: 'SYSTEM',
            userName: 'SYSTEM',
            actionType: ActionType.GRATITUDE,
            value: '',
            damageDealt: 0,
            message: `${playerName} joined the party! Boss HP increased!`
        };
      } else {
        // Update name if they changed it, but keep stats
        currentData.players[playerId].name = playerName;
      }

      return currentData;
    });
  }

  async drinkWaterTransaction(roomId: string, playerId: string, mlAmount: number): Promise<{ success: boolean; dmg: number; buffUsed: BuffType }> {
    const roomRef = ref(db, `rooms/${roomId}`);
    
    let resultDmg = 0;
    let resultBuff = BuffType.NONE;

    try {
      await runTransaction(roomRef, (currentData: any) => {
        if (!currentData || !currentData.players || !currentData.players[playerId]) return;
        
        const player = currentData.players[playerId];
        const boss = currentData.boss;

        if (boss.currentHp <= 0) return;

        // --- Core Gameplay Logic ---
        const currentBuff = player.activeBuff;
        let baseDamage = DAMAGE_PER_DRINK;
        let finalDamage = 0;
        let healed = false;
        
        // 1. Apply Buffs
        finalDamage = baseDamage;

        if (currentBuff === BuffType.CRITICAL_x3) {
          finalDamage = finalDamage * 3;
        } else if (currentBuff === BuffType.DOUBLE_DMG) {
          finalDamage = finalDamage * 2;
        } else if (currentBuff === BuffType.HEAL_LIFE) {
          finalDamage = 0;
          if (player.hp < MAX_PLAYER_LIVES) {
            player.hp += 1;
            healed = true;
          }
        }

        // 2. Apply Daily Event
        if (!healed && finalDamage > 0 && currentData.dailyEvent && currentData.dailyEvent.multiplier) {
            finalDamage = Math.floor(finalDamage * currentData.dailyEvent.multiplier);
        }

        resultDmg = finalDamage;
        resultBuff = currentBuff;

        // Update Boss
        let newBossHp = boss.currentHp - finalDamage;
        if (newBossHp <= 0) {
            newBossHp = 0;
            boss.isDefeated = true;
            currentData.status = 'VICTORY';
        }
        boss.currentHp = newBossHp;

        // Update Player
        player.todayWaterMl += mlAmount;
        player.activeBuff = BuffType.NONE;
        player.totalDamageDealt = (player.totalDamageDealt || 0) + finalDamage;

        // Log
        const logId = `log_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
        if (!currentData.logs) currentData.logs = {};
        
        let msg = healed 
            ? `recovered 1 Heart!` 
            : `dealt ${finalDamage} DMG!`;

        currentData.logs[logId] = {
          id: logId,
          timestamp: Date.now(),
          userId: playerId,
          userName: player.name,
          actionType: ActionType.DRINK,
          value: mlAmount,
          damageDealt: finalDamage,
          message: msg
        };

        return currentData;
      });

      return { success: true, dmg: resultDmg, buffUsed: resultBuff };

    } catch (e) {
      console.error("Firebase Transaction Failed", e);
      return { success: false, dmg: 0, buffUsed: BuffType.NONE };
    }
  }

  async submitGratitudeTransaction(roomId: string, playerId: string, text: string): Promise<BuffType> {
    const roomRef = ref(db, `rooms/${roomId}`);
    let assignedBuff = BuffType.NONE;

    try {
        await runTransaction(roomRef, (currentData: any) => {
            if (!currentData || !currentData.players || !currentData.players[playerId]) return;

            const player = currentData.players[playerId];
            
            // Randomizer
            const roll = Math.random();
            let newBuff = BuffType.DOUBLE_DMG; 
            if (roll < 0.2) newBuff = BuffType.HEAL_LIFE;
            else if (roll < 0.5) newBuff = BuffType.CRITICAL_x3;
            
            player.activeBuff = newBuff;
            assignedBuff = newBuff;

            // Log
            const logId = `log_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
            if (!currentData.logs) currentData.logs = {};
            currentData.logs[logId] = {
                id: logId,
                timestamp: Date.now(),
                userId: playerId,
                userName: player.name,
                actionType: ActionType.GRATITUDE,
                value: text,
                damageDealt: 0,
                // Changed from "prayed" to "sent gratitude"
                message: `sent gratitude: "${text}"`
            };

            return currentData;
        });
        return assignedBuff;
    } catch (e) {
        return BuffType.NONE;
    }
  }

  async resetGame(roomId: string) {
    const roomRef = ref(db, `rooms/${roomId}`);
    await set(roomRef, null); 
  }
}

export const gameService = new GameService();