
import { TerrainType, BiomeResourceData, TerrainWeights, CraftingRecipe, CraftingCategory, GlobalBiomeDef, PeriodicTableData } from './types';

// 128-bit Hex Seed (32 chars)
export const DEFAULT_SEED = "A3726246D353E0C7ADEA4FF766C4D6E7";
export const DEFAULT_HEX_SIZE = 25; // Pixels
export const DEFAULT_RENDER_RADIUS = 5; // 5 Hexes * 500m = 2500m

export const DEFAULT_TERRAIN_WEIGHTS: TerrainWeights = {
  [TerrainType.DEEP_WATER]: 20,
  [TerrainType.WATER]: 20,
  [TerrainType.SAND]: 15,
  [TerrainType.GRASS]: 25,
  [TerrainType.FOREST]: 15,
  [TerrainType.MOUNTAIN]: 4,
  [TerrainType.SNOW]: 1,
};

export const TERRAIN_COLORS: Record<TerrainType, string> = {
  [TerrainType.DEEP_WATER]: '#1e3a8a', // Blue 900
  [TerrainType.WATER]: '#3b82f6',      // Blue 500
  [TerrainType.SAND]: '#fde047',       // Yellow 300
  [TerrainType.GRASS]: '#4ade80',      // Green 400
  [TerrainType.FOREST]: '#15803d',     // Green 700
  [TerrainType.MOUNTAIN]: '#78716c',   // Stone 500
  [TerrainType.SNOW]: '#f8fafc',       // Slate 50
};

// Movement directions for Pointy Top Hexagons (Axial Coordinates)
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
  VEGETATION: 0.85,    // 85% chance - Very abundant
  ANIMALS: 0.15,       // 15% chance
  MINERALS: 0.20,      // 20% chance
  RARE_STONES: 0.02,   // 2% chance
};

// Helper to generate placeholder images (Simulating external 512x512 links)
const img = (text: string, color: string = '444') => `https://placehold.co/512x512/${color}/FFF/png?text=${encodeURIComponent(text)}`;

// --- GLOBAL BIOME DATA (GEOGRAPHIC) ---
export const GLOBAL_BIOMES_DATA: GlobalBiomeDef[] = [
  {
    id: "rainforest",
    defaultTerrains: [TerrainType.FOREST, TerrainType.DEEP_WATER, TerrainType.WATER],
    pt_br: {
      nome_global: "Floresta Tropical e Equatorial",
      caracteristica: "Clima quente, alta pluviosidade e biodiversidade densa."
    },
    en_us: {
      nome_global: "Tropical and Equatorial Rainforest",
      caracteristica: "Warm climate, high rainfall, and dense biodiversity."
    },
    variacoes_regionais: [
      { pt_br: { nome_regional: "Amazônia", paises_prevalencia: ["Brasil", "Peru", "Colômbia", "Venezuela", "Equador", "Bolívia"] }, en_us: { nome_regional: "Amazon", paises_prevalencia: ["Brazil", "Peru", "Colombia", "Venezuela", "Ecuador", "Bolivia"] } },
      { pt_br: { nome_regional: "Mata Atlântica", paises_prevalencia: ["Brasil", "Paraguai", "Argentina"] }, en_us: { nome_regional: "Atlantic Forest", paises_prevalencia: ["Brazil", "Paraguay", "Argentina"] } },
      { pt_br: { nome_regional: "Floresta do Congo", paises_prevalencia: ["República Democrática do Congo", "Congo", "Gabão", "Camarões"] }, en_us: { nome_regional: "Congo Rainforest", paises_prevalencia: ["Democratic Republic of the Congo", "Congo", "Gabon", "Cameroon"] } }
    ]
  },
  {
    id: "savanna",
    defaultTerrains: [TerrainType.GRASS, TerrainType.SAND],
    pt_br: {
      nome_global: "Savana",
      caracteristica: "Vegetação de gramíneas com árvores esparsas e estações seca/chuvosa definidas."
    },
    en_us: {
      nome_global: "Savanna",
      caracteristica: "Grassland vegetation with scattered trees and defined wet/dry seasons."
    },
    variacoes_regionais: [
      { pt_br: { nome_regional: "Cerrado", paises_prevalencia: ["Brasil", "Paraguai"] }, en_us: { nome_regional: "Cerrado (Brazilian Savanna)", paises_prevalencia: ["Brazil", "Paraguay"] } },
      { pt_br: { nome_regional: "Savana Africana", paises_prevalencia: ["Quênia", "Tanzânia", "África do Sul", "Botsuana", "Namíbia"] }, en_us: { nome_regional: "African Savanna", paises_prevalencia: ["Kenya", "Tanzania", "South Africa", "Botswana", "Namibia"] } }
    ]
  },
  {
    id: "grassland",
    defaultTerrains: [TerrainType.GRASS],
    pt_br: {
      nome_global: "Pradarias e Estepes (Campos Temperados)",
      caracteristica: "Dominado por vegetação rasteira, solo fértil e clima temperado."
    },
    en_us: {
      nome_global: "Grasslands and Steppes (Temperate)",
      caracteristica: "Dominated by low vegetation, fertile soil, and temperate climate."
    },
    variacoes_regionais: [
      { pt_br: { nome_regional: "Pampa", paises_prevalencia: ["Brasil", "Argentina", "Uruguai"] }, en_us: { nome_regional: "Pampas", paises_prevalencia: ["Brazil", "Argentina", "Uruguay"] } },
      { pt_br: { nome_regional: "Pradarias", paises_prevalencia: ["Estados Unidos", "Canadá"] }, en_us: { nome_regional: "Prairies", paises_prevalencia: ["United States", "Canada"] } }
    ]
  },
  {
    id: "desert",
    defaultTerrains: [TerrainType.SAND],
    pt_br: {
      nome_global: "Desertos e Áreas Semiáridas",
      caracteristica: "Baixíssima umidade, escassez de água e vegetação adaptada."
    },
    en_us: {
      nome_global: "Deserts and Semi-arid Areas",
      caracteristica: "Very low humidity, water scarcity, and adapted vegetation."
    },
    variacoes_regionais: [
      { pt_br: { nome_regional: "Caatinga", paises_prevalencia: ["Brasil"] }, en_us: { nome_regional: "Caatinga", paises_prevalencia: ["Brazil"] } },
      { pt_br: { nome_regional: "Saara", paises_prevalencia: ["Egito", "Argélia", "Líbia", "Marrocos", "Mali"] }, en_us: { nome_regional: "Sahara", paises_prevalencia: ["Egypt", "Algeria", "Libya", "Morocco", "Mali"] } }
    ]
  },
  {
    id: "taiga",
    defaultTerrains: [TerrainType.FOREST, TerrainType.SNOW],
    pt_br: {
      nome_global: "Floresta Boreal (Taiga)",
      caracteristica: "Florestas de coníferas em regiões de alta latitude e invernos rigorosos."
    },
    en_us: {
      nome_global: "Boreal Forest (Taiga)",
      caracteristica: "Coniferous forests in high-latitude regions with harsh winters."
    },
    variacoes_regionais: [
      { pt_br: { nome_regional: "Taiga", paises_prevalencia: ["Rússia", "Suécia", "Noruega", "Finlândia"] }, en_us: { nome_regional: "Taiga", paises_prevalencia: ["Russia", "Sweden", "Norway", "Finland"] } }
    ]
  },
  {
    id: "tundra",
    defaultTerrains: [TerrainType.SNOW, TerrainType.MOUNTAIN],
    pt_br: {
      nome_global: "Tundra",
      caracteristica: "Vegetação rasteira sobre solo permanentemente congelado."
    },
    en_us: {
      nome_global: "Tundra",
      caracteristica: "Low-lying vegetation over permanently frozen soil."
    },
    variacoes_regionais: [
      { pt_br: { nome_regional: "Tundra Ártica", paises_prevalencia: ["Rússia", "Canadá", "Estados Unidos", "Groenlândia"] }, en_us: { nome_regional: "Arctic Tundra", paises_prevalencia: ["Russia", "Canada", "United States", "Greenland"] } }
    ]
  },
  {
    id: "wetlands",
    defaultTerrains: [TerrainType.WATER, TerrainType.GRASS, TerrainType.DEEP_WATER],
    pt_br: {
      nome_global: "Zonas Úmidas (Pantanal)",
      caracteristica: "Planícies de inundação periódica com alta concentração de fauna aquática."
    },
    en_us: {
      nome_global: "Wetlands (Pantanal)",
      caracteristica: "Periodically flooded plains with high concentration of aquatic fauna."
    },
    variacoes_regionais: [
      { pt_br: { nome_regional: "Pantanal", paises_prevalencia: ["Brasil", "Bolívia", "Paraguai"] }, en_us: { nome_regional: "Pantanal", paises_prevalencia: ["Brazil", "Bolivia", "Paraguay"] } },
      { pt_br: { nome_regional: "Everglades", paises_prevalencia: ["Estados Unidos"] }, en_us: { nome_regional: "Everglades", paises_prevalencia: ["United States"] } }
    ]
  }
];


// --- RESOURCES LINKED TO PHYSICAL TERRAIN (DEFAULT) ---
export const TERRAIN_RESOURCES: Record<TerrainType, BiomeResourceData> = {
  [TerrainType.DEEP_WATER]: {
    animals: [
      { en: "Giant Squid", pt: "Lula Gigante", image: img("Giant Squid", "00008B") },
      { en: "Anglerfish", pt: "Peixe-Diabo", image: img("Anglerfish", "2F4F4F") },
      { en: "Whale", pt: "Baleia", image: img("Whale", "4682B4") },
      { en: "Shark", pt: "Tubarão", image: img("Shark", "708090") },
      { en: "Jellyfish", pt: "Água-viva", image: img("Jellyfish", "E0FFFF") }
    ],
    mineral_resources: [
      { en: "Oil", pt: "Petróleo", image: "https://imagedelivery.net/QSzHJ7VhDUrBv1VXnLbazw/048491ea-6fce-4a59-df3f-cf0bba190700/craft512" },
      { en: "Limestone", pt: "Calcário", image: img("Limestone", "DCDCDC") },
      { en: "Manganese Nodules", pt: "Nódulos de Manganês", image: img("Manganese", "696969") }
    ],
    rare_stones: [
      { en: "Black Pearl", pt: "Pérola Negra", image: img("Black Pearl", "1C1C1C") },
      { en: "Prismarine", pt: "Prismarinho", image: img("Prismarine", "00FA9A") },
      { en: "Sapphire", pt: "Safira", image: img("Sapphire", "0000CD") }
    ],
    vegetation: [
       { 
         id: "kelp",
         pt: "Algas", 
         en: "Kelp",
         image: img("Kelp", "228B22"),
         harvestable_materials: [
           { pt: "Biomassa Seca", en: "Dried Biomass" },
           { pt: "Iodo", en: "Iodine" },
           { pt: "Extrato Gelatinoso", en: "Gelatinous Extract" },
           { pt: "Sal Marinho", en: "Sea Salt" }
         ]
       },
       { pt: "Coral de Tubo", en: "Tube Coral", image: img("Tube Coral", "FF4500") },
       { pt: "Coral de Cérebro", en: "Brain Coral", image: img("Brain Coral", "FF69B4") },
       { pt: "Coral de Bolha", en: "Bubble Coral", image: img("Bubble Coral", "FFC0CB") },
       { pt: "Coral de Fogo", en: "Fire Coral", image: img("Fire Coral", "FF0000") },
       { pt: "Coral de Chifre", en: "Horn Coral", image: img("Horn Coral", "DA70D6") }
    ]
  },
  [TerrainType.WATER]: {
    animals: [
      { en: "Salmon", pt: "Salmão", image: img("Salmon", "FA8072") },
      { en: "Turtle", pt: "Tartaruga", image: img("Turtle", "2E8B57") },
      { en: "Otter", pt: "Lontra", image: img("Otter", "8B4513") },
      { en: "Crocodile", pt: "Crocodilo", image: img("Crocodile", "006400") }
    ],
    mineral_resources: [
      { en: "Clay", pt: "Argila", image: img("Clay", "A9A9A9") },
      { en: "Sand", pt: "Areia", image: img("Sand", "F0E68C") },
      { en: "Silt", pt: "Silte", image: img("Silt", "D2B48C") }
    ],
    rare_stones: [
      { en: "Freshwater Pearl", pt: "Pérola de Água Doce", image: img("Fresh Pearl", "FFFAFA") },
      { en: "Lapis Lazuli", pt: "Lápis-lazúli", image: img("Lapis", "191970") }
    ],
    vegetation: [
      { pt: "Erva Marinha", en: "Seagrass", image: img("Seagrass", "3CB371") },
      { pt: "Vitória-régia", en: "Lily Pad", image: img("Lily Pad", "228B22") },
      { pt: "Pepino do Mar", en: "Sea Pickle", image: img("Sea Pickle", "32CD32") },
      { pt: "Musgo", en: "Moss Block", image: img("Moss", "556B2F") }
    ]
  },
  [TerrainType.SAND]: {
    animals: [
      { en: "Camel", pt: "Camelo", image: img("Camel", "C19A6B") },
      { en: "Scorpion", pt: "Escorpião", image: img("Scorpion", "8B0000") },
      { en: "Rattlesnake", pt: "Cascavel", image: img("Rattlesnake", "DAA520") },
      { en: "Fennec Fox", pt: "Raposa-do-deserto", image: img("Fennec Fox", "F4A460") },
      { en: "Vulture", pt: "Abutre", image: img("Vulture", "2F4F4F") }
    ],
    mineral_resources: [
      { en: "Sandstone", pt: "Arenito", image: img("Sandstone", "F4A460") },
      { en: "Saltpeter", pt: "Salitre", image: img("Saltpeter", "F5F5F5") },
      { en: "Silicon", pt: "Silício", image: img("Silicon", "708090") },
      { en: "Glass", pt: "Vidro", image: img("Glass", "ADD8E6") }
    ],
    rare_stones: [
      { en: "Topaz", pt: "Topázio", image: img("Topaz", "FFD700") },
      { en: "Desert Rose", pt: "Rosa do Deserto", image: img("Desert Rose", "CD5C5C") },
      { en: "Jasper", pt: "Jaspe", image: img("Jasper", "B22222") },
      { en: "Sunstone", pt: "Pedra do Sol", image: img("Sunstone", "FFA07A") }
    ],
    vegetation: [
      { 
        id: "cactus",
        pt: "Cacto", 
        en: "Cactus",
        image: "http://ue.ia.br/nvop",
        harvestable_materials: [
          { pt: "Extrato de Água", en: "Water Extract" },
          { pt: "Pigmento Verde", en: "Green Pigment" },
          { pt: "Espinhos", en: "Spines" },
          { pt: "Agulhas Naturais", en: "Natural Needles" }
        ]
      },
      { pt: "Arbusto Morto", en: "Dead Bush", image: img("Dead Bush", "8B4513") },
      { pt: "Acácia", en: "Acacia", image: img("Acacia", "FF8C00") } 
    ]
  },
  [TerrainType.GRASS]: {
    animals: [
      { en: "Horse", pt: "Cavalo", image: img("Horse", "8B4513") },
      { en: "Cow", pt: "Vaca", image: img("Cow", "000000") },
      { en: "Rabbit", pt: "Coelho", image: img("Rabbit", "D2B48C") },
      { en: "Sheep", pt: "Ovelha", image: img("Sheep", "FFFFFF") },
      { en: "Bison", pt: "Bisão", image: img("Bison", "8B0000") }
    ],
    mineral_resources: [
      { en: "Dirt", pt: "Terra", image: img("Dirt", "8B4513") },
      { en: "Peat", pt: "Turfa", image: img("Peat", "556B2F") },
      { en: "Loam", pt: "Franco", image: img("Loam", "A0522D") },
      { en: "Coal", pt: "Carvão", image: img("Coal", "000000") }
    ],
    rare_stones: [
      { en: "Agate", pt: "Ágata", image: img("Agate", "FF4500") },
      { en: "Amethyst", pt: "Ametista", image: img("Amethyst", "9932CC") },
      { en: "Citrine", pt: "Citrino", image: img("Citrine", "FFFF00") }
    ],
    vegetation: [
      { pt: "Grama", en: "Grass", image: img("Grass", "00FF00") },
      { pt: "Grama Alta", en: "Tall Grass", image: img("Tall Grass", "32CD32") },
      { 
        id: "dandelion",
        pt: "Dente-de-leão", 
        en: "Dandelion",
        image: img("Dandelion", "FFFF00"),
        harvestable_materials: [
          { pt: "Pigmento Amarelo", en: "Yellow Pigment" },
          { pt: "Raízes Medicinais", en: "Medicinal Roots" },
          { pt: "Néctar", en: "Nectar" }
        ]
      },
      { 
        id: "poppy",
        pt: "Papoula", 
        en: "Poppy",
        image: img("Poppy", "FF0000"),
        harvestable_materials: [
          { pt: "Pigmento Vermelho", en: "Red Pigment" },
          { pt: "Sementes de Papoula", en: "Poppy Seeds" },
          { pt: "Óleos Vegetais", en: "Vegetable Oils" }
        ] 
      },
      { pt: "Aliúme", en: "Allium", image: img("Allium", "DA70D6") },
      { pt: "Azure Bluet", en: "Azure Bluet", image: img("Azure Bluet", "E0FFFF") },
      { pt: "Tulipa Vermelha", en: "Red Tulip", image: img("Red Tulip", "FF0000") },
      { pt: "Tulipa Rosa", en: "Pink Tulip", image: img("Pink Tulip", "FFC0CB") },
      { pt: "Tulipa Laranja", en: "Orange Tulip", image: img("Orange Tulip", "FFA500") },
      { pt: "Tulipa Branca", en: "White Tulip", image: img("White Tulip", "FFFFFF") },
      { pt: "Margarida", en: "Oxeye Daisy", image: img("Daisy", "FFFFFF") },
      { pt: "Centáurea", en: "Cornflower", image: img("Cornflower", "6495ED") },
      { pt: "Girassol", en: "Sunflower", image: img("Sunflower", "FFD700") },
      { 
        id: "wheat",
        pt: "Trigo", 
        en: "Wheat",
        image: img("Wheat", "F5DEB3"),
        harvestable_materials: [
          { pt: "Grãos de Trigo", en: "Grain" },
          { pt: "Palha", en: "Straw" },
          { pt: "Fibras Vegetais", en: "Plant Fiber" },
          { pt: "Sementes", en: "Seeds" }
        ]
      },
      { pt: "Cenoura", en: "Carrot", image: img("Carrot", "FFA500") },
      { pt: "Batata", en: "Potato", image: img("Potato", "D2B48C") },
      { pt: "Beterraba", en: "Beetroot", image: img("Beetroot", "8B0000") },
      { pt: "Abóbora", en: "Pumpkin", image: img("Pumpkin", "FF8C00") },
      { pt: "Melancia", en: "Melon", image: img("Melon", "008000") }
    ]
  },
  [TerrainType.FOREST]: {
    animals: [
      { en: "Deer", pt: "Cervo", image: img("Deer", "8B4513") },
      { en: "Wolf", pt: "Lobo", image: img("Wolf", "808080") },
      { en: "Bear", pt: "Urso", image: img("Bear", "000000") },
      { en: "Squirrel", pt: "Esquilo", image: img("Squirrel", "A0522D") },
      { en: "Owl", pt: "Coruja", image: img("Owl", "8B4513") }
    ],
    mineral_resources: [
      { en: "Charcoal", pt: "Carvão Vegetal", image: img("Charcoal", "363636") },
      { en: "Iron Ore", pt: "Minério de Ferro", image: img("Iron Ore", "A19D94") },
      { en: "Fungus", pt: "Fungos", image: img("Fungus", "8B0000") }
    ],
    rare_stones: [
      { en: "Emerald", pt: "Esmeralda", image: img("Emerald", "00FF00") },
      { en: "Amber", pt: "Âmbar", image: img("Amber", "FFBF00") },
      { en: "Jade", pt: "Jade", image: img("Jade", "00A86B") },
      { en: "Moss Agate", pt: "Ágata Musgo", image: img("Moss Agate", "2E8B57") }
    ],
    vegetation: [
      { 
        id: "oak_log",
        pt: "Carvalho", 
        en: "Oak",
        image: img("Oak Tree", "228B22"),
        harvestable_materials: [
          { pt: "Toras de Madeira", en: "Wood Logs" },
          { pt: "Gravetos", en: "Sticks" },
          { pt: "Casca de Árvore", en: "Bark" },
          { pt: "Sementes/Glandes", en: "Acorns" },
          { pt: "Resina", en: "Resin" }
        ]
      },
      { 
        pt: "Bétula", 
        en: "Birch",
        image: img("Birch", "FFFFFF")
      },
      { pt: "Carvalho Escuro", en: "Dark Oak", image: img("Dark Oak", "006400") },
      { pt: "Carvalho Pálido", en: "Pale Oak", image: img("Pale Oak", "90EE90") },
      { 
        id: "cherry_log",
        pt: "Cerejeira", 
        en: "Cherry",
        image: img("Cherry Tree", "FF69B4"),
        harvestable_materials: [
          { pt: "Madeira Rosada", en: "Pink Wood" },
          { pt: "Pétalas de Flor", en: "Blossoms" },
          { pt: "Cerejas", en: "Cherries" },
          { pt: "Casca Aromática", en: "Fragrant Bark" }
        ]
      },
      { pt: "Mangue", en: "Mangrove", image: img("Mangrove", "556B2F") },
      { pt: "Azaleia", en: "Azalea Tree", image: img("Azalea", "FF1493") },
      { 
        id: "brown_mushroom",
        pt: "Cogumelo Marrom", 
        en: "Brown Mushroom",
        image: img("Brown Mushroom", "8B4513"),
        harvestable_materials: [
          { pt: "Esporos Comestíveis", en: "Edible Spores" },
          { pt: "Fibra Fúngica", en: "Fungus Fiber" },
          { pt: "Essência da Terra", en: "Earth Essence" }
        ]
      },
      { pt: "Cogumelo Vermelho", en: "Red Mushroom", image: img("Red Mushroom", "FF0000") },
      { pt: "Samambaia", en: "Fern", image: img("Fern", "228B22") },
      { pt: "Samambaia Grande", en: "Large Fern", image: img("Big Fern", "006400") },
      { pt: "Lilás", en: "Lilac", image: img("Lilac", "C8A2C8") },
      { pt: "Roseira", en: "Rose Bush", image: img("Rose Bush", "FF0000") },
      { pt: "Peônia", en: "Peony", image: img("Peony", "FFC0CB") },
      { pt: "Lírio do Vale", en: "Lily of the Valley", image: img("Lily", "FFFFFF") },
      { pt: "Frutas Vermelhas", en: "Sweet Berries", image: img("Berries", "DC143C") },
      { pt: "Cacau", en: "Cocoa Beans", image: img("Cocoa", "8B4513") },
      { pt: "Bambu", en: "Bamboo", image: img("Bamboo", "00FF00") }
    ]
  },
  [TerrainType.MOUNTAIN]: {
    animals: [
      { en: "Mountain Goat", pt: "Cabra da Montanha", image: img("Goat", "FFFFFF") },
      { en: "Eagle", pt: "Águia", image: img("Eagle", "8B4513") },
      { en: "Cougar", pt: "Puma", image: img("Cougar", "D2B48C") },
      { en: "Llama", pt: "Lhama", image: img("Llama", "F5DEB3") },
      { en: "Yak", pt: "Iaque", image: img("Yak", "000000") }
    ],
    mineral_resources: [
      { en: "Granite", pt: "Granito", image: img("Granite", "C0C0C0") },
      { en: "Copper Ore", pt: "Minério de Cobre", image: img("Copper", "B87333") },
      { en: "Iron Ore", pt: "Minério de Ferro", image: img("Iron", "A9A9A9") },
      { en: "Obsidian", pt: "Obsidiana", image: img("Obsidian", "000000") }
    ],
    rare_stones: [
      { en: "Ruby", pt: "Rubi", image: img("Ruby", "FF0000") },
      { en: "Gold Nugget", pt: "Pepita de Ouro", image: img("Gold", "FFD700") },
      { en: "Garnet", pt: "Granada", image: img("Garnet", "8B0000") },
      { en: "Malachite", pt: "Malaquita", image: img("Malachite", "006400") }
    ],
    vegetation: [
      { 
        id: "spruce_log",
        pt: "Pinheiro", 
        en: "Spruce",
        image: img("Spruce", "006400"),
        harvestable_materials: [
          { pt: "Madeira Macia", en: "Softwood" },
          { pt: "Pinhas", en: "Pinecones" },
          { pt: "Resina de Pinheiro", en: "Pine Resin" },
          { pt: "Agulhas", en: "Needles" }
        ]
      },
      { 
        id: "glow_lichen",
        pt: "Líquen Brilhante", 
        en: "Glow Lichen",
        image: img("Glow Lichen", "ADFF2F"),
        harvestable_materials: [
          { pt: "Pó Brilhante", en: "Glow Dust" },
          { pt: "Resina Adesiva", en: "Adhesive Resin" },
          { pt: "Pigmento Luminescente", en: "Luminescent Pigment" }
        ]
      },
      { pt: "Flor de Esporo", en: "Spore Blossom", image: img("Spore Blossom", "FF69B4") },
      { pt: "Raízes Pendentes", en: "Hanging Roots", image: img("Hanging Roots", "8B4513") },
      { pt: "Bagas Brilhantes", en: "Glow Berries", image: img("Glow Berries", "FFA500") }
    ]
  },
  [TerrainType.SNOW]: {
    animals: [
      { en: "Polar Bear", pt: "Urso Polar", image: img("Polar Bear", "FFFFFF") },
      { en: "Penguin", pt: "Pinguim", image: img("Penguin", "000000") },
      { en: "Arctic Fox", pt: "Raposa-do-ártico", image: img("Arctic Fox", "F0FFFF") },
      { en: "Walrus", pt: "Morsa", image: img("Walrus", "800000") },
      { en: "Snow Leopard", pt: "Leopardo-das-neves", image: img("Snow Leopard", "F5F5F5") }
    ],
    mineral_resources: [
      { en: "Ice", pt: "Gelo", image: img("Ice", "ADD8E6") },
      { en: "Packed Ice", pt: "Gelo Compactado", image: img("Packed Ice", "87CEEB") },
      { en: "Silver Ore", pt: "Minério de Prata", image: img("Silver", "C0C0C0") },
      { en: "Tungsten", pt: "Tungstênio", image: img("Tungsten", "696969") }
    ],
    rare_stones: [
      { en: "Diamond", pt: "Diamante", image: img("Diamond", "E0FFFF") },
      { en: "Opal", pt: "Opala", image: img("Opala", "FFFAF0") },
      { en: "Moonstone", pt: "Pedra da Lua", image: img("Moonstone", "F8F8FF") },
      { en: "Celestite", pt: "Celestita", image: img("Celestite", "B0E0E6") }
    ],
    vegetation: [
      { 
        id: "spruce_log",
        pt: "Pinheiro", 
        en: "Spruce",
        image: img("Spruce", "006400"),
        harvestable_materials: [
          { pt: "Madeira Macia", en: "Softwood" },
          { pt: "Pinhas", en: "Pinecones" },
          { pt: "Resina de Pinheiro", en: "Pine Resin" },
          { pt: "Agulhas", en: "Needles" }
        ]
      },
      { pt: "Frutas Vermelhas", en: "Sweet Berries", image: img("Berries", "DC143C") } 
    ]
  }
};

export const CRAFTING_RECIPES: CraftingRecipe[] = [
  // TOOLS
  {
    id: 'stone_axe',
    category: CraftingCategory.TOOLS,
    inputs: [
      { nameEn: 'Sticks', quantity: 2 },
      { nameEn: 'Granite', quantity: 1 },
      { nameEn: 'Plant Fiber', quantity: 1 }
    ],
    output: { pt: 'Machado de Pedra', en: 'Stone Axe', quantity: 1, image: img('Axe', '708090') }
  },
  {
    id: 'rope',
    category: CraftingCategory.TOOLS,
    inputs: [
      { nameEn: 'Plant Fiber', quantity: 3 }
    ],
    output: { pt: 'Corda', en: 'Rope', quantity: 1, image: img('Rope', 'D2B48C') }
  },
  {
    id: 'torch',
    category: CraftingCategory.TOOLS,
    inputs: [
      { nameEn: 'Sticks', quantity: 1 },
      { nameEn: 'Pine Resin', quantity: 1 }
    ],
    output: { pt: 'Tocha', en: 'Torch', quantity: 2, image: img('Torch', 'FFA500') }
  },

  // WEAPONS
  {
    id: 'spear',
    category: CraftingCategory.WEAPONS,
    inputs: [
      { nameEn: 'Sticks', quantity: 2 },
      { nameEn: 'Obsidian', quantity: 1 }
    ],
    output: { pt: 'Lança de Obsidiana', en: 'Obsidian Spear', quantity: 1, image: img('Spear', '000') }
  },
  {
    id: 'bow',
    category: CraftingCategory.WEAPONS,
    inputs: [
      { nameEn: 'Sticks', quantity: 3 },
      { nameEn: 'Plant Fiber', quantity: 2 }
    ],
    output: { pt: 'Arco Primitivo', en: 'Primitive Bow', quantity: 1, image: img('Bow', '8B4513') }
  },

  // CHEMISTRY
  {
    id: 'health_potion',
    category: CraftingCategory.CHEMISTRY,
    inputs: [
      { nameEn: 'Medicinal Roots', quantity: 1 },
      { nameEn: 'Water Extract', quantity: 1 }
    ],
    output: { pt: 'Poção de Vida Menor', en: 'Minor Health Potion', quantity: 1, image: img('Health Potion', 'FF0000') }
  },
  {
    id: 'glass',
    category: CraftingCategory.CHEMISTRY,
    inputs: [
      { nameEn: 'Sand', quantity: 2 },
      { nameEn: 'Coal', quantity: 1 } // Fuel for smelting logic simplified
    ],
    output: { pt: 'Vidro', en: 'Glass', quantity: 1, image: img('Glass', 'ADD8E6') }
  },
  {
    id: 'gunpowder',
    category: CraftingCategory.CHEMISTRY,
    inputs: [
      { nameEn: 'Saltpeter', quantity: 1 },
      { nameEn: 'Charcoal', quantity: 1 }
    ],
    output: { pt: 'Pólvora', en: 'Gunpowder', quantity: 2, image: img('Gunpowder', '696969') }
  },

  // MISC
  {
    id: 'planks',
    category: CraftingCategory.RECIPES,
    inputs: [
      { nameEn: 'Oak', quantity: 1 }
    ],
    output: { pt: 'Tábuas de Carvalho', en: 'Oak Planks', quantity: 4, image: img('Planks', 'DEB887') }
  }
];

export const PERIODIC_TABLE_DATA: PeriodicTableData = {
  "tabela_periodica": {
    "versao": "2.1",
    "descricao": "Carregando dados...",
    "categorias": [],
    "nota_informativa": "Dados sendo carregados do servidor..."
  }
};
