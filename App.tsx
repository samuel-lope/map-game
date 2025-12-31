import React, { useState, useEffect, useCallback } from 'react';
import HexCanvas from './components/HexCanvas';
import Controls from './components/Controls';
import LandingPage from './components/LandingPage';
import { DEFAULT_HEX_SIZE, DEFAULT_RENDER_RADIUS, DEFAULT_SEED } from './constants';
import { MapSettings, HexCoordinate, MapSaveData, SavedLocation, Language } from './types';
import { getStartPositionFromSeed, getElevation } from './utils/rng';

const App: React.FC = () => {
  // Screen Dimensions
  const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });

  // Game State
  const [hasStarted, setHasStarted] = useState(false);
  const [settings, setSettings] = useState<MapSettings>({
    hexSize: DEFAULT_HEX_SIZE,
    renderRadius: DEFAULT_RENDER_RADIUS,
    seed: DEFAULT_SEED
  });
  const [language, setLanguage] = useState<Language>('pt');

  const [playerPos, setPlayerPos] = useState<HexCoordinate>({ q: 0, r: 0 });
  const [metersTraveled, setMetersTraveled] = useState(0);
  const [savedLocations, setSavedLocations] = useState<SavedLocation[]>([]);
  
  // UI Selection State
  const [selectedMarker, setSelectedMarker] = useState<SavedLocation | null>(null);

  // --- PERSISTENCE LOGIC ---

  const getStorageKey = (seed: string) => `hex_map_${seed}`;

  // Function to load data from LocalStorage
  const loadFromStorage = useCallback((seed: string) => {
    const key = getStorageKey(seed);
    const storedData = localStorage.getItem(key);
    
    if (storedData) {
      try {
        const parsed: MapSaveData = JSON.parse(storedData);
        // Ensure the seed matches (double check)
        if (parsed.seed === seed) {
          return parsed;
        }
      } catch (e) {
        console.error("Failed to parse save data", e);
      }
    }
    return null;
  }, []);

  // Function to save data to LocalStorage
  const saveToStorage = useCallback((seed: string, pos: HexCoordinate, locations: SavedLocation[]) => {
    const key = getStorageKey(seed);
    const elevation = getElevation(pos.q, pos.r, seed);
    
    const data: MapSaveData = {
      seed: seed,
      x: pos.q,
      y: pos.r,
      altitude: elevation,
      saved_positions: locations
    };

    localStorage.setItem(key, JSON.stringify(data));
  }, []);

  // --- INITIALIZATION ---

  // Handle Start (Load or New)
  const handleStartGame = () => {
    const saveData = loadFromStorage(settings.seed);
    
    if (saveData) {
      // Load existing
      setPlayerPos({ q: saveData.x, r: saveData.y });
      setSavedLocations(saveData.saved_positions || []);
      // Estimate distance based on displacement from origin (approx)
      setMetersTraveled(Math.abs(saveData.x) * 500 + Math.abs(saveData.y) * 500); 
    } else {
      // New Game
      const startPos = getStartPositionFromSeed(settings.seed);
      setPlayerPos(startPos);
      setSavedLocations([]);
      setMetersTraveled(0);
      
      // Create initial save file
      saveToStorage(settings.seed, startPos, []);
    }
    
    setHasStarted(true);
  };

  // Auto-save whenever player moves or saves a location
  useEffect(() => {
    if (hasStarted) {
      saveToStorage(settings.seed, playerPos, savedLocations);
    }
  }, [playerPos, savedLocations, hasStarted, settings.seed, saveToStorage]);


  // --- EVENT HANDLERS ---

  const handleSaveLocation = (name: string) => {
    const newLoc: SavedLocation = {
      id: Date.now().toString(),
      name,
      x: playerPos.q,
      y: playerPos.r,
      timestamp: Date.now()
    };
    setSavedLocations(prev => [...prev, newLoc]);
  };

  const handleDeleteLocation = (id: string) => {
    setSavedLocations(prev => prev.filter(loc => loc.id !== id));
    // If deleted marker was selected, close popup
    if (selectedMarker?.id === id) setSelectedMarker(null);
  };

  const handleTeleport = (loc: SavedLocation) => {
    setPlayerPos({ q: loc.x, r: loc.y });
    setSelectedMarker(null); // Close popup on teleport
  };

  const handleMarkerSelect = (loc: SavedLocation | null) => {
    setSelectedMarker(loc);
  };

  // Handle Resize
  useEffect(() => {
    const handleResize = () => {
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Movement Logic
  const movePlayer = useCallback((dq: number, dr: number) => {
    if (!hasStarted) return; // Prevent movement if not started

    setPlayerPos(prev => ({
      q: prev.q + dq,
      r: prev.r + dr
    }));
    // Each hex is now 500 meters
    setMetersTraveled(prev => prev + 500);
    
    // Deselect marker if we move
    setSelectedMarker(null);
  }, [hasStarted]);

  // Keyboard Controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!hasStarted) return;
      if (document.activeElement?.tagName === 'INPUT') return;

      switch (e.key.toLowerCase()) {
        case 'q': movePlayer(0, -1); break;
        case 'e': movePlayer(1, -1); break;
        case 'a': movePlayer(-1, 0); break;
        case 'd': movePlayer(1, 0); break;
        case 'z': movePlayer(-1, 1); break;
        case 'x': movePlayer(0, 1); break;
        case 'w': movePlayer(0, -1); break;
        case 's': movePlayer(0, 1); break;
        case 'escape': setSelectedMarker(null); break; 
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [movePlayer, hasStarted]);

  // Main Render Flow
  return (
    <div className="relative w-full h-full bg-slate-900 overflow-hidden text-slate-200">
      
      {!hasStarted ? (
        <LandingPage 
          seed={settings.seed} 
          setSeed={(val) => setSettings(prev => ({ ...prev, seed: val }))}
          onStart={handleStartGame}
        />
      ) : (
        <>
          <HexCanvas 
            width={dimensions.width}
            height={dimensions.height}
            playerPos={playerPos}
            settings={settings}
            savedLocations={savedLocations}
            onLocationSelect={handleMarkerSelect}
          />
          <Controls 
            settings={settings}
            setSettings={setSettings}
            playerPos={playerPos}
            movePlayer={movePlayer}
            metersTraveled={metersTraveled}
            savedLocations={savedLocations}
            onSaveLocation={handleSaveLocation}
            onDeleteLocation={handleDeleteLocation}
            onTeleport={handleTeleport}
            language={language}
            setLanguage={setLanguage}
          />
          
          {/* Help Overlay - only shows initially */}
          {metersTraveled === 0 && savedLocations.length === 0 && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none text-center opacity-70 animate-pulse z-50">
               <h1 className="text-4xl font-bold text-white mb-2 tracking-widest uppercase drop-shadow-lg">Explorar</h1>
               <p className="text-slate-200 font-bold bg-slate-900/50 px-4 py-1 rounded-full">Use Q W E A S D</p>
            </div>
          )}

          {/* Marker Details Popup */}
          {selectedMarker && (
             <div className="absolute top-20 left-1/2 transform -translate-x-1/2 bg-slate-800/90 backdrop-blur border border-yellow-500/50 p-4 rounded-xl shadow-2xl z-40 min-w-[280px] animate-in fade-in zoom-in duration-200">
                <div className="flex justify-between items-start mb-2 border-b border-slate-700 pb-2">
                  <h3 className="font-bold text-yellow-400 text-lg truncate pr-4">{selectedMarker.name}</h3>
                  <button onClick={() => setSelectedMarker(null)} className="text-slate-400 hover:text-white">✕</button>
                </div>
                <div className="text-xs text-slate-400 font-mono mb-4 flex gap-4">
                  <span>Q: <span className="text-white">{selectedMarker.x}</span></span>
                  <span>R: <span className="text-white">{selectedMarker.y}</span></span>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleTeleport(selectedMarker)}
                    className="flex-1 bg-emerald-700 hover:bg-emerald-600 text-white font-bold py-2 px-3 rounded text-sm transition-colors shadow-lg flex items-center justify-center gap-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="currentColor"><path d="M480-388q54-50 84-80t47-50q16-20 22.5-37t6.5-37q0-36-26-62t-62-26q-21 0-40.5 8.5T480-648q-12-15-31-23.5t-41-8.5q-36 0-62 26t-26 62q0 21 6 37t22 36q17 20 46 50t86 81Zm0 202q122-112 181-203.5T720-552q0-109-69.5-178.5T480-800q-101 0-170.5 69.5T240-552q0 71 59 162.5T480-186Zm0 106Q319-217 239.5-334.5T160-552q0-150 96.5-239T480-880q127 0 223.5 89T800-552q0 100-79.5 217.5T480-80Zm0-480Z"/></svg>
                    TELEPORT
                  </button>
                  <button 
                    onClick={() => handleDeleteLocation(selectedMarker.id)}
                    className="bg-red-900/50 hover:bg-red-700 text-red-200 font-bold py-2 px-3 rounded text-sm transition-colors border border-red-900"
                    title="Delete"
                  >
                    🗑
                  </button>
                </div>
             </div>
          )}
        </>
      )}
    </div>
  );
};

export default App;