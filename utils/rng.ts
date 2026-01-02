
import { TerrainType, HexCoordinate, HexResources, MapSettings, TerrainWeights, BiomeResourceData, GlobalBiomeDef, GlobalBiomeConfig } from '../types';
import { PROBABILITY, DEFAULT_TERRAIN_WEIGHTS, GLOBAL_BIOMES_DATA } from '../constants';

// --- PSEUDO-RANDOM & NOISE CORE ---

function hash128(str: string): number {
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
  for (let i = 0, ch; i < str.length; i++) {
    ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return 4294967296 * (2097151 & h2) + (h1 >>> 0);
}

function random2D(x: number, y: number, seedVal: number): number {
  const dot = x * 12.9898 + y * 78.233;
  const sin = Math.sin(dot + seedVal) * 43758.5453123;
  return sin - Math.floor(sin);
}

function smoothstep(t: number): number {
  return t * t * (3 - 2 * t);
}

function valueNoise(x: number, y: number, seedVal: number): number {
  const iX = Math.floor(x);
  const iY = Math.floor(y);
  const fX = x - iX;
  const fY = y - iY;

  const a = random2D(iX, iY, seedVal);
  const b = random2D(iX + 1, iY, seedVal);
  const c = random2D(iX, iY + 1, seedVal);
  const d = random2D(iX + 1, iY + 1, seedVal);

  const u = smoothstep(fX);
  const v = smoothstep(fY);

  return (a * (1 - u) + b * u) * (1 - v) + 
         (c * (1 - u) + d * u) * v;
}

function fbm(x: number, y: number, octaves: number, persistence: number, lacunarity: number, seedVal: number): number {
  let total = 0;
  let frequency = 1;
  let amplitude = 1;
  let maxValue = 0;

  for (let i = 0; i < octaves; i++) {
    total += valueNoise(x * frequency, y * frequency, seedVal) * amplitude;
    maxValue += amplitude;
    amplitude *= persistence;
    frequency *= lacunarity;
  }

  return total / maxValue;
}

function getNoiseCoordinates(q: number, r: number): { x: number, y: number } {
  const x = Math.sqrt(3) * q + (Math.sqrt(3) / 2) * r;
  const y = (3 / 2) * r;
  return { x, y };
}

// --- CONFIGURATION PARSING ---

// Calculates thresholds based on weights.
function calculateThresholds(weights: TerrainWeights) {
  const total = Object.values(weights).reduce((a, b) => a + b, 0);
  if (total === 0) {
    // Fallback to standard
    return {
      deepWater: 0.3,
      water: 0.4,
      sand: 0.45,
      mountainStart: 0.85,
      snowStart: 0.92,
      moistureBias: 0
    };
  }

  // Calculate percentages
  const pDeep = weights.DEEP_WATER / total;
  const pWater = weights.WATER / total;
  const pSand = weights.SAND / total;
  const pGrass = weights.GRASS / total;
  const pForest = weights.FOREST / total;
  const pMount = weights.MOUNTAIN / total;
  const pSnow = weights.SNOW / total;

  // Height Thresholds
  const deepWater = pDeep; 
  const water = pDeep + pWater;
  
  const snowStart = 1.0 - pSnow;
  const mountainStart = snowStart - pMount;

  const sandThreshold = water + (pSand * 0.4); 

  let moistureBias = 0;
  const landTotal = pSand + pGrass + pForest;
  if (landTotal > 0) {
     const weightedAvg = (pSand * 0.2 + pGrass * 0.5 + pForest * 0.8) / landTotal;
     moistureBias = (weightedAvg - 0.5) * 1.5; 
  }

  return {
    deepWater,
    water,
    sand: sandThreshold,
    mountainStart,
    snowStart,
    moistureBias
  };
}


// --- TERRAIN GENERATION LOGIC ---

interface TerrainData {
  height: number;
  moisture: number;
  isRiver: boolean;
  thresholds: ReturnType<typeof calculateThresholds>;
}

// Now accepts MapSettings instead of just seed string
function getTerrainData(q: number, r: number, settings: MapSettings): TerrainData {
  const { seed, terrainWeights } = settings;
  const thresholds = calculateThresholds(terrainWeights || DEFAULT_TERRAIN_WEIGHTS);

  const seedHash = hash128(seed);
  const seedVal = (seedHash % 100000) / 1000; 

  const coords = getNoiseCoordinates(q, r);
  
  // 1. HEIGHT
  const macroScale = 0.015; 
  let height = fbm(coords.x * macroScale, coords.y * macroScale, 6, 0.5, 2.0, seedVal);
  height = Math.pow(height, 1.2); 

  // 2. RIVERS
  const riverScale = 0.025;
  const riverNoise = fbm(coords.x * riverScale + 500, coords.y * riverScale + 500, 4, 0.5, 2.0, seedVal + 123);
  const riverWidth = 0.025; 
  let isRiver = false;

  // Only rivers on land (above water threshold) and not too high
  if (height > thresholds.water && height < thresholds.mountainStart) {
     const distFromCenter = Math.abs(riverNoise - 0.5);
     if (distFromCenter < riverWidth) {
       isRiver = true;
       // Carve river slightly below water level
       height = thresholds.water - 0.02; 
     }
  }

  // 3. MOISTURE
  let moisture = fbm(coords.x * 0.05, coords.y * 0.05, 3, 0.5, 2.0, seedVal + 999);
  // Apply User Bias
  moisture = Math.max(0, Math.min(1, moisture + thresholds.moistureBias));

  // 4. ISLANDS
  // If we are deep in the ocean, add some islands
  if (height < thresholds.deepWater) {
     const islandNoise = valueNoise(coords.x * 0.1, coords.y * 0.1, seedVal + 777);
     if (islandNoise > 0.85) {
       height = thresholds.sand; // Beach level
     }
  }

  return { height, moisture, isRiver, thresholds };
}


export function getTerrain(q: number, r: number, settings: MapSettings): TerrainType {
  const { height, moisture, isRiver, thresholds } = getTerrainData(q, r, settings);

  if (isRiver) return TerrainType.WATER;

  if (height < thresholds.deepWater) return TerrainType.DEEP_WATER;
  if (height < thresholds.water) return TerrainType.WATER;
  if (height < thresholds.sand) return TerrainType.SAND;

  // High Altitude
  if (height > thresholds.mountainStart) {
    if (height > thresholds.snowStart) return TerrainType.SNOW;
    return TerrainType.MOUNTAIN;
  }

  // Mid Altitude
  if (moisture < 0.35) {
    return TerrainType.SAND; // Desert
  } else if (moisture > 0.65) {
    return TerrainType.FOREST;
  } else {
    // Transition
    if (height > (thresholds.mountainStart * 0.8)) return TerrainType.FOREST; // Hills often forested
    return TerrainType.GRASS;
  }
}

/**
 * Determines the Global Biome (Educational Layer) based on the same noise maps.
 * Maps Height+Moisture to the 7 Global Biomes in JSON.
 */
export function getGlobalBiome(q: number, r: number, settings: MapSettings): GlobalBiomeDef {
    const { height, moisture, isRiver, thresholds } = getTerrainData(q, r, settings);
    
    // 0: Rainforest, 1: Savanna, 2: Grassland, 3: Desert, 4: Taiga, 5: Tundra, 6: Wetlands

    // 1. Water dominated (Rivers or Low Height + High Water noise)
    if (isRiver) return GLOBAL_BIOMES_DATA[6]; // Wetlands
    if (height < thresholds.water) {
       // Ocean areas map to Wetlands for simplicity in this dataset, or we could add "Ocean" to JSON later.
       // For now, let's treat shallow water near land as Wetlands context.
       return GLOBAL_BIOMES_DATA[6]; 
    }

    // 2. High Altitude / Cold
    if (height > thresholds.mountainStart) {
        if (height > thresholds.snowStart) return GLOBAL_BIOMES_DATA[5]; // Tundra
        return GLOBAL_BIOMES_DATA[4]; // Taiga
    }

    // 3. Moisture & Temp based
    // Simulating Temp via Height (Lower = Hotter)
    const relativeHeight = (height - thresholds.water) / (thresholds.mountainStart - thresholds.water);
    const isHot = relativeHeight < 0.4;
    const isTemperate = relativeHeight >= 0.4 && relativeHeight < 0.8;

    if (moisture > 0.7) {
        if (isHot) return GLOBAL_BIOMES_DATA[0]; // Rainforest
        return GLOBAL_BIOMES_DATA[4]; // Taiga (Wet+Coldish)
    } else if (moisture > 0.4) {
        if (isHot) return GLOBAL_BIOMES_DATA[1]; // Savanna
        return GLOBAL_BIOMES_DATA[2]; // Grassland
    } else {
        // Dry
        if (isHot) return GLOBAL_BIOMES_DATA[3]; // Desert
        return GLOBAL_BIOMES_DATA[2]; // Dry Grassland/Steppe
    }
}

export function getElevation(q: number, r: number, settings: MapSettings): number {
  const { height, thresholds } = getTerrainData(q, r, settings);

  const seaLevel = thresholds.water;

  if (height < seaLevel) {
    // Underwater
    const depthRatio = 1 - (height / seaLevel); 
    if (seaLevel === 0) return 0;
    return Math.floor(-1000 - (depthRatio * 4000));
  }

  // Land
  const landRange = 1 - seaLevel;
  if (landRange <= 0.001) return 0; // Avoid divide by zero if world is 100% water

  const landRatio = (height - seaLevel) / landRange;
  const elevation = Math.pow(landRatio, 2) * 8848; 
  return Math.floor(elevation);
}

// --- RESOURCE UTILS ---

function getDeterministicRandom(q: number, r: number, seed: string, context: string): number {
  const key = `${seed}:${q}:${r}:${context}`;
  const h = hash128(key);
  return (h % 100000) / 100000;
}

function shuffleDeterministic<T>(array: T[], q: number, r: number, seed: string, salt: string): T[] {
  const copy = [...array];
  let m = copy.length, t, i;
  while (m) {
    const rand = getDeterministicRandom(q, r, seed, `${salt}_${m}`);
    i = Math.floor(rand * m--);
    t = copy[m];
    copy[m] = copy[i];
    copy[i] = t;
  }
  return copy;
}

// Modified to accept a TerrainType and look up resources
export function getHexResources(
  q: number, 
  r: number, 
  seed: string, 
  terrain: TerrainType, 
  resourceData: Record<TerrainType, BiomeResourceData>,
  globalBiomeConfig?: GlobalBiomeConfig
): HexResources {
  const resources: HexResources = {
    animals: [],
    minerals: [],
    rareStones: [],
    vegetation: [],
    droppedItems: []
  };
  
  const terrainData = resourceData[terrain];
  if (!terrainData) return resources;

  // Merge with custom resources from global biome if provided
  const combinedData: BiomeResourceData = {
      animals: [...terrainData.animals],
      vegetation: [...terrainData.vegetation],
      mineral_resources: [...terrainData.mineral_resources],
      rare_stones: [...terrainData.rare_stones]
  };

  if (globalBiomeConfig && globalBiomeConfig.customResources) {
      combinedData.animals.push(...globalBiomeConfig.customResources.animals);
      combinedData.vegetation.push(...globalBiomeConfig.customResources.vegetation);
      combinedData.mineral_resources.push(...globalBiomeConfig.customResources.mineral_resources);
      combinedData.rare_stones.push(...globalBiomeConfig.customResources.rare_stones);
  }

  // Vegetation
  const vegDensityRoll = getDeterministicRandom(q, r, seed, 'veg_density');
  if (vegDensityRoll < PROBABILITY.VEGETATION) {
     const vegCount = Math.floor(getDeterministicRandom(q, r, seed, 'veg_count') * 4) + 1;
     if (combinedData.vegetation.length > 0) {
        const shuffled = shuffleDeterministic(combinedData.vegetation, q, r, seed, 'veg_shuffle');
        resources.vegetation = shuffled.slice(0, Math.min(vegCount, shuffled.length));
     }
  }

  // Animals
  const animDensityRoll = getDeterministicRandom(q, r, seed, 'anim_density');
  if (animDensityRoll < PROBABILITY.ANIMALS) {
    const animCount = Math.floor(getDeterministicRandom(q, r, seed, 'anim_count') * 3) + 1;
    if (combinedData.animals.length > 0) {
      const shuffled = shuffleDeterministic(combinedData.animals, q, r, seed, 'anim_shuffle');
      resources.animals = shuffled.slice(0, Math.min(animCount, shuffled.length));
    }
  }

  // Minerals
  const minDensityRoll = getDeterministicRandom(q, r, seed, 'min_density');
  if (minDensityRoll < PROBABILITY.MINERALS) {
    const minCount = Math.floor(getDeterministicRandom(q, r, seed, 'min_count') * 2) + 1;
    if (combinedData.mineral_resources.length > 0) {
      const shuffled = shuffleDeterministic(combinedData.mineral_resources, q, r, seed, 'min_shuffle');
      resources.minerals = shuffled.slice(0, Math.min(minCount, shuffled.length));
    }
  }

  // Rare Stones
  const rareRoll = getDeterministicRandom(q, r, seed, 'rare_density');
  if (rareRoll < PROBABILITY.RARE_STONES) {
    const rareCount = (getDeterministicRandom(q, r, seed, 'rare_count') > 0.8) ? 2 : 1;
    if (combinedData.rare_stones.length > 0) {
      const shuffled = shuffleDeterministic(combinedData.rare_stones, q, r, seed, 'rare_shuffle');
      resources.rareStones = shuffled.slice(0, Math.min(rareCount, shuffled.length));
    }
  }

  return resources;
}

export function generateRandomCoordinate(): HexCoordinate {
  const range = 100000;
  const q = Math.floor(Math.random() * (range * 2)) - range;
  const r = Math.floor(Math.random() * (range * 2)) - range;
  return { q, r };
}

export function generateHexSeed(): string {
  const chars = '0123456789ABCDEF';
  let result = '';
  for (let i = 0; i < 32; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

export function getStartPositionFromSeed(seed: string): HexCoordinate {
  const h = hash128(seed);
  const q = (h % 20000) - 10000;
  const r = ((h >> 16) % 20000) - 10000;
  return { q, r };
}