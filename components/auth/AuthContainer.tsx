import React from 'react';
import Logo from '../Logo';

interface AuthContainerProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

const AuthContainer: React.FC<AuthContainerProps> = ({ children, title, subtitle }) => {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background text-slate-100 relative overflow-hidden p-4">
      {/* Background Ambient Glow */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-brand-start/10 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-brand-end/10 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="w-full max-w-md bg-surface/50 backdrop-blur-xl border border-border p-8 rounded-3xl shadow-2xl flex flex-col items-center gap-6 animate-fade-in-up">
        
        <div className="scale-110 mb-2">
          <Logo size="lg" />
        </div>

        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-white">{title}</h1>
          {subtitle && (
            <p className="text-slate-400 text-sm">
              {subtitle}
            </p>
          )}
        </div>

        {children}

        <div className="pt-4 border-t border-white/5 w-full text-center">
          <p className="text-xs text-slate-600">
            &copy; {new Date().getFullYear()} HybridApps. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthContainer;
