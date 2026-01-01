import React, { useState } from 'react';
import { MapSettings, HexCoordinate, BiomeType, SavedLocation, Language, HexResources } from '../types';
import { getBiome, getElevation } from '../utils/rng';

interface ControlsProps {
  settings: MapSettings;
  setSettings: (s: MapSettings) => void;
  playerPos: HexCoordinate;
  movePlayer: (dq: number, dr: number) => void;
  metersTraveled: number;
  distanceFromSpawn: number;
  rotation: number;
  setRotation: (deg: number | ((prev: number) => number)) => void;
  // Persistence props
  savedLocations: SavedLocation[];
  onSaveLocation: (name: string) => void;
  onDeleteLocation: (id: string) => void;
  onTeleport: (loc: SavedLocation) => void;
  // Language
  language: Language;
  setLanguage: (l: Language) => void;
  // New Prop
  currentResources: HexResources;
}

const Controls: React.FC<ControlsProps> = ({ 
  settings, 
  setSettings, 
  playerPos, 
  movePlayer,
  metersTraveled,
  distanceFromSpawn,
  rotation,
  setRotation,
  savedLocations,
  onSaveLocation,
  onDeleteLocation,
  onTeleport,
  language,
  setLanguage,
  currentResources
}) => {
  
  const currentBiome = getBiome(playerPos.q, playerPos.r, settings.seed);
  const elevation = getElevation(playerPos.q, playerPos.r, settings.seed);

  // --- Local UI State for Modals ---
  const [isSaveModalOpen, setSaveModalOpen] = useState(false);
  const [saveName, setSaveName] = useState("");

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleSaveClick = () => {
    setSaveName(`Pos ${playerPos.q}, ${playerPos.r}`);
    setSaveModalOpen(true);
  };

  const confirmSave = () => {
    if (saveName.trim()) {
      onSaveLocation(saveName);
      setSaveModalOpen(false);
    }
  };

  const handleDeleteClick = (id: string) => {
    setDeleteConfirmId(id);
  };

  const confirmDelete = () => {
    if (deleteConfirmId) {
      onDeleteLocation(deleteConfirmId);
      setDeleteConfirmId(null);
    }
  };

  const rotateMap = (delta: number) => {
    setRotation(prev => (prev + delta) % 360);
  };

  const isEmpty = 
    currentResources.vegetation.length === 0 &&
    currentResources.animals.length === 0 &&
    currentResources.minerals.length === 0 &&
    currentResources.rareStones.length === 0;

  return (
    <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
      
      {/* Left Panel: Settings & Saves & Compass */}
      <div className="absolute top-4 left-4 pointer-events-auto flex flex-col gap-4 bg-slate-900/90 backdrop-blur-md p-4 rounded-lg border border-slate-700 shadow-xl w-72 max-h-[85vh] overflow-y-auto z-20 scrollbar-thin scrollbar-thumb-slate-600">
        <h3 className="font-bold border-b border-slate-700 pb-2 text-slate-400 text-sm uppercase tracking-wider">Map Configuration</h3>

        {/* Seed Display (Read Only while playing) */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold text-slate-500 uppercase">Seed (128-bit Hex)</label>
          <div className="bg-slate-800/50 text-slate-400 border border-slate-700 rounded px-2 py-1.5 font-mono text-xs w-full break-all">
            {settings.seed}
          </div>
        </div>

        {/* View Radius Control */}
        <div className="flex flex-col gap-2">
           <div className="flex justify-between items-end">
             <label className="text-xs font-bold text-slate-500 uppercase">View Radius</label>
             <span className="text-blue-400 text-xs font-mono">{(settings.renderRadius * 500 / 1000).toFixed(1)} km</span>
           </div>
           <input 
             type="range"
             min="5"
             max="50"
             value={settings.renderRadius}
             onChange={(e) => setSettings({...settings, renderRadius: parseInt(e.target.value)})}
             className="accent-blue-500 w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer"
           />
        </div>

        {/* Language Toggle */}
        <div className="flex flex-col gap-2 pt-2 border-t border-slate-700">
          <label className="text-xs font-bold text-slate-500 uppercase">Language / Idioma</label>
          <div className="flex gap-2 bg-slate-800 p-1 rounded border border-slate-700">
             <button 
               onClick={() => setLanguage('pt')}
               className={`flex-1 text-xs py-1 rounded font-bold transition-all ${language === 'pt' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
             >
               PT-BR
             </button>
             <button 
               onClick={() => setLanguage('en')}
               className={`flex-1 text-xs py-1 rounded font-bold transition-all ${language === 'en' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
             >
               ENGLISH
             </button>
          </div>
        </div>

        {/* Saved Locations Section */}
        <div className="mt-2 border-t border-slate-700 pt-4 flex flex-col gap-3">
          <div className="flex justify-between items-center">
             <h3 className="font-bold text-slate-400 text-sm uppercase tracking-wider">Bookmarks</h3>
             <button 
               onClick={handleSaveClick}
               className="bg-emerald-700 hover:bg-emerald-600 text-white text-xs px-2 py-1 rounded font-bold transition-colors shadow-md"
             >
               + SAVE POS
             </button>
          </div>

          <div className="flex flex-col gap-2 max-h-40 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-700">
            {savedLocations.length === 0 ? (
              <span className="text-xs text-slate-600 italic">No saved locations.</span>
            ) : (
              savedLocations.map(loc => (
                <div key={loc.id} className="bg-slate-800 border border-slate-700 rounded p-2 flex justify-between items-center group">
                  <div className="flex flex-col overflow-hidden max-w-[120px]">
                    <span className="text-xs font-bold text-slate-200 truncate" title={loc.name}>{loc.name}</span>
                    <span className="text-[10px] text-slate-500 font-mono">Q:{loc.x} R:{loc.y}</span>
                  </div>
                  <div className="flex gap-1">
                    <button 
                      onClick={() => onTeleport(loc)}
                      className="text-[10px] bg-emerald-900/50 hover:bg-emerald-600 text-emerald-200 p-1.5 rounded transition-colors border border-emerald-900 flex items-center justify-center"
                      title="Teleport"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" height="16px" viewBox="0 -960 960 960" width="16px" fill="currentColor"><path d="M480-388q54-50 84-80t47-50q16-20 22.5-37t6.5-37q0-36-26-62t-62-26q-21 0-40.5 8.5T480-648q-12-15-31-23.5t-41-8.5q-36 0-62 26t-26 62q0 21 6 37t22 36q17 20 46 50t86 81Zm0 202q122-112 181-203.5T720-552q0-109-69.5-178.5T480-800q-101 0-170.5 69.5T240-552q0 71 59 162.5T480-186Zm0 106Q319-217 239.5-334.5T160-552q0-150 96.5-239T480-880q127 0 223.5 89T800-552q0 100-79.5 217.5T480-80Zm0-480Z"/></svg>
                    </button>
                    <button 
                      onClick={() => handleDeleteClick(loc.id)}
                      className="text-[10px] bg-red-900/50 hover:bg-red-600 text-red-200 px-1.5 py-1 rounded transition-colors border border-red-900"
                      title="Delete"
                    >
                      X
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Bottom Center: Simplified Compass */}
        <div className="mt-4 pt-4 border-t border-slate-700 flex flex-col items-center gap-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Orientation</span>
            <div className="flex items-center gap-4">
                <button 
                  onClick={() => rotateMap(-60)}
                  className="w-8 h-8 flex items-center justify-center bg-slate-800 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white transition-colors border border-slate-600 active:scale-95"
                  title="Rotate Left (-60°)"
                >
                  ↺
                </button>

                <div 
                   className="w-12 h-12 bg-slate-800 rounded-full border-2 border-slate-600 relative flex items-center justify-center cursor-pointer transition-transform hover:border-slate-400"
                   onClick={() => setRotation(0)}
                   title="Reset North"
                   style={{ transform: `rotate(${rotation}deg)`, transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)' }}
                >
                   {/* North */}
                   <div className="absolute top-1 left-1/2 -translate-x-1/2 text-[8px] font-bold text-red-500">N</div>
                   <div className="absolute top-0.5 left-1/2 -translate-x-1/2 w-0.5 h-2 bg-red-500"></div>

                   {/* South */}
                   <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-0.5 h-2 bg-slate-500"></div>

                   {/* East/West Ticks */}
                   <div className="absolute right-0.5 top-1/2 -translate-y-1/2 w-1.5 h-0.5 bg-slate-500"></div>
                   <div className="absolute left-0.5 top-1/2 -translate-y-1/2 w-1.5 h-0.5 bg-slate-500"></div>

                   {/* Center Dot */}
                   <div className="w-1.5 h-1.5 bg-slate-400 rounded-full z-10"></div>
                   
                   {/* Needle */}
                   <div className="absolute top-1/2 left-1/2 w-0.5 h-8 -translate-x-1/2 -translate-y-1/2">
                      <div className="absolute top-0 w-full h-1/2 bg-red-500/80"></div>
                      <div className="absolute bottom-0 w-full h-1/2 bg-slate-400/50"></div>
                   </div>
                </div>

                <button 
                  onClick={() => rotateMap(60)}
                  className="w-8 h-8 flex items-center justify-center bg-slate-800 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white transition-colors border border-slate-600 active:scale-95"
                  title="Rotate Right (+60°)"
                >
                  ↻
                </button>
            </div>
        </div>

      </div>

      {/* Top Right: Status */}
      <div className="absolute top-4 right-4 pointer-events-auto">
        <div className="bg-slate-900/80 backdrop-blur p-4 rounded-lg border border-slate-700 text-slate-200 w-56 shadow-xl max-h-[85vh] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-600">
           <h3 className="font-bold border-b border-slate-700 mb-2 pb-1 text-slate-400 text-sm uppercase tracking-wider">Status</h3>
           <div className="flex justify-between text-sm mb-1">
             <span className="text-slate-400">X (q):</span> <span className="font-mono">{playerPos.q}</span>
           </div>
           <div className="flex justify-between text-sm mb-1">
             <span className="text-slate-400">Y (r):</span> <span className="font-mono">{playerPos.r}</span>
           </div>
           
           {/* Total Traveled (Odometer) */}
           <div className="flex justify-between text-sm mb-1">
             <span className="text-slate-400">{language === 'pt' ? 'Percorrido:' : 'Traveled:'}</span> 
             <span className="font-mono text-blue-400">
               {metersTraveled >= 1000 ? `${(metersTraveled / 1000).toFixed(1)}km` : `${metersTraveled}m`}
             </span>
           </div>

           {/* Distance from Spawn (Radius) */}
           <div className="flex justify-between text-sm mb-1">
             <span className="text-slate-400">{language === 'pt' ? 'Raio:' : 'Radius:'}</span> 
             <span className="font-mono text-purple-400">
               {distanceFromSpawn >= 1000 ? `${(distanceFromSpawn / 1000).toFixed(1)}km` : `${distanceFromSpawn.toFixed(0)}m`}
             </span>
           </div>

           <div className="flex justify-between text-sm mb-1">
             <span className="text-slate-400">Altitude:</span> 
             <span className={`font-mono ${elevation < 0 ? 'text-blue-400' : 'text-emerald-400'}`}>
               {elevation}m
             </span>
           </div>
           <div className="mt-3 pt-2 border-t border-slate-700">
             <span className="text-xs uppercase text-slate-500 block mb-1">Current Terrain</span>
             <span className="font-bold text-lg" style={{ color: currentBiome === BiomeType.SNOW ? '#fff' : '#4ade80' }}>
               {currentBiome}
             </span>
           </div>

           {/* Resources Section - MULTIPLE ITEMS */}
           <div className="mt-3 pt-2 border-t border-slate-700">
             <span className="text-xs uppercase text-slate-500 block mb-2">Findings</span>
             <div className="flex flex-col gap-3">
                
                {isEmpty && (
                  <span className="text-slate-600 text-xs italic">{language === 'pt' ? 'Nada encontrado.' : 'Nothing found.'}</span>
                )}

                {/* Vegetation */}
                {currentResources.vegetation.length > 0 && (
                  <div className="flex flex-col gap-1">
                     <span className="text-xs text-green-500/80 font-bold uppercase tracking-wide">Vegetation</span>
                     {currentResources.vegetation.map((veg, i) => (
                       <div key={i} className="flex items-center gap-2 pl-1">
                         <span className="text-sm">🌿</span>
                         <span className="text-green-200 text-xs font-semibold">{veg[language]}</span>
                       </div>
                     ))}
                  </div>
                )}

                {/* Animals */}
                {currentResources.animals.length > 0 && (
                  <div className="flex flex-col gap-1">
                     <span className="text-xs text-orange-500/80 font-bold uppercase tracking-wide">Fauna</span>
                     {currentResources.animals.map((anim, i) => (
                       <div key={i} className="flex items-center gap-2 pl-1 animate-pulse">
                         <span className="text-sm">🐾</span>
                         <span className="text-orange-200 text-xs font-semibold">{anim[language]}</span>
                       </div>
                     ))}
                  </div>
                )}

                {/* Minerals */}
                {currentResources.minerals.length > 0 && (
                  <div className="flex flex-col gap-1">
                     <span className="text-xs text-stone-500/80 font-bold uppercase tracking-wide">Minerals</span>
                     {currentResources.minerals.map((min, i) => (
                       <div key={i} className="flex items-center gap-2 pl-1">
                         <span className="text-sm">⛏️</span>
                         <span className="text-stone-300 text-xs font-semibold">{min[language]}</span>
                       </div>
                     ))}
                  </div>
                )}

                {/* Rare Stones */}
                {currentResources.rareStones.length > 0 && (
                  <div className="flex flex-col gap-1">
                     <span className="text-xs text-purple-500/80 font-bold uppercase tracking-wide">Rare Findings</span>
                     {currentResources.rareStones.map((rare, i) => (
                        <div key={i} className="flex items-center gap-2 mt-1 bg-purple-900/30 p-1 rounded border border-purple-500/30">
                          <span className="text-sm">💎</span>
                          <span className="text-purple-300 font-bold text-xs drop-shadow-md">{rare[language]}</span>
                        </div>
                     ))}
                  </div>
                )}

             </div>
           </div>

        </div>
      </div>

      {/* Bottom Left: D-Pad Controls (for mobile/mouse) - MOVED FROM RIGHT */}
      <div className="absolute bottom-8 left-8 pointer-events-auto flex flex-col items-center gap-1">
        <div className="flex gap-1">
          <button onClick={() => movePlayer(0, -1)} className="w-12 h-12 bg-slate-700 hover:bg-slate-600 rounded-tl-xl flex items-center justify-center text-white font-bold active:scale-95 shadow-lg border-b-4 border-slate-800 transition-all">↖</button>
          <button onClick={() => movePlayer(1, -1)} className="w-12 h-12 bg-slate-700 hover:bg-slate-600 rounded-tr-xl flex items-center justify-center text-white font-bold active:scale-95 shadow-lg border-b-4 border-slate-800 transition-all">↗</button>
        </div>
        <div className="flex gap-1">
          <button onClick={() => movePlayer(-1, 0)} className="w-12 h-12 bg-slate-700 hover:bg-slate-600 flex items-center justify-center text-white font-bold active:scale-95 shadow-lg border-b-4 border-slate-800 transition-all">←</button>
          <div className="w-12 h-12 flex items-center justify-center text-slate-500 font-bold bg-slate-800 rounded-full">P</div>
          <button onClick={() => movePlayer(1, 0)} className="w-12 h-12 bg-slate-700 hover:bg-slate-600 flex items-center justify-center text-white font-bold active:scale-95 shadow-lg border-b-4 border-slate-800 transition-all">→</button>
        </div>
        <div className="flex gap-1">
          <button onClick={() => movePlayer(-1, 1)} className="w-12 h-12 bg-slate-700 hover:bg-slate-600 rounded-bl-xl flex items-center justify-center text-white font-bold active:scale-95 shadow-lg border-b-4 border-slate-800 transition-all">↙</button>
          <button onClick={() => movePlayer(0, 1)} className="w-12 h-12 bg-slate-700 hover:bg-slate-600 rounded-br-xl flex items-center justify-center text-white font-bold active:scale-95 shadow-lg border-b-4 border-slate-800 transition-all">↘</button>
        </div>
        <div className="mt-2 text-xs text-slate-500 font-mono bg-slate-900/50 px-2 py-1 rounded text-center">
           ARROWS + COMBOS
        </div>
      </div>

      {/* --- CUSTOM MODALS --- */}
      
      {/* Save Modal */}
      {isSaveModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center pointer-events-auto backdrop-blur-sm">
          <div className="bg-slate-800 border border-slate-600 p-6 rounded-xl shadow-2xl w-80">
            <h4 className="text-white font-bold text-lg mb-4">Save Location</h4>
            <input 
              type="text" 
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              className="w-full bg-slate-900 border border-slate-600 text-white rounded p-2 mb-4 focus:border-blue-500 outline-none"
              placeholder="Name this location"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button 
                onClick={() => setSaveModalOpen(false)}
                className="px-3 py-1.5 text-slate-400 hover:text-white transition-colors text-sm"
              >
                Cancel
              </button>
              <button 
                onClick={confirmSave}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded font-bold text-sm transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center pointer-events-auto backdrop-blur-sm">
          <div className="bg-slate-800 border border-slate-600 p-6 rounded-xl shadow-2xl w-80">
            <h4 className="text-white font-bold text-lg mb-2">Delete Location?</h4>
            <p className="text-slate-400 text-sm mb-4">Are you sure you want to remove this bookmark?</p>
            <div className="flex justify-end gap-2">
              <button 
                onClick={() => setDeleteConfirmId(null)}
                className="px-3 py-1.5 text-slate-400 hover:text-white transition-colors text-sm"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDelete}
                className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded font-bold text-sm transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Controls;