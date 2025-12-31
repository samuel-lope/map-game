import { BiomeType, BiomeResourceData } from './types';

// 128-bit Hex Seed (32 chars)
export const DEFAULT_SEED = "A3726246D353E0C7ADEA4FF766C4D6E7";
export const DEFAULT_HEX_SIZE = 25; // Pixels
export const DEFAULT_RENDER_RADIUS = 12; // In Hexes

export const BIOME_COLORS: Record<BiomeType, string> = {
  [BiomeType.DEEP_WATER]: '#1e3a8a', // Blue 900
  [BiomeType.WATER]: '#3b82f6',      // Blue 500
  [BiomeType.SAND]: '#fde047',       // Yellow 300
  [BiomeType.GRASS]: '#4ade80',      // Green 400
  [BiomeType.FOREST]: '#15803d',     // Green 700
  [BiomeType.MOUNTAIN]: '#78716c',   // Stone 500
  [BiomeType.SNOW]: '#f8fafc',       // Slate 50
};

// Movement directions for Pointy Top Hexagons (Axial Coordinates)
// Neighbors: East, SE, SW, West, NW, NE
export const HEX_DIRECTIONS = [
  { q: 1, r: 0 },   // East
  { q: 0, r: 1 },   // South East
  { q: -1, r: 1 },  // South West
  { q: -1, r: 0 },  // West
  { q: 0, r: -1 },  // North West
  { q: 1, r: -1 },  // North East
];

// Discovery Probabilities (0 to 1)
export const PROBABILITY = {
  ANIMALS: 0.1,       // 40% chance to find an animal
  MINERALS: 0.15,      // 60% chance to find minerals
  RARE_STONES: 0.05,  // 5% chance to find a rare stone
};

export const BIOME_RESOURCES: Record<BiomeType, BiomeResourceData> = {
  [BiomeType.DEEP_WATER]: {
    animals: ["Giant Squid", "Anglerfish", "Whale", "Shark", "Jellyfish"],
    mineral_resources: ["Oil", "Limestone", "Salt", "Manganese Nodules"],
    rare_stones: ["Black Pearl", "Aquamarine", "Sapphire", "Prismarine"]
  },
  [BiomeType.WATER]: {
    animals: ["Salmon", "Turtle", "Beaver", "Otter", "Crocodile"],
    mineral_resources: ["Clay", "Sand", "Gravel", "Silt"],
    rare_stones: ["Freshwater Pearl", "Lapis Lazuli", "Blue Quartz"]
  },
  [BiomeType.SAND]: {
    animals: ["Camel", "Scorpion", "Rattlesnake", "Fennec Fox", "Vulture"],
    mineral_resources: ["Sandstone", "Saltpeter", "Silicon", "Glass"],
    rare_stones: ["Topaz", "Desert Rose", "Jasper", "Sunstone"]
  },
  [BiomeType.GRASS]: {
    animals: ["Horse", "Cow", "Rabbit", "Sheep", "Bison"],
    mineral_resources: ["Dirt", "Peat", "Loam", "Coal"],
    rare_stones: ["Agate", "Amethyst", "Clear Quartz", "Citrine"]
  },
  [BiomeType.FOREST]: {
    animals: ["Deer", "Wolf", "Bear", "Squirrel", "Owl"],
    mineral_resources: ["Charcoal", "Iron Ore", "Fungus", "Hardwood"],
    rare_stones: ["Emerald", "Amber", "Jade", "Moss Agate"]
  },
  [BiomeType.MOUNTAIN]: {
    animals: ["Mountain Goat", "Eagle", "Cougar", "Llama", "Yak"],
    mineral_resources: ["Granite", "Copper Ore", "Iron Ore", "Obsidian"],
    rare_stones: ["Ruby", "Gold Nugget", "Garnet", "Malachite"]
  },
  [BiomeType.SNOW]: {
    animals: ["Polar Bear", "Penguin", "Arctic Fox", "Walrus", "Snow Leopard"],
    mineral_resources: ["Ice", "Packed Ice", "Silver Ore", "Tungsten"],
    rare_stones: ["Diamond", "Opal", "Moonstone", "Celestite"]
  }
};