import React from 'react';
import { VisionResult } from '@/src/services/gemini';
import { motion } from 'motion/react';

interface VisionOverlayProps {
  result: VisionResult | null;
}

export function VisionOverlay({ result }: VisionOverlayProps) {
  if (!result) return null;

  return (
    <div className="absolute inset-0 pointer-events-none">
      {result.objects.map((obj, idx) => {
        const [ymin, xmin, ymax, xmax] = obj.box_2d;
        
        // Gemini returns normalized coordinates [0, 1000]
        const top = `${ymin / 10}%`;
        const left = `${xmin / 10}%`;
        const width = `${(xmax - xmin) / 10}%`;
        const height = `${(ymax - ymin) / 10}%`;

        return (
          <motion.div
            key={`${obj.label}-${idx}`}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute border-2 border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.5)] rounded-sm"
            style={{ top, left, width, height }}
          >
            <div className="absolute -top-7 left-0 bg-cyan-400 text-black text-[10px] font-bold px-2 py-0.5 rounded-t-sm whitespace-nowrap uppercase tracking-tighter">
              {obj.label} ({(obj.confidence * 100).toFixed(0)}%)
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
