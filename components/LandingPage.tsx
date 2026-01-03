
import React, { useState, useEffect } from 'react';
import { generateHexSeed } from '../utils/rng';
import { TerrainType, TerrainWeights, MapSaveData } from '../types';
import { DEFAULT_TERRAIN_WEIGHTS, TERRAIN_COLORS } from '../constants';
import { validateUserCode, formatUserCodeInput } from '../utils/userIdentity';

interface LandingPageProps {
  seed: string;
  setSeed: (seed: string) => void;
  userCode: string;
  setUserCode: (code: string) => void;
  weights: TerrainWeights;
  setWeights: (weights: TerrainWeights) => void;
  onStart: (seedOverride?: string) => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ seed, setSeed, userCode, setUserCode, weights, setWeights, onStart }) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isValidCode, setIsValidCode] = useState(true);
  const [savedMaps, setSavedMaps] = useState<MapSaveData[]>([]);

  // Validate code on change and fetch saves
  useEffect(() => {
    const valid = validateUserCode(userCode);
    setIsValidCode(valid);

    if (valid) {
      // Search LocalStorage for saves associated with this user
      const foundSaves: MapSaveData[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('hex_map_')) {
          try {
            const data: MapSaveData = JSON.parse(localStorage.getItem(key) || '{}');
            if (data.userCode === userCode) {
              foundSaves.push(data);
            }
          } catch (e) { console.error("Error parsing save", e); }
        }
      }
      // Sort by last played (newest first)
      foundSaves.sort((a, b) => (b.last_played || 0) - (a.last_played || 0));
      setSavedMaps(foundSaves);
    } else {
      setSavedMaps([]);
    }
  }, [userCode]);

  const handleRandomize = () => {
    setSeed(generateHexSeed());
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9a-fA-F]/g, '');
    setSeed(val);
  };

  const handleUserCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatUserCodeInput(e.target.value);
    setUserCode(formatted);
  };

  const handleWeightChange = (terrain: TerrainType, value: number) => {
    setWeights({
      ...weights,
      [terrain]: value
    });
  };

  const handleLoadMap = (saveData: MapSaveData) => {
    // Directly start with the specific seed from the save file
    // preventing race conditions with the input state
    setSeed(saveData.seed); // Update UI for consistency
    onStart(saveData.seed);
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
          
          {/* User Code Input */}
          <div className="space-y-2 text-left">
             <div className="flex justify-between items-end">
               <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                Código de Usuário (Identity)
               </label>
               {isValidCode ? (
                 <span className="text-[10px] text-emerald-400 font-bold bg-emerald-900/30 px-2 py-0.5 rounded border border-emerald-800">VALIDATED</span>
               ) : (
                 <span className="text-[10px] text-red-400 font-bold bg-red-900/30 px-2 py-0.5 rounded border border-red-800">INVALID</span>
               )}
             </div>
             <input 
                type="text" 
                value={userCode}
                onChange={handleUserCodeChange}
                maxLength={19}
                placeholder="XXXX-XXXX-XXXX-XXXX"
                className={`w-full bg-slate-900 border rounded-lg py-3 px-4 font-mono text-sm text-center tracking-widest uppercase focus:outline-none focus:ring-1 transition-all shadow-inner ${isValidCode ? 'border-slate-600 focus:border-blue-500 focus:ring-blue-500 text-slate-200' : 'border-red-500 focus:border-red-500 focus:ring-red-500 text-red-300'}`}
              />
              <p className="text-[10px] text-slate-500 text-center">
                 Este código é sua chave de acesso. Ele vincula seus mapas salvos a você.
              </p>
          </div>
          
          {/* Saved Maps List */}
          {isValidCode && savedMaps.length > 0 && (
             <div className="space-y-2 text-left animate-in fade-in slide-in-from-top-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                  Seus Mapas Salvos ({savedMaps.length})
                </label>
                <div className="max-h-40 overflow-y-auto pr-1 space-y-2 scrollbar-thin scrollbar-thumb-slate-700 bg-slate-900/50 p-2 rounded border border-slate-700">
                   {savedMaps.map((map) => (
                      <button 
                        key={map.seed}
                        onClick={() => handleLoadMap(map)}
                        className="w-full flex justify-between items-center bg-slate-800 hover:bg-slate-700 p-2 rounded border border-slate-600 transition-colors group"
                      >
                         <div className="flex flex-col items-start">
                            <span className="text-xs font-mono text-slate-300 group-hover:text-white">{map.seed.substring(0, 16)}...</span>
                            <span className="text-[10px] text-slate-500">
                               {map.last_played ? new Date(map.last_played).toLocaleDateString() + ' ' + new Date(map.last_played).toLocaleTimeString() : 'Unknown Date'}
                            </span>
                         </div>
                         <span className="text-[10px] bg-blue-900/50 text-blue-200 px-2 py-1 rounded border border-blue-800">CARREGAR</span>
                      </button>
                   ))}
                </div>
             </div>
          )}

          <div className="w-full h-px bg-slate-700"></div>

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
               <span>{showAdvanced ? '▼' : '▶'}</span> CONFIGURAÇÃO DE TERRENOS (PROBABILIDADE)
             </button>

             {showAdvanced && (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 animate-in fade-in slide-in-from-top-2">
                 {(Object.keys(DEFAULT_TERRAIN_WEIGHTS) as TerrainType[]).map((terrain) => (
                   <div key={terrain} className="flex flex-col gap-1 bg-slate-900/50 p-2 rounded border border-slate-700">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: TERRAIN_COLORS[terrain] }}></div>
                          {terrain}
                        </span>
                        <span className="text-xs font-mono text-slate-400">{weights[terrain]}</span>
                      </div>
                      <input 
                        type="range"
                        min="0"
                        max="100"
                        step="1"
                        value={weights[terrain]}
                        onChange={(e) => handleWeightChange(terrain, parseInt(e.target.value))}
                        className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                      />
                   </div>
                 ))}
                 
                 <div className="md:col-span-2 text-center mt-2">
                   <button 
                     onClick={() => setWeights(DEFAULT_TERRAIN_WEIGHTS)}
                     className="text-[10px] text-slate-500 hover:text-white underline"
                   >
                     Resetar para Padrão
                   </button>
                 </div>
               </div>
             )}
          </div>

          <button 
            onClick={() => onStart()}
            disabled={!isValidCode}
            className={`w-full py-4 font-bold text-xl rounded-xl shadow-lg transform transition hover:scale-[1.02] active:scale-[0.98] uppercase tracking-wider ${isValidCode ? 'bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 text-white' : 'bg-slate-700 text-slate-500 cursor-not-allowed'}`}
          >
            Iniciar Expedição
          </button>

        </div>
        
        <div className="text-slate-600 text-xs font-mono">
          v1.2.0 &bull; Scale: 500m/hex &bull; Educational Edition
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
