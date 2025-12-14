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

  const drinkWater = useCallback(async (ml: number) => {
    if (!currentRoomId || !roomData || !myPlayerId || isProcessing || roomData.boss.isDefeated) return;

    setIsProcessing(true);
    setLastActionFeedback(null);

    try {
      const result = await gameService.drinkWaterTransaction(currentRoomId, myPlayerId, ml);
      if (result.success) {
        setLastActionFeedback({
            msg: result.buffUsed === BuffType.HEAL_LIFE ? 'HEALED!' : 'DAMAGE!',
            val: result.dmg,
            drop: result.drop
        });
        setTimeout(() => setLastActionFeedback(null), 3000); // Increased duration to show drop
      }
    } catch (e) {
      console.error("Drink failed", e);
    } finally {
      setIsProcessing(false);
    }
  }, [currentRoomId, myPlayerId, roomData, isProcessing]);

  const completeQuest = useCallback(async (questId: string, questName: string) => {
      if (!currentRoomId || !myPlayerId || isProcessing) return;
      setIsProcessing(true);
      setLastActionFeedback(null);

      try {
        const result = await gameService.completeQuestTransaction(currentRoomId, myPlayerId, questId, questName);
        if (result.success) {
             setLastActionFeedback({
                msg: 'QUEST COMPLETE!',
                val: 0,
                drop: result.drop
            });
            setTimeout(() => setLastActionFeedback(null), 3000);
        }
      } catch (e) {
          console.error("Quest failed", e);
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
        console.error("Gratitude failed", e);
    } finally {
        setIsProcessing(false);
    }
  }, [currentRoomId, myPlayerId, roomData, isProcessing]);

  return {
    roomData,
    currentRoomId,
    currentPlayer,
    otherPlayers, 
    boss,
    logs,
    loading: false, 
    isProcessing,
    lastActionFeedback,
    isLoggedIn: !!myPlayerId && !!currentRoomId, 
    joinGame,
    logout, 
    drinkWater,
    completeQuest,
    submitGratitude
  };
};