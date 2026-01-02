
export interface HexCoordinate {
  q: number;
  r: number;
}

export interface PixelCoordinate {
  x: number;
  y: number;
}

export enum BiomeType {
  DEEP_WATER = 'DEEP_WATER',
  WATER = 'WATER',
  SAND = 'SAND',
  GRASS = 'GRASS',
  FOREST = 'FOREST',
  MOUNTAIN = 'MOUNTAIN',
  SNOW = 'SNOW',
}

export interface HexData {
  coord: HexCoordinate;
  biome: BiomeType;
  height: number; // 0 to 1
}

export type BiomeWeights = Record<BiomeType, number>;

export interface MapSettings {
  hexSize: number;
  renderRadius: number;
  seed: string;
  biomeWeights: BiomeWeights;
}

export interface SavedLocation {
  id: string;
  name: string;
  x: number; // q
  y: number; // r
  timestamp: number;
}

export interface InventoryItem extends LocalizedName {
  uuid: string; // Unique ID for the specific instance in inventory
  quantity: number;
}

export interface InventoryContainer {
  id: number;
  name: string;
  slots: (InventoryItem | null)[]; // Fixed size 36
}

export interface ExploredBounds {
  minQ: number;
  maxQ: number;
  minR: number;
  maxR: number;
}

export interface MapSaveData {
  seed: string;
  x: number; // Current q
  y: number; // Current r
  altitude: number;
  saved_positions: SavedLocation[];
  inventory?: InventoryContainer[]; 
  dropped_items?: Record<string, InventoryItem[]>; // Key: "q,r", Value: Items
  start_x?: number; // Origin q
  start_y?: number; // Origin r
  explored_bounds?: ExploredBounds;
  biome_weights?: BiomeWeights; 
}

export interface LocalizedName {
  pt: string;
  en: string;
  image?: string; // URL for 512x512 image
}

export interface HarvestableMaterial extends LocalizedName {}

export interface VegetationDefinition extends LocalizedName {
  id?: string;
  harvestable_materials?: HarvestableMaterial[];
}

export interface BiomeResourceData {
  animals: LocalizedName[];
  mineral_resources: LocalizedName[];
  rare_stones: LocalizedName[];
  vegetation: VegetationDefinition[];
}

export interface HexResources {
  animals: LocalizedName[];
  minerals: LocalizedName[];
  rareStones: LocalizedName[];
  vegetation: VegetationDefinition[];
  droppedItems: InventoryItem[]; // Items dropped by player
}

export enum CraftingCategory {
  RECIPES = 'RECEITAS',
  CHEMISTRY = 'QUÍMICA',
  TOOLS = 'UTENSÍLIOS',
  WEAPONS = 'ARMAS',
  MISC = 'OUTROS'
}

export interface CraftingRecipe {
  id: string;
  category: CraftingCategory;
  inputs: { nameEn: string; quantity: number }[]; // Match by English name for stability
  output: LocalizedName & { quantity: number };
}

export type Language = 'pt' | 'en';