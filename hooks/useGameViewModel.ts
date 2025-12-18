
import { useState, useEffect, useCallback } from 'react';
import { RoomData, Player, GameLog } from '../types';
import { gameService } from '../services/gameService';
import { BuffType, DimensionType } from '../constants';

const STORAGE_KEY_USER = 'hydro_slayer_id';
const STORAGE_KEY_ROOM = 'hydro_slayer_room';
const DEFAULT_ROOM = 'community_raid_01';

const safeStorage = {
    getItem: (key: string): string | null => {
        try { return localStorage.getItem(key); } catch (e) { return null; }
    },
    setItem: (key: string, value: string) => {
        try { localStorage.setItem(key, value); } catch (e) {}
    },
    removeItem: (key: string) => {
        try { localStorage.removeItem(key); } catch (e) {}
    }
};

export const useGameViewModel = () => {
  const [roomData, setRoomData] = useState<RoomData | null>(null);
  const [randomTasks, setRandomTasks] = useState<string[]>([]);
  
  const [myPlayerId, setMyPlayerId] = useState<string | null>(() => {
    return safeStorage.getItem(STORAGE_KEY_USER);
  });

  const [currentRoomId, setCurrentRoomId] = useState<string | null>(() => {
    return safeStorage.getItem(STORAGE_KEY_ROOM);
  });
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastActionFeedback, setLastActionFeedback] = useState<{msg: string, val: number, drop?: string | null, stats?: DimensionType[], xp?: number} | null>(null);

  useEffect(() => {
    const unsubscribeTasks = gameService.subscribeToRandomTasks(setRandomTasks);
    return () => unsubscribeTasks();
  }, []);

  useEffect(() => {
    if (!currentRoomId) return;
    gameService.checkAndTriggerDailyReset(currentRoomId);
    const unsubscribe = gameService.subscribe(currentRoomId, setRoomData);
    return () => unsubscribe();
  }, [currentRoomId]);

  const joinGame = useCallback(async (roomIdInput: string, name: string) => {
    setIsProcessing(true);
    const safeRoomId = roomIdInput.trim() || DEFAULT_ROOM;
    try {
        const cleanName = name.trim();
        const encodedName = encodeURIComponent(cleanName);
        const base64Name = btoa(encodedName).replace(/\//g, '_').replace(/\+/g, '-').replace(/=/g, ''); 
        const newId = `u_${base64Name}`;
        await gameService.joinRoom(safeRoomId, newId, cleanName);
        safeStorage.setItem(STORAGE_KEY_USER, newId);
        safeStorage.setItem(STORAGE_KEY_ROOM, safeRoomId);
        setMyPlayerId(newId);
        setCurrentRoomId(safeRoomId);
    } catch (e) {
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const logout = useCallback(() => {
    safeStorage.removeItem(STORAGE_KEY_USER);
    safeStorage.removeItem(STORAGE_KEY_ROOM);
    setMyPlayerId(null);
    setCurrentRoomId(null);
    setRoomData(null);
  }, []);

  const completeTutorial = useCallback(async () => {
      if (!currentRoomId || !myPlayerId) return;
      await gameService.completeTutorialTransaction(currentRoomId, myPlayerId);
  }, [currentRoomId, myPlayerId]);

  const currentPlayer = (roomData && myPlayerId) ? roomData.players[myPlayerId] : null;
  const boss = roomData?.boss;

  const logs = roomData?.logs 
    ? (Object.values(roomData.logs) as GameLog[]).sort((a, b) => b.timestamp - a.timestamp)
    : [];

  const otherPlayers = roomData 
    ? (Object.values(roomData.players) as Player[]).sort((a, b) => b.totalDamageDealt - a.totalDamageDealt) 
    : [];

  const joinRaid = useCallback(async () => {
      if (!currentRoomId || !myPlayerId || isProcessing) return;
      setIsProcessing(true);
      try {
          await gameService.joinRaidTransaction(currentRoomId, myPlayerId);
      } catch (e) {
      } finally {
          setIsProcessing(false);
      }
  }, [currentRoomId, myPlayerId, isProcessing]);

  const drinkWater = useCallback(async (ml: number) => {
    if (!currentRoomId || !roomData || !myPlayerId || isProcessing) return;
    setIsProcessing(true);
    setLastActionFeedback(null);
    try {
      const result = await gameService.drinkWaterTransaction(currentRoomId, myPlayerId, ml);
      if (result.success && result.drop) {
        setLastActionFeedback({ msg: 'Found Item!', val: 0, drop: result.drop });
        setTimeout(() => setLastActionFeedback(null), 3000);
      }
    } catch (e) {
    } finally {
      setIsProcessing(false);
    }
  }, [currentRoomId, myPlayerId, roomData, isProcessing]);

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
      } finally {
          setIsProcessing(false);
      }
  }, [currentRoomId, myPlayerId, roomData, isProcessing]);

  const addTodo = useCallback(async (task: { label: string, note?: string, importance: number, difficulty: number, dimensions: DimensionType[], source?: 'RANDOM'|'CUSTOM' }) => {
      if (!currentRoomId || !myPlayerId || isProcessing) return;
      setIsProcessing(true);
      try {
          await gameService.addTodoTransaction(currentRoomId, myPlayerId, {
            label: task.label,
            note: task.note || '',
            importance: task.importance,
            difficulty: task.difficulty,
            dimensions: task.dimensions,
            source: task.source
          });
      } catch (e) {
      } finally {
          setIsProcessing(false);
      }
  }, [currentRoomId, myPlayerId, isProcessing]);

  const completeTodo = useCallback(async (todoId: string) => {
      if (!currentRoomId || !myPlayerId || isProcessing) return;
      setIsProcessing(true);
      setLastActionFeedback(null);
      try {
        const result = await gameService.completeTodoTransaction(currentRoomId, myPlayerId, todoId);
        if (result.success) {
             setLastActionFeedback({
                msg: `Quest Complete!`,
                val: 0,
                drop: result.drop,
                xp: result.xpGained,
                stats: result.statsGained
            });
            setTimeout(() => setLastActionFeedback(null), 4000);
        }
      } catch (e) {
      } finally {
          setIsProcessing(false);
      }
  }, [currentRoomId, myPlayerId, isProcessing]);

  const failTodo = useCallback(async (todoId: string) => {
      if (!currentRoomId || !myPlayerId || isProcessing) return;
      setIsProcessing(true);
      setLastActionFeedback(null);
      try {
        const result = await gameService.failTodoTransaction(currentRoomId, myPlayerId, todoId);
        if (result.success) {
             setLastActionFeedback({
                msg: `Failed...`,
                val: 0,
                drop: null,
                xp: -result.xpLost,
                stats: result.statsLost
            });
            setTimeout(() => setLastActionFeedback(null), 3000);
        }
      } catch (e) {
      } finally {
          setIsProcessing(false);
      }
  }, [currentRoomId, myPlayerId, isProcessing]);

  const submitGratitude = useCallback(async (text: string) => {
    if (!currentRoomId || !roomData || !myPlayerId || isProcessing) return;
    setIsProcessing(true);
    try {
        await gameService.submitGratitudeTransaction(currentRoomId, myPlayerId, text);
    } catch (e) {
    } finally {
        setIsProcessing(false);
    }
  }, [currentRoomId, myPlayerId, roomData, isProcessing]);

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
    randomTasks, 
    loading: false, 
    isProcessing,
    lastActionFeedback,
    isLoggedIn: !!myPlayerId && !!currentRoomId, 
    joinGame,
    logout,
    completeTutorial,
    joinRaid, 
    drinkWater,
    performAttack,
    addTodo,      
    completeTodo, 
    failTodo,
    submitGratitude,
    debugRespawn
  };
};
