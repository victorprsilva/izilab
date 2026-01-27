import React, { useState } from 'react';
import { Mail, ArrowRight, AlertCircle, Loader2, CheckCircle2, ArrowLeft } from 'lucide-react';
import { authService } from '../../services/authService';

interface ForgotPasswordFormProps {
  onSwitchToLogin: () => void;
}

const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({ onSwitchToLogin }) => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isShake, setIsShake] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const { error: authError } = await authService.resetPassword(email);

    if (authError) {
      setError(authError.message);
      setIsShake(true);
      setTimeout(() => setIsShake(false), 500);
      setIsLoading(false);
      return;
    }

    setShowConfirmation(true);
    setIsLoading(false);
  };

  if (showConfirmation) {
    return (
      <div className="w-full text-center space-y-4">
        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 size={32} className="text-green-500" />
        </div>
        <h3 className="text-lg font-semibold text-white">Email enviado!</h3>
        <p className="text-sm text-slate-400">
          Se existe uma conta com o email <span className="text-brand-start font-medium">{email}</span>, 
          você receberá um link para redefinir sua senha.
        </p>
        <button
          onClick={onSwitchToLogin}
          className="w-full bg-gradient-to-r from-brand-start to-brand-end hover:from-brand-600 hover:to-brand-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-brand-start/20 hover:shadow-brand-start/40 transform transition-all active:scale-[0.98] flex items-center justify-center gap-2"
        >
          Voltar para Login
          <ArrowRight size={18} />
        </button>
      </div>
    );
  }

  return (
    <>
      <form onSubmit={handleSubmit} className={`w-full space-y-4 ${isShake ? 'animate-[shake_0.5s_ease-in-out]' : ''}`}>
        <p className="text-sm text-slate-400 text-center">
          Digite seu email e enviaremos um link para redefinir sua senha.
        </p>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">Email</label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 group-focus-within:text-brand-start transition-colors">
              <Mail size={18} />
            </div>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError('');
              }}
              className={`w-full bg-background/50 border ${error ? 'border-red-500/50 focus:ring-red-500/20' : 'border-border focus:ring-brand-start/20 focus:border-brand-start'} rounded-xl py-3 pl-10 pr-4 text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-4 transition-all`}
              placeholder="seu@email.com"
              autoFocus
              disabled={isLoading}
            />
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-1.5 text-red-400 text-xs px-1 animate-fade-in">
            <AlertCircle size={12} />
            <span>{error}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={!email || isLoading}
          className="w-full bg-gradient-to-r from-brand-start to-brand-end hover:from-brand-600 hover:to-brand-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-brand-start/20 hover:shadow-brand-start/40 transform transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Enviando...
            </>
          ) : (
            <>
              Enviar Link de Recuperação
              <ArrowRight size={18} />
            </>
          )}
        </button>
      </form>

      <div className="w-full text-center">
        <button
          onClick={onSwitchToLogin}
          className="text-sm text-slate-400 hover:text-brand-start transition-colors flex items-center justify-center gap-1 mx-auto"
        >
          <ArrowLeft size={14} />
          Voltar para Login
        </button>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
          20%, 40%, 60%, 80% { transform: translateX(4px); }
        }
      `}</style>
    </>
  );
};

export default ForgotPasswordForm;
