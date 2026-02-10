
import React, { useState, useRef } from 'react';
import { Sparkles, Camera, Download, RefreshCcw, Send, Image as ImageIcon, Loader2 } from 'lucide-react';
import { editImage } from '../services/geminiService';

const MediaProcessor: React.FC = () => {
  const [image, setImage] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setHistory([reader.result as string]);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEdit = async () => {
    if (!image || !prompt) return;
    setProcessing(true);
    try {
      const base64Data = image.split(',')[1];
      const mimeType = image.split(';')[0].split(':')[1];
      const result = await editImage(base64Data, prompt, mimeType);
      if (result) {
        setImage(result);
        setHistory(prev => [...prev, result]);
        setPrompt("");
      }
    } catch (error) {
      console.error("Editing failed", error);
    } finally {
      setProcessing(false);
    }
  };

  const undo = () => {
    if (history.length > 1) {
      const newHistory = [...history];
      newHistory.pop();
      setHistory(newHistory);
      setImage(newHistory[newHistory.length - 1]);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Media Intelligence</h2>
          <p className="text-slate-400 mt-1">AI-assisted drone feed enhancement and tactical analysis.</p>
        </div>
        <div className="flex gap-2">
           {history.length > 1 && (
             <button onClick={undo} className="px-4 py-2 glass rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-2">
               <RefreshCcw size={16} /> Undo
             </button>
           )}
           <button 
             onClick={() => fileInputRef.current?.click()}
             className="px-6 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg font-semibold transition-all shadow-[0_0_20px_rgba(14,165,233,0.3)] flex items-center gap-2"
           >
             <Camera size={18} /> Capture New Feed
           </button>
           <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[600px]">
        {/* Workspace */}
        <div className="lg:col-span-2 glass rounded-3xl border border-slate-800 p-8 flex flex-col bg-slate-900/20">
          <div className="flex-1 relative rounded-2xl border border-slate-800 bg-black/40 overflow-hidden group">
            {image ? (
              <>
                <img src={image} alt="Drone Feed" className="w-full h-full object-contain" />
                {processing && (
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center gap-4 text-sky-400">
                    <Loader2 className="animate-spin" size={48} />
                    <p className="text-xs font-bold uppercase tracking-[0.2em] animate-pulse">Processing Neural Enhancement...</p>
                  </div>
                )}
                <div className="absolute bottom-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                   <a href={image} download="enhanced_feed.png" className="p-3 bg-white/10 hover:bg-white/20 backdrop-blur rounded-xl transition-colors">
                     <Download size={20} />
                   </a>
                </div>
              </>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-600 space-y-4">
                <ImageIcon size={64} strokeWidth={1} />
                <p className="font-medium">No live feed selected</p>
                <button 
                   onClick={() => fileInputRef.current?.click()}
                   className="text-sky-400 text-sm hover:underline"
                >
                  Upload tactical imagery to begin
                </button>
              </div>
            )}
          </div>
        </div>

        {/* AI Controls */}
        <div className="glass rounded-3xl border border-slate-800 p-8 flex flex-col gap-6">
          <div>
            <h3 className="text-lg font-bold flex items-center gap-2 mb-2">
              <Sparkles size={20} className="text-amber-400" />
              Neural Processor
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Describe modifications or analysis tasks to be performed on the tactical imagery using Gemini 2.5 Flash Image.
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Modification Prompt</label>
              <textarea 
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g., 'Apply night vision filter and highlight thermal signatures' or 'Clear background haze'..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-4 text-sm focus:outline-none focus:ring-1 focus:ring-sky-500 h-32 resize-none transition-all placeholder:text-slate-600"
              />
            </div>

            <button 
              onClick={handleEdit}
              disabled={!image || !prompt || processing}
              className="w-full py-4 bg-sky-600 hover:bg-sky-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2"
            >
              <Send size={18} /> Apply Enhancements
            </button>
          </div>

          <div className="mt-auto space-y-3">
            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Quick Presets</h4>
            <div className="grid grid-cols-2 gap-2">
              {[
                "Add retro cinematic filter",
                "Remove atmospheric fog",
                "Boost saturation",
                "Monochrome tactical view"
              ].map((preset) => (
                <button 
                  key={preset}
                  onClick={() => setPrompt(preset)}
                  className="px-3 py-2 text-[10px] font-semibold bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 transition-colors text-left"
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MediaProcessor;
