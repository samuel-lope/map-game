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
  start_x?: number; // Origin q
  start_y?: number; // Origin r
}

export interface LocalizedName {
  pt: string;
  en: string;
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
  animal?: LocalizedName;
  mineral?: LocalizedName;
  rareStone?: LocalizedName;
  vegetation?: VegetationDefinition;
}

export type Language = 'pt' | 'en';