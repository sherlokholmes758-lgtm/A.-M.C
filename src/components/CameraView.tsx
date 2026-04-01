import React, { useRef, useEffect, useState } from 'react';
import { Camera, CameraOff, RefreshCw, Scan, Zap, ZapOff } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface CameraViewProps {
  onCapture: (base64: string) => void;
  isAnalyzing: boolean;
  isContinuous: boolean;
  setIsContinuous: (v: boolean) => void;
}

export function CameraView({ onCapture, isAnalyzing, isContinuous, setIsContinuous }: CameraViewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');

  const startCamera = async () => {
    try {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      setStream(newStream);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
      setError(null);
    } catch (err) {
      setError("Impossible d'accéder à la caméra. Vérifiez les permissions.");
      console.error(err);
    }
  };

  useEffect(() => {
    startCamera();
    return () => {
      stream?.getTracks().forEach(track => track.stop());
    };
  }, [facingMode]);

  const captureFrame = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const base64 = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
        onCapture(base64);
      }
    }
  };

  // Continuous scan logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isContinuous && !isAnalyzing) {
      interval = setInterval(() => {
        captureFrame();
      }, 4000); // Scan every 4 seconds in continuous mode to avoid rate limits
    }
    return () => clearInterval(interval);
  }, [isContinuous, isAnalyzing]);

  const toggleCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  return (
    <div className="relative w-full h-full bg-black rounded-3xl overflow-hidden shadow-2xl border-4 border-white/10 group">
      {error ? (
        <div className="flex flex-col items-center justify-center h-full text-white p-6 text-center">
          <CameraOff className="w-16 h-16 mb-4 text-red-400" />
          <p className="text-lg font-medium">{error}</p>
          <button 
            onClick={startCamera}
            className="mt-4 px-6 py-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
          >
            Réessayer
          </button>
        </div>
      ) : (
        <>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          <canvas ref={canvasRef} className="hidden" />
          
          {/* Controls Overlay */}
          <div className="absolute bottom-6 left-0 right-0 flex justify-center items-center gap-4 px-6">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={toggleCamera}
              className="p-4 bg-black/40 backdrop-blur-md border border-white/20 rounded-full text-white hover:bg-black/60 transition-colors"
              title="Changer de caméra"
            >
              <RefreshCw className="w-6 h-6" />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={captureFrame}
              disabled={isAnalyzing || isContinuous}
              className={cn(
                "flex items-center gap-3 px-8 py-4 rounded-full font-bold text-lg shadow-xl transition-all",
                (isAnalyzing || isContinuous)
                  ? "bg-gray-500 cursor-not-allowed text-white/50" 
                  : "bg-white text-black hover:bg-gray-100"
              )}
            >
              {isAnalyzing ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                >
                  <RefreshCw className="w-6 h-6" />
                </motion.div>
              ) : (
                <Scan className="w-6 h-6" />
              )}
              {isAnalyzing ? "Analyse..." : "Analyser"}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsContinuous(!isContinuous)}
              className={cn(
                "p-4 backdrop-blur-md border rounded-full transition-all",
                isContinuous 
                  ? "bg-cyan-500 border-cyan-400 text-white shadow-[0_0_15px_rgba(34,211,238,0.5)]" 
                  : "bg-black/40 border-white/20 text-white hover:bg-black/60"
              )}
              title={isContinuous ? "Désactiver le scan continu" : "Activer le scan continu"}
            >
              {isContinuous ? <Zap className="w-6 h-6" /> : <ZapOff className="w-6 h-6" />}
            </motion.button>
          </div>

          {/* Status Indicator */}
          <div className="absolute top-6 left-6 flex items-center gap-2 px-3 py-1 bg-black/40 backdrop-blur-md border border-white/20 rounded-full">
            <div className={cn("w-2 h-2 rounded-full", stream ? "bg-green-500 animate-pulse" : "bg-red-500")} />
            <span className="text-xs font-medium text-white uppercase tracking-wider">
              {isContinuous ? "Scan Continu" : "Mode Manuel"}
            </span>
          </div>
        </>
      )}
    </div>
  );
}
