
export interface HexCoordinate {
  q: number;
  r: number;
}

export interface PixelCoordinate {
  x: number;
  y: number;
}

// Renamed from BiomeType to TerrainType (Physical visual layer)
export enum TerrainType {
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
  terrain: TerrainType;
  height: number; // 0 to 1
}

export type TerrainWeights = Record<TerrainType, number>;

export interface MapSettings {
  hexSize: number;
  renderRadius: number;
  seed: string;
  terrainWeights: TerrainWeights;
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

// Global Biome Structure (From JSON)
export interface RegionalVariant {
  pt_br: { nome_regional: string; paises_prevalencia: string[] };
  en_us: { nome_regional: string; paises_prevalencia: string[] };
}

export interface GlobalBiomeDef {
  id: string; // Internal ID for logic
  defaultTerrains: TerrainType[]; // Default physical terrains associated
  pt_br: { nome_global: string; caracteristica: string };
  en_us: { nome_global: string; caracteristica: string };
  variacoes_regionais: RegionalVariant[];
}

export interface GlobalBiomeConfig {
  associatedTerrains: TerrainType[]; // Which terrains are educationaly linked to this biome
  customResources: BiomeResourceData;
}

export interface MapSaveData {
  seed: string;
  x: number; // Current q
  y: number; // Current r
  altitude: number;
  saved_positions: SavedLocation[];
  inventory?: InventoryContainer[]; 
  dropped_items?: Record<string, InventoryItem[]>;
  start_x?: number;
  start_y?: number;
  explored_bounds?: ExploredBounds;
  terrain_weights?: TerrainWeights; 
  // Key is the Global Biome ID (index or slug)
  global_biome_configs?: Record<string, GlobalBiomeConfig>;
  // Legacy support for per-terrain resources if needed, or moved to global
  terrain_resources?: Record<TerrainType, BiomeResourceData>;
}

export interface LocalizedName {
  pt: string;
  en: string;
  image?: string; // URL for 512x512 image
  educational_info?: string;
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
  droppedItems: InventoryItem[];
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
  inputs: { nameEn: string; quantity: number }[];
  output: LocalizedName & { quantity: number };
}

export type Language = 'pt' | 'en';

// --- PERIODIC TABLE TYPES ---

export interface AtomicStructure {
  protons: number;
  neutrons: number;
  eletrons: number;
  raio_atomico_pm: number;
  eletronegatividade_pauling: number | null;
}

export interface PeriodicElement {
  numero_atomico: number;
  simbolo: string;
  nome: { pt_BR: string; en_US: string };
  massa_atomica: number;
  configuracao_eletronica: string;
  camadas: number[];
  estado_fisico_padrao: string;
  estrutura_atomica: AtomicStructure;
  fontes_naturais: { pt_BR: string[]; en_US: string[] };
}

export interface PeriodicCategory {
  nome: { pt_BR: string; en_US: string };
  elementos: PeriodicElement[];
}

export interface PeriodicTableData {
  tabela_periodica: {
    versao: string;
    descricao: string;
    categorias: PeriodicCategory[];
    nota_informativa: string;
  };
}
