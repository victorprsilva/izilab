
import React, { useCallback, useState, useRef, useEffect } from 'react';
import { UploadCloud, AlertCircle, Files, Type, ArrowRight, Clipboard, Mic, Camera, StopCircle, Settings2, ToggleLeft, ToggleRight, X, SwitchCamera, Check } from 'lucide-react';
import { AnalysisPreferences } from '../types';

interface FileUploadProps {
  onFileSelect: (files: File[]) => void;
  onTextSubmit: (text: string) => void;
  onAudioSubmit: (audioBlob: Blob) => void;
  preferences: AnalysisPreferences;
  onUpdatePreferences: (prefs: AnalysisPreferences) => void;
  disabled?: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({ 
  onFileSelect, 
  onTextSubmit, 
  onAudioSubmit,
  preferences,
  onUpdatePreferences,
  disabled 
}) => {
  const [activeTab, setActiveTab] = useState<'pdf' | 'text'>('pdf');
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [textInput, setTextInput] = useState('');
  
  // --- Audio State ---
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // --- Custom Camera State ---
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [photosTaken, setPhotosTaken] = useState<number>(0);
  const [usingFrontCamera, setUsingFrontCamera] = useState(false);

  // --- Fallback Inputs Refs ---
  const cameraFallbackInputRef = useRef<HTMLInputElement>(null);

  // --- Cleanup on unmount ---
  useEffect(() => {
    return () => {
      stopCameraStream();
    };
  }, []);

  // --- Handlers ---

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (disabled || activeTab !== 'pdf') return;
    setIsDragging(true);
  }, [disabled, activeTab]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const validateAndSelect = (fileList: File[]) => {
    const validFiles: File[] = [];
    
    for (const file of fileList) {
        // Accept PDF and Images
        if (!file.type.includes('pdf') && !file.type.includes('image/')) {
          setError('Apenas PDF ou Imagens (JPG/PNG).');
          return;
        }
        if (file.size > 15 * 1024 * 1024) { 
          setError(`Arquivo ${file.name} muito grande (Máx 15MB).`);
          return;
        }
        validFiles.push(file);
    }
    
    if (validFiles.length > 0) {
        setError(null);
        onFileSelect(validFiles);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled || activeTab !== 'pdf') return;

    const files = Array.from(e.dataTransfer.files) as File[];
    if (files.length > 0) validateAndSelect(files);
  }, [disabled, onFileSelect, activeTab]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSelect(Array.from(e.target.files) as File[]);
    }
    if(e.target) e.target.value = '';
  };

  const handleTextSubmit = () => {
    if (!textInput.trim()) {
      setError("Cole ou digite o texto.");
      return;
    }
    setError(null);
    onTextSubmit(textInput);
  };

  // --- Audio Logic ---
  const startRecording = async () => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        let mimeType = 'audio/webm';
        if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
            mimeType = 'audio/webm;codecs=opus';
        } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
            mimeType = 'audio/mp4';
        }

        const mediaRecorder = new MediaRecorder(stream, { mimeType });
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) audioChunksRef.current.push(event.data);
        };

        mediaRecorder.onstop = () => {
            const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
            onAudioSubmit(audioBlob);
            stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorder.start();
        setIsRecording(true);
        setError(null);
    } catch (err) {
        console.error(err);
        setError("Microfone indisponível. Verifique as permissões.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
        setIsRecording(false);
    }
  };

  // --- Camera Logic (Robust) ---
  const initCameraStream = async (useFront: boolean) => {
    try {
        const constraints = {
            video: { 
                facingMode: useFront ? 'user' : 'environment'
            }
        };
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        handleStreamSuccess(stream);
    } catch (err) {
        console.warn("Specific camera failed, trying generic...", err);
        // Fallback: try ANY video device without specific facingMode
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            handleStreamSuccess(stream);
        } catch (finalErr) {
            console.error("All camera access failed:", finalErr);
            // FINAL FALLBACK: Trigger Native Input
            setIsCameraOpen(false);
            setError("Acesso direto bloqueado pelo navegador. Abrindo câmera nativa...");
            setTimeout(() => {
                setError(null);
                cameraFallbackInputRef.current?.click();
            }, 1500);
        }
    }
  };

  const handleStreamSuccess = (stream: MediaStream) => {
    setCameraStream(stream);
    setIsCameraOpen(true);
    setPhotosTaken(0); // Reset count on new stream open only if desired, logic kept to session
    setError(null);
    setTimeout(() => {
        if (videoRef.current) {
            videoRef.current.srcObject = stream;
        }
    }, 100);
  };

  const startCamera = () => {
    setPhotosTaken(0); // Reset session photos
    initCameraStream(false); // Try back camera first
  };

  const switchCamera = () => {
      stopCameraStream();
      setUsingFrontCamera(!usingFrontCamera);
      initCameraStream(!usingFrontCamera);
  };

  const stopCameraStream = () => {
      if (cameraStream) {
          cameraStream.getTracks().forEach(track => track.stop());
          setCameraStream(null);
      }
      setIsCameraOpen(false);
  };

  const handleFinishCapture = () => {
      stopCameraStream();
      // Photos are already in queue via onFileSelect, closing modal reveals them.
  };

  const takePhoto = () => {
      if (videoRef.current && canvasRef.current) {
          const video = videoRef.current;
          const canvas = canvasRef.current;
          
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          
          const context = canvas.getContext('2d');
          if (context) {
              // Flip horizontally if front camera for natural mirror effect
              if (usingFrontCamera) {
                  context.translate(canvas.width, 0);
                  context.scale(-1, 1);
              }

              context.drawImage(video, 0, 0, canvas.width, canvas.height);
              
              canvas.toBlob((blob) => {
                  if (blob) {
                      const file = new File([blob], `foto_${Date.now()}.jpg`, { type: 'image/jpeg' });
                      onFileSelect([file]); 
                      setPhotosTaken(prev => prev + 1);
                      
                      const flash = document.getElementById('camera-flash');
                      if(flash) {
                          flash.style.opacity = '1';
                          setTimeout(() => flash.style.opacity = '0', 150);
                      }
                  }
              }, 'image/jpeg', 0.85);
          }
      }
  };

  // --- Preferences Toggles ---
  const toggleRef = () => onUpdatePreferences({...preferences, showReferenceValues: !preferences.showReferenceValues});
  const toggleDates = () => onUpdatePreferences({...preferences, groupDates: !preferences.groupDates});

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col gap-4">
      
      {/* --- HIDDEN FALLBACK INPUTS --- */}
      <input 
        ref={cameraFallbackInputRef}
        type="file" 
        accept="image/*" 
        capture="environment" // Forces native camera on mobile
        className="hidden" 
        onChange={handleFileInput}
      />

      {/* --- CAMERA MODAL (CUSTOM UI) --- */}
      {isCameraOpen && (
          <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center animate-fade-in">
              <div id="camera-flash" className="absolute inset-0 bg-white opacity-0 pointer-events-none transition-opacity duration-150 z-20"></div>
              
              <div className="relative w-full h-full flex flex-col">
                  {/* Camera Header */}
                  <div className="absolute top-0 left-0 right-0 p-4 md:p-6 flex justify-between items-center z-10 bg-gradient-to-b from-black/80 to-transparent">
                      <div className="text-white font-bold flex items-center gap-2 text-sm md:text-base">
                        <Camera size={20} />
                        Modo Sequencial
                      </div>
                      <button 
                        onClick={stopCameraStream}
                        className="p-2 bg-black/40 text-white rounded-full hover:bg-white/20 backdrop-blur-md"
                      >
                        <X size={24} />
                      </button>
                  </div>

                  {/* Video Stream */}
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    className={`w-full h-full object-cover ${usingFrontCamera ? 'scale-x-[-1]' : ''}`}
                  />
                  <canvas ref={canvasRef} className="hidden" />

                  {/* Camera Controls */}
                  <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 bg-gradient-to-t from-black/90 via-black/50 to-transparent">
                      
                      <div className="max-w-md mx-auto flex items-center justify-between">
                          
                          {/* Switch Camera */}
                          <button 
                              onClick={switchCamera}
                              className="p-3 bg-white/10 text-white rounded-full hover:bg-white/20 backdrop-blur-md active:scale-95 transition-all"
                              title="Trocar Câmera"
                          >
                              <SwitchCamera size={24} />
                          </button>

                          {/* Shutter Button */}
                          <div className="relative">
                            {photosTaken > 0 && (
                                <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-brand-start text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg animate-pop whitespace-nowrap">
                                    {photosTaken} foto(s)
                                </div>
                            )}
                            <button 
                                onClick={takePhoto}
                                className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center bg-white/20 active:scale-95 transition-transform"
                            >
                                <div className="w-16 h-16 bg-white rounded-full shadow-[0_0_15px_rgba(255,255,255,0.5)]"></div>
                            </button>
                          </div>

                          {/* Finish/Send Button */}
                          <div className="w-[48px] flex justify-end">
                            {photosTaken > 0 ? (
                                <button 
                                    onClick={handleFinishCapture}
                                    className="p-3 bg-green-600 text-white rounded-full hover:bg-green-500 shadow-lg shadow-green-900/50 animate-pop active:scale-95 transition-all flex items-center justify-center"
                                    title="Concluir e Enviar"
                                >
                                    <Check size={24} strokeWidth={3} />
                                </button>
                            ) : (
                                <div className="w-12"></div> // Spacer to keep shutter centered
                            )}
                          </div>
                      </div>
                      
                      <p className="text-white/60 text-[10px] md:text-xs text-center mt-4 font-medium">
                          Tire quantas fotos precisar e clique no <span className="text-green-400 font-bold">✓</span> para enviar.
                      </p>
                  </div>
              </div>
          </div>
      )}

      {/* --- PREFERENCES BAR --- */}
      <div className="bg-surface/50 border border-border rounded-xl p-3 flex flex-col sm:flex-row items-center justify-between gap-3 animate-fade-in">
        <div className="flex items-center gap-2 text-brand-start text-xs font-bold uppercase tracking-wide">
            <Settings2 size={16} /> Preferências
        </div>
        <div className="flex gap-4">
            <button 
                onClick={toggleRef}
                className="flex items-center gap-2 text-xs font-medium text-slate-300 hover:text-white transition-colors"
            >
                {preferences.showReferenceValues 
                    ? <ToggleRight size={24} className="text-brand-start" /> 
                    : <ToggleLeft size={24} className="text-slate-500" />
                }
                Mostrar Referências
            </button>
            <button 
                onClick={toggleDates}
                className="flex items-center gap-2 text-xs font-medium text-slate-300 hover:text-white transition-colors"
            >
                {preferences.groupDates 
                    ? <ToggleRight size={24} className="text-brand-start" /> 
                    : <ToggleLeft size={24} className="text-slate-500" />
                }
                Agrupar Datas (Seta)
            </button>
        </div>
      </div>

      {/* --- MAIN INPUT AREA --- */}
      <div>
        <div className="flex gap-2 mb-0">
            <button
            onClick={() => { setActiveTab('pdf'); setError(null); }}
            className={`flex-1 py-3 text-sm font-semibold rounded-t-xl transition-all border-t border-x border-transparent flex items-center justify-center gap-2
                ${activeTab === 'pdf' 
                ? 'bg-surface border-border text-white shadow-lg relative z-10 translate-y-px' 
                : 'bg-surfaceHighlight/30 text-slate-500 hover:bg-surfaceHighlight/50 border-transparent hover:text-slate-300'
                }`}
            >
            <Files size={16} />
            Arquivo / Câmera
            </button>
            <button
            onClick={() => { setActiveTab('text'); setError(null); }}
            className={`flex-1 py-3 text-sm font-semibold rounded-t-xl transition-all border-t border-x border-transparent flex items-center justify-center gap-2
                ${activeTab === 'text' 
                ? 'bg-surface border-border text-white shadow-lg relative z-10 translate-y-px' 
                : 'bg-surfaceHighlight/30 text-slate-500 hover:bg-surfaceHighlight/50 border-transparent hover:text-slate-300'
                }`}
            >
            <Type size={16} />
            Texto / Áudio
            </button>
        </div>

        <div className={`bg-surface border border-border rounded-b-2xl rounded-tr-none ${activeTab === 'text' ? 'rounded-tl-2xl rounded-tr-2xl sm:rounded-tl-none' : 'sm:rounded-tr-2xl'} p-1 relative z-0 transition-all duration-300`}>
            
            {/* FILE / CAMERA MODE */}
            {activeTab === 'pdf' && (
            <div className="p-1">
                <label
                    className={`
                    relative flex flex-col items-center justify-center w-full h-52 
                    border-2 border-dashed rounded-xl cursor-pointer transition-all duration-300 mb-2
                    ${isDragging 
                        ? 'border-brand-start bg-brand-start/10 shadow-[0_0_30px_rgba(59,130,246,0.2)]' 
                        : 'border-border/50 bg-background/50 hover:bg-surfaceHighlight hover:border-brand-start/50'
                    }
                    ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center px-4">
                        <div className={`p-4 rounded-full mb-3 transition-colors ${isDragging ? 'bg-brand-start text-white' : 'bg-surfaceHighlight text-slate-400'}`}>
                            {isDragging ? <Files size={32} /> : <UploadCloud size={32} />}
                        </div>
                        <p className="mb-1 text-base font-medium text-slate-200">
                            Clique ou arraste <span className="text-brand-start font-bold">PDFs</span> ou <span className="text-brand-start font-bold">Imagens</span>
                        </p>
                        <p className="text-xs text-slate-500">Múltiplos arquivos suportados</p>
                    </div>
                    <input 
                        type="file" 
                        className="hidden" 
                        accept="application/pdf,image/*"
                        multiple
                        onChange={handleFileInput}
                        disabled={disabled}
                    />
                </label>

                {/* Quick Camera Button - Attempts Custom, Fallbacks to Native */}
                <button
                    onClick={startCamera}
                    disabled={disabled}
                    className="w-full py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-lg flex items-center justify-center gap-2 transition-all font-medium text-sm"
                >
                    <Camera size={18} />
                    Adicionar via Câmera
                </button>
            </div>
            )}

            {/* TEXT / AUDIO MODE */}
            {activeTab === 'text' && (
            <div className="w-full h-auto flex flex-col p-1 gap-2">
                <div className="relative flex-grow h-40">
                <textarea
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder="Cole o texto do exame aqui..."
                    className="w-full h-full bg-background/50 p-4 rounded-xl text-slate-200 text-sm placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-start/50 resize-none border border-border/50 custom-scrollbar"
                    disabled={disabled}
                />
                <div className="absolute bottom-4 right-4">
                    <button
                    onClick={async () => {
                        try {
                            const text = await navigator.clipboard.readText();
                            setTextInput(text);
                        } catch (err) {}
                    }}
                    className="p-2 bg-surfaceHighlight hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition-colors border border-border"
                    title="Colar da área de transferência"
                    >
                    <Clipboard size={16} />
                    </button>
                </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                    <button
                        onClick={isRecording ? stopRecording : startRecording}
                        disabled={disabled}
                        className={`
                            py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all border
                            ${isRecording 
                                ? 'bg-red-500/10 border-red-500 text-red-500 animate-pulse' 
                                : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                            }
                        `}
                    >
                        {isRecording ? <><StopCircle size={18} /> Parar Gravação</> : <><Mic size={18} /> Gravar Áudio</>}
                    </button>

                    <button
                        onClick={handleTextSubmit}
                        disabled={disabled || !textInput.trim()}
                        className="py-3 bg-gradient-to-r from-brand-start to-brand-end hover:from-brand-600 hover:to-brand-700 text-white rounded-lg font-bold shadow-lg shadow-brand-start/10 hover:shadow-brand-start/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Processar Texto <ArrowRight size={18} />
                    </button>
                </div>
            </div>
            )}

        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-400 bg-red-900/20 border border-red-900/50 p-3 rounded-lg text-sm font-medium animate-pulse">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      <div className="mt-4 flex items-center justify-center gap-6 text-[10px] sm:text-xs text-slate-500 uppercase tracking-widest font-semibold">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.5)]"></div>
          Pediatria
        </div>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 bg-brand-start rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
          IA Híbrida
        </div>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 bg-purple-500 rounded-full shadow-[0_0_8px_rgba(168,85,247,0.5)]"></div>
          Multi-Formatos
        </div>
      </div>
    </div>
  );
};

export default FileUpload;