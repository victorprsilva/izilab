
import React, { useEffect, useState } from 'react';
import { Scan, User, FileSearch, Database, Sparkles } from 'lucide-react';

const TIPS = [
  "Dica: Você pode fotografar vários exames em sequência.",
  "Dica: O IZI LAB separa exames de laboratório e de imagem automaticamente.",
  "Dica: Use o Modo Leitura para uma visualização rápida no celular.",
  "Dica: Valores alterados são destacados em laranja.",
  "Dica: O IZI LAB organiza datas automaticamente para ver a evolução.",
];

const BloodLoader: React.FC = () => {
  const [progress, setProgress] = useState(0);
  const [tipIndex, setTipIndex] = useState(0);

  useEffect(() => {
    // Randomize initial tip
    setTipIndex(Math.floor(Math.random() * TIPS.length));

    // Rotate tips every 3.5 seconds
    const tipInterval = setInterval(() => {
      setTipIndex(prev => (prev + 1) % TIPS.length);
    }, 3500);

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          // Slow trickle at the end while waiting for API
          return prev < 99 ? prev + 0.05 : prev;
        }
        // Moves faster at start, slows as it reaches 90
        const increment = Math.max(0.1, (100 - prev) / 60); 
        return prev + increment;
      });
    }, 30); // update every 30ms for smoothness

    return () => {
      clearInterval(interval);
      clearInterval(tipInterval);
    };
  }, []);

  const getStageInfo = (p: number) => {
    if (p < 25) return { text: "Digitalizando arquivo...", icon: <Scan size={18} className="animate-pulse text-brand-start" /> };
    if (p < 45) return { text: "Identificando paciente...", icon: <User size={18} className="animate-bounce text-purple-400" /> };
    if (p < 65) return { text: "Classificando exames...", icon: <FileSearch size={18} className="animate-pulse text-indigo-400" /> };
    if (p < 85) return { text: "Extraindo resultados...", icon: <Database size={18} className="animate-pulse text-cyan-400" /> };
    return { text: "Organizando resumo...", icon: <Sparkles size={18} className="animate-spin text-yellow-400" /> };
  };

  const stage = getStageInfo(progress);

  return (
    <div className="flex flex-col items-center justify-center space-y-6 animate-fade-in w-full max-w-sm mx-auto">
      
      {/* Progress Tube */}
      <div className="relative w-full h-8 bg-slate-900 rounded-full border border-slate-700 shadow-inner overflow-hidden ring-4 ring-slate-800">
        
        {/* Tick marks */}
        <div className="absolute inset-0 z-20 pointer-events-none opacity-30 flex justify-between px-4">
            {[...Array(10)].map((_, i) => (
                <div key={i} className="h-2 w-px bg-slate-400 mt-auto mb-1"></div>
            ))}
        </div>

        {/* Glass Reflection */}
        <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/10 to-transparent z-10 rounded-t-full"></div>

        {/* Liquid */}
        <div 
          className="absolute top-0 left-0 h-full bg-gradient-to-r from-red-900 via-red-700 to-red-600 shadow-[0_0_20px_rgba(220,38,38,0.5)] transition-all duration-75 ease-linear flex items-center justify-end"
          style={{ width: `${progress}%` }}
        >
          <div className="h-full w-2 bg-gradient-to-r from-transparent to-white/30"></div>
        </div>
      </div>

      {/* Percentage & Stage */}
      <div className="flex flex-col items-center gap-3">
        <span className="text-4xl font-bold text-slate-100 font-mono tracking-tighter drop-shadow-lg">
          {Math.min(100, Math.round(progress))}%
        </span>
        
        <div className="flex items-center gap-3 bg-slate-800/80 px-5 py-2.5 rounded-xl border border-slate-700/50 backdrop-blur-md shadow-lg transition-all duration-300 transform hover:scale-105">
            {stage.icon}
            <span className="text-sm text-slate-200 font-semibold tracking-wide">
              {stage.text}
            </span>
        </div>
      </div>

      {/* Rotating Tips */}
      <div className="h-12 flex items-center justify-center w-full px-4">
          <p key={tipIndex} className="text-xs text-slate-500 italic text-center animate-fade-in leading-relaxed">
             {TIPS[tipIndex]}
          </p>
      </div>
    </div>
  );
};

export default BloodLoader;