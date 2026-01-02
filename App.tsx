import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import HexCanvas from './components/HexCanvas';
import Controls from './components/Controls';
import LandingPage from './components/LandingPage';
import Dock from './components/Dock';
import MinimapModal from './components/MinimapModal';
import { DEFAULT_HEX_SIZE, DEFAULT_RENDER_RADIUS, DEFAULT_SEED, DEFAULT_BIOME_WEIGHTS, CRAFTING_RECIPES } from './constants';
import { MapSettings, HexCoordinate, MapSaveData, SavedLocation, Language, LocalizedName, HexResources, ExploredBounds, InventoryContainer, InventoryItem } from './types';
import { generateRandomCoordinate, getElevation, getHexResources, getBiome } from './utils/rng';
import { hexDistance, rotateMoveVector } from './utils/hexMath';

// Easing function for smooth animation (Ease In Out Cubic)
const easeInOutCubic = (t: number): number => {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
};

// Initial Empty Inventory Helper
const createEmptyInventory = (): InventoryContainer[] => {
  return Array.from({ length: 6 }, (_, i) => ({
    id: i,
    name: `Container ${i + 1}`,
    slots: Array(36).fill(null)
  }));
};

const App: React.FC = () => {
  // Screen Dimensions - Initialize with integer values
  const [dimensions, setDimensions] = useState({ 
    width: Math.ceil(window.innerWidth), 
    height: Math.ceil(window.innerHeight) 
  });

  // Game State
  const [hasStarted, setHasStarted] = useState(false);
  
  // Settings State
  const [settings, setSettings] = useState<MapSettings>({
    hexSize: DEFAULT_HEX_SIZE,
    renderRadius: DEFAULT_RENDER_RADIUS,
    seed: DEFAULT_SEED,
    biomeWeights: DEFAULT_BIOME_WEIGHTS
  });

  const [language, setLanguage] = useState<Language>('pt');

  const [playerPos, setPlayerPos] = useState<HexCoordinate>({ q: 0, r: 0 });
  const [spawnPos, setSpawnPos] = useState<HexCoordinate>({ q: 0, r: 0 });
  const [metersTraveled, setMetersTraveled] = useState(0);
  const [savedLocations, setSavedLocations] = useState<SavedLocation[]>([]);
  
  // Inventory State
  const [inventory, setInventory] = useState<InventoryContainer[]>(createEmptyInventory());
  // Dropped Items State: Key is "q,r", Value is array of items
  const [droppedItems, setDroppedItems] = useState<Record<string, InventoryItem[]>>({});
  
  // Looting Interaction State
  const [clickedHex, setClickedHex] = useState<HexCoordinate | null>(null);
  const [clickedHexResources, setClickedHexResources] = useState<HexResources | null>(null);

  // Crafting State (6 Slots)
  const [craftingSlots, setCraftingSlots] = useState<(InventoryItem | null)[]>(Array(6).fill(null));

  // Bounds Tracking
  const [exploredBounds, setExploredBounds] = useState<ExploredBounds>({ minQ: 0, maxQ: 0, minR: 0, maxR: 0 });
  
  // Resource State (Current Player Position)
  const [currentResources, setCurrentResources] = useState<HexResources>({
    animals: [],
    minerals: [],
    rareStones: [],
    vegetation: [],
    droppedItems: []
  });

  // View State
  const [rotation, setRotation] = useState(0); // Degrees
  const [isTeleporting, setIsTeleporting] = useState(false); // Animation State
  
  // UI Selection State
  const [selectedMarker, setSelectedMarker] = useState<SavedLocation | null>(null);
  const [isMinimapOpen, setIsMinimapOpen] = useState(false);

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
  const saveToStorage = useCallback((
    currentSettings: MapSettings, 
    pos: HexCoordinate, 
    spawn: HexCoordinate, 
    locations: SavedLocation[], 
    bounds: ExploredBounds, 
    inv: InventoryContainer[],
    dropped: Record<string, InventoryItem[]>
  ) => {
    const key = getStorageKey(currentSettings.seed);
    const elevation = getElevation(pos.q, pos.r, currentSettings);
    
    const data: MapSaveData = {
      seed: currentSettings.seed,
      x: pos.q,
      y: pos.r,
      altitude: elevation,
      saved_positions: locations,
      inventory: inv,
      dropped_items: dropped,
      start_x: spawn.q,
      start_y: spawn.r,
      explored_bounds: bounds,
      biome_weights: currentSettings.biomeWeights
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
      setSpawnPos({ 
        q: saveData.start_x !== undefined ? saveData.start_x : saveData.x, 
        r: saveData.start_y !== undefined ? saveData.start_y : saveData.y 
      });
      setSavedLocations(saveData.saved_positions || []);
      
      if (saveData.inventory) {
        setInventory(saveData.inventory);
      }
      if (saveData.dropped_items) {
        setDroppedItems(saveData.dropped_items);
      }
      
      // Load Bounds
      if (saveData.explored_bounds) {
        setExploredBounds(saveData.explored_bounds);
      } else {
        setExploredBounds({
          minQ: saveData.x, maxQ: saveData.x, minR: saveData.y, maxR: saveData.y
        });
      }

      // If existing save has specific weights, load them to preserve map consistency
      if (saveData.biome_weights) {
        setSettings(prev => ({ ...prev, biomeWeights: saveData.biome_weights! }));
      }

    } else {
      // New Game
      const initialPos = generateRandomCoordinate();
      setPlayerPos(initialPos);
      setSpawnPos(initialPos);
      setSavedLocations([]);
      setInventory(createEmptyInventory());
      setDroppedItems({});
      setMetersTraveled(0);
      
      const initialBounds = {
        minQ: initialPos.q, maxQ: initialPos.q, minR: initialPos.r, maxR: initialPos.r
      };
      setExploredBounds(initialBounds);
      
      // Create initial save file
      saveToStorage(settings, initialPos, initialPos, [], initialBounds, createEmptyInventory(), {});
    }
    
    setHasStarted(true);
  };

  // Update bounds whenever player moves
  useEffect(() => {
    if (!hasStarted) return;
    
    setExploredBounds(prev => {
      const newBounds = {
        minQ: Math.min(prev.minQ, playerPos.q),
        maxQ: Math.max(prev.maxQ, playerPos.q),
        minR: Math.min(prev.minR, playerPos.r),
        maxR: Math.max(prev.maxR, playerPos.r)
      };
      
      // Only update state if something changed
      if (newBounds.minQ !== prev.minQ || newBounds.maxQ !== prev.maxQ || 
          newBounds.minR !== prev.minR || newBounds.maxR !== prev.maxR) {
        return newBounds;
      }
      return prev;
    });
  }, [playerPos, hasStarted]);

  // Auto-save
  useEffect(() => {
    if (hasStarted && !isTeleporting) {
      saveToStorage(settings, playerPos, spawnPos, savedLocations, exploredBounds, inventory, droppedItems);
    }
  }, [playerPos, spawnPos, savedLocations, exploredBounds, inventory, droppedItems, hasStarted, settings, saveToStorage, isTeleporting]);


  // --- RESOURCE CALCULATION LOGIC ---
  useEffect(() => {
    if (!hasStarted) return;
    
    // For Status Panel
    const currentBiome = getBiome(playerPos.q, playerPos.r, settings);
    const resources = getHexResources(playerPos.q, playerPos.r, settings.seed, currentBiome);
    
    // Merge dropped items for current position
    const key = `${playerPos.q},${playerPos.r}`;
    const groundItems = droppedItems[key] || [];
    
    setCurrentResources({ ...resources, droppedItems: groundItems });

  }, [playerPos, settings, hasStarted, droppedItems]);


  // --- EVENT HANDLERS ---

  const handleHexClick = (hex: HexCoordinate) => {
    // UPDATED LOGIC: Clicking map only selects markers or closes UI. 
    // It does NOT open the loot menu anymore.

    // 1. Check if it's a saved location for teleport/delete purposes
    const found = savedLocations.find(loc => loc.x === hex.q && loc.y === hex.r);
    setSelectedMarker(found || null);

    // 2. If clicking anywhere else, close the loot menu if open
    if (clickedHex && (clickedHex.q !== hex.q || clickedHex.r !== hex.r)) {
       setClickedHex(null);
       // We do NOT reset crafting slots when closing Loot menu anymore, 
       // because crafting is now in the Dock.
    }
  };

  // Helper to add item to inventory
  const addToInventory = (item: InventoryItem, source: 'nature' | 'ground' | 'crafting', hex?: HexCoordinate) => {
    // Find first empty slot in the inventory (across all containers)
    let targetContainerIdx = -1;
    let targetSlotIdx = -1;

    for (let i = 0; i < inventory.length; i++) {
        const slotIdx = inventory[i].slots.findIndex(s => s === null);
        if (slotIdx !== -1) {
            targetContainerIdx = i;
            targetSlotIdx = slotIdx;
            break;
        }
    }

    if (targetContainerIdx !== -1 && targetSlotIdx !== -1) {
        const newInventory = [...inventory];
        newInventory[targetContainerIdx] = {
            ...newInventory[targetContainerIdx],
            slots: [...newInventory[targetContainerIdx].slots]
        };
        newInventory[targetContainerIdx].slots[targetSlotIdx] = item;

        setInventory(newInventory);

        // Remove from ground if applicable
        if (source === 'ground' && hex) {
            const key = `${hex.q},${hex.r}`;
            setDroppedItems(prev => {
                const current = prev[key] || [];
                const updated = current.filter(i => i.uuid !== item.uuid);
                
                // Update the Loot Menu View immediately
                if (clickedHex && clickedHex.q === hex.q && clickedHex.r === hex.r && clickedHexResources) {
                    setClickedHexResources({
                        ...clickedHexResources,
                        droppedItems: updated
                    });
                }

                if (updated.length === 0) {
                    const { [key]: _, ...rest } = prev;
                    return rest;
                }
                return { ...prev, [key]: updated };
            });
        }
    } else {
        alert(language === 'pt' ? 'Inventário Cheio!' : 'Inventory Full!');
    }
  };

  const handleCollectItem = (item: LocalizedName | InventoryItem, source: 'nature' | 'ground', hex?: HexCoordinate) => {
      const newItem: InventoryItem = {
          ...item,
          uuid: (item as InventoryItem).uuid || crypto.randomUUID(),
          quantity: (item as InventoryItem).quantity || 1
      };
      addToInventory(newItem, source, hex);
  };

  // --- CRAFTING LOGIC ---

  const handleAddToCrafting = (containerId: number, slotIndex: number) => {
    const container = inventory.find(c => c.id === containerId);
    if (!container) return;
    const item = container.slots[slotIndex];
    if (!item) return;

    // Find first empty crafting slot
    const emptySlotIdx = craftingSlots.findIndex(s => s === null);
    
    if (emptySlotIdx !== -1) {
      // Move from Inventory to Crafting Slot
      const newInventory = inventory.map(c => {
          if (c.id === containerId) {
              const newSlots = [...c.slots];
              newSlots[slotIndex] = null;
              return { ...c, slots: newSlots };
          }
          return c;
      });
      setInventory(newInventory);

      const newCraftingSlots = [...craftingSlots];
      newCraftingSlots[emptySlotIdx] = item;
      setCraftingSlots(newCraftingSlots);
    } else {
      alert(language === 'pt' ? 'Mesa de combinação cheia!' : 'Crafting table full!');
    }
  };

  const handleReturnFromCrafting = (index: number) => {
    const item = craftingSlots[index];
    if (!item) return;

    // Return to inventory
    addToInventory(item, 'crafting'); // Treat like any addition

    const newSlots = [...craftingSlots];
    newSlots[index] = null;
    setCraftingSlots(newSlots);
  };

  const handleCombine = () => {
    // 1. Tally up ingredients in the grid
    const ingredients: Record<string, number> = {};
    const filledSlots: number[] = [];

    craftingSlots.forEach((slot, idx) => {
       if (slot) {
         filledSlots.push(idx);
         ingredients[slot.en] = (ingredients[slot.en] || 0) + slot.quantity;
       }
    });

    if (filledSlots.length === 0) return;

    // 2. Find matching recipe
    const recipe = CRAFTING_RECIPES.find(r => {
       // Check if all inputs are satisfied
       return r.inputs.every(req => (ingredients[req.nameEn] || 0) >= req.quantity) &&
              Object.keys(ingredients).every(ingName => r.inputs.some(req => req.nameEn === ingName));
    });

    if (recipe) {
       // 3. Consume Ingredients
       const newSlots = [...craftingSlots];
       
       // Simple consumption: Clear all slots used.
       filledSlots.forEach(idx => newSlots[idx] = null);
       setCraftingSlots(newSlots);

       // 4. Create Output
       const outputItem: InventoryItem = {
          ...recipe.output,
          uuid: crypto.randomUUID()
       };

       addToInventory(outputItem, 'crafting');
       alert(language === 'pt' ? `Criado: ${outputItem.pt}!` : `Crafted: ${outputItem.en}!`);

    } else {
       alert(language === 'pt' ? 'Combinação inválida.' : 'Invalid combination.');
    }
  };


  // Handle Drop Item from Inventory
  const handleDropItem = (containerId: number, slotIndex: number) => {
      const container = inventory.find(c => c.id === containerId);
      if (!container) return;
      const item = container.slots[slotIndex];
      if (!item) return;

      // 1. Remove from Inventory
      const newInventory = inventory.map(c => {
          if (c.id === containerId) {
              const newSlots = [...c.slots];
              newSlots[slotIndex] = null;
              return { ...c, slots: newSlots };
          }
          return c;
      });
      setInventory(newInventory);

      // 2. Add to Ground at Player Position
      const key = `${playerPos.q},${playerPos.r}`;
      setDroppedItems(prev => {
          const current = prev[key] || [];
          const updated = [...current, item];
          return { ...prev, [key]: updated };
      });
  };

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
    if (selectedMarker?.id === id) setSelectedMarker(null);
  };

  // Teleport Animation Logic
  const handleTeleport = (loc: SavedLocation) => {
    if (isTeleporting) return;

    setSelectedMarker(null);
    setClickedHex(null); // Close Loot Menu
    // We do NOT clear crafting slots on teleport if they are in inventory now, 
    // but maybe good practice to reset if we consider crafting a stationary activity?
    // Let's keep them for now, assuming portable crafting.
    setIsMinimapOpen(false);
    
    const startPos = playerPos;
    const endPos = { q: loc.x, r: loc.y };
    const dist = hexDistance(startPos, endPos);
    
    if (dist < 0.1) return;

    setIsTeleporting(true);

    const baseDuration = 1000;
    const durationPerHex = 10;
    const maxDuration = 3000;
    
    const duration = Math.min(maxDuration, baseDuration + (dist * durationPerHex));
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = easeInOutCubic(progress);

      const currentQ = startPos.q + (endPos.q - startPos.q) * ease;
      const currentR = startPos.r + (endPos.r - startPos.r) * ease;

      setPlayerPos({ q: currentQ, r: currentR });

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        setPlayerPos(endPos); 
        setIsTeleporting(false);
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    const handleResize = () => {
      setDimensions({ 
        width: Math.ceil(window.innerWidth), 
        height: Math.ceil(window.innerHeight) 
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const movePlayer = useCallback((dq: number, dr: number) => {
    if (!hasStarted || isTeleporting) return;

    const rotated = rotateMoveVector(dq, dr, rotation);

    setPlayerPos(prev => ({
      q: prev.q + rotated.q,
      r: prev.r + rotated.r
    }));
    setMetersTraveled(prev => prev + 500);
    setSelectedMarker(null);
    setClickedHex(null); // Close loot menu on move
  }, [hasStarted, rotation, isTeleporting]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!hasStarted || isTeleporting) return;
      if (document.activeElement?.tagName === 'INPUT') return;

      const key = e.key;
      pressedKeys.current.add(key);

      // --- LOOT INTERACTION (Press 'C') ---
      if (key.toLowerCase() === 'c') {
         // Calculate resources for Current Player Position
         const biome = getBiome(playerPos.q, playerPos.r, settings);
         const resources = getHexResources(playerPos.q, playerPos.r, settings.seed, biome);
         
         // Fetch dropped items for Current Player Position
         const itemKey = `${playerPos.q},${playerPos.r}`;
         const groundItems = droppedItems[itemKey] || [];

         setClickedHex(playerPos);
         setClickedHexResources({ ...resources, droppedItems: groundItems });
         return;
      }

      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) {
        e.preventDefault();
      }

      if (key === 'Escape') {
        setSelectedMarker(null);
        setClickedHex(null);
        setIsMinimapOpen(false);
        return;
      }

      if (key.toLowerCase() === 'm') {
        setIsMinimapOpen(prev => !prev);
      }

      const up = pressedKeys.current.has('ArrowUp');
      const down = pressedKeys.current.has('ArrowDown');
      const left = pressedKeys.current.has('ArrowLeft');
      const right = pressedKeys.current.has('ArrowRight');

      let dq = 0;
      let dr = 0;
      let shouldMove = false;

      if (key === 'ArrowLeft') {
         if (up) { dq = 0; dr = -1; shouldMove = true; } 
         else if (down) { dq = -1; dr = 1; shouldMove = true; } 
         else { dq = -1; dr = 0; shouldMove = true; } 
      }
      else if (key === 'ArrowRight') {
         if (up) { dq = 1; dr = -1; shouldMove = true; } 
         else if (down) { dq = 0; dr = 1; shouldMove = true; } 
         else { dq = 1; dr = 0; shouldMove = true; } 
      }
      else if (key === 'ArrowUp') {
         if (left) { dq = 0; dr = -1; shouldMove = true; } 
         else if (right) { dq = 1; dr = -1; shouldMove = true; } 
      }
      else if (key === 'ArrowDown') {
         if (left) { dq = -1; dr = 1; shouldMove = true; } 
         else if (right) { dq = 0; dr = 1; shouldMove = true; } 
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
  }, [movePlayer, hasStarted, isTeleporting, playerPos, settings, droppedItems]);

  return (
    <div className="relative w-full h-full bg-slate-900 overflow-hidden text-slate-200">
      
      {!hasStarted ? (
        <LandingPage 
          seed={settings.seed} 
          setSeed={(val) => setSettings(prev => ({ ...prev, seed: val }))}
          weights={settings.biomeWeights}
          setWeights={(weights) => setSettings(prev => ({ ...prev, biomeWeights: weights }))}
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
            onHexClick={handleHexClick}
            selectedLocation={selectedMarker}
          />
          <Controls 
            settings={settings}
            setSettings={setSettings}
            playerPos={playerPos}
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
            onOpenMinimap={() => setIsMinimapOpen(true)}
          />
          
          {/* Inventory Dock - NOW HANDLES CRAFTING UI */}
          <Dock 
            inventory={inventory} 
            language={language} 
            onDropItem={handleDropItem}
            onAddToCrafting={handleAddToCrafting} 
            onRemoveFromCrafting={handleReturnFromCrafting}
            craftingSlots={craftingSlots}
            onCombine={handleCombine}
          />

          {/* LOOT MENU (C) - SIMPLIFIED TO LOOT ONLY */}
          {clickedHex && clickedHexResources && (
             <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-slate-900/95 backdrop-blur-md border border-slate-600 rounded-xl p-4 shadow-2xl z-50 w-[350px] animate-in fade-in zoom-in duration-200">
                <div className="flex justify-between items-center mb-4 border-b border-slate-700 pb-2">
                   <div className="flex flex-col">
                      <h3 className="text-white font-bold text-lg">{language === 'pt' ? 'Recursos Locais' : 'Local Resources'}</h3>
                      <span className="text-slate-500 text-xs font-mono">Q:{clickedHex.q} R:{clickedHex.r}</span>
                   </div>
                   <button onClick={() => setClickedHex(null)} className="text-slate-400 hover:text-white">✕</button>
                </div>

                <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-700">
                    {[
                        ...clickedHexResources.droppedItems,
                        ...clickedHexResources.vegetation, 
                        ...clickedHexResources.animals, 
                        ...clickedHexResources.minerals, 
                        ...clickedHexResources.rareStones
                    ].length === 0 ? (
                        <p className="text-slate-500 italic text-center text-sm py-4">{language === 'pt' ? 'Nada aqui.' : 'Nothing here.'}</p>
                    ) : (
                        <>
                           {/* DROPPED ITEMS */}
                           {clickedHexResources.droppedItems.length > 0 && (
                               <div className="mb-2">
                                   <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{language === 'pt' ? 'No Chão' : 'On Ground'}</div>
                                   {clickedHexResources.droppedItems.map((item, i) => (
                                       <LootItem key={`drop-${item.uuid}`} item={item} language={language} onCollect={() => handleCollectItem(item, 'ground', clickedHex)} isDropped={true} />
                                   ))}
                               </div>
                           )}

                           {/* NATURAL RESOURCES */}
                           {(clickedHexResources.vegetation.length > 0 || clickedHexResources.animals.length > 0 || clickedHexResources.minerals.length > 0 || clickedHexResources.rareStones.length > 0) && (
                               <div>
                                   <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{language === 'pt' ? 'Natureza' : 'Nature'}</div>
                                   {clickedHexResources.vegetation.map((item, i) => (
                                       <LootItem key={`veg-${i}`} item={item} language={language} onCollect={() => handleCollectItem(item, 'nature')} />
                                   ))}
                                   {clickedHexResources.animals.map((item, i) => (
                                       <LootItem key={`anim-${i}`} item={item} language={language} onCollect={() => handleCollectItem(item, 'nature')} />
                                   ))}
                                   {clickedHexResources.minerals.map((item, i) => (
                                       <LootItem key={`min-${i}`} item={item} language={language} onCollect={() => handleCollectItem(item, 'nature')} />
                                   ))}
                                   {clickedHexResources.rareStones.map((item, i) => (
                                       <LootItem key={`rare-${i}`} item={item} language={language} onCollect={() => handleCollectItem(item, 'nature')} />
                                   ))}
                               </div>
                           )}
                        </>
                    )}
                </div>
             </div>
          )}

          {metersTraveled === 0 && savedLocations.length === 0 && !isTeleporting && !clickedHex && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none text-center opacity-70 animate-pulse z-40">
               <h1 className="text-4xl font-bold text-white mb-2 tracking-widest uppercase drop-shadow-lg">Explorar</h1>
               <div className="flex flex-col gap-1 items-center bg-slate-900/50 px-6 py-2 rounded-xl border border-white/10">
                 <p className="text-white font-bold text-lg">Use as Setas</p>
                 <p className="text-slate-300 text-xs">← Esquerda / Direita →</p>
               </div>
            </div>
          )}

          {isTeleporting && (
             <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 pointer-events-none z-50">
                <div className="bg-blue-600/80 backdrop-blur text-white px-4 py-2 rounded-full font-bold shadow-lg animate-bounce border border-blue-400">
                   TRAVELING...
                </div>
             </div>
          )}

          {isMinimapOpen && (
            <MinimapModal 
              seed={settings.seed}
              bounds={exploredBounds}
              playerPos={playerPos}
              onClose={() => setIsMinimapOpen(false)}
              language={language}
              settings={settings}
            />
          )}

        </>
      )}
    </div>
  );
};

// Helper Component for Loot Items
const LootItem: React.FC<{ item: LocalizedName; language: Language; onCollect: () => void; isDropped?: boolean }> = ({ item, language, onCollect, isDropped }) => (
    <div className={`flex items-center justify-between p-2 rounded border transition-colors mb-1 ${isDropped ? 'bg-slate-800/80 border-blue-900/50' : 'bg-slate-800 border-slate-700 hover:border-slate-500'}`}>
        <div className="flex items-center gap-2 overflow-hidden">
            {item.image ? (
                <img src={item.image} alt="icon" className="w-8 h-8 rounded bg-black object-cover" />
            ) : (
                <div className="w-8 h-8 bg-slate-700 rounded flex items-center justify-center text-xs">?</div>
            )}
            <span className={`text-sm truncate ${isDropped ? 'text-blue-200' : 'text-slate-200'}`}>{item[language]}</span>
        </div>
        <button 
            onClick={onCollect}
            className="ml-2 bg-blue-700 hover:bg-blue-600 text-white text-[10px] font-bold px-2 py-1.5 rounded uppercase tracking-wide shadow-sm"
        >
            {language === 'pt' ? 'Pegar' : 'Take'}
        </button>
    </div>
);

export default App;