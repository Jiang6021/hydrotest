import { useState, useEffect, useCallback } from 'react';
import { RoomData, Player, GameLog } from '../types';
import { gameService } from '../services/gameService';
import { BuffType } from '../constants';

const STORAGE_KEY_USER = 'hydro_slayer_id';
const STORAGE_KEY_ROOM = 'hydro_slayer_room';
const DEFAULT_ROOM = 'community_raid_01';

export const useGameViewModel = () => {
  const [roomData, setRoomData] = useState<RoomData | null>(null);
  
  // Initialize from localStorage
  const [myPlayerId, setMyPlayerId] = useState<string | null>(() => {
    return localStorage.getItem(STORAGE_KEY_USER);
  });

  const [currentRoomId, setCurrentRoomId] = useState<string | null>(() => {
    return localStorage.getItem(STORAGE_KEY_ROOM);
  });
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastActionFeedback, setLastActionFeedback] = useState<{msg: string, val: number} | null>(null);

  useEffect(() => {
    if (!currentRoomId) return;

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
    // Previous regex `/[^a-z0-9]/g` stripped Chinese characters, causing collisions.
    // Now we use URL encoding + Base64 to handle any character set safely.
    try {
        const cleanName = name.trim();
        
        // 1. Encode URI Component (handles Chinese/Emoji -> %XX format)
        // 2. Base64 encode it (makes it safe-ish string)
        // 3. Replace '/' and '+' which are valid in Base64 but bad for Firebase/URLs
        const encodedName = encodeURIComponent(cleanName);
        const base64Name = btoa(encodedName)
            .replace(/\//g, '_')
            .replace(/\+/g, '-')
            .replace(/=/g, ''); // Strip padding

        const newId = `u_${base64Name}`;
        
        await gameService.joinRoom(safeRoomId, newId, cleanName);
        
        // Save to storage and state
        localStorage.setItem(STORAGE_KEY_USER, newId);
        localStorage.setItem(STORAGE_KEY_ROOM, safeRoomId);
        
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
    localStorage.removeItem(STORAGE_KEY_USER);
    localStorage.removeItem(STORAGE_KEY_ROOM);
    
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
            val: result.dmg
        });
        setTimeout(() => setLastActionFeedback(null), 2000);
      }
    } catch (e) {
      console.error("Drink failed", e);
    } finally {
      setIsProcessing(false);
    }
  }, [currentRoomId, myPlayerId, roomData, isProcessing]);

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

  const resetGame = () => {
    if (currentRoomId) {
        gameService.resetGame(currentRoomId);
    }
  };

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
    submitGratitude,
    resetGame
  };
};