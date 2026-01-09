
import React, { useState } from 'react';
import { X, Send, MessageSquare } from 'lucide-react';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose }) => {
  const [message, setMessage] = useState('');

  if (!isOpen) return null;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    
    const recipient = "matheusrabahi@gmail.com";
    const subject = encodeURIComponent("Feedback - Plataforma IZI LAB");
    const body = encodeURIComponent(message);
    
    // Trigger the default email client
    window.location.href = `mailto:${recipient}?subject=${subject}&body=${body}`;
    
    // Close modal and reset
    onClose();
    setMessage('');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-surface rounded-2xl shadow-2xl shadow-black border border-border w-full max-w-lg overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-surfaceHighlight">
          <div className="flex items-center gap-2 text-slate-100">
            <MessageSquare size={20} className="text-brand-start" />
            <h2 className="text-lg font-bold">Enviar Feedback</h2>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSend} className="p-6 flex flex-col gap-4">
          <p className="text-sm text-slate-400">
            Encontrou um erro ou tem uma sugestão? Sua mensagem será enviada diretamente para o desenvolvedor.
          </p>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase">Sua Mensagem</label>
            <textarea
              required
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Descreva sua sugestão ou reporte um problema..."
              className="w-full h-32 px-4 py-3 bg-background border border-border text-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-start placeholder-slate-600 resize-none"
            />
          </div>

          <div className="flex justify-end pt-2">
            <button 
              type="submit"
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-brand-start to-brand-end hover:from-brand-600 hover:to-brand-700 text-white rounded-xl font-bold shadow-lg shadow-brand-start/20 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>Enviar por E-mail</span>
              <Send size={16} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FeedbackModal;