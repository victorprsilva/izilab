
import React, { useState, useRef, memo } from 'react';
import { AnalyzedExam, LabResultItem } from '../types';
import { Copy, CheckCheck, RefreshCw, ScanEye, ArrowLeft, AlertTriangle, ChevronDown, ChevronUp, FilePlus, User, Trash2, XCircle, Download, MessageSquare, FileText, Stethoscope, AlignJustify, Grid } from 'lucide-react';

interface ResultDisplayProps {
  data: AnalyzedExam[];
  onReset: () => void;
  onAddFiles: (files: File[]) => void;
  onRemoveExam: (id: string) => void;
}

// System Categorization Map (For Labs)
const SYSTEM_CATEGORIES: Record<string, string[]> = {
  'HEMOGRAMA': ['Hb', 'Ht', 'VCM', 'HCM', 'CHCM', 'RDW', 'Leuco', 'Neut', 'Linf', 'Mono', 'Eos', 'Plq', 'MPV'],
  'RENAL': ['Ur', 'Cr', 'Cist-C'],
  'ELETRÓLITOS': ['Na', 'K', 'Ca', 'Mg', 'P', 'Cl', 'Cálcio Ion'],
  'METABÓLICO': ['Glic', 'HbA1c', 'Homa-IR', 'Insul', 'Lac', 'Lactato'],
  'LIPIDOGRAMA': ['Col-T', 'HDL', 'LDL', 'TG', 'VLDL'],
  'HEPÁTICO': ['TGO', 'TGP', 'GGT', 'FA', 'Bil-T', 'Bil-D', 'Bil-I', 'Albumina', 'Proteínas'],
  'HORMONAL': ['TSH', 'T4L', 'T3', 'Vit-D', 'Vit-B12', 'PTH', 'Cortisol'],
  'INFLAMATÓRIO': ['PCR', 'VHS', 'Ferr', 'Fibrin', 'Proc'],
  'CARDÍACO': ['Trop', 'CK-MB', 'BNP', 'CK'],
  'GASOMETRIA': ['pH', 'pO2', 'pCO2', 'HCO3', 'BE', 'SatO2'],
  'URINA': ['EAS', 'Leuco-U', 'Hem-U', 'Prot-U'],
};

// Helper to determine category for an abbreviation
const getCategory = (abbr: string): string => {
  for (const [category, items] of Object.entries(SYSTEM_CATEGORIES)) {
    if (items.includes(abbr)) return category;
  }
  return 'OUTROS';
};

// Excel Export Helper
const downloadExcel = (exam: AnalyzedExam) => {
    let htmlContent = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
            <meta charset="UTF-8">
            <style>
                table { border-collapse: collapse; width: 100%; }
                th, td { border: 1px solid #000; padding: 5px; text-align: left; }
                .abnormal { color: red; font-weight: bold; }
            </style>
        </head>
        <body>
            <h3>${exam.patientInitials} - ${exam.category === 'NON_LAB' ? exam.nonLabData?.examTitle : 'Exame Laboratorial'} - ${exam.collectionDate || 'Data N/A'}</h3>
    `;

    if (exam.category === 'LAB') {
        htmlContent += `
            <table>
                <thead>
                    <tr>
                        <th>Exame</th>
                        <th>Resultado</th>
                        <th>Referência</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
        `;
        exam.results.forEach(res => {
            const isAbnormal = res.abnormality !== 'NORMAL';
            const classStr = isAbnormal ? 'class="abnormal"' : '';
            htmlContent += `
                <tr>
                    <td>${res.abbreviation}</td>
                    <td ${classStr}>${res.value}</td>
                    <td>${res.referenceRange || '-'}</td>
                    <td ${classStr}>${res.abnormality}</td>
                </tr>
            `;
        });
        htmlContent += `</tbody></table>`;
    } else {
        // Excel format for Non-Lab
        htmlContent += `
            <h4>Título: ${exam.nonLabData?.examTitle || 'Laudo'}</h4>
            <h5>Achados Principais:</h5>
            <ul>
                ${exam.nonLabData?.mainFindings.map(f => `<li>${f}</li>`).join('')}
            </ul>
            <h5>Conclusão:</h5>
            <p>${exam.nonLabData?.impression || ''}</p>
        `;
    }

    htmlContent += `</body></html>`;

    const blob = new Blob([htmlContent], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${exam.patientInitials}_${exam.category}_${exam.collectionDate?.replace(/\//g, '-') || 'Data'}.xls`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
};

// Feedback Helper
const sendFeedback = () => {
    const recipient = "matheusrabahi@gmail.com";
    const subject = encodeURIComponent("Feedback sobre o uso do IZI LAB");
    const body = encodeURIComponent("Olá, gostaria de reportar o seguinte sobre o IZI LAB:");
    window.location.href = `mailto:${recipient}?subject=${subject}&body=${body}`;
};

// Memoized Patient Card for optimized rendering
const PatientCard: React.FC<{ exam: AnalyzedExam; onRemove: (id: string) => void; isLeanMode: boolean }> = memo(({ exam, onRemove, isLeanMode }) => {
    const [copiedSummary, setCopiedSummary] = useState(false);
    const [copiedAbnormal, setCopiedAbnormal] = useState(false);
    const [showAbnormal, setShowAbnormal] = useState(false);

    // Error State
    const isError = (!exam.results || exam.results.length === 0) && (!exam.nonLabData);

    // Format Date
    const today = new Date();
    const dateStr = exam.collectionDate || `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}`;

    // --- LOGIC GENERATION ---
    let fullClipboardText = "";
    let abnormalClipboardText = "";
    let hasAbnormal = false;

    if (exam.category === 'LAB') {
        const abnormalResults = exam.results.filter(
            (item) => item.abnormality === 'HIGH' || item.abnormality === 'LOW'
        );
        hasAbnormal = abnormalResults.length > 0;

        const groupedResults: Record<string, LabResultItem[]> = {};
        const categoriesOrder = [...Object.keys(SYSTEM_CATEGORIES), 'OUTROS'];

        exam.results.forEach(item => {
            const cat = getCategory(item.abbreviation);
            if (!groupedResults[cat]) groupedResults[cat] = [];
            groupedResults[cat].push(item);
        });

        const formatValue = (val: string) => val.replace(/\./g, ',');
        let fullTextBody = "";
        
        categoriesOrder.forEach(cat => {
            if (groupedResults[cat] && groupedResults[cat].length > 0) {
                const lineItems = groupedResults[cat]
                    .map(item => {
                        const ref = item.referenceRange ? ` (Ref: ${item.referenceRange})` : '';
                        return `${item.abbreviation} ${formatValue(item.value)}${ref}`;
                    })
                    .join(' / ');
                
                const prefix = cat === 'OUTROS' ? '' : `${cat}: `;
                fullTextBody += `${prefix}${lineItems}\n`;
            }
        });
        fullClipboardText = `${exam.patientInitials} - Lab (${dateStr}):\n${fullTextBody.trim()}`;

        const abnormalFormattedText = abnormalResults
            .map(item => {
            const arrow = item.abnormality === 'HIGH' ? '↑' : '↓';
            return `${item.abbreviation} ${formatValue(item.value)} ${arrow}`;
            })
            .join(' / ');
        abnormalClipboardText = `${exam.patientInitials} - Lab (${dateStr}) - ALTERAÇÕES: ${abnormalFormattedText}`;

    } else {
        // NON_LAB Logic
        const title = exam.nonLabData?.examTitle || "Laudo Médico";
        const findings = exam.nonLabData?.mainFindings.map(f => `• ${f}`).join('\n') || "";
        const conclusion = exam.nonLabData?.impression || "";
        
        fullClipboardText = `${exam.patientInitials} - ${title} (${dateStr}):\n\nACHADOS:\n${findings}\n\nCONCLUSÃO:\n${conclusion}`;
        hasAbnormal = false; // We don't use the standard alteration box for reports, as everything is important
    }

    const handleCopySummary = () => {
        navigator.clipboard.writeText(fullClipboardText).then(() => {
        setCopiedSummary(true);
        setTimeout(() => setCopiedSummary(false), 2000);
        });
    };

    const handleCopyAbnormal = () => {
        navigator.clipboard.writeText(abnormalClipboardText).then(() => {
        setCopiedAbnormal(true);
        setTimeout(() => setCopiedAbnormal(false), 2000);
        });
    };

    if (isError) {
        return (
            <div className={`bg-surface rounded-2xl shadow-xl border border-red-500/30 overflow-hidden animate-fade-in-up ${isLeanMode ? 'mb-4' : 'mb-8'}`}>
                <div className={`bg-red-900/10 flex items-center justify-between border-b border-red-500/20 ${isLeanMode ? 'p-3' : 'px-6 py-4'}`}>
                    <div className="flex items-center gap-3">
                        <div className="bg-red-500/10 text-red-500 rounded-lg w-8 h-8 flex items-center justify-center shrink-0">
                            <XCircle size={isLeanMode ? 18 : 24} />
                        </div>
                        <div>
                            <h3 className={`text-red-200 font-semibold ${isLeanMode ? 'text-sm' : 'text-lg'}`}>Leitura Falhou</h3>
                            {!isLeanMode && <p className="text-red-400 text-xs">Arquivo não reconhecido.</p>}
                        </div>
                    </div>
                    <button onClick={() => onRemove(exam.id)} className="p-2 text-red-400 hover:text-white hover:bg-red-500 rounded-lg transition-colors">
                        <Trash2 size={isLeanMode ? 16 : 20} />
                    </button>
                </div>
            </div>
        );
    }

    // --- LEAN MODE RENDER ---
    if (isLeanMode) {
        return (
            <div className="bg-surface rounded-xl border border-border overflow-hidden mb-3 animate-fade-in-up hover:border-brand-start/30 transition-all">
                {/* Lean Header */}
                <div className="bg-surfaceHighlight/50 px-4 py-2.5 flex items-center justify-between border-b border-border/50">
                    <div className="flex items-center gap-3 overflow-hidden">
                        <div className={`w-2 h-2 rounded-full shrink-0 ${exam.category === 'LAB' ? 'bg-brand-start shadow-[0_0_8px_rgba(59,130,246,0.8)]' : 'bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.8)]'}`}></div>
                        <h3 className="text-slate-200 font-bold text-sm truncate flex items-center gap-2">
                            {exam.patientInitials}
                            <span className="text-slate-500 font-normal text-xs">| {dateStr}</span>
                            <span className="text-slate-500 font-normal text-xs hidden sm:inline">| {exam.category === 'LAB' ? 'Laboratório' : (exam.nonLabData?.examTitle || 'Imagem')}</span>
                        </h3>
                    </div>
                    <button onClick={() => onRemove(exam.id)} className="text-slate-600 hover:text-red-400 transition-colors p-1">
                        <Trash2 size={14} />
                    </button>
                </div>

                {/* Lean Content */}
                <div className="p-4">
                     {/* LAB CONTENT */}
                    {exam.category === 'LAB' && (
                        <div className="font-mono text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                             {fullClipboardText.replace(`${exam.patientInitials} - Lab (${dateStr}):\n`, '')}
                        </div>
                    )}

                    {/* NON-LAB CONTENT */}
                    {exam.category === 'NON_LAB' && exam.nonLabData && (
                        <div className="text-sm space-y-3">
                             <div className="space-y-1">
                                {exam.nonLabData.mainFindings.map((finding, idx) => (
                                    <div key={idx} className="flex gap-2 text-slate-300 leading-snug">
                                        <span className="text-brand-start font-bold">•</span>
                                        <span>{finding}</span>
                                    </div>
                                ))}
                             </div>
                             {exam.nonLabData.impression && (
                                <div className="pl-3 border-l-2 border-brand-start/30 text-slate-400 italic">
                                    {exam.nonLabData.impression}
                                </div>
                             )}
                        </div>
                    )}
                </div>

                {/* Lean Footer - Only show alterations if they exist, no big buttons */}
                {exam.category === 'LAB' && hasAbnormal && (
                    <div className="bg-orange-950/10 px-4 py-2 border-t border-orange-500/10 flex items-start gap-2">
                         <AlertTriangle size={12} className="text-orange-500 mt-0.5 shrink-0" />
                         <p className="text-xs text-orange-300 font-mono leading-tight">
                            {abnormalClipboardText.replace(`${exam.patientInitials} - Lab (${dateStr}) - ALTERAÇÕES: `, '')}
                         </p>
                    </div>
                )}
            </div>
        )
    }

    // --- STANDARD MODE RENDER ---
    return (
        <div className="bg-surface rounded-2xl shadow-2xl shadow-black/50 border border-border overflow-hidden mb-8 animate-fade-in-up transition-all hover:border-brand-start/20" style={{ contentVisibility: 'auto', containIntrinsicSize: '0 300px' }}>
            {/* Header */}
            <div className="bg-gradient-to-r from-surfaceHighlight to-surface px-6 py-4 flex items-center justify-between border-b border-border">
                <div className="flex items-center gap-3">
                    <div className={`bg-gradient-to-br ${exam.category === 'LAB' ? 'from-brand-start to-brand-end' : 'from-purple-600 to-pink-600'} text-white font-bold rounded-lg w-10 h-10 flex items-center justify-center text-lg shadow-lg shrink-0`}>
                        {exam.patientInitials.substring(0, 2)}
                    </div>
                    <div>
                        <h3 className="text-white font-semibold text-lg tracking-wide flex items-center gap-2">
                            {exam.patientInitials} 
                            <span className="text-slate-500 text-sm font-normal flex items-center gap-1">
                                {exam.category === 'LAB' ? <Stethoscope size={14} /> : <ScanEye size={14} />}
                                - {exam.category === 'LAB' ? 'Laboratório' : (exam.nonLabData?.examTitle || 'Imagem/Laudo')} ({dateStr})
                            </span>
                        </h3>
                        {exam.patientAge && <p className="text-slate-400 text-sm font-medium">{exam.patientAge}</p>}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => downloadExcel(exam)}
                        className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-green-600/10 text-green-500 hover:bg-green-600/20 border border-green-600/20 rounded-lg text-xs font-bold uppercase transition-colors"
                        title="Baixar Excel"
                    >
                        <Download size={14} /> Excel
                    </button>
                    <button onClick={() => onRemove(exam.id)} className="text-slate-500 hover:text-red-400 transition-colors p-2 hover:bg-white/5 rounded-lg">
                        <Trash2 size={18} />
                    </button>
                </div>
            </div>

            {/* Content Body */}
            <div className="p-6 md:p-8">
                
                {/* RENDER FOR LAB EXAMS */}
                {exam.category === 'LAB' && (
                    <div className="mb-6">
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Resumo Laboratorial (Por Sistemas)</label>
                        <div className="bg-background rounded-xl p-5 border border-border font-mono text-slate-300 text-sm md:text-base leading-relaxed break-words shadow-inner max-h-[400px] overflow-y-auto custom-scrollbar whitespace-pre-wrap">
                            {fullClipboardText.replace(`${exam.patientInitials} - Lab (${dateStr}):\n`, '')}
                        </div>
                    </div>
                )}

                {/* RENDER FOR NON_LAB EXAMS */}
                {exam.category === 'NON_LAB' && exam.nonLabData && (
                    <div className="space-y-6">
                        {/* Findings */}
                        <div>
                            <label className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                                <FileText size={14} className="text-brand-start" /> Achados Principais
                            </label>
                            <div className="space-y-2">
                                {exam.nonLabData.mainFindings.length > 0 ? (
                                    exam.nonLabData.mainFindings.map((finding, idx) => (
                                        <div key={idx} className="flex gap-3 text-slate-300 text-sm md:text-base leading-relaxed p-2 rounded-lg hover:bg-surfaceHighlight/30 transition-colors">
                                            <span className="text-brand-start font-bold">•</span>
                                            <span>{finding}</span>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-slate-500 italic text-sm p-2">Nenhum achado específico destacado.</p>
                                )}
                            </div>
                        </div>

                        {/* Impression/Conclusion Box */}
                        <div className="bg-brand-start/5 border border-brand-start/20 rounded-xl overflow-hidden">
                            <div className="bg-brand-start/10 px-4 py-2 border-b border-brand-start/10 flex items-center gap-2">
                                <ScanEye size={16} className="text-brand-start" />
                                <span className="text-brand-start font-bold text-xs uppercase tracking-wide">Conclusão / Impressão</span>
                            </div>
                            <div className="p-4 text-slate-200 font-medium leading-relaxed">
                                {exam.nonLabData.impression || "Conclusão não detectada."}
                            </div>
                        </div>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 mt-6">
                     <button
                        onClick={sendFeedback}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors border border-transparent text-sm"
                        title="Reportar Erro"
                     >
                        <MessageSquare size={16} /> <span className="hidden sm:inline">Reportar</span>
                     </button>
                     <button
                        onClick={handleCopySummary}
                        className={`
                            flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-white shadow-lg transition-all transform hover:scale-105 active:scale-95 border border-transparent text-sm
                            ${copiedSummary ? 'bg-green-600 shadow-green-900/20' : 'bg-gradient-to-r from-brand-start to-brand-end hover:shadow-brand-start/20 hover:border-white/10'}
                        `}
                        >
                        {copiedSummary ? <CheckCheck size={18} className="animate-pop" /> : <Copy size={18} />}
                        {copiedSummary ? 'Copiado!' : 'Copiar Resumo'}
                    </button>
                </div>
            </div>

            {/* Alterations Section (ONLY FOR LAB) */}
            {exam.category === 'LAB' && (
                hasAbnormal ? (
                    <div className="border-t border-orange-500/20">
                        <button onClick={() => setShowAbnormal(!showAbnormal)} className="w-full flex items-center justify-between px-6 py-4 bg-orange-500/5 hover:bg-orange-500/10 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="p-1.5 bg-orange-500/20 text-orange-400 rounded-full border border-orange-500/20"><AlertTriangle size={16} /></div>
                                <div className="text-left"><h4 className="font-bold text-slate-300 text-sm">Exames Alterados Detectados</h4></div>
                            </div>
                            {showAbnormal ? <ChevronUp className="text-slate-500" /> : <ChevronDown className="text-slate-500" />}
                        </button>
                        
                        {showAbnormal && (
                            <div className="p-6 border-t border-orange-500/20 animate-fade-in bg-orange-950/5">
                                <div className="mb-4">
                                    <label className="block text-xs font-semibold text-orange-400 uppercase tracking-wider mb-2">Resumo de Alterações (Com Setas)</label>
                                    <div className="bg-background rounded-xl p-4 border border-orange-500/20 font-mono text-slate-300 text-base leading-relaxed break-words shadow-inner">
                                    {abnormalClipboardText.replace(`${exam.patientInitials} - Lab (${dateStr}) - ALTERAÇÕES: `, '')}
                                    </div>
                                </div>
                                <div className="flex justify-end">
                                    <button onClick={handleCopyAbnormal} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-white shadow-md transition-all transform hover:scale-105 active:scale-95 text-xs uppercase tracking-wide ${copiedAbnormal ? 'bg-green-600' : 'bg-orange-600 hover:bg-orange-700'}`}>
                                    {copiedAbnormal ? <CheckCheck size={16} className="animate-pop" /> : <Copy size={16} />}
                                    {copiedAbnormal ? 'Copiado!' : 'Copiar Alterações'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="bg-surfaceHighlight/30 px-6 py-3 border-t border-border flex items-center gap-2 text-slate-500 text-xs">
                        <CheckCheck size={14} className="text-green-500" /> Nenhuma alteração significativa.
                    </div>
                )
            )}
        </div>
    );
});

const ResultDisplay: React.FC<ResultDisplayProps> = ({ data, onReset, onAddFiles, onRemoveExam }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLeanMode, setIsLeanMode] = useState(false);

  const handleAddClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const validFiles = Array.from(files); 
      if (validFiles.length > 0) {
        onAddFiles(validFiles);
      }
    }
    if (event.target) event.target.value = '';
  };

  return (
    <div className="w-full max-w-4xl mx-auto animate-fade-in-up pb-24">
      <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="application/pdf,image/*" multiple />

      <div className="flex items-center justify-between mb-6 sticky top-20 z-40 bg-background/90 backdrop-blur-md py-4 border-b border-border/50">
        <button onClick={onReset} className="flex items-center gap-2 text-slate-400 hover:text-brand-start transition-colors text-sm font-medium group">
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" /> Voltar
        </button>

        <div className="flex items-center gap-2 sm:gap-3">
             
             {/* Lean Mode Toggle */}
             <button
                onClick={() => setIsLeanMode(!isLeanMode)}
                className={`
                    p-2 rounded-lg transition-colors border hidden sm:flex
                    ${isLeanMode 
                        ? 'bg-brand-start/20 text-brand-start border-brand-start/50' 
                        : 'bg-surfaceHighlight text-slate-400 border-transparent hover:text-slate-200'}
                `}
                title={isLeanMode ? "Voltar ao Modo Detalhado" : "Modo Leitura (Enxuto)"}
             >
                {isLeanMode ? <Grid size={18} /> : <AlignJustify size={18} />}
             </button>

             <button onClick={onReset} className="text-slate-500 hover:text-red-400 text-sm font-medium flex items-center gap-2 transition-colors px-3 py-2 rounded-lg hover:bg-red-500/10 border border-transparent hover:border-red-500/20" title="Limpar tudo">
                <RefreshCw size={16} /> <span className="hidden sm:inline">Limpar</span>
              </button>
              <button onClick={handleAddClick} className="text-brand-start hover:text-brand-end text-sm font-medium flex items-center gap-2 transition-colors px-3 py-2 rounded-lg bg-brand-start/5 border border-brand-start/20 hover:bg-brand-start/10" title="Adicionar mais arquivos">
                <FilePlus size={16} /> Adicionar
              </button>
        </div>
      </div>

      <div className="space-y-6">
          <div className="flex items-center justify-between text-slate-400 text-sm mb-4 px-2">
            <div className="flex items-center gap-2">
                <User size={16} />
                <span>{data.length} {data.length === 1 ? 'paciente identificado' : 'pacientes identificados'}</span>
            </div>
            
            {/* Mobile Lean Toggle (Visible only on small screens) */}
             <button
                onClick={() => setIsLeanMode(!isLeanMode)}
                className={`
                    flex sm:hidden items-center gap-1.5 text-xs font-medium transition-colors
                    ${isLeanMode ? 'text-brand-start' : 'text-slate-500'}
                `}
             >
                {isLeanMode ? <Grid size={14} /> : <AlignJustify size={14} />}
                {isLeanMode ? "Ver Detalhes" : "Modo Leitura"}
             </button>
          </div>
          
          <div className={isLeanMode ? "space-y-2" : "space-y-6"}>
            {data.map((exam) => (
                <PatientCard key={exam.id} exam={exam} onRemove={onRemoveExam} isLeanMode={isLeanMode} />
            ))}
          </div>
      </div>
    </div>
  );
};

export default ResultDisplay;
