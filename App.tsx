
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import HexCanvas from './components/HexCanvas';
import Controls from './components/Controls';
import LandingPage from './components/LandingPage';
import Dock from './components/Dock';
import MinimapModal from './components/MinimapModal';
import PeriodicTableModal from './components/PeriodicTableModal';
import { DEFAULT_HEX_SIZE, DEFAULT_RENDER_RADIUS, DEFAULT_SEED, DEFAULT_TERRAIN_WEIGHTS, CRAFTING_RECIPES, TERRAIN_RESOURCES, GLOBAL_BIOMES_DATA } from './constants';
import { MapSettings, HexCoordinate, MapSaveData, SavedLocation, Language, LocalizedName, HexResources, ExploredBounds, InventoryContainer, InventoryItem, TerrainType, BiomeResourceData, VegetationDefinition, GlobalBiomeDef, GlobalBiomeConfig } from './types';
import { generateRandomCoordinate, getElevation, getHexResources, getTerrain, getGlobalBiome } from './utils/rng';
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

interface EditorState {
  isOpen: boolean;
  type: 'global_biome' | 'resource';
  biome?: GlobalBiomeDef;
  terrain?: TerrainType;
  category?: string;
  itemIndex?: number;
  itemData?: LocalizedName;
}

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
    terrainWeights: DEFAULT_TERRAIN_WEIGHTS
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

  // Resources Linked to Terrain
  const [activeTerrainResources, setActiveTerrainResources] = useState<Record<TerrainType, BiomeResourceData>>(TERRAIN_RESOURCES);

  // Global Biome Configuration (Educational Layer: Linking Terrains to Biomes)
  // This stores which terrains "belong" to which global biome educationally
  const [globalBiomeSettings, setGlobalBiomeSettings] = useState<Record<string, GlobalBiomeConfig>>({});

  const [editorState, setEditorState] = useState<EditorState>({ isOpen: false, type: 'global_biome' });

  // View State
  const [rotation, setRotation] = useState(0); // Degrees
  const [isTeleporting, setIsTeleporting] = useState(false); // Animation State
  
  // UI Selection State
  const [selectedMarker, setSelectedMarker] = useState<SavedLocation | null>(null);
  const [isMinimapOpen, setIsMinimapOpen] = useState(false);
  const [isPeriodicTableOpen, setIsPeriodicTableOpen] = useState(false);

  // Input State
  const pressedKeys = useRef<Set<string>>(new Set());
  const animationFrameRef = useRef<number>(0);

  // Calculate Distance from Spawn
  const distanceFromSpawn = useMemo(() => {
    return hexDistance(spawnPos, playerPos) * 500;
  }, [spawnPos, playerPos]);

  // Calculate Global Resource Pool (All unique items from constants)
  const allGlobalResources = useMemo(() => {
      const pool: BiomeResourceData = {
          animals: [],
          vegetation: [],
          mineral_resources: [],
          rare_stones: []
      };

      const seen = new Set<string>();
      
      Object.values(TERRAIN_RESOURCES).forEach(biomeData => {
          biomeData.vegetation.forEach(item => { if(!seen.has(item.en)) { seen.add(item.en); pool.vegetation.push(item); } });
          biomeData.animals.forEach(item => { if(!seen.has(item.en)) { seen.add(item.en); pool.animals.push(item); } });
          biomeData.mineral_resources.forEach(item => { if(!seen.has(item.en)) { seen.add(item.en); pool.mineral_resources.push(item); } });
          biomeData.rare_stones.forEach(item => { if(!seen.has(item.en)) { seen.add(item.en); pool.rare_stones.push(item); } });
      });

      return pool;
  }, []);

  // --- PERSISTENCE LOGIC ---

  const getStorageKey = (seed: string) => `hex_map_${seed}`;

  // Function to load data from LocalStorage
  const loadFromStorage = useCallback((seed: string) => {
    const key = getStorageKey(seed);
    const storedData = localStorage.getItem(key);
    
    if (storedData) {
      try {
        const parsed: MapSaveData = JSON.parse(storedData);
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
    dropped: Record<string, InventoryItem[]>,
    terrainResources: Record<TerrainType, BiomeResourceData>,
    globalBiomeConfigs: Record<string, GlobalBiomeConfig>
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
      terrain_weights: currentSettings.terrainWeights,
      terrain_resources: terrainResources, // Persist legacy/physical structure
      global_biome_configs: globalBiomeConfigs // Persist new educational structure
    };

    localStorage.setItem(key, JSON.stringify(data));
  }, []);

  // --- INITIALIZATION ---

  // Handle Start (Load or New)
  const handleStartGame = () => {
    const saveData = loadFromStorage(settings.seed);
    
    // Initialize Default Global Biome Settings if not present
    const defaultGlobalSettings: Record<string, GlobalBiomeConfig> = {};
    GLOBAL_BIOMES_DATA.forEach(biome => {
        defaultGlobalSettings[biome.id] = {
            associatedTerrains: biome.defaultTerrains || [],
            customResources: { animals:[], vegetation:[], mineral_resources:[], rare_stones:[] }
        };
    });

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
      if (saveData.terrain_weights) {
        setSettings(prev => ({ ...prev, terrainWeights: saveData.terrain_weights! }));
      }

      // Load Custom Resources
      if (saveData.terrain_resources) {
        setActiveTerrainResources(saveData.terrain_resources);
      }
      if (saveData.global_biome_configs) {
        setGlobalBiomeSettings({ ...defaultGlobalSettings, ...saveData.global_biome_configs });
      } else {
        setGlobalBiomeSettings(defaultGlobalSettings);
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
      setActiveTerrainResources(TERRAIN_RESOURCES); // Reset to defaults on new game
      setGlobalBiomeSettings(defaultGlobalSettings);
      
      const initialBounds = {
        minQ: initialPos.q, maxQ: initialPos.q, minR: initialPos.r, maxR: initialPos.r
      };
      setExploredBounds(initialBounds);
      
      // Create initial save file
      saveToStorage(settings, initialPos, initialPos, [], initialBounds, createEmptyInventory(), {}, TERRAIN_RESOURCES, defaultGlobalSettings);
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
      saveToStorage(settings, playerPos, spawnPos, savedLocations, exploredBounds, inventory, droppedItems, activeTerrainResources, globalBiomeSettings);
    }
  }, [playerPos, spawnPos, savedLocations, exploredBounds, inventory, droppedItems, hasStarted, settings, saveToStorage, isTeleporting, activeTerrainResources, globalBiomeSettings]);


  // --- RESOURCE CALCULATION LOGIC ---
  useEffect(() => {
    if (!hasStarted) return;
    
    // For Status Panel
    const currentTerrain = getTerrain(playerPos.q, playerPos.r, settings);
    const globalBiome = getGlobalBiome(playerPos.q, playerPos.r, settings);
    const globalConfig = globalBiomeSettings[globalBiome.id];

    // Use activeTerrainResources AND global biome config to generate resources
    const resources = getHexResources(playerPos.q, playerPos.r, settings.seed, currentTerrain, activeTerrainResources, globalConfig);
    
    // Merge dropped items for current position
    const key = `${playerPos.q},${playerPos.r}`;
    const groundItems = droppedItems[key] || [];
    
    setCurrentResources({ ...resources, droppedItems: groundItems });

  }, [playerPos, settings, hasStarted, droppedItems, activeTerrainResources, globalBiomeSettings]);


  // --- EVENT HANDLERS ---

  const handleHexClick = (hex: HexCoordinate) => {
    const found = savedLocations.find(loc => loc.x === hex.q && loc.y === hex.r);
    setSelectedMarker(found || null);

    if (clickedHex && (clickedHex.q !== hex.q || clickedHex.r !== hex.r)) {
       setClickedHex(null);
    }
  };

  // Helper to add item to inventory
  const addToInventory = (item: InventoryItem, source: 'nature' | 'ground' | 'crafting', hex?: HexCoordinate) => {
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
    const emptySlotIdx = craftingSlots.findIndex(s => s === null);
    
    if (emptySlotIdx !== -1) {
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
    addToInventory(item, 'crafting'); 
    const newSlots = [...craftingSlots];
    newSlots[index] = null;
    setCraftingSlots(newSlots);
  };

  const handleCombine = () => {
    const ingredients: Record<string, number> = {};
    const filledSlots: number[] = [];

    craftingSlots.forEach((slot, idx) => {
       if (slot) {
         filledSlots.push(idx);
         ingredients[slot.en] = (ingredients[slot.en] || 0) + slot.quantity;
       }
    });

    if (filledSlots.length === 0) return;

    const recipe = CRAFTING_RECIPES.find(r => {
       return r.inputs.every(req => (ingredients[req.nameEn] || 0) >= req.quantity) &&
              Object.keys(ingredients).every(ingName => r.inputs.some(req => req.nameEn === ingName));
    });

    if (recipe) {
       const newSlots = [...craftingSlots];
       filledSlots.forEach(idx => newSlots[idx] = null);
       setCraftingSlots(newSlots);
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

  const handleDropItem = (containerId: number, slotIndex: number) => {
      const container = inventory.find(c => c.id === containerId);
      if (!container) return;
      const item = container.slots[slotIndex];
      if (!item) return;

      const newInventory = inventory.map(c => {
          if (c.id === containerId) {
              const newSlots = [...c.slots];
              newSlots[slotIndex] = null;
              return { ...c, slots: newSlots };
          }
          return c;
      });
      setInventory(newInventory);

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

  const handleTeleport = (loc: SavedLocation) => {
    if (isTeleporting) return;
    setSelectedMarker(null);
    setClickedHex(null); 
    setIsMinimapOpen(false);
    setIsPeriodicTableOpen(false);
    
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
      setDimensions({ width: Math.ceil(window.innerWidth), height: Math.ceil(window.innerHeight) });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const movePlayer = useCallback((dq: number, dr: number) => {
    if (!hasStarted || isTeleporting) return;
    const rotated = rotateMoveVector(dq, dr, rotation);
    setPlayerPos(prev => ({ q: prev.q + rotated.q, r: prev.r + rotated.r }));
    setMetersTraveled(prev => prev + 500);
    setSelectedMarker(null);
    setClickedHex(null); 
  }, [hasStarted, rotation, isTeleporting]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!hasStarted || isTeleporting) return;
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;

      const key = e.key;
      pressedKeys.current.add(key);

      if (key.toLowerCase() === 'c') {
         const terrain = getTerrain(playerPos.q, playerPos.r, settings);
         const globalBiome = getGlobalBiome(playerPos.q, playerPos.r, settings);
         const globalConfig = globalBiomeSettings[globalBiome.id];
         const resources = getHexResources(playerPos.q, playerPos.r, settings.seed, terrain, activeTerrainResources, globalConfig);
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
        setIsPeriodicTableOpen(false);
        setEditorState({ ...editorState, isOpen: false });
        return;
      }

      if (key.toLowerCase() === 'm') {
        setIsMinimapOpen(prev => !prev);
      }

      const up = pressedKeys.current.has('ArrowUp');
      const down = pressedKeys.current.has('ArrowDown');
      const left = pressedKeys.current.has('ArrowLeft');
      const right = pressedKeys.current.has('ArrowRight');

      let dq = 0; let dr = 0; let shouldMove = false;
      if (key === 'ArrowLeft') { if (up) { dq = 0; dr = -1; shouldMove = true; } else if (down) { dq = -1; dr = 1; shouldMove = true; } else { dq = -1; dr = 0; shouldMove = true; } }
      else if (key === 'ArrowRight') { if (up) { dq = 1; dr = -1; shouldMove = true; } else if (down) { dq = 0; dr = 1; shouldMove = true; } else { dq = 1; dr = 0; shouldMove = true; } }
      else if (key === 'ArrowUp') { if (left) { dq = 0; dr = -1; shouldMove = true; } else if (right) { dq = 1; dr = -1; shouldMove = true; } }
      else if (key === 'ArrowDown') { if (left) { dq = -1; dr = 1; shouldMove = true; } else if (right) { dq = 0; dr = 1; shouldMove = true; } }

      if (shouldMove) movePlayer(dq, dr);
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
  }, [movePlayer, hasStarted, isTeleporting, playerPos, settings, droppedItems, activeTerrainResources, editorState, globalBiomeSettings]);

  // --- EDUCATIONAL EDITING HANDLERS ---

  const handleEditGlobalBiome = (biome: GlobalBiomeDef) => {
    setEditorState({
      isOpen: true,
      type: 'global_biome',
      biome: biome
    });
  };

  const handleToggleTerrainInBiome = (terrain: TerrainType) => {
     if (!editorState.biome) return;
     const biomeId = editorState.biome.id;

     setGlobalBiomeSettings(prev => {
        const currentConfig = prev[biomeId] || { associatedTerrains: [], customResources: { animals:[], vegetation:[], mineral_resources:[], rare_stones:[] } };
        let newTerrains = [...currentConfig.associatedTerrains];
        
        if (newTerrains.includes(terrain)) {
            newTerrains = newTerrains.filter(t => t !== terrain);
        } else {
            newTerrains.push(terrain);
        }

        return {
            ...prev,
            [biomeId]: {
                ...currentConfig,
                associatedTerrains: newTerrains
            }
        };
     });
  };

  const handleAddGlobalResource = (item: LocalizedName, category: string) => {
    if (!editorState.biome) return;
    const biomeId = editorState.biome.id;

    setGlobalBiomeSettings(prev => {
        const config = prev[biomeId];
        // @ts-ignore
        const currentList = config.customResources[category] as LocalizedName[];
        if (currentList.some(i => i.en === item.en)) return prev; // Already exists

        return {
            ...prev,
            [biomeId]: {
                ...config,
                customResources: {
                    ...config.customResources,
                    [category]: [...currentList, item]
                }
            }
        };
    });
  };

  const handleRemoveGlobalResource = (item: LocalizedName, category: string) => {
    if (!editorState.biome) return;
    const biomeId = editorState.biome.id;

    setGlobalBiomeSettings(prev => {
        const config = prev[biomeId];
        // @ts-ignore
        const currentList = config.customResources[category] as LocalizedName[];
        return {
            ...prev,
            [biomeId]: {
                ...config,
                customResources: {
                    ...config.customResources,
                    [category]: currentList.filter(i => i.en !== item.en)
                }
            }
        };
    });
  };

  const handleEditResource = (item: LocalizedName, category: string, terrain: TerrainType) => {
     const biomeData = activeTerrainResources[terrain];
     if (!biomeData) return;
     // @ts-ignore
     const list = biomeData[category] as LocalizedName[];
     if (!list) return;
     const index = list.findIndex(i => i.en === item.en);
     if (index === -1) return;

     setEditorState({
       isOpen: true,
       type: 'resource',
       terrain: terrain, 
       category,
       itemIndex: index,
       itemData: list[index]
     });
  };

  const handleSaveResourceChange = (updatedItem: LocalizedName) => {
     if (!editorState.category || editorState.itemIndex === undefined || !editorState.terrain) return;

     setActiveTerrainResources(prev => {
       const newResources = { ...prev };
       const biomeData = { ...newResources[editorState.terrain!] };
       // @ts-ignore
       const list = [...biomeData[editorState.category!]];
       list[editorState.itemIndex!] = updatedItem;
       // @ts-ignore
       biomeData[editorState.category!] = list;
       newResources[editorState.terrain!] = biomeData;
       return newResources;
     });

     setEditorState({ ...editorState, isOpen: false });
  };

  const getGlobalBiomeConfig = (biomeId: string) => {
      return globalBiomeSettings[biomeId] || { associatedTerrains: [], customResources: { animals:[], vegetation:[], mineral_resources:[], rare_stones:[] } };
  };

  const langKey = language === 'pt' ? 'pt_br' : 'en_us';

  return (
    <div className="relative w-full h-full bg-slate-900 overflow-hidden text-slate-200">
      
      {!hasStarted ? (
        <LandingPage 
          seed={settings.seed} 
          setSeed={(val) => setSettings(prev => ({ ...prev, seed: val }))}
          weights={settings.terrainWeights}
          setWeights={(weights) => setSettings(prev => ({ ...prev, terrainWeights: weights }))}
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
            onOpenPeriodicTable={() => setIsPeriodicTableOpen(true)}
            onEditBiome={handleEditGlobalBiome}
            onEditResource={handleEditResource}
          />
          
          <Dock 
            inventory={inventory} 
            language={language} 
            onDropItem={handleDropItem}
            onAddToCrafting={handleAddToCrafting} 
            onRemoveFromCrafting={handleReturnFromCrafting}
            craftingSlots={craftingSlots}
            onCombine={handleCombine}
          />

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
                           {clickedHexResources.droppedItems.length > 0 && (
                               <div className="mb-2">
                                   <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{language === 'pt' ? 'No Chão' : 'On Ground'}</div>
                                   {clickedHexResources.droppedItems.map((item, i) => (
                                       <LootItem key={`drop-${item.uuid}`} item={item} language={language} onCollect={() => handleCollectItem(item, 'ground', clickedHex)} isDropped={true} />
                                   ))}
                               </div>
                           )}

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

          {/* EDITOR MODAL: RESOURCE */}
          {editorState.isOpen && editorState.type === 'resource' && editorState.itemData && (
             <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
                <div className="bg-slate-900 border border-slate-600 rounded-xl shadow-2xl w-full max-w-md p-6 animate-in zoom-in-95 duration-200">
                   <h2 className="text-xl font-bold text-white mb-1">
                     {language === 'pt' ? 'Configuração Educacional' : 'Educational Configuration'}
                   </h2>
                   <ResourceEditorForm 
                      item={editorState.itemData} 
                      onSave={handleSaveResourceChange} 
                      onCancel={() => setEditorState({ ...editorState, isOpen: false })} 
                      language={language}
                   />
                </div>
             </div>
          )}

          {/* EDITOR MODAL: GLOBAL BIOME */}
          {editorState.isOpen && editorState.type === 'global_biome' && editorState.biome && (
             <BiomeEditorModal 
                biome={editorState.biome}
                config={getGlobalBiomeConfig(editorState.biome.id)}
                activeTerrainResources={activeTerrainResources}
                globalResources={allGlobalResources}
                onClose={() => setEditorState({...editorState, isOpen: false})}
                onToggleTerrain={handleToggleTerrainInBiome}
                onAddResource={handleAddGlobalResource}
                onRemoveResource={handleRemoveGlobalResource}
                language={language}
             />
          )}

          {/* PERIODIC TABLE MODAL */}
          {isPeriodicTableOpen && (
            <PeriodicTableModal 
              onClose={() => setIsPeriodicTableOpen(false)}
              language={language}
            />
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

// --- SUBCOMPONENTS ---

// Separate Global Biome Editor Component to handle Tabs
const BiomeEditorModal: React.FC<{
    biome: GlobalBiomeDef;
    config: GlobalBiomeConfig;
    activeTerrainResources: Record<TerrainType, BiomeResourceData>;
    globalResources: BiomeResourceData;
    onClose: () => void;
    onToggleTerrain: (t: TerrainType) => void;
    onAddResource: (item: LocalizedName, category: string) => void;
    onRemoveResource: (item: LocalizedName, category: string) => void;
    language: Language;
}> = ({ biome, config, activeTerrainResources, globalResources, onClose, onToggleTerrain, onAddResource, onRemoveResource, language }) => {
    
    const [activeTab, setActiveTab] = useState<'terrains' | 'resources'>('terrains');
    const [resourceCategory, setResourceCategory] = useState<'vegetation' | 'animals' | 'mineral_resources' | 'rare_stones'>('vegetation');
    const langKey = language === 'pt' ? 'pt_br' : 'en_us';

    const categories = {
        vegetation: { label: language === 'pt' ? 'Flora' : 'Flora' },
        animals: { label: language === 'pt' ? 'Fauna' : 'Fauna' },
        mineral_resources: { label: language === 'pt' ? 'Minerais' : 'Minerals' },
        rare_stones: { label: language === 'pt' ? 'Pedras Raras' : 'Rare Stones' }
    };

    // Calculate aggregated resources from Terrains
    const terrainBasedResources: LocalizedName[] = [];
    config.associatedTerrains.forEach(terrain => {
        // @ts-ignore
        const list = activeTerrainResources[terrain][resourceCategory] as LocalizedName[];
        list.forEach(item => {
            if (!terrainBasedResources.find(i => i.en === item.en)) {
                terrainBasedResources.push({ ...item, educational_info: `(From ${terrain.replace('_',' ')})` });
            }
        });
    });

    // @ts-ignore
    const customResources = config.customResources[resourceCategory] as LocalizedName[];
    
    // Global Available (Minus those already in custom or terrain)
    // @ts-ignore
    const availableResources = (globalResources[resourceCategory] as LocalizedName[]).filter(
        g => !customResources.some(c => c.en === g.en) && !terrainBasedResources.some(t => t.en === g.en)
    );

    return (
        <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-600 rounded-xl shadow-2xl w-full max-w-4xl p-6 animate-in zoom-in-95 duration-200 h-[80vh] flex flex-col">
               <div className="flex justify-between items-center mb-4 border-b border-slate-700 pb-2 shrink-0">
                   <div>
                       <h2 className="text-xl font-bold text-white">
                         {language === 'pt' ? 'Configuração de Bioma' : 'Biome Configuration'}
                       </h2>
                       <span className="text-sm font-bold text-yellow-400 uppercase tracking-widest">{biome[langKey].nome_global}</span>
                   </div>
                   <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
               </div>

               <div className="flex gap-4 mb-4 border-b border-slate-700 shrink-0">
                   <button 
                     onClick={() => setActiveTab('terrains')}
                     className={`pb-2 px-2 text-sm font-bold border-b-2 transition-colors ${activeTab === 'terrains' ? 'border-blue-500 text-white' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
                   >
                     TERRENOS
                   </button>
                   <button 
                     onClick={() => setActiveTab('resources')}
                     className={`pb-2 px-2 text-sm font-bold border-b-2 transition-colors ${activeTab === 'resources' ? 'border-blue-500 text-white' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
                   >
                     RECURSOS
                   </button>
               </div>
               
               <div className="flex-1 overflow-hidden min-h-0">
                  {/* --- TERRAINS TAB --- */}
                  {activeTab === 'terrains' && (
                      <div className="flex flex-col h-full overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-700">
                          <div className="mb-4 bg-slate-800/50 p-3 rounded text-sm text-slate-300 italic shrink-0">
                            {biome[langKey].caracteristica}
                          </div>
                          
                          <h3 className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-2 shrink-0">
                             {language === 'pt' ? 'Terrenos Associados' : 'Associated Terrains'}
                          </h3>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6 shrink-0">
                                {(Object.values(TerrainType) as TerrainType[]).map(terrain => {
                                    const isChecked = config.associatedTerrains.includes(terrain);
                                    return (
                                        <label key={terrain} className={`flex items-center gap-3 p-3 rounded border cursor-pointer transition-all ${isChecked ? 'bg-blue-900/30 border-blue-500' : 'bg-slate-800 border-slate-700 hover:border-slate-500'}`}>
                                            <input 
                                                type="checkbox" 
                                                checked={isChecked} 
                                                onChange={() => onToggleTerrain(terrain)}
                                                className="w-4 h-4 rounded accent-blue-500"
                                            />
                                            <span className="text-sm font-bold text-slate-200">{terrain.replace('_', ' ')}</span>
                                        </label>
                                    );
                                })}
                          </div>

                          <h3 className="text-xs font-bold text-purple-400 uppercase tracking-widest mb-2 shrink-0">
                             {language === 'pt' ? 'Variações Regionais' : 'Regional Variants'}
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 shrink-0 pb-4">
                                {biome.variacoes_regionais.map((variant, idx) => (
                                    <div key={idx} className="bg-slate-950/50 border border-slate-800 p-3 rounded">
                                        <div className="font-bold text-slate-200 text-sm mb-1">{variant[langKey].nome_regional}</div>
                                        <div className="text-xs text-slate-500">
                                            {variant[langKey].paises_prevalencia.join(', ')}
                                        </div>
                                    </div>
                                ))}
                          </div>
                      </div>
                  )}

                  {/* --- RESOURCES TAB --- */}
                  {activeTab === 'resources' && (
                      <div className="flex flex-col h-full min-h-0">
                          {/* Category Selector */}
                          <div className="flex gap-2 mb-4 overflow-x-auto pb-1 shrink-0 scrollbar-thin scrollbar-thumb-slate-700">
                              {(Object.keys(categories) as Array<keyof typeof categories>).map(cat => (
                                  <button 
                                    key={cat}
                                    onClick={() => setResourceCategory(cat)}
                                    className={`px-3 py-1.5 rounded text-xs font-bold whitespace-nowrap transition-colors ${resourceCategory === cat ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                                  >
                                      {categories[cat].label}
                                  </button>
                              ))}
                          </div>

                          <div className="grid grid-cols-2 gap-4 flex-1 overflow-hidden min-h-0">
                              {/* Left: Active Resources */}
                              <div className="flex flex-col bg-slate-950/50 rounded border border-slate-700 p-3 h-full overflow-hidden">
                                  <h4 className="text-xs font-bold text-emerald-400 uppercase mb-3 border-b border-slate-800 pb-2 shrink-0">
                                      {language === 'pt' ? 'Recursos Ativos (Terreno + Custom)' : 'Active Resources (Terrain + Custom)'}
                                  </h4>
                                  <div className="flex-1 overflow-y-auto pr-2 flex flex-col gap-2 min-h-0 scrollbar-thin scrollbar-thumb-slate-700">
                                      {/* Custom Resources */}
                                      {customResources.map((item, idx) => (
                                          <div key={`custom-${idx}`} className="flex items-center justify-between bg-slate-800 p-2 rounded border border-emerald-500/50 shrink-0">
                                              <div className="flex items-center gap-2 overflow-hidden">
                                                  <img src={item.image} className="w-6 h-6 rounded bg-black object-cover shrink-0" />
                                                  <div className="flex flex-col truncate">
                                                      <span className="text-xs text-emerald-200 font-bold truncate">{item[language]}</span>
                                                      <span className="text-[10px] text-emerald-500/70 uppercase">Custom</span>
                                                  </div>
                                              </div>
                                              <button onClick={() => onRemoveResource(item, resourceCategory)} className="text-red-400 hover:text-white px-2">✕</button>
                                          </div>
                                      ))}
                                      
                                      {/* Terrain Resources */}
                                      {terrainBasedResources.map((item, idx) => (
                                          <div key={`terr-${idx}`} className="flex items-center gap-2 bg-slate-800/50 p-2 rounded border border-slate-700 opacity-70 shrink-0">
                                              <img src={item.image} className="w-6 h-6 rounded bg-black object-cover grayscale shrink-0" />
                                              <div className="flex flex-col truncate">
                                                  <span className="text-xs text-slate-300 truncate">{item[language]}</span>
                                                  <span className="text-[9px] text-slate-500 italic truncate">{item.educational_info}</span>
                                              </div>
                                          </div>
                                      ))}
                                      
                                      {customResources.length === 0 && terrainBasedResources.length === 0 && (
                                          <span className="text-slate-600 text-xs italic p-2 text-center">Empty.</span>
                                      )}
                                  </div>
                              </div>

                              {/* Right: Available Resources */}
                              <div className="flex flex-col bg-slate-950/50 rounded border border-slate-700 p-3 h-full overflow-hidden">
                                  <h4 className="text-xs font-bold text-blue-400 uppercase mb-3 border-b border-slate-800 pb-2 shrink-0">
                                      {language === 'pt' ? 'Disponíveis (Global Pool)' : 'Available (Global Pool)'}
                                  </h4>
                                  <div className="flex-1 overflow-y-auto pr-2 flex flex-col gap-2 min-h-0 scrollbar-thin scrollbar-thumb-slate-700">
                                      {availableResources.map((item, idx) => (
                                          <div key={`avail-${idx}`} className="flex items-center justify-between bg-slate-800 p-2 rounded border border-slate-700 hover:border-slate-500 transition-colors group shrink-0">
                                              <div className="flex items-center gap-2 overflow-hidden">
                                                  <img src={item.image} className="w-6 h-6 rounded bg-black object-cover shrink-0" />
                                                  <span className="text-xs text-slate-300 truncate">{item[language]}</span>
                                              </div>
                                              <button 
                                                onClick={() => onAddResource(item, resourceCategory)}
                                                className="bg-emerald-900/50 hover:bg-emerald-600 text-emerald-200 text-xs px-2 py-1 rounded border border-emerald-900 transition-colors shrink-0"
                                              >
                                                  + Add
                                              </button>
                                          </div>
                                      ))}
                                      {availableResources.length === 0 && (
                                          <span className="text-slate-600 text-xs italic p-2 text-center">
                                              {language === 'pt' ? 'Todos os itens adicionados.' : 'All items added.'}
                                          </span>
                                      )}
                                  </div>
                              </div>
                          </div>
                      </div>
                  )}
               </div>
            </div>
        </div>
    );
};

const LootItem: React.FC<{ 
  item: LocalizedName | InventoryItem; 
  language: Language; 
  onCollect: () => void;
  isDropped?: boolean; 
}> = ({ item, language, onCollect, isDropped }) => {
  return (
    <div className="flex items-center justify-between bg-slate-800/80 p-2 rounded mb-1 border border-slate-700 hover:border-blue-500 transition-colors group">
      <div className="flex items-center gap-3">
         <img src={item.image} className="w-8 h-8 rounded bg-black object-cover border border-slate-600" />
         <div className="flex flex-col">
            <span className="text-sm font-bold text-slate-200 group-hover:text-white transition-colors">
               {item[language]}
            </span>
            {isDropped && (item as InventoryItem).quantity > 1 && (
               <span className="text-[10px] text-slate-400">x{(item as InventoryItem).quantity}</span>
            )}
            {!isDropped && (
                <span className="text-[9px] text-slate-500 uppercase tracking-wider">{language === 'pt' ? 'Recurso' : 'Resource'}</span>
            )}
         </div>
      </div>
      <button 
        onClick={onCollect}
        className="bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold px-3 py-1.5 rounded shadow transition-all active:scale-95"
      >
        {language === 'pt' ? 'COLETAR' : 'COLLECT'}
      </button>
    </div>
  );
};

const ResourceEditorForm: React.FC<{
    item: LocalizedName;
    onSave: (item: LocalizedName) => void;
    onCancel: () => void;
    language: Language;
}> = ({ item, onSave, onCancel, language }) => {
    const [formData, setFormData] = useState<LocalizedName>({ ...item });

    const handleChange = (field: keyof LocalizedName, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-400 uppercase">Name (English)</label>
                <input 
                    type="text" 
                    value={formData.en} 
                    onChange={e => handleChange('en', e.target.value)}
                    className="bg-slate-800 border border-slate-600 rounded p-2 text-white focus:border-blue-500 outline-none"
                />
            </div>
            <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-400 uppercase">Nome (Português)</label>
                <input 
                    type="text" 
                    value={formData.pt} 
                    onChange={e => handleChange('pt', e.target.value)}
                    className="bg-slate-800 border border-slate-600 rounded p-2 text-white focus:border-blue-500 outline-none"
                />
            </div>
            <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-400 uppercase">Image URL (512x512)</label>
                <div className="flex gap-2">
                    <input 
                        type="text" 
                        value={formData.image || ''} 
                        onChange={e => handleChange('image', e.target.value)}
                        className="bg-slate-800 border border-slate-600 rounded p-2 text-white focus:border-blue-500 outline-none flex-1 text-xs font-mono"
                    />
                    {formData.image && (
                        <img src={formData.image} className="w-10 h-10 rounded border border-slate-600 bg-black object-cover" />
                    )}
                </div>
            </div>
             <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-400 uppercase">Educational Info</label>
                <textarea 
                    value={formData.educational_info || ''} 
                    onChange={e => handleChange('educational_info', e.target.value)}
                    className="bg-slate-800 border border-slate-600 rounded p-2 text-white focus:border-blue-500 outline-none text-sm h-20"
                />
            </div>
            
            <div className="flex justify-end gap-2 mt-2">
                <button 
                    onClick={onCancel}
                    className="px-4 py-2 text-slate-400 hover:text-white transition-colors font-bold text-sm"
                >
                    {language === 'pt' ? 'Cancelar' : 'Cancel'}
                </button>
                <button 
                    onClick={() => onSave(formData)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded font-bold text-sm transition-colors shadow-lg"
                >
                    {language === 'pt' ? 'Salvar Alterações' : 'Save Changes'}
                </button>
            </div>
        </div>
    );
};

export default App;
