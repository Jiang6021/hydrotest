
import { useState, useEffect, useCallback } from 'react';
import { RoomData, Player, GameLog } from '../types';
import { gameService } from '../services/gameService';
import { BuffType } from '../constants';

const STORAGE_KEY_USER = 'hydro_slayer_id';
const STORAGE_KEY_ROOM = 'hydro_slayer_room';
const DEFAULT_ROOM = 'community_raid_01';

// Safe Storage Helper
const safeStorage = {
    getItem: (key: string): string | null => {
        try {
            return localStorage.getItem(key);
        } catch (e) {
            console.warn('LocalStorage access denied', e);
            return null;
        }
    },
    setItem: (key: string, value: string) => {
        try {
            localStorage.setItem(key, value);
        } catch (e) {
            console.warn('LocalStorage write denied', e);
        }
    },
    removeItem: (key: string) => {
        try {
            localStorage.removeItem(key);
        } catch (e) {
            console.warn('LocalStorage remove denied', e);
        }
    }
};

export const useGameViewModel = () => {
  const [roomData, setRoomData] = useState<RoomData | null>(null);
  const [randomTasks, setRandomTasks] = useState<string[]>([]);
  
  // Initialize from localStorage safely
  const [myPlayerId, setMyPlayerId] = useState<string | null>(() => {
    return safeStorage.getItem(STORAGE_KEY_USER);
  });

  const [currentRoomId, setCurrentRoomId] = useState<string | null>(() => {
    return safeStorage.getItem(STORAGE_KEY_ROOM);
  });
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastActionFeedback, setLastActionFeedback] = useState<{msg: string, val: number, drop?: string | null} | null>(null);

  useEffect(() => {
    // Subscribe to Global Random Tasks (Run once on mount)
    const unsubscribeTasks = gameService.subscribeToRandomTasks(setRandomTasks);

    return () => {
        unsubscribeTasks();
    };
  }, []);

  useEffect(() => {
    if (!currentRoomId) return;

    // Check if a daily reset is needed as soon as we connect
    gameService.checkAndTriggerDailyReset(currentRoomId);

    // Subscribe to room updates globally
    const unsubscribe = gameService.subscribe(currentRoomId, setRoomData);
    return () => unsubscribe();
  }, [currentRoomId]);

  // Action to Join/Login
  const joinGame = useCallback(async (roomIdInput: string, name: string) => {
    setIsProcessing(true);
    
    // Normalize Room ID
    const safeRoomId = roomIdInput.trim() || DEFAULT_ROOM;

    // Fix: Create Robust Deterministic ID
    try {
        const cleanName = name.trim();
        const encodedName = encodeURIComponent(cleanName);
        const base64Name = btoa(encodedName)
            .replace(/\//g, '_')
            .replace(/\+/g, '-')
            .replace(/=/g, ''); 

        const newId = `u_${base64Name}`;
        
        await gameService.joinRoom(safeRoomId, newId, cleanName);
        
        // Save to storage and state
        safeStorage.setItem(STORAGE_KEY_USER, newId);
        safeStorage.setItem(STORAGE_KEY_ROOM, safeRoomId);
        
        setMyPlayerId(newId);
        setCurrentRoomId(safeRoomId);

    } catch (e) {
      console.error("Join failed", e);
    } finally {
      setIsProcessing(false);
    }
  }, []);

  // Action to Logout
  const logout = useCallback(() => {
    safeStorage.removeItem(STORAGE_KEY_USER);
    safeStorage.removeItem(STORAGE_KEY_ROOM);
    
    setMyPlayerId(null);
    setCurrentRoomId(null);
    setRoomData(null);
  }, []);

  const currentPlayer = (roomData && myPlayerId) ? roomData.players[myPlayerId] : null;
  const boss = roomData?.boss;

  const logs = roomData?.logs 
    ? (Object.values(roomData.logs) as GameLog[]).sort((a, b) => b.timestamp - a.timestamp)
    : [];

  const otherPlayers = roomData 
    ? (Object.values(roomData.players) as Player[])
        .sort((a, b) => b.totalDamageDealt - a.totalDamageDealt) 
    : [];

  // Join Daily Raid (Opt-in)
  const joinRaid = useCallback(async () => {
      if (!currentRoomId || !myPlayerId || isProcessing) return;
      setIsProcessing(true);
      try {
          await gameService.joinRaidTransaction(currentRoomId, myPlayerId);
      } catch (e) {
          console.error("Join Raid failed", e);
      } finally {
          setIsProcessing(false);
      }
  }, [currentRoomId, myPlayerId, isProcessing]);


  // Only Hydrates (no damage)
  const drinkWater = useCallback(async (ml: number) => {
    if (!currentRoomId || !roomData || !myPlayerId || isProcessing) return;

    setIsProcessing(true);
    setLastActionFeedback(null);

    try {
      const result = await gameService.drinkWaterTransaction(currentRoomId, myPlayerId, ml);
      if (result.success && result.drop) {
        setLastActionFeedback({
            msg: 'Found Item!',
            val: 0,
            drop: result.drop
        });
        setTimeout(() => setLastActionFeedback(null), 3000);
      }
    } catch (e) {
      console.error("Drink failed", e);
    } finally {
      setIsProcessing(false);
    }
  }, [currentRoomId, myPlayerId, roomData, isProcessing]);

  // Performs Attack (Consumes charge)
  const performAttack = useCallback(async () => {
      if (!currentRoomId || !roomData || !myPlayerId || isProcessing) return;

      setIsProcessing(true);
      setLastActionFeedback(null);

      try {
          const result = await gameService.performAttackTransaction(currentRoomId, myPlayerId);
          if (result.success) {
               setLastActionFeedback({
                  msg: result.buffUsed === BuffType.HEAL_LIFE ? 'HEALED!' : 'ATTACK!',
                  val: result.dmg,
              });
              setTimeout(() => setLastActionFeedback(null), 2000);
          }
      } catch (e) {
          console.error("Attack failed", e);
      } finally {
          setIsProcessing(false);
      }
  }, [currentRoomId, myPlayerId, roomData, isProcessing]);

  // New: Add Todo (Enhanced)
  const addTodo = useCallback(async (task: { label: string, note?: string, importance: number, difficulty: number }) => {
      if (!currentRoomId || !myPlayerId || isProcessing) return;
      setIsProcessing(true);
      try {
          await gameService.addTodoTransaction(currentRoomId, myPlayerId, {
            label: task.label,
            note: task.note || '',
            importance: task.importance,
            difficulty: task.difficulty
          });
      } catch (e) {
          console.error("Add Todo failed", e);
      } finally {
          setIsProcessing(false);
      }
  }, [currentRoomId, myPlayerId, isProcessing]);

  // New: Complete Todo
  const completeTodo = useCallback(async (todoId: string) => {
      if (!currentRoomId || !myPlayerId || isProcessing) return;
      setIsProcessing(true);
      setLastActionFeedback(null);

      try {
        const result = await gameService.completeTodoTransaction(currentRoomId, myPlayerId, todoId);
        if (result.success) {
             setLastActionFeedback({
                msg: 'TASK COMPLETE!',
                val: 0,
                drop: result.drop
            });
            setTimeout(() => setLastActionFeedback(null), 3000);
        }
      } catch (e) {
          console.error("Complete Todo failed", e);
      } finally {
          setIsProcessing(false);
      }
  }, [currentRoomId, myPlayerId, isProcessing]);

  // Legacy (Keep for compatibility if needed)
  const completeQuest = useCallback(async (questId: string, questName: string) => {
      // No-op for now, replaced by completeTodo
  }, []);

  const submitGratitude = useCallback(async (text: string) => {
    if (!currentRoomId || !roomData || !myPlayerId || isProcessing) return;
    setIsProcessing(true);
    try {
        await gameService.submitGratitudeTransaction(currentRoomId, myPlayerId, text);
    } catch (e) {
        console.error("Gratitude failed", e);
    } finally {
        setIsProcessing(false);
    }
  }, [currentRoomId, myPlayerId, roomData, isProcessing]);

  // Debug Helper
  const debugRespawn = useCallback(async () => {
      if (!currentRoomId) return;
      await gameService.debugRespawnBoss(currentRoomId);
  }, [currentRoomId]);

  return {
    roomData,
    currentRoomId,
    currentPlayer,
    otherPlayers, 
    boss,
    logs,
    randomTasks, // Exported to View
    loading: false, 
    isProcessing,
    lastActionFeedback,
    isLoggedIn: !!myPlayerId && !!currentRoomId, 
    joinGame,
    logout,
    joinRaid, // New
    drinkWater,
    performAttack,
    addTodo,      // New
    completeTodo, // New
    completeQuest,
    submitGratitude,
    debugRespawn
  };
};
