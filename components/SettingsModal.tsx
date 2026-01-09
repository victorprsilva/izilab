import React, { useState } from 'react';
import { X, Plus, Trash2, Check } from 'lucide-react';
import { CustomAbbreviation } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  abbreviations: CustomAbbreviation[];
  setAbbreviations: (abbr: CustomAbbreviation[]) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, abbreviations, setAbbreviations }) => {
  const [examName, setExamName] = useState('');
  const [abbr, setAbbr] = useState('');

  if (!isOpen) return null;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!examName.trim() || !abbr.trim()) return;

    const newAbbr: CustomAbbreviation = {
      id: Date.now().toString(),
      examName: examName.trim(),
      abbreviation: abbr.trim().toUpperCase()
    };

    const updated = [...abbreviations, newAbbr];
    setAbbreviations(updated);
    // Salva automaticamente no localStorage
    localStorage.setItem('seo_custom_abbreviations', JSON.stringify(updated));
    
    setExamName('');
    setAbbr('');
  };

  const handleDelete = (id: string) => {
    const updated = abbreviations.filter(item => item.id !== id);
    setAbbreviations(updated);
    // Salva automaticamente no localStorage
    localStorage.setItem('seo_custom_abbreviations', JSON.stringify(updated));
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-surface rounded-2xl shadow-2xl shadow-black border border-border w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-surfaceHighlight">
          <h2 className="text-lg font-bold text-slate-100">Customizar Abreviações</h2>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex-grow overflow-y-auto">
          <p className="text-sm text-slate-400 mb-6">
            Adicione exames específicos que você usa frequentemente. A IA usará essas siglas prioritariamente.
          </p>

          <form onSubmit={handleAdd} className="flex gap-2 mb-8 items-end">
            <div className="flex-grow space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase">Nome do Exame</label>
              <input 
                type="text" 
                placeholder="Ex: Hemoglobina Glicada"
                value={examName}
                onChange={(e) => setExamName(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border text-slate-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-start placeholder-slate-600"
              />
            </div>
            <div className="w-24 space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase">Sigla</label>
              <input 
                type="text" 
                placeholder="HBA1C"
                value={abbr}
                onChange={(e) => setAbbr(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border text-slate-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-start uppercase placeholder-slate-600"
              />
            </div>
            <button 
              type="submit"
              disabled={!examName || !abbr}
              className="px-4 py-2 bg-brand-start text-white rounded-lg hover:bg-brand-end disabled:opacity-50 disabled:cursor-not-allowed transition-colors h-[38px] flex items-center justify-center"
            >
              <Plus size={20} />
            </button>
          </form>

          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Suas Regras</h3>
            {abbreviations.length === 0 ? (
              <div className="text-center py-8 border border-dashed border-border rounded-xl bg-surfaceHighlight/50 text-slate-500 text-sm">
                Nenhuma abreviação customizada.
              </div>
            ) : (
              <div className="space-y-2">
                {abbreviations.map(item => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-surfaceHighlight border border-border rounded-lg shadow-sm group hover:border-brand-start/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-slate-200">{item.examName}</span>
                      <span className="text-slate-500">→</span>
                      <span className="font-bold text-brand-start bg-brand-start/10 px-2 py-0.5 rounded text-xs border border-brand-start/20">{item.abbreviation}</span>
                    </div>
                    <button 
                      onClick={() => handleDelete(item.id)}
                      className="text-slate-500 hover:text-red-400 transition-colors p-1"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border bg-surfaceHighlight flex justify-between items-center">
          <span className="text-xs text-slate-400 italic flex items-center gap-1">
            <Check size={14} className="text-green-500" />
            Salvo automaticamente
          </span>
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors font-medium text-sm"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;