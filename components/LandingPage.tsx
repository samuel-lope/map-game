
import React, { useState } from 'react';
import { generateHexSeed } from '../utils/rng';
import { BiomeType, BiomeWeights } from '../types';
import { DEFAULT_BIOME_WEIGHTS, BIOME_COLORS } from '../constants';

interface LandingPageProps {
  seed: string;
  setSeed: (seed: string) => void;
  weights: BiomeWeights;
  setWeights: (weights: BiomeWeights) => void;
  onStart: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ seed, setSeed, weights, setWeights, onStart }) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleRandomize = () => {
    setSeed(generateHexSeed());
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9a-fA-F]/g, '');
    setSeed(val);
  };

  const handleWeightChange = (biome: BiomeType, value: number) => {
    setWeights({
      ...weights,
      [biome]: value
    });
  };

  return (
    <div className="flex flex-col items-center justify-center w-full h-full bg-slate-900 text-slate-100 p-6 relative overflow-hidden overflow-y-auto">
      
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 opacity-20 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600 rounded-full blur-[128px]"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-600 rounded-full blur-[128px]"></div>
      </div>

      <div className="z-10 flex flex-col items-center max-w-2xl w-full text-center space-y-8 my-8">
        
        <div className="space-y-2">
          <h1 className="text-6xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
            HEX INFINITE
          </h1>
          <p className="text-slate-400 text-lg">
            Exploração procedural em escala infinita.
          </p>
        </div>

        <div className="w-full bg-slate-800/50 backdrop-blur-sm border border-slate-700 p-8 rounded-2xl shadow-2xl space-y-6">
          
          {/* Seed Input */}
          <div className="space-y-2 text-left">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">
              World Seed (128-bit Hex)
            </label>
            <div className="relative group">
              <input 
                type="text" 
                value={seed}
                onChange={handleChange}
                maxLength={32}
                spellCheck={false}
                className="w-full bg-slate-900 border border-slate-600 rounded-lg py-3 px-4 font-mono text-sm text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-inner"
              />
              <div className="absolute right-2 top-2">
                <button 
                  onClick={handleRandomize}
                  className="p-1.5 bg-slate-700 hover:bg-slate-600 rounded text-xs font-bold text-slate-300 transition-colors"
                  title="Generate Random Seed"
                >
                  🎲 RANDOM
                </button>
              </div>
            </div>
          </div>

          {/* Advanced Config Toggle */}
          <div className="text-left border-t border-slate-700 pt-4">
             <button 
               onClick={() => setShowAdvanced(!showAdvanced)}
               className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-2"
             >
               <span>{showAdvanced ? '▼' : '▶'}</span> CONFIGURAÇÃO DE BIOMAS (PROBABILIDADE)
             </button>

             {showAdvanced && (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 animate-in fade-in slide-in-from-top-2">
                 {(Object.keys(DEFAULT_BIOME_WEIGHTS) as BiomeType[]).map((biome) => (
                   <div key={biome} className="flex flex-col gap-1 bg-slate-900/50 p-2 rounded border border-slate-700">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: BIOME_COLORS[biome] }}></div>
                          {biome}
                        </span>
                        <span className="text-xs font-mono text-slate-400">{weights[biome]}</span>
                      </div>
                      <input 
                        type="range"
                        min="0"
                        max="100"
                        step="1"
                        value={weights[biome]}
                        onChange={(e) => handleWeightChange(biome, parseInt(e.target.value))}
                        className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                      />
                   </div>
                 ))}
                 
                 <div className="md:col-span-2 text-center mt-2">
                   <button 
                     onClick={() => setWeights(DEFAULT_BIOME_WEIGHTS)}
                     className="text-[10px] text-slate-500 hover:text-white underline"
                   >
                     Resetar para Padrão
                   </button>
                 </div>
               </div>
             )}
          </div>

          <button 
            onClick={onStart}
            className="w-full py-4 bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 text-white font-bold text-xl rounded-xl shadow-lg transform transition hover:scale-[1.02] active:scale-[0.98] uppercase tracking-wider"
          >
            Iniciar Expedição
          </button>

        </div>
        
        <div className="text-slate-600 text-xs font-mono">
          v1.1.0 &bull; Scale: 500m/hex
        </div>
      </div>
    </div>
  );
};

export default LandingPage;