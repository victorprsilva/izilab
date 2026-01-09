
import React, { useState, useEffect, Suspense, useCallback } from 'react';
import { AnalysisState, AnalyzedExam, CustomAbbreviation, AnalysisPreferences } from './types';
import { analyzeLabExam } from './services/geminiService';
import { authService, UserProfile } from './services/authService';
import Logo from './components/Logo';
import FileUpload from './components/FileUpload';
import BloodLoader from './components/BloodLoader';
import AuthScreen from './components/auth/AuthScreen';
import UserMenu from './components/UserMenu';
import { Lock, FileText, CheckCircle2, Play, Trash2, File as FileIcon, Zap, MessageSquare } from 'lucide-react';
import type { Session } from '@supabase/supabase-js';

// Lazy load heavy components for better performance
const ResultDisplay = React.lazy(() => import('./components/ResultDisplay'));
const SettingsModal = React.lazy(() => import('./components/SettingsModal'));
const FeedbackModal = React.lazy(() => import('./components/FeedbackModal'));

const App: React.FC = () => {
  // Authentication State
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  // App Logic State
  const [state, setState] = useState<AnalysisState>({
    status: 'idle',
    data: null,
  });
  const [queuedFiles, setQueuedFiles] = useState<File[]>([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [customAbbreviations, setCustomAbbreviations] = useState<CustomAbbreviation[]>([]);
  
  // New Preferences State
  const [preferences, setPreferences] = useState<AnalysisPreferences>({
    showReferenceValues: false,
    groupDates: false
  });

  // Check authentication on mount and listen for auth changes
  useEffect(() => {
    // Get initial session
    authService.getSession().then(({ session }) => {
      setSession(session);
      setIsAuthChecking(false);
    });

    // Listen for auth state changes
    const { data: { subscription } } = authService.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch user profile when session changes
  useEffect(() => {
    if (session?.user?.id) {
      authService.getProfile(session.user.id).then(({ profile }) => {
        setUserProfile(profile);
      });
    } else {
      setUserProfile(null);
    }
  }, [session]);

  // Load settings on mount
  useEffect(() => {
    const saved = localStorage.getItem('seo_custom_abbreviations');
    if (saved) {
      try {
        setCustomAbbreviations(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse settings", e);
      }
    }
  }, []);

  const handleAuthSuccess = () => {
    // Session will be updated automatically via onAuthStateChange
  };

  const handleLogout = async () => {
    await authService.signOut();
    setSession(null);
    handleReset();
  };

  // Centralized function to handle analysis (Files, Text, or Audio)
  const processAnalysis = async (input: File[] | Blob | string, existingData: AnalyzedExam[] | null = null) => {
    setState({ status: 'analyzing', data: existingData }); 

    const resultComponentPromise = import('./components/ResultDisplay');

    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const newResultsArray = await analyzeLabExam(input, customAbbreviations, preferences);
      
      let finalData: AnalyzedExam[] = [];

      // Merge logic: Just append new findings to existing findings
      if (existingData) {
        finalData = [...existingData, ...newResultsArray];
      } else {
        finalData = newResultsArray;
      }
      
      await resultComponentPromise;

      setState({ status: 'success', data: finalData });
      // Clear queue only if input was files
      if (Array.isArray(input)) {
        setQueuedFiles([]); 
      }
    } catch (error: any) {
      setState({ 
        status: 'error', 
        data: null, 
        error: error.message || "Ocorreu um erro desconhecido ao processar o exame." 
      });
    }
  };

  // Add files to queue instead of processing immediately
  const handleFileSelect = (files: File[]) => {
    setQueuedFiles((prev) => [...prev, ...files]);
  };

  // Handle immediate text submission
  const handleTextSubmit = (text: string) => {
    processAnalysis(text, state.data);
  };
  
  // Handle immediate audio submission
  const handleAudioSubmit = (audioBlob: Blob) => {
    processAnalysis(audioBlob, state.data);
  };

  // Remove file from queue
  const handleRemoveFile = (indexToRemove: number) => {
    setQueuedFiles((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  // Start processing the queued files
  const handleStartProcessing = () => {
    if (queuedFiles.length === 0) return;
    processAnalysis(queuedFiles, null);
  };

  // Handle adding more files from the result screen
  const handleAddFilesFromResult = async (files: File[]) => {
    if (state.data) {
      await processAnalysis(files, state.data);
    }
  };

  // Optimized remove handler using functional update and useCallback
  const handleRemoveExam = useCallback((id: string) => {
    setState(prev => {
        if (!prev.data) return prev;
        
        const newData = prev.data.filter(item => item.id !== id);
        
        if (newData.length === 0) {
            return { ...prev, status: 'idle', data: null };
        }
        
        return { ...prev, data: newData };
    });
  }, []);

  const handleReset = useCallback(() => {
    setState({ status: 'idle', data: null });
    setQueuedFiles([]);
  }, []);

  // Render Logic
  if (isAuthChecking) return null; // Or a minimal loading spinner

  if (!session) {
    return <AuthScreen onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    <div className="min-h-screen flex flex-col font-sans bg-background text-slate-100 selection:bg-brand-start selection:text-white">
      
      {/* Navbar */}
      <header className="sticky top-0 z-50 bg-surface/80 backdrop-blur-md border-b border-border shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <button 
            onClick={handleReset} 
            className="hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-brand-start rounded-xl p-1 -ml-1"
            title="Voltar ao início"
          >
            <Logo />
          </button>
          
          <div className="flex items-center gap-3 md:gap-4">
            <UserMenu
              userName={userProfile?.full_name || null}
              userEmail={session?.user?.email || ''}
              onLogout={handleLogout}
              onOpenSettings={() => setIsSettingsOpen(true)}
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden">
        
        {/* Background Ambient Glow */}
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-brand-start/10 blur-[120px] rounded-full pointer-events-none"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-brand-end/10 blur-[120px] rounded-full pointer-events-none"></div>

        {state.status === 'idle' && (
          <div className="w-full max-w-4xl flex flex-col items-center text-center animate-fade-in space-y-8 relative z-10">
            
            {/* Hero Text */}
            {queuedFiles.length === 0 && (
              <div className="space-y-6 max-w-2xl mb-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-start/10 border border-brand-start/20 text-brand-start text-xs font-semibold uppercase tracking-wider mb-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-start opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-start"></span>
                  </span>
                  Inteligência Híbrida Ativa
                </div>
                <h1 className="text-5xl md:text-6xl font-extrabold text-white tracking-tight leading-tight">
                  Organização instantânea <br/>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-start via-brand-glow to-brand-end">
                    de exames com IZI
                  </span>
                </h1>
                <p className="text-lg text-slate-400 leading-relaxed max-w-xl mx-auto">
                  Desenvolvido exclusivo para Mentorados da Inteligência Híbrida
                </p>
              </div>
            )}

            {/* Feature Pills (Hide when files are queued to clean up UI) */}
            {queuedFiles.length === 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-3xl">
                {/* Speed Card - Replaces Upload Multiple */}
                <div className="group bg-surface/50 backdrop-blur-sm p-5 rounded-2xl border border-border flex flex-col items-center gap-3 hover:border-brand-start/30 transition-all duration-500 hover:bg-surfaceHighlight/50 hover:shadow-2xl hover:shadow-brand-start/10">
                  <div className="p-3 bg-brand-start/10 text-brand-start rounded-xl group-hover:scale-110 group-hover:bg-brand-start/20 group-hover:text-yellow-400 transition-all duration-500 ease-out shadow-lg shadow-brand-start/0 group-hover:shadow-brand-start/40">
                    <Zap size={24} className="group-hover:fill-current transition-all duration-500" />
                  </div>
                  <h3 className="font-semibold text-slate-200 group-hover:text-white transition-colors duration-300">Anotação Acelerada</h3>
                  <p className="text-xs text-slate-500 group-hover:text-slate-400 transition-colors duration-300">Resumos automáticos e precisos</p>
                </div>

                {/* Privacy Card */}
                <div className="group bg-surface/50 backdrop-blur-sm p-5 rounded-2xl border border-border flex flex-col items-center gap-3 hover:border-brand-end/30 transition-all duration-500 hover:bg-surfaceHighlight/50 hover:shadow-2xl hover:shadow-brand-end/10">
                  <div className="p-3 bg-brand-end/10 text-brand-end rounded-xl group-hover:scale-110 group-hover:bg-brand-end/20 group-hover:text-violet-300 transition-all duration-500 ease-out shadow-lg shadow-brand-end/0 group-hover:shadow-brand-end/40">
                    <Lock size={24} className="group-hover:rotate-12 transition-transform duration-500 cubic-bezier(0.34, 1.56, 0.64, 1)"/>
                  </div>
                  <h3 className="font-semibold text-slate-200 group-hover:text-white transition-colors duration-300">Anonimização</h3>
                  <p className="text-xs text-slate-500 group-hover:text-slate-400 transition-colors duration-300">Proteção total dos dados</p>
                </div>

                {/* Result Card */}
                <div className="group bg-surface/50 backdrop-blur-sm p-5 rounded-2xl border border-border flex flex-col items-center gap-3 hover:border-green-500/30 transition-all duration-500 hover:bg-surfaceHighlight/50 hover:shadow-2xl hover:shadow-green-500/10">
                  <div className="p-3 bg-green-500/10 text-green-500 rounded-xl group-hover:scale-110 group-hover:bg-green-500/20 group-hover:text-green-300 transition-all duration-500 ease-out shadow-lg shadow-green-500/0 group-hover:shadow-green-500/40">
                    <CheckCircle2 size={24} className="group-hover:scale-110 transition-transform duration-500"/>
                  </div>
                  <h3 className="font-semibold text-slate-200 group-hover:text-white transition-colors duration-300">Resultado</h3>
                  <p className="text-xs text-slate-500 group-hover:text-slate-400 transition-colors duration-300">HB 9.5 / UR 45 (Padronizado)</p>
                </div>
              </div>
            )}

            <FileUpload 
              onFileSelect={handleFileSelect} 
              onTextSubmit={handleTextSubmit}
              onAudioSubmit={handleAudioSubmit}
              preferences={preferences}
              onUpdatePreferences={setPreferences}
            />

            {/* File Queue List */}
            {queuedFiles.length > 0 && (
              <div className="w-full max-w-2xl bg-surface rounded-2xl border border-border overflow-hidden animate-fade-in-up">
                <div className="bg-surfaceHighlight px-4 py-3 border-b border-border flex justify-between items-center">
                  <span className="text-sm font-semibold text-slate-300">
                    Arquivos Selecionados ({queuedFiles.length})
                  </span>
                  <button 
                    onClick={() => setQueuedFiles([])}
                    className="text-xs text-red-400 hover:text-red-300 hover:underline"
                  >
                    Limpar tudo
                  </button>
                </div>
                <div className="max-h-60 overflow-y-auto p-2 space-y-2">
                  {queuedFiles.map((file, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-background rounded-lg border border-border group hover:border-brand-start/30 transition-colors">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="p-2 bg-slate-800 rounded-lg text-slate-400">
                          <FileIcon size={18} />
                        </div>
                        <div className="flex flex-col text-left overflow-hidden">
                          <span className="text-sm font-medium text-slate-200 truncate max-w-[200px] sm:max-w-xs">{file.name}</span>
                          <span className="text-xs text-slate-500">{(file.size / 1024).toFixed(0)} KB</span>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleRemoveFile(idx)}
                        className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                        title="Remover arquivo"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="p-4 bg-surfaceHighlight/50 border-t border-border">
                  <button
                    onClick={handleStartProcessing}
                    className="w-full py-4 bg-gradient-to-r from-brand-start to-brand-end hover:from-brand-600 hover:to-brand-700 text-white rounded-xl font-bold text-lg shadow-lg shadow-brand-start/20 hover:shadow-brand-start/40 transform hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                  >
                    <Play size={24} fill="currentColor" />
                    Organizar Exames Agora
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {state.status === 'analyzing' && (
          <div className="flex flex-col items-center justify-center space-y-6 text-center w-full max-w-md relative z-10">
            <div className="relative w-full py-12">
               <div className="absolute inset-0 bg-brand-start/5 blur-3xl rounded-full"></div>
               <BloodLoader />
            </div>
            <div className="space-y-2 relative z-10">
              <h2 className="text-xl font-bold text-white">Processando com IZI LAB...</h2>
              <p className="text-sm text-slate-400">
                {state.data ? "Adicionando novos exames à lista..." : "Extraindo dados, verificando idade, organizando datas..."}
              </p>
            </div>
          </div>
        )}

        {state.status === 'success' && state.data && (
           <Suspense fallback={<div className="h-96 w-full animate-pulse bg-surface rounded-2xl" />}>
              <div className="relative z-10 w-full">
                <ResultDisplay 
                  data={state.data} 
                  onReset={handleReset} 
                  onAddFiles={handleAddFilesFromResult}
                  onRemoveExam={handleRemoveExam}
                />
              </div>
           </Suspense>
        )}

        {state.status === 'error' && (
          <div className="max-w-md w-full bg-surface p-8 rounded-2xl shadow-xl border border-red-500/30 text-center space-y-4 relative z-10">
             <div className="w-16 h-16 bg-red-900/20 rounded-full flex items-center justify-center mx-auto text-red-500 mb-4 border border-red-500/20">
               <FileText size={32} />
             </div>
             <h3 className="text-xl font-bold text-white">Não foi possível ler o exame</h3>
             <p className="text-slate-400">{state.error}</p>
             <button 
               onClick={handleReset}
               className="mt-6 w-full py-3 bg-white text-black rounded-xl font-bold hover:bg-slate-200 transition-colors"
             >
               Tentar Novamente
             </button>
          </div>
        )}

      </main>

      {/* Modals (Lazy Loaded) */}
      <Suspense fallback={null}>
        <SettingsModal 
          isOpen={isSettingsOpen} 
          onClose={() => setIsSettingsOpen(false)}
          abbreviations={customAbbreviations}
          setAbbreviations={setCustomAbbreviations}
        />
        <FeedbackModal 
          isOpen={isFeedbackOpen}
          onClose={() => setIsFeedbackOpen(false)}
        />
      </Suspense>

      {/* Footer */}
      <footer className="py-8 bg-surface border-t border-border mt-auto relative z-20">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6 text-center md:text-left">
          
          <div className="flex flex-col gap-2 items-center md:items-start">
            <div>
              <p className="text-slate-300 font-semibold">App da HybridApps</p>
              <p className="text-slate-500 text-sm">Powered by IZI LAB</p>
            </div>
            <button 
              onClick={() => setIsFeedbackOpen(true)}
              className="mt-1 flex items-center gap-2 text-xs font-semibold text-brand-start hover:text-brand-end transition-colors bg-brand-start/10 hover:bg-brand-start/20 px-3 py-1.5 rounded-full border border-brand-start/20"
            >
              <MessageSquare size={12} />
              Enviar Feedback / Reportar Erro
            </button>
          </div>

          <div className="flex flex-col gap-1 items-center md:items-end">
            <p className="text-slate-400 text-xs uppercase tracking-wide">Responsável Técnico</p>
            <p className="text-slate-200 font-medium text-sm">Dr Matheus Rabahi <span className="text-brand-start">CRM 26108 RQE 19855</span></p>
            <p className="text-slate-500 text-xs">Goiânia - GO, Brasil</p>
          </div>

        </div>
      </footer>
    </div>
  );
};

export default App;