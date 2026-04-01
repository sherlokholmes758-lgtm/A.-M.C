import React, { useState } from 'react';
import { CameraView } from './components/CameraView';
import { VisionOverlay } from './components/VisionOverlay';
import { analyzeFrame, VisionResult } from './services/gemini';
import { Brain, Info, History, Trash2, Languages } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [result, setResult] = useState<VisionResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isContinuous, setIsContinuous] = useState(false);
  const [history, setHistory] = useState<VisionResult[]>([]);

  const handleCapture = async (base64: string) => {
    setIsAnalyzing(true);
    try {
      const analysis = await analyzeFrame(base64);
      setResult(analysis);
      setHistory(prev => [analysis, ...prev].slice(0, 5));
    } catch (error) {
      console.error("Analysis failed", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const clearHistory = () => setHistory([]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-cyan-500/30">
      {/* Header */}
      <header className="p-6 border-b border-white/5 bg-black/20 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-500/10 rounded-xl border border-cyan-500/20">
              <Brain className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Vision AI Explorer</h1>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-widest">Powered by Gemini 3 Flash</p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-400">
            <span className="hover:text-white transition-colors cursor-pointer">Documentation</span>
            <span className="hover:text-white transition-colors cursor-pointer">API</span>
            <div className="h-4 w-px bg-white/10" />
            <Languages className="w-5 h-5 hover:text-white transition-colors cursor-pointer" />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Camera & Analysis */}
        <div className="lg:col-span-8 space-y-6">
          <section className="relative aspect-video w-full">
            <CameraView 
              onCapture={handleCapture} 
              isAnalyzing={isAnalyzing} 
              isContinuous={isContinuous}
              setIsContinuous={setIsContinuous}
            />
            <VisionOverlay result={result} />
          </section>

          <AnimatePresence mode="wait">
            {result && (
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-sm"
              >
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-cyan-500/20 rounded-lg">
                      <Info className="w-5 h-5 text-cyan-400" />
                    </div>
                    <h2 className="text-xl font-bold">Résultats de l'analyse</h2>
                  </div>
                  <div className="px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded-full text-[10px] font-bold text-cyan-400 uppercase tracking-widest">
                    Précision Élevée
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">Description</h3>
                    <p className="text-lg leading-relaxed text-gray-200">
                      {result.description}
                    </p>
                  </div>

                  {result.text_ocr && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">Texte Détecté (OCR)</h3>
                      <div className="p-4 bg-black/40 rounded-2xl border border-white/5 font-mono text-sm text-cyan-300">
                        {result.text_ocr}
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    {result.objects.map((obj, i) => (
                      <span 
                        key={i}
                        className="px-4 py-2 bg-white/5 border border-white/10 rounded-full text-sm font-medium hover:bg-white/10 transition-colors"
                      >
                        {obj.label} <span className="text-cyan-400 ml-1">{(obj.confidence * 100).toFixed(0)}%</span>
                      </span>
                    ))}
                  </div>
                </div>
              </motion.section>
            )}
          </AnimatePresence>
        </div>

        {/* Right Column: History & Stats */}
        <div className="lg:col-span-4 space-y-6">
          <section className="bg-white/5 border border-white/10 rounded-3xl p-6 h-full flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <History className="w-5 h-5 text-gray-400" />
                <h2 className="font-bold">Historique</h2>
              </div>
              {history.length > 0 && (
                <button 
                  onClick={clearHistory}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-500 hover:text-red-400"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto max-h-[600px] pr-2 custom-scrollbar">
              {history.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-gray-600">
                  <p className="text-sm italic">Aucune analyse récente</p>
                </div>
              ) : (
                history.map((item, idx) => (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    key={idx}
                    className="p-4 bg-white/5 border border-white/5 rounded-2xl hover:border-white/20 transition-all group"
                  >
                    <p className="text-sm text-gray-300 line-clamp-2 mb-2 group-hover:text-white transition-colors">
                      {item.description}
                    </p>
                    <div className="flex gap-2 overflow-x-auto no-scrollbar">
                      {item.objects.slice(0, 3).map((obj, i) => (
                        <span key={i} className="text-[10px] bg-white/5 px-2 py-0.5 rounded text-gray-500 whitespace-nowrap">
                          {obj.label}
                        </span>
                      ))}
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            <div className="mt-6 pt-6 border-t border-white/5">
              <div className="p-4 bg-cyan-500/5 border border-cyan-500/10 rounded-2xl">
                <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-widest mb-2">Conseil Pro</h3>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Pour de meilleurs résultats, assurez-vous d'avoir un bon éclairage et de stabiliser la caméra avant de lancer l'analyse.
                </p>
              </div>
            </div>
          </section>
        </div>
      </main>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
      `}</style>
    </div>
  );
}
