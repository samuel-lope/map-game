import { BiomeType, HexCoordinate, HexResources } from '../types';
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
 * Rules:
 * - Deep Water: -10000m to approx -1m
 * - Water: Always 0m
 * - Land: 1m to 9000m
 */
export function getElevation(q: number, r: number, seed: string): number {
  const h = getPerlinApproximation(q, r, seed);

  // DEEP_WATER (< 0.25)
  // Map 0.0 -> -10000m
  // Map 0.25 -> ~ -100m
  if (h < 0.25) {
    const normalized = h / 0.25; // 0 to 1
    // Linear interpolation from -10000 to -100
    return Math.floor(-10000 + (normalized * 9900));
  }

  // WATER (0.25 to 0.40)
  // Always 0 meters as per request
  if (h < 0.40) {
    return 0;
  }

  // LAND (> 0.40)
  // Map 0.40 -> 0m
  // Map 1.0 -> 9000m
  // Denominator is 0.60 (range of land)
  const landNormalized = (h - 0.40) / 0.60;
  return Math.floor(landNormalized * 9000);
}

/**
 * Generates resources for a specific hex based on biome and probability.
 */
export function getHexResources(q: number, r: number, seed: string, biome: BiomeType): HexResources {
  const resources: HexResources = {};
  const data = BIOME_RESOURCES[biome];
  
  if (!data) return resources;

  // Check Animal
  const animalRoll = getDeterministicRandom(q, r, seed, 'animal_roll');
  if (animalRoll < PROBABILITY.ANIMALS) {
    // Determine which animal
    const idx = Math.floor(getDeterministicRandom(q, r, seed, 'animal_idx') * data.animals.length);
    resources.animal = data.animals[idx];
  }

  // Check Mineral
  const mineralRoll = getDeterministicRandom(q, r, seed, 'mineral_roll');
  if (mineralRoll < PROBABILITY.MINERALS) {
    const idx = Math.floor(getDeterministicRandom(q, r, seed, 'mineral_idx') * data.mineral_resources.length);
    resources.mineral = data.mineral_resources[idx];
  }

  // Check Rare Stone
  const rareRoll = getDeterministicRandom(q, r, seed, 'rare_roll');
  if (rareRoll < PROBABILITY.RARE_STONES) {
    const idx = Math.floor(getDeterministicRandom(q, r, seed, 'rare_idx') * data.rare_stones.length);
    resources.rareStone = data.rare_stones[idx];
  }

  return resources;
}

/**
 * Parses the 128-bit seed to determine a starting position.
 * This ensures different seeds start in vastly different places in the infinite grid.
 */
export function getStartPositionFromSeed(seed: string): HexCoordinate {
  if (seed.length < 16) return { q: 0, r: 0 };
  
  // Take chunks of the hex string to form coordinate offsets
  // We use BigInt to handle large numbers, then modulo to keep them within a JS number safe range
  // effectively simulating a very large coordinate space.
  
  const partA = seed.substring(0, 16);
  const partB = seed.substring(16, 32);

  // We want coordinates that can be negative, so we subtract a bias
  const bigA = BigInt("0x" + (partA || "0"));
  const bigB = BigInt("0x" + (partB || "0"));

  // Modulo to safe integer range (approx +/- 9 quadrillion) 
  // but let's keep it smaller to avoid any rendering floating point jitters if we were strictly canvas
  // Although canvas handles translation, let's keep it within +/- 1,000,000 for safety.
  
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