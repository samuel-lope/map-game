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

export interface MapSettings {
  hexSize: number;
  renderRadius: number;
  seed: string;
}

export interface SavedLocation {
  id: string;
  name: string;
  x: number; // q
  y: number; // r
  timestamp: number;
}

export interface MapSaveData {
  seed: string;
  x: number; // Current q
  y: number; // Current r
  altitude: number;
  saved_positions: SavedLocation[];
}

export interface BiomeResourceData {
  animals: string[];
  mineral_resources: string[];
  rare_stones: string[];
}

export interface HexResources {
  animal?: string;
  mineral?: string;
  rareStone?: string;
}