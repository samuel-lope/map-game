
import { BiomeType, HexCoordinate, HexResources, LocalizedName } from '../types';
import { BIOME_RESOURCES, PROBABILITY } from '../constants';

/**
 * A simple pseudo-random number generator that takes coordinates and a seed string.
 * It uses a basic hashing approach to be deterministic.
 */
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
}

/**
 * Generates a deterministic value between 0 and 1 based on coord and seed.
 */
function noise(q: number, r: number, seed: string): number {
  // Combine inputs into a string key
  const key = `${seed}:${q}:${r}`;
  const h = simpleHash(key);
  const x = Math.sin(h) * 10000;
  return x - Math.floor(x);
}

/**
 * Helper to get a deterministic random float 0-1 from a specific key context
 */
function getDeterministicRandom(q: number, r: number, seed: string, context: string): number {
  const key = `${seed}:${q}:${r}:${context}`;
  const h = simpleHash(key);
  const x = Math.sin(h) * 10000;
  return Math.abs(x - Math.floor(x));
}

/**
 * Simulates Perlin-like noise by layering frequencies.
 * Adjusted for 500m scale: Frequencies are much lower to create large continents/oceans.
 */
function getPerlinApproximation(q: number, r: number, seed: string): number {
  // Use numeric value of seed parts for offsets
  const seedPart = parseInt(seed.substring(0, 8), 16) || 12345;
  
  // Convert hex coords to roughly cartesian for noise math
  const x = (q * Math.sqrt(3)) / 2;
  const y = r * 1.5;

  // Layer 1: Base terrain (Continents/Oceans)
  // Scale reduced drastically (from 0.1 to 0.005) to simulate large distances (500m/hex)
  const scale1 = 0.005; 
  const n1 = Math.sin(x * scale1 + seedPart) * Math.cos(y * scale1 + seedPart);

  // Layer 2: Regional variations (Hills/Valleys)
  // Scale reduced (from 0.3 to 0.02)
  const scale2 = 0.02;
  const n2 = Math.sin(x * scale2 - seedPart) * Math.cos(y * scale2 + seedPart) * 0.5;

  // Layer 3: Local detail/Texture
  // Scale reduced (from 0.8 to 0.1) so neighbors aren't too chaotic
  const scale3 = 0.1;
  const n3 = noise(q, r, seed) * 0.2;

  // Normalize roughly to 0-1
  let val = (n1 + n2 + n3 + 1.7) / 3.4;
  return Math.max(0, Math.min(1, val));
}

export function getBiome(q: number, r: number, seed: string): BiomeType {
  const height = getPerlinApproximation(q, r, seed);

  if (height < 0.25) return BiomeType.DEEP_WATER;
  if (height < 0.40) return BiomeType.WATER;
  if (height < 0.45) return BiomeType.SAND;
  if (height < 0.65) return BiomeType.GRASS;
  if (height < 0.80) return BiomeType.FOREST;
  if (height < 0.92) return BiomeType.MOUNTAIN;
  return BiomeType.SNOW;
}

/**
 * Calculates elevation in meters based on noise height.
 */
export function getElevation(q: number, r: number, seed: string): number {
  const h = getPerlinApproximation(q, r, seed);

  if (h < 0.25) {
    const normalized = h / 0.25;
    return Math.floor(-10000 + (normalized * 9900));
  }

  if (h < 0.40) {
    return 0;
  }

  const landNormalized = (h - 0.40) / 0.60;
  return Math.floor(landNormalized * 9000);
}

/**
 * Deterministically shuffles an array based on coordinates and seed.
 * This ensures we pick unique items randomly but consistently.
 */
function shuffleDeterministic<T>(array: T[], q: number, r: number, seed: string, salt: string): T[] {
  const copy = [...array];
  let m = copy.length, t, i;

  while (m) {
    // Generate index based on remaining items and context
    const rand = getDeterministicRandom(q, r, seed, `${salt}_${m}`);
    i = Math.floor(rand * m--);

    t = copy[m];
    copy[m] = copy[i];
    copy[i] = t;
  }

  return copy;
}

/**
 * Generates resources for a specific hex based on biome and probability.
 * Now supports multiple findings per category.
 */
export function getHexResources(q: number, r: number, seed: string, biome: BiomeType): HexResources {
  const resources: HexResources = {
    animals: [],
    minerals: [],
    rareStones: [],
    vegetation: []
  };
  
  const data = BIOME_RESOURCES[biome];
  if (!data) return resources;

  // 1. Vegetation (Abundant)
  // Calculate potential density (0 to 4 items)
  const vegDensityRoll = getDeterministicRandom(q, r, seed, 'veg_density');
  let vegCount = 0;
  if (vegDensityRoll < PROBABILITY.VEGETATION) {
     // If we hit the probability, how many?
     // Map 0-1 range to 1-4 items
     vegCount = Math.floor(getDeterministicRandom(q, r, seed, 'veg_count') * 4) + 1;
  }
  if (vegCount > 0 && data.vegetation.length > 0) {
    const shuffled = shuffleDeterministic(data.vegetation, q, r, seed, 'veg_shuffle');
    resources.vegetation = shuffled.slice(0, Math.min(vegCount, shuffled.length));
  }

  // 2. Animals
  // Potential density (0 to 3 items)
  const animDensityRoll = getDeterministicRandom(q, r, seed, 'anim_density');
  let animCount = 0;
  if (animDensityRoll < PROBABILITY.ANIMALS) {
    animCount = Math.floor(getDeterministicRandom(q, r, seed, 'anim_count') * 3) + 1;
  }
  if (animCount > 0 && data.animals.length > 0) {
    const shuffled = shuffleDeterministic(data.animals, q, r, seed, 'anim_shuffle');
    resources.animals = shuffled.slice(0, Math.min(animCount, shuffled.length));
  }

  // 3. Minerals
  // Potential density (0 to 2 items)
  const minDensityRoll = getDeterministicRandom(q, r, seed, 'min_density');
  let minCount = 0;
  if (minDensityRoll < PROBABILITY.MINERALS) {
    minCount = Math.floor(getDeterministicRandom(q, r, seed, 'min_count') * 2) + 1;
  }
  if (minCount > 0 && data.mineral_resources.length > 0) {
    const shuffled = shuffleDeterministic(data.mineral_resources, q, r, seed, 'min_shuffle');
    resources.minerals = shuffled.slice(0, Math.min(minCount, shuffled.length));
  }

  // 4. Rare Stones
  // Usually just 0 or 1, but let's allow rare chance of 2
  const rareRoll = getDeterministicRandom(q, r, seed, 'rare_density');
  let rareCount = 0;
  if (rareRoll < PROBABILITY.RARE_STONES) {
    // Very lucky roll for double rare stone
    rareCount = (getDeterministicRandom(q, r, seed, 'rare_count') > 0.8) ? 2 : 1;
  }
  if (rareCount > 0 && data.rare_stones.length > 0) {
    const shuffled = shuffleDeterministic(data.rare_stones, q, r, seed, 'rare_shuffle');
    resources.rareStones = shuffled.slice(0, Math.min(rareCount, shuffled.length));
  }

  return resources;
}

/**
 * Generates a random coordinate within a large range.
 */
export function generateRandomCoordinate(): HexCoordinate {
  const range = 1000000; // safe range for map exploration
  const q = Math.floor(Math.random() * (range * 2)) - range;
  const r = Math.floor(Math.random() * (range * 2)) - range;
  return { q, r };
}

export function getStartPositionFromSeed(seed: string): HexCoordinate {
  if (seed.length < 16) return { q: 0, r: 0 };
  const partA = seed.substring(0, 16);
  const partB = seed.substring(16, 32);
  const bigA = BigInt("0x" + (partA || "0"));
  const bigB = BigInt("0x" + (partB || "0"));
  const limit = BigInt(1000000);
  const q = Number(bigA % limit) - 500000;
  const r = Number(bigB % limit) - 500000;
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
