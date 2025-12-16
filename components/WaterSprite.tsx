import React, { useState, useEffect } from 'react';
import { CC_IMAGE } from '../assets';

interface WaterSpriteProps {
  isDrinking: boolean;
  isHappy: boolean;
  isTeamGoalMet: boolean;
}

export const WaterSprite: React.FC<WaterSpriteProps> = ({ isDrinking, isHappy, isTeamGoalMet }) => {
  const [clickJump, setClickJump] = useState(false);
  
  // 直接使用來自 assets 的圖片資料
  const customImageUrl = CC_IMAGE;

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