import { useState, useEffect, useCallback } from 'react';
import { RoomData, Player, GameLog } from '../types';
import { gameService } from '../services/gameService';
import { BuffType } from '../constants';

/**
 * ViewModel (game_view_model.dart equivalent)
 * 
 * Responsibilities:
 * 1. Holds State (RoomData)
 * 2. Exposes business actions (drinkWater, submitGratitude)
 * 3. Formats data for View
 */

export const useGameViewModel = (activePlayerId: string) => {
  const [roomData, setRoomData] = useState<RoomData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastActionFeedback, setLastActionFeedback] = useState<{msg: string, val: number} | null>(null);

  useEffect(() => {
    const unsubscribe = gameService.subscribe(setRoomData);
    return () => unsubscribe();
  }, []);

  const currentPlayer = roomData?.players[activePlayerId];
  const boss = roomData?.boss;

  // Derived state: Sort logs by timestamp desc
  const logs = roomData?.logs 
    ? (Object.values(roomData.logs) as GameLog[]).sort((a, b) => b.timestamp - a.timestamp)
    : [];

  // --- Core Action: Drink Water ---
  const drinkWater = useCallback(async (ml: number) => {
    if (!roomData || isProcessing || (roomData.boss.currentHp <= 0)) return;

    setIsProcessing(true);
    setLastActionFeedback(null);

    try {
      // Future Scalability: Plug in Computer Vision API here to verify water volume from camera.
      
      const result = await gameService.drinkWaterTransaction(activePlayerId, ml);
      
      if (result.success) {
        setLastActionFeedback({
            msg: result.buffUsed === BuffType.HEAL_LIFE ? 'HEALED!' : 'DAMAGE!',
            val: result.dmg
        });
        setTimeout(() => setLastActionFeedback(null), 2000);
      }
    } catch (e) {
      console.error("Drink transaction failed", e);
    } finally {
      setIsProcessing(false);
    }
  }, [activePlayerId, roomData, isProcessing]);

  // --- Core Action: Gratitude Check-in ---
  const submitGratitude = useCallback(async (text: string) => {
    if (!roomData || isProcessing) return;
    setIsProcessing(true);
    
    try {
        const buff = await gameService.submitGratitudeTransaction(activePlayerId, text);
        // We rely on the UI reacting to the new `activeBuff` state automatically
    } catch (e) {
        console.error("Gratitude transaction failed", e);
    } finally {
        setIsProcessing(false);
    }
  }, [activePlayerId, roomData, isProcessing]);

  const resetGame = () => {
    gameService.resetGame();
  };

  return {
    roomData,
    currentPlayer,
    boss,
    logs,
    loading: !roomData,
    isProcessing,
    lastActionFeedback,
    drinkWater,
    submitGratitude,
    resetGame
  };
};