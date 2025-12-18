
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
    
    const unsubscribe = onValue(tasksRef, (snapshot) => {
        const val = snapshot.val();
        let loadedTasks: string[] = [];
        
        if (val) {
            if (Array.isArray(val)) {
                loadedTasks = val.filter((t: any) => typeof t === 'string') as string[];
            } else if (typeof val === 'object') {
                loadedTasks = Object.values(val as object).filter((t: any) => typeof t === 'string') as string[];
            }
        }

        if (loadedTasks.length > 0) {
            callback(loadedTasks);
        } else {
            callback(["等待任務發布..."]);
        }
    }, (error) => {
        console.error("❌ [Firebase] Read failed:", error);
        callback(["連線錯誤", "請檢查網路"]);
    });

    return () => unsubscribe();
  }

  async joinRoom(roomId: string, playerId: string, playerName: string): Promise<void> {
    const roomRef = ref(db, `rooms/${roomId}`);
    const todayStr = new Date().toDateString();

    await runTransaction(roomRef, (currentData: any) => {
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

      if (currentData.lastActiveDate !== todayStr) {
          this.performDailyReset(currentData, todayStr);
      }

      if (!currentData.players) currentData.players = {};

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
          isParticipatingToday: false,
          inventory: [],
          completedQuests: [],
          todos: {},
          hasSeenTutorial: false, // Default to false
          stats: {
             [DimensionType.RESILIENCE]: 0,
             [DimensionType.CHARM]: 0,
             [DimensionType.ACADEMICS]: 0,
             [DimensionType.PHYSIQUE]: 0,
             [DimensionType.CREATIVITY]: 0,
          }
        };
        
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
        currentData.players[playerId].name = playerName;
        if (!currentData.players[playerId].stats) {
            currentData.players[playerId].stats = {
                 [DimensionType.RESILIENCE]: 0,
                 [DimensionType.CHARM]: 0,
                 [DimensionType.ACADEMICS]: 0,
                 [DimensionType.PHYSIQUE]: 0,
                 [DimensionType.CREATIVITY]: 0,
            };
        }
      }

      return currentData;
    });
  }

  async completeTutorialTransaction(roomId: string, playerId: string): Promise<void> {
    const playerRef = ref(db, `rooms/${roomId}/players/${playerId}`);
    try {
        await runTransaction(playerRef, (player: any) => {
            if (player) {
                player.hasSeenTutorial = true;
            }
            return player;
        });
    } catch (e) {
        console.error("Complete Tutorial Tx Failed", e);
    }
  }

  async joinRaidTransaction(roomId: string, playerId: string): Promise<boolean> {
      const roomRef = ref(db, `rooms/${roomId}`);
      const todayStr = new Date().toDateString();

      try {
          await runTransaction(roomRef, (currentData: any) => {
             if (!currentData || !currentData.players || !currentData.players[playerId]) return;
             if (currentData.lastActiveDate !== todayStr) {
                 this.performDailyReset(currentData, todayStr);
             }
             const player = currentData.players[playerId];
             if (player.isParticipatingToday) return;
             player.isParticipatingToday = true;
             if (currentData.boss) {
                 currentData.boss.maxHp = (currentData.boss.maxHp || BOSS_MAX_HP) + BOSS_HP_PER_PLAYER;
                 if (!currentData.boss.isDefeated) {
                     currentData.boss.currentHp = (currentData.boss.currentHp || 0) + BOSS_HP_PER_PLAYER;
                 }
             }
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
          return false;
      }
  }

  async drinkWaterTransaction(roomId: string, playerId: string, mlAmount: number): Promise<{ success: boolean; drop: string | null }> {
    const roomRef = ref(db, `rooms/${roomId}`);
    const todayStr = new Date().toDateString();
    let droppedItem: string | null = null;
    try {
        await runTransaction(roomRef, (currentData: any) => {
            if (!currentData || !currentData.players || !currentData.players[playerId]) return;
            if (currentData.lastActiveDate !== todayStr) {
                this.performDailyReset(currentData, todayStr);
            }
            const player = currentData.players[playerId];
            player.todayWaterMl = (player.todayWaterMl || 0) + mlAmount;
            if (Math.random() < 0.3) {
                if (!player.inventory) player.inventory = [];
                const randomTrinket = TRINKETS[Math.floor(Math.random() * TRINKETS.length)];
                player.inventory.push(randomTrinket);
                droppedItem = randomTrinket;
            }
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
        return { success: false, drop: null };
    }
  }

  async performAttackTransaction(roomId: string, playerId: string): Promise<{ success: boolean; dmg: number; buffUsed: BuffType }> {
      const roomRef = ref(db, `rooms/${roomId}`);
      let resultDmg = 0;
      let resultBuff = BuffType.NONE;
      try {
          await runTransaction(roomRef, (currentData: any) => {
              if (!currentData || !currentData.players || !currentData.players[playerId]) return;
              const player = currentData.players[playerId];
              const boss = currentData.boss;
              const maxPossibleAttacks = Math.floor(player.todayWaterMl / WATER_PER_ATTACK_CHARGE);
              const attacksDone = player.attacksPerformed || 0;
              if (attacksDone >= maxPossibleAttacks || attacksDone >= MAX_DAILY_ATTACKS) return;
              const currentBuff = player.activeBuff;
              let baseDamage = DAMAGE_PER_DRINK;
              let finalDamage = baseDamage;
              let healed = false;
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
              resultDmg = finalDamage;
              resultBuff = currentBuff;
              if (boss && !boss.isDefeated) {
                  let newBossHp = boss.currentHp - finalDamage;
                  if (newBossHp < 0) newBossHp = 0;
                  if (newBossHp === 0) {
                      boss.isDefeated = true;
                      currentData.status = 'VICTORY';
                  }
                  boss.currentHp = newBossHp;
              }
              player.attacksPerformed = attacksDone + 1;
              player.activeBuff = BuffType.NONE;
              player.totalDamageDealt = (player.totalDamageDealt || 0) + finalDamage;
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
          return { success: false, dmg: 0, buffUsed: BuffType.NONE };
      }
  }

  async addTodoTransaction(roomId: string, playerId: string, task: { label: string, note: string, importance: number, difficulty: number, dimensions: DimensionType[], source?: 'RANDOM'|'CUSTOM' }): Promise<boolean> {
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
                  dimensions: task.dimensions,
                  source: task.source || 'CUSTOM',
                  isCompleted: false,
                  createdAt: Date.now()
              };
              return currentData;
          });
          return true;
      } catch (e) {
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
              const source = todo.source || 'CUSTOM';
              let dimList = todo.dimensions || (todo.dimension ? [todo.dimension] : [DimensionType.RESILIENCE]);
              const difficulty = todo.difficulty || 1;
              xpGained = 10 * difficulty;
              if (!player.stats) player.stats = {};
              dimList.forEach((d: DimensionType) => {
                  player.stats[d] = (player.stats[d] || 0) + xpGained;
                  statsGained.push(d);
              });
              delete player.todos[todoId];
              if (!player.inventory) player.inventory = [];
              const randomTrinket = TRINKETS[Math.floor(Math.random() * TRINKETS.length)];
              player.inventory.push(randomTrinket);
              resultDrop = randomTrinket;
              if (source === 'RANDOM') {
                  const logId = `log_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
                  if (!currentData.logs) currentData.logs = {};
                  let msg = `completed task: "${taskLabel}"`;
                  if (resultDrop) msg += ` and found ${resultDrop}!`;
                  currentData.logs[logId] = {
                      id: logId,
                      timestamp: Date.now(),
                      userId: playerId,
                      userName: player.name,
                      actionType: ActionType.QUEST,
                      value: taskLabel,
                      damageDealt: 0,
                      message: msg
                  };
              }
              return currentData;
          });
          if (resultDrop) return { success: true, drop: resultDrop, xpGained, statsGained };
          return { success: false, drop: "", xpGained: 0, statsGained: [] };
      } catch (e) {
          return { success: false, drop: "", xpGained: 0, statsGained: [] };
      }
  }

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
              xpLost = 5 * difficulty;
              if (!player.stats) player.stats = {};
              dimList.forEach((d: DimensionType) => {
                   const currentVal = player.stats[d] || 0;
                   player.stats[d] = Math.max(0, currentVal - xpLost);
                   statsLost.push(d);
              });
              delete player.todos[todoId];
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
          return { success: false, xpLost: 0, statsLost: [] };
      }
  }

  async submitGratitudeTransaction(roomId: string, playerId: string, text: string): Promise<BuffType> {
    const roomRef = ref(db, `rooms/${roomId}`);
    let assignedBuff = BuffType.NONE;
    try {
        await runTransaction(roomRef, (currentData: any) => {
            if (!currentData || !currentData.players || !currentData.players[playerId]) return;
            const player = currentData.players[playerId];
            const roll = Math.random();
            let newBuff = BuffType.DOUBLE_DMG; 
            if (roll < 0.2) newBuff = BuffType.HEAL_LIFE;
            else if (roll < 0.5) newBuff = BuffType.CRITICAL_x3;
            player.activeBuff = newBuff;
            assignedBuff = newBuff;
            if (!player.stats) player.stats = {};
            player.stats[DimensionType.CHARM] = (player.stats[DimensionType.CHARM] || 0) + 5;
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
                message: `shared gratitude: "${text}" and received a Blessing!`
            };
            return currentData;
        });
        return assignedBuff;
    } catch (e) {
        return BuffType.NONE;
    }
  }

  async debugRespawnBoss(roomId: string) {
      const roomRef = ref(db, `rooms/${roomId}`);
      try {
          await runTransaction(roomRef, (currentData: any) => {
              if (!currentData) return;
              currentData.status = 'ACTIVE';
              if (currentData.boss) {
                currentData.boss.isDefeated = false;
                currentData.boss.maxHp = BOSS_MAX_HP;
                currentData.boss.currentHp = BOSS_MAX_HP;
              }
              if (currentData.players) {
                  Object.values(currentData.players).forEach((p: any) => {
                      p.todayWaterMl = 0;
                      p.attacksPerformed = 0;
                      p.activeBuff = BuffType.NONE;
                      p.todos = {};
                      p.isParticipatingToday = false;
                  });
              }
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
      } catch (e) {}
  }

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
    } catch (e) {}
  }

  private performDailyReset(currentData: any, todayStr: string) {
      currentData.lastActiveDate = todayStr;
      currentData.status = 'ACTIVE';
      if (currentData.boss) {
          currentData.boss.isDefeated = false;
          currentData.boss.maxHp = BOSS_MAX_HP;
          currentData.boss.currentHp = BOSS_MAX_HP;
      }
      if (currentData.players) {
          Object.values(currentData.players).forEach((p: any) => {
              p.todayWaterMl = 0;
              p.attacksPerformed = 0;
              p.completedQuests = [];
              p.isParticipatingToday = false;
              if (p.hp <= 0) p.hp = MAX_PLAYER_LIVES;
          });
      }
      currentData.logs = {};
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
