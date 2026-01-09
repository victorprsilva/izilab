import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Mail, Camera, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { authService, UserProfile } from '../services/authService';
import Logo from '../components/Logo';

interface ProfilePageProps {
  session: { user: { id: string; email: string } } | null;
  userProfile: UserProfile | null;
  onProfileUpdate: (profile: UserProfile) => void;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ session, userProfile, onProfileUpdate }) => {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState(userProfile?.full_name || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (userProfile?.full_name) {
      setFullName(userProfile.full_name);
    }
  }, [userProfile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user?.id) return;

    setIsLoading(true);
    setError('');
    setSuccess(false);

    const { error: updateError } = await authService.updateProfile(session.user.id, {
      full_name: fullName.trim(),
    });

    if (updateError) {
      setError(updateError.message);
      setIsLoading(false);
      return;
    }

    if (userProfile) {
      onProfileUpdate({ ...userProfile, full_name: fullName.trim() });
    }

    setSuccess(true);
    setIsLoading(false);

    setTimeout(() => setSuccess(false), 3000);
  };

  const initials = (fullName || session?.user?.email?.split('@')[0] || 'U')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="min-h-screen flex flex-col font-sans bg-background text-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-surface/80 backdrop-blur-md border-b border-border shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <button 
            onClick={() => navigate('/')} 
            className="hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-brand-start rounded-xl p-1 -ml-1"
            title="Voltar ao início"
          >
            <Logo />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex flex-col items-center p-4 sm:p-6 lg:p-8 relative overflow-hidden">
        {/* Background Ambient Glow */}
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-brand-start/10 blur-[120px] rounded-full pointer-events-none"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-brand-end/10 blur-[120px] rounded-full pointer-events-none"></div>

        <div className="w-full max-w-2xl relative z-10">
          {/* Back Button */}
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft size={18} />
            <span className="text-sm font-medium">Voltar</span>
          </button>

          {/* Page Title */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white">Editar Perfil</h1>
            <p className="text-slate-400 mt-2">Atualize suas informações pessoais</p>
          </div>

          {/* Profile Card */}
          <div className="bg-surface/50 backdrop-blur-xl border border-border rounded-2xl overflow-hidden">
            {/* Avatar Section */}
            <div className="bg-gradient-to-r from-brand-start/20 to-brand-end/20 p-8 flex flex-col items-center border-b border-border">
              <div className="relative group">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-brand-start to-brand-end flex items-center justify-center text-white font-bold text-2xl shadow-xl shadow-brand-start/30">
                  {initials}
                </div>
                <button className="absolute bottom-0 right-0 w-8 h-8 bg-surface border border-border rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-surfaceHighlight transition-colors shadow-lg">
                  <Camera size={14} />
                </button>
              </div>
              <p className="mt-4 text-white font-semibold">{fullName || 'Seu Nome'}</p>
              <p className="text-slate-400 text-sm">{session?.user?.email}</p>
            </div>

            {/* Form Section */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Full Name */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Nome Completo
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 group-focus-within:text-brand-start transition-colors">
                    <User size={18} />
                  </div>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => {
                      setFullName(e.target.value);
                      setError('');
                      setSuccess(false);
                    }}
                    className="w-full bg-background/50 border border-border focus:ring-brand-start/20 focus:border-brand-start rounded-xl py-3 pl-10 pr-4 text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-4 transition-all"
                    placeholder="Seu nome completo"
                  />
                </div>
              </div>

              {/* Email (Read-only) */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Email
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Mail size={18} />
                  </div>
                  <input
                    type="email"
                    value={session?.user?.email || ''}
                    disabled
                    className="w-full bg-background/30 border border-border rounded-xl py-3 pl-10 pr-4 text-slate-400 cursor-not-allowed"
                  />
                </div>
                <p className="text-xs text-slate-500">O email não pode ser alterado</p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}

              {/* Success Message */}
              {success && (
                <div className="flex items-center gap-2 text-green-400 text-sm bg-green-500/10 border border-green-500/20 rounded-lg px-4 py-3">
                  <CheckCircle2 size={16} />
                  <span>Perfil atualizado com sucesso!</span>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading || !fullName.trim()}
                className="w-full bg-gradient-to-r from-brand-start to-brand-end hover:from-brand-600 hover:to-brand-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-brand-start/20 hover:shadow-brand-start/40 transform transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Salvando...
                  </>
                ) : (
                  'Salvar Alterações'
                )}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProfilePage;
