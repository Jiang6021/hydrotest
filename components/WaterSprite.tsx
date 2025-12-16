import React, { useState, useEffect, useRef } from 'react';
import { CC_IMAGE } from '../assets';
import { CLICK_SOUND_BASE64 } from '../assets';
interface WaterSpriteProps {
  isDrinking: boolean;
  isHappy: boolean;
  isTeamGoalMet: boolean;
}

// 資料來源格式：請將您的 Base64 音訊字串放入此處
// 範例：'data:audio/mpeg;base64,SUQzBAAAAAAA...' 或 'data:audio/wav;base64,UklGR...'
// 您需要將實際的 Base64 音訊數據替換掉 'YOUR_BASE64_AUDIO_STRING_HERE'


export const WaterSprite: React.FC<WaterSpriteProps> = ({ isDrinking, isHappy, isTeamGoalMet }) => {
  const [clickJump, setClickJump] = useState(false);
  
  // 直接使用來自 assets 的圖片資料
  const customImageUrl = CC_IMAGE;

  // 優化 5: 音效初始化與清理 (使用 useRef 避免每次 Render 都重新建立實例)
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // 初始化 Audio 物件，確保只創建一次
    if (!audioRef.current) {
      audioRef.current = new Audio(CLICK_SOUND_BASE64);
      // 可選：預載入音訊以減少首次播放延遲，但可能會消耗更多初始資源
      // audioRef.current.load(); 
    }

    // 環境保護：清理函數，確保組件卸載時音訊狀態良好
    return () => {
      if (audioRef.current) {
        audioRef.current.pause(); // 暫停任何正在播放的音訊
        audioRef.current.currentTime = 0; // 重置播放時間
        audioRef.current = null; // 幫助垃圾回收，雖然 HTMLAudioElement 不一定強制需要
      }
    };
  }, []); // 空依賴陣列確保只在組件掛載和卸載時運行

  // 優化 1: 使用 useEffect 處理計時器，防止組件卸載時的記憶體洩漏
  useEffect(() => {
    // Fix: Use ReturnType<typeof setTimeout> instead of NodeJS.Timeout for browser compatibility
    let timer: ReturnType<typeof setTimeout>;
    if (clickJump) {
      timer = setTimeout(() => setClickJump(false), 600);
    }
    // Cleanup function
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [clickJump]);

  const triggerJump = () => {
    setClickJump(true);

    // 優化 6: 播放音效 (連按優化：每次播放前重置 currentTime)
    if (audioRef.current) {
      audioRef.current.currentTime = 0; // 重置播放時間，讓音效可以快速連按從頭播放
      audioRef.current.play().catch(e => {
        // 處理 Promise rejection (例如：使用者未互動前嘗試播放)
        console.error("Error playing audio:", e);
      });
    }
  };

  // 優化 2: 樣式邏輯分離
  const animClass = clickJump ? 'jump-animation' : (isHappy ? 'animate-bounce' : '');
  const glowClass = isDrinking ? 'glow-animation' : '';
  
  // 優化 3: 使用 CSS Filter 模擬達成目標的金光效果 (因為 PNG 無法用 text-color 變色)
  const goalStyle = isTeamGoalMet ? { filter: 'drop-shadow(0 0 5px #facc15) brightness(1.1)' } : {};

  return (
    <div 
      onClick={triggerJump}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && triggerJump()}
      className={`relative w-24 h-24 flex items-center justify-center transition-all duration-500 cursor-pointer select-none outline-none ${animClass} ${glowClass}`}
    >
      {/* 優化 4: 移除冗餘的 SVG 判斷，直接渲染圖片 */}
      <img 
        src={customImageUrl}
        alt="Water Sprite Character" 
        className="w-full h-full object-contain drop-shadow-lg transition-all"
        style={goalStyle}
      />
      
      {/* 特效層 */}
      {(isHappy || clickJump) && (
        <>
            <div className="absolute top-0 right-0 text-yellow-300 animate-pulse text-xl">✨</div>
            <div className="absolute bottom-0 left-0 text-yellow-300 animate-pulse delay-100 text-xl">✨</div>
        </>
      )}
    </div>
  );
};