
import { RoomData, GameLog, Player } from '../types';
import { BuffType, ActionType, DAMAGE_PER_DRINK, BOSS_MAX_HP, BOSS_HP_PER_PLAYER, MAX_PLAYER_LIVES, TRINKETS, WATER_PER_ATTACK_CHARGE, MAX_DAILY_ATTACKS, DimensionType, DIMENSION_CONFIG } from '../constants';
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
            lastActiveDate: data.lastActiveDate || new Date().toDateString(),
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

  // --- NEW: Subscribe to Global Random Tasks ---
  subscribeToRandomTasks(callback: (tasks: string[]) => void): () => void {
    const tasksRef = ref(db, 'randomTasks');
    
    // Listen to changes
    const unsubscribe = onValue(tasksRef, (snapshot) => {
        const val = snapshot.val();
        let loadedTasks: string[] = [];
        
        console.log("🔥 [Firebase] randomTasks raw data:", val); // Debugging Log

        if (val) {
            if (Array.isArray(val)) {
                // If it's a simple array ["task1", "task2"]
                loadedTasks = val.filter((t: any) => typeof t === 'string') as string[];
            } else if (typeof val === 'object') {
                // If it's an object map {"id1": "task1", "id2": "task2"}
                loadedTasks = Object.values(val as object).filter((t: any) => typeof t === 'string') as string[];
            }
        }

        if (loadedTasks.length > 0) {
            console.log("✅ [Firebase] Using remote tasks:", loadedTasks);
            callback(loadedTasks);
        } else {
            console.log("⚠️ [Firebase] No remote tasks found.");
            callback(["等待任務發布..."]);
        }
    }, (error) => {
        console.error("❌ [Firebase] Read failed (Check Rules):", error);
        callback(["連線錯誤", "請檢查網路"]);
    });

    return () => unsubscribe();
  }

  async joinRoom(roomId: string, playerId: string, playerName: string): Promise<void> {
    const roomRef = ref(db, `rooms/${roomId}`);
    const todayStr = new Date().toDateString();

    await runTransaction(roomRef, (currentData: any) => {
      // 1. Initialize Room if null
      if (!currentData) {
        currentData = {
          status: 'ACTIVE',
          lastActiveDate: todayStr,
          boss: {
            currentHp: BOSS_MAX_HP,
            maxHp: BOSS_MAX_HP,
            name: "Fire Demon Legion",
            isDefeated: false
          },
          players: {},
          logs: {},
          dailyEvent: {
            type: "NORMAL",
            multiplier: 1,
            description: "Standard Battle"
          }
        };
      }

      // Check for daily reset immediately upon join
      if (currentData.lastActiveDate !== todayStr) {
          this.performDailyReset(currentData, todayStr);
      }

      if (!currentData.players) currentData.players = {};

      // 2. Initialize Player or Update Name if exists
      if (!currentData.players[playerId]) {
        currentData.players[playerId] = {
          id: playerId,
          name: playerName,
          hp: MAX_PLAYER_LIVES,
          activeBuff: BuffType.NONE,
          todayWaterMl: 0,
          attacksPerformed: 0,
          totalDamageDealt: 0,
          joinedAt: Date.now(),
          isParticipatingToday: false, // Default to false, must opt-in
          inventory: [],
          completedQuests: [],
          todos: {},
          // Initialize Stats
          stats: {
             [DimensionType.RESILIENCE]: 0,
             [DimensionType.CHARM]: 0,
             [DimensionType.ACADEMICS]: 0,
             [DimensionType.PHYSIQUE]: 0,
             [DimensionType.CREATIVITY]: 0,
          }
        };
        
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
            message: `${playerName} entered the lobby.`
        };
      } else {
        // Update name if they changed it, but keep stats
        currentData.players[playerId].name = playerName;
        
        // Backfill stats if missing (for existing users)
        if (!currentData.players[playerId].stats) {
            currentData.players[playerId].stats = {
                 [DimensionType.RESILIENCE]: 0,
                 [DimensionType.CHARM]: 0,
                 [DimensionType.ACADEMICS]: 0,
                 [DimensionType.PHYSIQUE]: 0,
                 [DimensionType.CREATIVITY]: 0,
            };
        }
        
        if (currentData.players[playerId].attacksPerformed === undefined) {
            currentData.players[playerId].attacksPerformed = 0;
        }
        if (currentData.players[playerId].isParticipatingToday === undefined) {
            currentData.players[playerId].isParticipatingToday = false;
        }
      }

      return currentData;
    });
  }

  // --- NEW: Opt-in to Raid Transaction ---
  async joinRaidTransaction(roomId: string, playerId: string): Promise<boolean> {
      const roomRef = ref(db, `rooms/${roomId}`);
      const todayStr = new Date().toDateString();

      try {
          await runTransaction(roomRef, (currentData: any) => {
             if (!currentData || !currentData.players || !currentData.players[playerId]) return;

             // Check Daily Reset logic first to be safe
             if (currentData.lastActiveDate !== todayStr) {
                 this.performDailyReset(currentData, todayStr);
             }

             const player = currentData.players[playerId];
             
             // If already participating, do nothing
             if (player.isParticipatingToday) return;

             // 1. Mark as participating
             player.isParticipatingToday = true;

             // 2. Scale Boss (Increase Max and Current HP)
             // Only scale if boss is not defeated (or maybe even if defeated, to reset for next logic? kept simple for now)
             if (currentData.boss) {
                 currentData.boss.maxHp = (currentData.boss.maxHp || BOSS_MAX_HP) + BOSS_HP_PER_PLAYER;
                 if (!currentData.boss.isDefeated) {
                     currentData.boss.currentHp = (currentData.boss.currentHp || 0) + BOSS_HP_PER_PLAYER;
                 }
             }

             // 3. Log
             const logId = `sys_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
             if (!currentData.logs) currentData.logs = {};
             currentData.logs[logId] = {
                 id: logId,
                 timestamp: Date.now(),
                 userId: playerId,
                 userName: player.name,
                 actionType: ActionType.QUEST,
                 value: '',
                 damageDealt: 0,
                 message: `joined the raid! Boss HP Scaled up!`
             };

             return currentData;
          });
          return true;
      } catch (e) {
          console.error("Join Raid Failed", e);
          return false;
      }
  }

  // Pure Hydration Transaction
  async drinkWaterTransaction(roomId: string, playerId: string, mlAmount: number): Promise<{ success: boolean; drop: string | null }> {
    const roomRef = ref(db, `rooms/${roomId}`);
    const todayStr = new Date().toDateString();
    let droppedItem: string | null = null;

    try {
        await runTransaction(roomRef, (currentData: any) => {
            if (!currentData || !currentData.players || !currentData.players[playerId]) return;
            
            // Check Daily Reset
            if (currentData.lastActiveDate !== todayStr) {
                this.performDailyReset(currentData, todayStr);
            }

            const player = currentData.players[playerId];
            player.todayWaterMl = (player.todayWaterMl || 0) + mlAmount;

            // 30% Chance for Drop
            if (Math.random() < 0.3) {
                if (!player.inventory) player.inventory = [];
                const randomTrinket = TRINKETS[Math.floor(Math.random() * TRINKETS.length)];
                player.inventory.push(randomTrinket);
                droppedItem = randomTrinket;
            }

            // Optional: Log drinking? Maybe too spammy if we have attack logs. 
            // Let's log only if they find an item or hit a milestone to keep logs clean for Gratitude/Attacks
            if (droppedItem) {
                 const logId = `log_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
                 if (!currentData.logs) currentData.logs = {};
                 currentData.logs[logId] = {
                    id: logId,
                    timestamp: Date.now(),
                    userId: playerId,
                    userName: player.name,
                    actionType: ActionType.DRINK,
                    value: mlAmount,
                    damageDealt: 0,
                    message: `hydrated ${mlAmount}ml and found ${droppedItem}!`
                 };
            }

            return currentData;
        });
        return { success: true, drop: droppedItem };
    } catch (e) {
        console.error("Drink Tx Failed", e);
        return { success: false, drop: null };
    }
  }

  // Attack Transaction
  async performAttackTransaction(roomId: string, playerId: string): Promise<{ success: boolean; dmg: number; buffUsed: BuffType }> {
      const roomRef = ref(db, `rooms/${roomId}`);
      let resultDmg = 0;
      let resultBuff = BuffType.NONE;

      try {
          await runTransaction(roomRef, (currentData: any) => {
              if (!currentData || !currentData.players || !currentData.players[playerId]) return;

              const player = currentData.players[playerId];
              const boss = currentData.boss;

              // Validate Attack Capability
              const maxPossibleAttacks = Math.floor(player.todayWaterMl / WATER_PER_ATTACK_CHARGE);
              const attacksDone = player.attacksPerformed || 0;

              if (attacksDone >= maxPossibleAttacks || attacksDone >= MAX_DAILY_ATTACKS) {
                  return; 
              }

              // --- Combat Logic ---
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

              // Removed daily Event multiplier for stability in testing

              resultDmg = finalDamage;
              resultBuff = currentBuff;

              // 3. Update Boss (Double check logic)
              if (boss && !boss.isDefeated) {
                  let newBossHp = boss.currentHp - finalDamage;
                  if (newBossHp < 0) newBossHp = 0; // Clamp
                  
                  if (newBossHp === 0) {
                      boss.isDefeated = true;
                      currentData.status = 'VICTORY';
                  }
                  boss.currentHp = newBossHp;
              }

              // 4. Update Player
              player.attacksPerformed = attacksDone + 1;
              player.activeBuff = BuffType.NONE; // Consume Buff
              player.totalDamageDealt = (player.totalDamageDealt || 0) + finalDamage;

              // 5. Log
              const logId = `log_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
              if (!currentData.logs) currentData.logs = {};
              
              let msg = healed ? `restored a Heart!` : `attacked for ${finalDamage} DMG!`;
              if (boss.isDefeated && !healed) msg = `delivered the FINAL BLOW for ${finalDamage} DMG!`;

              currentData.logs[logId] = {
                  id: logId,
                  timestamp: Date.now(),
                  userId: playerId,
                  userName: player.name,
                  actionType: ActionType.ATTACK,
                  value: '',
                  damageDealt: finalDamage,
                  message: msg
              };

              return currentData;
          });
          
          return { success: true, dmg: resultDmg, buffUsed: resultBuff };
      } catch (e) {
          console.error("Attack Tx Failed", e);
          return { success: false, dmg: 0, buffUsed: BuffType.NONE };
      }
  }

  // --- NEW: Custom Todo Logic ---
  async addTodoTransaction(roomId: string, playerId: string, task: { label: string, note: string, importance: number, difficulty: number, dimensions: DimensionType[] }): Promise<boolean> {
      const roomRef = ref(db, `rooms/${roomId}`);
      try {
          await runTransaction(roomRef, (currentData: any) => {
              if (!currentData || !currentData.players || !currentData.players[playerId]) return;
              
              const player = currentData.players[playerId];
              if (!player.todos) player.todos = {};
              
              const todoId = `todo_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
              player.todos[todoId] = {
                  id: todoId,
                  label: task.label,
                  note: task.note,
                  importance: task.importance,
                  difficulty: task.difficulty,
                  dimensions: task.dimensions, // Save Array
                  isCompleted: false,
                  createdAt: Date.now()
              };
              return currentData;
          });
          return true;
      } catch (e) {
          console.error("Add Todo Failed", e);
          return false;
      }
  }

  async completeTodoTransaction(roomId: string, playerId: string, todoId: string): Promise<{ success: boolean; drop: string, xpGained: number, statsGained: DimensionType[] }> {
      const roomRef = ref(db, `rooms/${roomId}`);
      let resultDrop = "";
      let xpGained = 0;
      let statsGained: DimensionType[] = [];

      try {
          await runTransaction(roomRef, (currentData: any) => {
              if (!currentData || !currentData.players || !currentData.players[playerId]) return;
              
              const player = currentData.players[playerId];
              if (!player.todos || !player.todos[todoId]) return;

              const todo = player.todos[todoId];
              const taskLabel = todo.label;
              // Handle backward compatibility (if 'dimension' exists instead of 'dimensions')
              let dimList = todo.dimensions || (todo.dimension ? [todo.dimension] : [DimensionType.RESILIENCE]);
              
              const difficulty = todo.difficulty || 1;

              // XP Calculation (Simple: Base 10 * Difficulty) per dimension
              xpGained = 10 * difficulty;
              
              if (!player.stats) player.stats = {};

              // Grant XP to ALL selected dimensions
              dimList.forEach((d: DimensionType) => {
                  player.stats[d] = (player.stats[d] || 0) + xpGained;
                  statsGained.push(d);
              });
              
              // Remove the todo
              delete player.todos[todoId];

              // Guaranteed Drop (similar to legacy quest)
              if (!player.inventory) player.inventory = [];
              const randomTrinket = TRINKETS[Math.floor(Math.random() * TRINKETS.length)];
              player.inventory.push(randomTrinket);
              resultDrop = randomTrinket;

              // Log
              const logId = `log_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
              if (!currentData.logs) currentData.logs = {};
              
              const dimNames = dimList.map((d: any) => DIMENSION_CONFIG[d as DimensionType]?.label).join(', ');

              currentData.logs[logId] = {
                  id: logId,
                  timestamp: Date.now(),
                  userId: playerId,
                  userName: player.name,
                  actionType: ActionType.QUEST,
                  value: taskLabel,
                  damageDealt: 0,
                  message: `gained +${xpGained} XP in [${dimNames}]!`
              };

              return currentData;
          });

          if (resultDrop) return { success: true, drop: resultDrop, xpGained, statsGained };
          return { success: false, drop: "", xpGained: 0, statsGained: [] };
      } catch (e) {
          console.error("Complete Todo Failed", e);
          return { success: false, drop: "", xpGained: 0, statsGained: [] };
      }
  }

  // New: Fail Todo (Give Up) - Decreases stats
  async failTodoTransaction(roomId: string, playerId: string, todoId: string): Promise<{ success: boolean; xpLost: number, statsLost: DimensionType[] }> {
      const roomRef = ref(db, `rooms/${roomId}`);
      let xpLost = 0;
      let statsLost: DimensionType[] = [];

      try {
          await runTransaction(roomRef, (currentData: any) => {
              if (!currentData || !currentData.players || !currentData.players[playerId]) return;
              
              const player = currentData.players[playerId];
              if (!player.todos || !player.todos[todoId]) return;

              const todo = player.todos[todoId];
              const taskLabel = todo.label;
              let dimList = todo.dimensions || (todo.dimension ? [todo.dimension] : [DimensionType.RESILIENCE]);
              const difficulty = todo.difficulty || 1;

              // XP Loss Calculation (Base 5 * Difficulty)
              xpLost = 5 * difficulty;

              // Update Stats (Decrease, min 0)
              if (!player.stats) player.stats = {};
              
              dimList.forEach((d: DimensionType) => {
                   const currentVal = player.stats[d] || 0;
                   player.stats[d] = Math.max(0, currentVal - xpLost);
                   statsLost.push(d);
              });

              // Remove the todo
              delete player.todos[todoId];

              // Log
              const logId = `log_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
              if (!currentData.logs) currentData.logs = {};
              currentData.logs[logId] = {
                  id: logId,
                  timestamp: Date.now(),
                  userId: playerId,
                  userName: player.name,
                  actionType: ActionType.FAIL,
                  value: taskLabel,
                  damageDealt: 0,
                  message: `gave up on "${taskLabel}"... lost XP.`
              };

              return currentData;
          });

          return { success: true, xpLost, statsLost };
      } catch (e) {
          console.error("Fail Todo Failed", e);
          return { success: false, xpLost: 0, statsLost: [] };
      }
  }

  async completeQuestTransaction(roomId: string, playerId: string, questId: string, questName: string): Promise<{ success: boolean; drop: string }> {
      // Legacy function kept for compatibility if needed, but primarily using todos now
      return { success: false, drop: "" };
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
            
            // Boost CHARM slightly for gratitude
            if (!player.stats) player.stats = {};
            player.stats[DimensionType.CHARM] = (player.stats[DimensionType.CHARM] || 0) + 5;

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
                // Highlight Gratitude in logs
                message: `shared gratitude: "${text}", gained Charm & Blessing!`
            };

            return currentData;
        });
        return assignedBuff;
    } catch (e) {
        return BuffType.NONE;
    }
  }

  // Debug: Force Boss Respawn & Reset Player States for Testing
  async debugRespawnBoss(roomId: string) {
      const roomRef = ref(db, `rooms/${roomId}`);
      try {
          await runTransaction(roomRef, (currentData: any) => {
              if (!currentData) return;
              
              currentData.status = 'ACTIVE';
              
              // Reset Boss to Base
              if (currentData.boss) {
                currentData.boss.isDefeated = false;
                currentData.boss.maxHp = BOSS_MAX_HP; // Reset to base, don't scale yet
                currentData.boss.currentHp = BOSS_MAX_HP;
              }

              // Reset All Players Daily Stats to allow testing
              if (currentData.players) {
                  Object.values(currentData.players).forEach((p: any) => {
                      p.todayWaterMl = 0;
                      p.attacksPerformed = 0;
                      p.activeBuff = BuffType.NONE;
                      p.todos = {}; // Clear todos on debug reset
                      p.isParticipatingToday = false; // Reset participation
                      // Note: We do NOT reset RPG stats on debug respawn usually, but if you want:
                      // p.stats = ...
                  });
              }
              
              // *** NEW: Clear Logs on Debug Reset ***
              currentData.logs = {};

              const logId = `sys_debug_${Date.now()}`;
              currentData.logs[logId] = {
                  id: logId,
                  timestamp: Date.now(),
                  userId: 'SYSTEM',
                  userName: 'SYSTEM',
                  actionType: ActionType.GRATITUDE,
                  value: '',
                  damageDealt: 0,
                  message: `DEBUG: Boss respawned, Stats reset, Logs cleared!`
              };
              
              return currentData;
          });
      } catch (e) {
          console.error("Debug Respawn Failed", e);
      }
  }

  /**
   * Checks if the day has changed. If so, runs the reset transaction.
   * Called by the client hook on load.
   */
  async checkAndTriggerDailyReset(roomId: string) {
    const roomRef = ref(db, `rooms/${roomId}`);
    const todayStr = new Date().toDateString();

    try {
        await runTransaction(roomRef, (currentData: any) => {
            if (!currentData) return;
            if (currentData.lastActiveDate !== todayStr) {
                this.performDailyReset(currentData, todayStr);
            }
            return currentData;
        });
    } catch (e) {
        console.error("Daily Reset Check Failed", e);
    }
  }

  // Internal helper to mutate data for reset
  private performDailyReset(currentData: any, todayStr: string) {
      currentData.lastActiveDate = todayStr;
      currentData.status = 'ACTIVE';
      
      // Respawn Boss with BASE HP (No scaling yet)
      if (currentData.boss) {
          currentData.boss.isDefeated = false;
          // Updated Scaling logic: Start with Base HP. Players must join to increase it.
          const startHp = BOSS_MAX_HP;
          currentData.boss.maxHp = startHp;
          currentData.boss.currentHp = startHp;
      }

      // Reset Player Daily Stats & Participation
      if (currentData.players) {
          Object.values(currentData.players).forEach((p: any) => {
              p.todayWaterMl = 0;
              p.attacksPerformed = 0; // Reset attacks
              p.completedQuests = [];
              // p.todos = {}; // Decision: Do NOT clear todos daily, let them persist? Or clear? 
              // Usually Todo lists persist. Let's comment this out so tasks stay.
              // p.todos = {}; 
              
              p.isParticipatingToday = false; // Reset Participation
              if (p.hp <= 0) p.hp = MAX_PLAYER_LIVES; // Revive if dead
          });
      }
      
      // *** NEW: Clear Logs for the new day ***
      currentData.logs = {};

      // System Log
      const logId = `sys_reset_${Date.now()}`;
      currentData.logs[logId] = {
          id: logId,
          timestamp: Date.now(),
          userId: 'SYSTEM',
          userName: 'SYSTEM',
          actionType: ActionType.GRATITUDE,
          value: '',
          damageDealt: 0,
          message: `A new day dawns! Logs cleared. Join the raid!`
      };
  }
}

export const gameService = new GameService();
