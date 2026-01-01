import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import HexCanvas from './components/HexCanvas';
import Controls from './components/Controls';
import LandingPage from './components/LandingPage';
import Dock from './components/Dock';
import { DEFAULT_HEX_SIZE, DEFAULT_RENDER_RADIUS, DEFAULT_SEED } from './constants';
import { MapSettings, HexCoordinate, MapSaveData, SavedLocation, Language, LocalizedName, HexResources } from './types';
import { generateRandomCoordinate, getElevation, getHexResources, getBiome } from './utils/rng';
import { hexDistance, rotateMoveVector } from './utils/hexMath';

// Easing function for smooth animation (Ease In Out Cubic)
const easeInOutCubic = (t: number): number => {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
};

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
  const [spawnPos, setSpawnPos] = useState<HexCoordinate>({ q: 0, r: 0 });
  const [metersTraveled, setMetersTraveled] = useState(0);
  const [savedLocations, setSavedLocations] = useState<SavedLocation[]>([]);
  
  // Resource State
  const [currentResources, setCurrentResources] = useState<HexResources>({
    animals: [],
    minerals: [],
    rareStones: [],
    vegetation: []
  });
  const [recentItems, setRecentItems] = useState<LocalizedName[]>([]);

  // View State
  const [rotation, setRotation] = useState(0); // Degrees
  const [isTeleporting, setIsTeleporting] = useState(false); // Animation State
  
  // UI Selection State
  const [selectedMarker, setSelectedMarker] = useState<SavedLocation | null>(null);

  // Input State
  const pressedKeys = useRef<Set<string>>(new Set());
  const animationFrameRef = useRef<number>(0);

  // Calculate Distance from Spawn
  const distanceFromSpawn = useMemo(() => {
    return hexDistance(spawnPos, playerPos) * 500;
  }, [spawnPos, playerPos]);

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
  const saveToStorage = useCallback((seed: string, pos: HexCoordinate, spawn: HexCoordinate, locations: SavedLocation[]) => {
    const key = getStorageKey(seed);
    const elevation = getElevation(pos.q, pos.r, seed);
    
    const data: MapSaveData = {
      seed: seed,
      x: pos.q,
      y: pos.r,
      altitude: elevation,
      saved_positions: locations,
      start_x: spawn.q,
      start_y: spawn.r
    };

    localStorage.setItem(key, JSON.stringify(data));
  }, []);

  // --- INITIALIZATION ---

  // Handle Start (Load or New)
  const handleStartGame = () => {
    const saveData = loadFromStorage(settings.seed);
    
    if (saveData) {
      // Load existing session for this seed
      setPlayerPos({ q: saveData.x, r: saveData.y });
      // Restore spawn point if available, otherwise default to current pos (for old saves)
      setSpawnPos({ 
        q: saveData.start_x !== undefined ? saveData.start_x : saveData.x, 
        r: saveData.start_y !== undefined ? saveData.start_y : saveData.y 
      });
      setSavedLocations(saveData.saved_positions || []);
    } else {
      // New Game - Randomize Start Position
      const initialPos = generateRandomCoordinate();
      setPlayerPos(initialPos);
      setSpawnPos(initialPos);
      setSavedLocations([]);
      setMetersTraveled(0);
      
      // Create initial save file
      saveToStorage(settings.seed, initialPos, initialPos, []);
    }
    
    setHasStarted(true);
  };

  // Auto-save whenever player moves or saves a location
  // Skip auto-save during teleport animation to avoid thrashing storage
  useEffect(() => {
    if (hasStarted && !isTeleporting) {
      saveToStorage(settings.seed, playerPos, spawnPos, savedLocations);
    }
  }, [playerPos, spawnPos, savedLocations, hasStarted, settings.seed, saveToStorage, isTeleporting]);


  // --- RESOURCE CALCULATION LOGIC ---
  useEffect(() => {
    if (!hasStarted) return;
    
    const currentBiome = getBiome(playerPos.q, playerPos.r, settings.seed);
    const resources = getHexResources(playerPos.q, playerPos.r, settings.seed, currentBiome);
    setCurrentResources(resources);

    // Update Dock Items
    // Collect all valid resource items found in this hex
    const foundItems: LocalizedName[] = [
      ...resources.rareStones,
      ...resources.animals,
      ...resources.vegetation,
      ...resources.minerals
    ];

    if (foundItems.length > 0) {
      setRecentItems(prev => {
        let newHistory = [...prev];
        
        foundItems.forEach(item => {
           // Move to front if exists, or add new
           newHistory = newHistory.filter(h => h.en !== item.en);
           newHistory.unshift(item);
        });

        // Limit to 6
        return newHistory.slice(0, 6);
      });
    }

  }, [playerPos, settings.seed, hasStarted]);


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

  // Teleport Animation Logic
  const handleTeleport = (loc: SavedLocation) => {
    if (isTeleporting) return;

    setSelectedMarker(null); // Close popup
    
    const startPos = playerPos;
    const endPos = { q: loc.x, r: loc.y };
    
    // Calculate distance to determine animation duration
    // Distances can be large, so we clamp the duration between 1s and 3s
    const dist = hexDistance(startPos, endPos);
    
    // If we are already there, do nothing
    if (dist < 0.1) return;

    setIsTeleporting(true);

    const baseDuration = 1000; // Minimum 1 second
    const durationPerHex = 10; // +10ms per hex
    const maxDuration = 3000; // Cap at 3 seconds max
    
    const duration = Math.min(maxDuration, baseDuration + (dist * durationPerHex));
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Apply easing
      const ease = easeInOutCubic(progress);

      // Interpolate Coordinates
      const currentQ = startPos.q + (endPos.q - startPos.q) * ease;
      const currentR = startPos.r + (endPos.r - startPos.r) * ease;

      setPlayerPos({ q: currentQ, r: currentR });

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        // Finished
        setPlayerPos(endPos); // Snap to exact target
        setIsTeleporting(false);
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);
  };

  // Clean up animation on unmount
  useEffect(() => {
    return () => cancelAnimationFrame(animationFrameRef.current);
  }, []);

  const handleMarkerSelect = (loc: SavedLocation | null) => {
    if (!isTeleporting) {
      setSelectedMarker(loc);
    }
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
    if (!hasStarted || isTeleporting) return; // Prevent movement if not started or teleporting

    // Adjust the input vector based on current rotation
    const rotated = rotateMoveVector(dq, dr, rotation);

    setPlayerPos(prev => ({
      q: prev.q + rotated.q,
      r: prev.r + rotated.r
    }));
    // Each hex is now 500 meters
    setMetersTraveled(prev => prev + 500);
    
    // Deselect marker if we move
    setSelectedMarker(null);
  }, [hasStarted, rotation, isTeleporting]);

  // Keyboard Controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!hasStarted || isTeleporting) return;
      if (document.activeElement?.tagName === 'INPUT') return;

      const key = e.key;
      pressedKeys.current.add(key);

      // Prevent default scrolling for arrow keys
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) {
        e.preventDefault();
      }

      if (key === 'Escape') {
        setSelectedMarker(null);
        return;
      }

      // Check Key Combinations
      const up = pressedKeys.current.has('ArrowUp');
      const down = pressedKeys.current.has('ArrowDown');
      const left = pressedKeys.current.has('ArrowLeft');
      const right = pressedKeys.current.has('ArrowRight');

      let dq = 0;
      let dr = 0;
      let shouldMove = false;

      // Logic: Up/Down only work if Left/Right are also pressed
      
      if (key === 'ArrowLeft') {
         if (up) { dq = 0; dr = -1; shouldMove = true; } // Up + Left = NW
         else if (down) { dq = -1; dr = 1; shouldMove = true; } // Down + Left = SW
         else { dq = -1; dr = 0; shouldMove = true; } // Left only = W
      }
      else if (key === 'ArrowRight') {
         if (up) { dq = 1; dr = -1; shouldMove = true; } // Up + Right = NE
         else if (down) { dq = 0; dr = 1; shouldMove = true; } // Down + Right = SE
         else { dq = 1; dr = 0; shouldMove = true; } // Right only = E
      }
      else if (key === 'ArrowUp') {
         if (left) { dq = 0; dr = -1; shouldMove = true; } // Up + Left = NW
         else if (right) { dq = 1; dr = -1; shouldMove = true; } // Up + Right = NE
         // Up alone does nothing
      }
      else if (key === 'ArrowDown') {
         if (left) { dq = -1; dr = 1; shouldMove = true; } // Down + Left = SW
         else if (right) { dq = 0; dr = 1; shouldMove = true; } // Down + Right = SE
         // Down alone does nothing
      }

      if (shouldMove) {
        movePlayer(dq, dr);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      pressedKeys.current.delete(e.key);
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [movePlayer, hasStarted, isTeleporting]);

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
            rotation={rotation}
            savedLocations={savedLocations}
            onLocationSelect={handleMarkerSelect}
          />
          <Controls 
            settings={settings}
            setSettings={setSettings}
            playerPos={playerPos}
            movePlayer={movePlayer}
            metersTraveled={metersTraveled}
            distanceFromSpawn={distanceFromSpawn}
            rotation={rotation}
            setRotation={setRotation}
            savedLocations={savedLocations}
            onSaveLocation={handleSaveLocation}
            onDeleteLocation={handleDeleteLocation}
            onTeleport={handleTeleport}
            language={language}
            setLanguage={setLanguage}
            currentResources={currentResources}
          />
          
          <Dock items={recentItems} language={language} />

          {/* Help Overlay - only shows initially */}
          {metersTraveled === 0 && savedLocations.length === 0 && !isTeleporting && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none text-center opacity-70 animate-pulse z-50">
               <h1 className="text-4xl font-bold text-white mb-2 tracking-widest uppercase drop-shadow-lg">Explorar</h1>
               <div className="flex flex-col gap-1 items-center bg-slate-900/50 px-6 py-2 rounded-xl border border-white/10">
                 <p className="text-white font-bold text-lg">Use as Setas</p>
                 <p className="text-slate-300 text-xs">← Esquerda / Direita →</p>
                 <p className="text-slate-400 text-[10px] uppercase tracking-wider">Combine com ↑ Cima / Baixo ↓</p>
               </div>
            </div>
          )}

          {/* Teleporting State Indicator */}
          {isTeleporting && (
             <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 pointer-events-none z-50">
                <div className="bg-blue-600/80 backdrop-blur text-white px-4 py-2 rounded-full font-bold shadow-lg animate-bounce border border-blue-400">
                   TRAVELING...
                </div>
             </div>
          )}

          {/* Marker Details Popup */}
          {selectedMarker && !isTeleporting && (
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