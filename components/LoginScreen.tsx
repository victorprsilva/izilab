
import React, { useState } from 'react';
import Logo from './Logo';
import { Lock, ArrowRight, AlertCircle } from 'lucide-react';

interface LoginScreenProps {
  onLogin: (password: string) => boolean;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [isShake, setIsShake] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const success = onLogin(password);
    if (!success) {
      setError(true);
      setIsShake(true);
      setTimeout(() => setIsShake(false), 500); // Reset shake animation
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background text-slate-100 relative overflow-hidden p-4">
      {/* Background Ambient Glow */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-brand-start/10 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-brand-end/10 blur-[120px] rounded-full pointer-events-none"></div>

      <div className={`w-full max-w-md bg-surface/50 backdrop-blur-xl border border-border p-8 rounded-3xl shadow-2xl flex flex-col items-center gap-6 animate-fade-in-up ${isShake ? 'animate-[shake_0.5s_ease-in-out]' : ''}`}>
        
        <div className="scale-110 mb-2">
          <Logo size="lg" />
        </div>

        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-white">Acesso Restrito</h1>
          <p className="text-slate-400 text-sm">
            Área exclusiva para Mentorados da <span className="text-brand-start font-medium">Inteligência Híbrida</span>.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="w-full space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">Senha de Acesso</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 group-focus-within:text-brand-start transition-colors">
                <Lock size={18} />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(false);
                }}
                className={`w-full bg-background/50 border ${error ? 'border-red-500/50 focus:ring-red-500/20' : 'border-border focus:ring-brand-start/20 focus:border-brand-start'} rounded-xl py-3 pl-10 pr-4 text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-4 transition-all`}
                placeholder="Digite a senha..."
                autoFocus
              />
            </div>
            {error && (
              <div className="flex items-center gap-1.5 text-red-400 text-xs px-1 animate-fade-in">
                <AlertCircle size={12} />
                <span>Senha incorreta. Tente novamente.</span>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={!password}
            className="w-full bg-gradient-to-r from-brand-start to-brand-end hover:from-brand-600 hover:to-brand-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-brand-start/20 hover:shadow-brand-start/40 transform transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Entrar na Plataforma
            <ArrowRight size={18} />
          </button>
        </form>

        <div className="pt-4 border-t border-white/5 w-full text-center">
            <p className="text-xs text-slate-600">
                &copy; {new Date().getFullYear()} HybridApps. Todos os direitos reservados.
            </p>
        </div>
      </div>
      
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
          20%, 40%, 60%, 80% { transform: translateX(4px); }
        }
      `}</style>
    </div>
  );
};

export default LoginScreen;