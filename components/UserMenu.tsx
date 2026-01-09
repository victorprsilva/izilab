import React, { useState, useRef, useEffect } from 'react';
import { User, Settings, CreditCard, LogOut, ChevronDown } from 'lucide-react';

interface UserMenuProps {
  userName: string | null;
  userEmail: string;
  onLogout: () => void;
  onOpenSettings: () => void;
}

const UserMenu: React.FC<UserMenuProps> = ({ userName, userEmail, onLogout, onOpenSettings }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const displayName = userName || userEmail.split('@')[0];
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-surfaceHighlight transition-all border border-transparent hover:border-border group"
      >
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-start to-brand-end flex items-center justify-center text-white font-semibold text-sm shadow-lg shadow-brand-start/20">
          {initials}
        </div>
        <div className="hidden sm:flex flex-col items-start">
          <span className="text-sm font-medium text-slate-200 max-w-[120px] truncate">
            {displayName}
          </span>
        </div>
        <ChevronDown 
          size={16} 
          className={`text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-surface border border-border rounded-xl shadow-2xl shadow-black/50 overflow-hidden animate-fade-in-up z-50">
          <div className="px-4 py-3 border-b border-border bg-surfaceHighlight/50">
            <p className="text-sm font-semibold text-white truncate">{displayName}</p>
            <p className="text-xs text-slate-400 truncate">{userEmail}</p>
          </div>

          <div className="py-2">
            <button
              onClick={() => {
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:bg-surfaceHighlight hover:text-white transition-colors"
            >
              <User size={16} className="text-slate-400" />
              Editar Perfil
            </button>

            <button
              onClick={() => {
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:bg-surfaceHighlight hover:text-white transition-colors"
            >
              <CreditCard size={16} className="text-slate-400" />
              Planos
            </button>

            <button
              onClick={() => {
                onOpenSettings();
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:bg-surfaceHighlight hover:text-white transition-colors"
            >
              <Settings size={16} className="text-slate-400" />
              Customizações
            </button>
          </div>

          <div className="border-t border-border py-2">
            <button
              onClick={() => {
                onLogout();
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
            >
              <LogOut size={16} />
              Sair da Conta
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserMenu;
