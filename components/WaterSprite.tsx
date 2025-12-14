import React from 'react';

interface WaterSpriteProps {
  isDrinking: boolean;
  isHappy: boolean;
  isTeamGoalMet: boolean;
}

export const WaterSprite: React.FC<WaterSpriteProps> = ({ isDrinking, isHappy, isTeamGoalMet }) => {
  
  // Base color changes if team goal met
  const baseColor = isTeamGoalMet ? 'text-yellow-400' : 'text-cyan-400';
  const glowClass = isDrinking ? 'glow-animation' : '';
  const bounceClass = isHappy ? 'jump-animation' : '';

  return (
    <div className={`relative w-16 h-16 flex items-center justify-center transition-all duration-500 ${bounceClass} ${glowClass}`}>
      {/* SVG Pixel Slime */}
      <svg viewBox="0 0 100 100" className={`w-full h-full drop-shadow-lg ${baseColor} fill-current`} xmlns="http://www.w3.org/2000/svg">
         {/* Body */}
         <path d="M20,80 Q10,80 10,70 Q10,20 50,20 Q90,20 90,70 Q90,80 80,80 Z" />
         {/* Highlight */}
         <circle cx="30" cy="40" r="5" fill="white" opacity="0.6" />
         
         {/* Face Logic */}
         {isDrinking ? (
            <g>
                {/* Drinking Face */}
                <circle cx="35" cy="55" r="4" fill="#0f172a" />
                <circle cx="65" cy="55" r="4" fill="#0f172a" />
                <path d="M40,65 Q50,75 60,65" stroke="#0f172a" strokeWidth="3" fill="none" />
                <circle cx="50" cy="65" r="3" fill="pink" /> 
            </g>
         ) : isHappy ? (
            <g>
                {/* Happy Face */}
                <path d="M30,55 Q35,50 40,55" stroke="#0f172a" strokeWidth="3" fill="none" />
                <path d="M60,55 Q65,50 70,55" stroke="#0f172a" strokeWidth="3" fill="none" />
                <path d="M45,65 Q50,70 55,65" stroke="#0f172a" strokeWidth="3" fill="none" />
            </g>
         ) : (
            <g>
                {/* Normal Face */}
                <circle cx="35" cy="55" r="4" fill="#0f172a" />
                <circle cx="65" cy="55" r="4" fill="#0f172a" />
                <path d="M45,65 Q50,68 55,65" stroke="#0f172a" strokeWidth="3" fill="none" />
            </g>
         )}

         {/* Leaf on head */}
         <path d="M50,20 Q30,0 50,0 Q70,0 50,20" fill="#22c55e" />
      </svg>
      
      {/* Sparkles when happy */}
      {isHappy && (
        <>
            <div className="absolute top-0 right-0 text-yellow-300 animate-pulse">✨</div>
            <div className="absolute bottom-0 left-0 text-yellow-300 animate-pulse delay-100">✨</div>
        </>
      )}
    </div>
  );
};