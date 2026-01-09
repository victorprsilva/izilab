
import React from 'react';

const Logo: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ size = 'md' }) => {
  // Scaling factors
  const dimension = size === 'sm' ? 'w-8 h-8' : size === 'lg' ? 'w-16 h-16' : 'w-12 h-12';
  const textSize = size === 'sm' ? 'text-xl' : size === 'lg' ? 'text-4xl' : 'text-3xl';
  
  return (
    <div className="flex items-center gap-3 select-none group">
      <div className={`relative flex items-center justify-center ${dimension}`}>
        {/* Glow effect specific to the tubes */}
        <div className="absolute inset-0 bg-brand-start blur-xl opacity-20 rounded-full group-hover:opacity-40 transition-opacity duration-500"></div>
        
        {/* Vector Logo - Animated Test Tubes */}
        <svg 
          viewBox="0 0 100 100" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg" 
          className="w-full h-full relative z-10 drop-shadow-lg"
        >
          <style>
            {`
              @keyframes float {
                0%, 100% { transform: translateY(0px) rotate(0deg); }
                50% { transform: translateY(-4px) rotate(2deg); }
              }
              @keyframes float-delayed {
                0%, 100% { transform: translateY(0px) rotate(0deg); }
                50% { transform: translateY(-4px) rotate(-2deg); }
              }
              @keyframes bubble-rise {
                0% { opacity: 0; transform: translateY(0) scale(0.5); }
                50% { opacity: 0.8; }
                100% { opacity: 0; transform: translateY(-20px) scale(1); }
              }
              .tube-left { animation: float 3s ease-in-out infinite; transform-origin: center bottom; }
              .tube-right { animation: float-delayed 3.2s ease-in-out infinite; transform-origin: center bottom; }
              .bubble-1 { animation: bubble-rise 2s infinite ease-out; }
              .bubble-2 { animation: bubble-rise 2.5s infinite ease-out 0.5s; }
              .bubble-3 { animation: bubble-rise 1.8s infinite ease-out 0.8s; }
              .bubble-4 { animation: bubble-rise 2.2s infinite ease-out 1.2s; }
            `}
          </style>
          <defs>
            <linearGradient id="blueLiquid" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#2563eb" /> {/* Blue 600 */}
              <stop offset="100%" stopColor="#60a5fa" /> {/* Blue 400 */}
            </linearGradient>
            <linearGradient id="purpleLiquid" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#7e22ce" /> {/* Purple 700 */}
              <stop offset="100%" stopColor="#c084fc" /> {/* Purple 400 */}
            </linearGradient>
            <linearGradient id="glassShine" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="white" stopOpacity="0.4" />
              <stop offset="50%" stopColor="white" stopOpacity="0.1" />
              <stop offset="100%" stopColor="white" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Left Tube (Medical Blue) */}
          <g className="tube-left">
            {/* Tube Body */}
            <rect x="25" y="20" width="20" height="60" rx="10" stroke="#94a3b8" strokeWidth="2" fill="none" />
            <rect x="23" y="18" width="24" height="4" rx="2" fill="#cbd5e1" />
            
            {/* Liquid */}
            <path d="M26 45 H44 V70 A9 9 0 0 1 26 70 Z" fill="url(#blueLiquid)" />
            
            {/* Bubbles */}
            <circle cx="35" cy="65" r="2" fill="white" className="bubble-1" />
            <circle cx="30" cy="55" r="1.5" fill="white" className="bubble-3" />
            
            {/* Glass Shine */}
            <path d="M27 24 L27 70 A8 8 0 0 0 32 70 L32 24 Z" fill="url(#glassShine)" />
          </g>
          
          {/* Right Tube (AI Purple) */}
          <g className="tube-right">
             {/* Tube Body */}
            <rect x="55" y="20" width="20" height="60" rx="10" stroke="#94a3b8" strokeWidth="2" fill="none" />
            <rect x="53" y="18" width="24" height="4" rx="2" fill="#cbd5e1" />
            
            {/* Liquid */}
            <path d="M56 50 H74 V70 A9 9 0 0 1 56 70 Z" fill="url(#purpleLiquid)" />
            
            {/* Bubbles */}
            <circle cx="65" cy="68" r="2" fill="white" className="bubble-2" />
            <circle cx="70" cy="58" r="1.5" fill="white" className="bubble-4" />
            
            {/* Glass Shine */}
            <path d="M57 24 L57 70 A8 8 0 0 0 62 70 L62 24 Z" fill="url(#glassShine)" />
          </g>

        </svg>
      </div>
      
      <div className={`flex flex-col leading-none`}>
        <span className={`font-extrabold tracking-tight text-white ${textSize}`}>
          IZI <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-start to-brand-end">LAB</span>
        </span>
        {size !== 'sm' && (
          <span className="text-[0.45em] font-semibold text-slate-400 uppercase tracking-widest ml-1">
            inteligência híbrida
          </span>
        )}
      </div>
    </div>
  );
};

export default Logo;
