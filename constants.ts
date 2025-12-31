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

export const BIOME_RESOURCES: Record<BiomeType, BiomeResourceData> = {
  [BiomeType.DEEP_WATER]: {
    animals: [
      { en: "Giant Squid", pt: "Lula Gigante" },
      { en: "Anglerfish", pt: "Peixe-Diabo" },
      { en: "Whale", pt: "Baleia" },
      { en: "Shark", pt: "Tubarão" },
      { en: "Jellyfish", pt: "Água-viva" }
    ],
    mineral_resources: [
      { en: "Oil", pt: "Petróleo" },
      { en: "Limestone", pt: "Calcário" },
      { en: "Manganese Nodules", pt: "Nódulos de Manganês" }
    ],
    rare_stones: [
      { en: "Black Pearl", pt: "Pérola Negra" },
      { en: "Prismarine", pt: "Prismarinho" },
      { en: "Sapphire", pt: "Safira" }
    ],
    vegetation: [
       { 
         id: "kelp",
         pt: "Algas", 
         en: "Kelp",
         harvestable_materials: [
           { pt: "Biomassa Seca", en: "Dried Biomass" },
           { pt: "Iodo", en: "Iodine" },
           { pt: "Extrato Gelatinoso", en: "Gelatinous Extract" },
           { pt: "Sal Marinho", en: "Sea Salt" }
         ]
       },
       { pt: "Coral de Tubo", en: "Tube Coral" },
       { pt: "Coral de Cérebro", en: "Brain Coral" },
       { pt: "Coral de Bolha", en: "Bubble Coral" },
       { pt: "Coral de Fogo", en: "Fire Coral" },
       { pt: "Coral de Chifre", en: "Horn Coral" }
    ]
  },
  [BiomeType.WATER]: {
    animals: [
      { en: "Salmon", pt: "Salmão" },
      { en: "Turtle", pt: "Tartaruga" },
      { en: "Otter", pt: "Lontra" },
      { en: "Crocodile", pt: "Crocodilo" }
    ],
    mineral_resources: [
      { en: "Clay", pt: "Argila" },
      { en: "Sand", pt: "Areia" },
      { en: "Silt", pt: "Silte" }
    ],
    rare_stones: [
      { en: "Freshwater Pearl", pt: "Pérola de Água Doce" },
      { en: "Lapis Lazuli", pt: "Lápis-lazúli" }
    ],
    vegetation: [
      { pt: "Erva Marinha", en: "Seagrass" },
      { pt: "Vitória-régia", en: "Lily Pad" },
      { pt: "Pepino do Mar", en: "Sea Pickle" },
      { pt: "Musgo", en: "Moss Block" }
    ]
  },
  [BiomeType.SAND]: {
    animals: [
      { en: "Camel", pt: "Camelo" },
      { en: "Scorpion", pt: "Escorpião" },
      { en: "Rattlesnake", pt: "Cascavel" },
      { en: "Fennec Fox", pt: "Raposa-do-deserto" },
      { en: "Vulture", pt: "Abutre" }
    ],
    mineral_resources: [
      { en: "Sandstone", pt: "Arenito" },
      { en: "Saltpeter", pt: "Salitre" },
      { en: "Silicon", pt: "Silício" },
      { en: "Glass", pt: "Vidro" }
    ],
    rare_stones: [
      { en: "Topaz", pt: "Topázio" },
      { en: "Desert Rose", pt: "Rosa do Deserto" },
      { en: "Jasper", pt: "Jaspe" },
      { en: "Sunstone", pt: "Pedra do Sol" }
    ],
    vegetation: [
      { 
        id: "cactus",
        pt: "Cacto", 
        en: "Cactus",
        harvestable_materials: [
          { pt: "Extrato de Água", en: "Water Extract" },
          { pt: "Pigmento Verde", en: "Green Pigment" },
          { pt: "Espinhos", en: "Spines" },
          { pt: "Agulhas Naturais", en: "Natural Needles" }
        ]
      },
      { pt: "Arbusto Morto", en: "Dead Bush" },
      { pt: "Acácia", en: "Acacia" } 
    ]
  },
  [BiomeType.GRASS]: {
    animals: [
      { en: "Horse", pt: "Cavalo" },
      { en: "Cow", pt: "Vaca" },
      { en: "Rabbit", pt: "Coelho" },
      { en: "Sheep", pt: "Ovelha" },
      { en: "Bison", pt: "Bisão" }
    ],
    mineral_resources: [
      { en: "Dirt", pt: "Terra" },
      { en: "Peat", pt: "Turfa" },
      { en: "Loam", pt: "Franco" },
      { en: "Coal", pt: "Carvão" }
    ],
    rare_stones: [
      { en: "Agate", pt: "Ágata" },
      { en: "Amethyst", pt: "Ametista" },
      { en: "Citrine", pt: "Citrino" }
    ],
    vegetation: [
      { pt: "Grama", en: "Grass" },
      { pt: "Grama Alta", en: "Tall Grass" },
      { 
        id: "dandelion",
        pt: "Dente-de-leão", 
        en: "Dandelion",
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
        harvestable_materials: [
          { pt: "Pigmento Vermelho", en: "Red Pigment" },
          { pt: "Sementes de Papoula", en: "Poppy Seeds" },
          { pt: "Óleos Vegetais", en: "Vegetable Oils" }
        ] 
      },
      { pt: "Aliúme", en: "Allium" },
      { pt: "Azure Bluet", en: "Azure Bluet" },
      { pt: "Tulipa Vermelha", en: "Red Tulip" },
      { pt: "Tulipa Rosa", en: "Pink Tulip" },
      { pt: "Tulipa Laranja", en: "Orange Tulip" },
      { pt: "Tulipa Branca", en: "White Tulip" },
      { pt: "Margarida", en: "Oxeye Daisy" },
      { pt: "Centáurea", en: "Cornflower" },
      { pt: "Girassol", en: "Sunflower" },
      { 
        id: "wheat",
        pt: "Trigo", 
        en: "Wheat",
        harvestable_materials: [
          { pt: "Grãos de Trigo", en: "Grain" },
          { pt: "Palha", en: "Straw" },
          { pt: "Fibras Vegetais", en: "Plant Fiber" },
          { pt: "Sementes", en: "Seeds" }
        ]
      },
      { pt: "Cenoura", en: "Carrot" },
      { pt: "Batata", en: "Potato" },
      { pt: "Beterraba", en: "Beetroot" },
      { pt: "Abóbora", en: "Pumpkin" },
      { pt: "Melancia", en: "Melon" }
    ]
  },
  [BiomeType.FOREST]: {
    animals: [
      { en: "Deer", pt: "Cervo" },
      { en: "Wolf", pt: "Lobo" },
      { en: "Bear", pt: "Urso" },
      { en: "Squirrel", pt: "Esquilo" },
      { en: "Owl", pt: "Coruja" }
    ],
    mineral_resources: [
      { en: "Charcoal", pt: "Carvão Vegetal" },
      { en: "Iron Ore", pt: "Minério de Ferro" },
      { en: "Fungus", pt: "Fungos" }
    ],
    rare_stones: [
      { en: "Emerald", pt: "Esmeralda" },
      { en: "Amber", pt: "Âmbar" },
      { en: "Jade", pt: "Jade" },
      { en: "Moss Agate", pt: "Ágata Musgo" }
    ],
    vegetation: [
      { 
        id: "oak_log",
        pt: "Carvalho", 
        en: "Oak",
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
        en: "Birch" 
      },
      { pt: "Carvalho Escuro", en: "Dark Oak" },
      { pt: "Carvalho Pálido", en: "Pale Oak" },
      { 
        id: "cherry_log",
        pt: "Cerejeira", 
        en: "Cherry",
        harvestable_materials: [
          { pt: "Madeira Rosada", en: "Pink Wood" },
          { pt: "Pétalas de Flor", en: "Blossoms" },
          { pt: "Cerejas", en: "Cherries" },
          { pt: "Casca Aromática", en: "Fragrant Bark" }
        ]
      },
      { pt: "Mangue", en: "Mangrove" },
      { pt: "Azaleia", en: "Azalea Tree" },
      { 
        id: "brown_mushroom",
        pt: "Cogumelo Marrom", 
        en: "Brown Mushroom",
        harvestable_materials: [
          { pt: "Esporos Comestíveis", en: "Edible Spores" },
          { pt: "Fibra Fúngica", en: "Fungus Fiber" },
          { pt: "Essência da Terra", en: "Earth Essence" }
        ]
      },
      { pt: "Cogumelo Vermelho", en: "Red Mushroom" },
      { pt: "Samambaia", en: "Fern" },
      { pt: "Samambaia Grande", en: "Large Fern" },
      { pt: "Lilás", en: "Lilac" },
      { pt: "Roseira", en: "Rose Bush" },
      { pt: "Peônia", en: "Peony" },
      { pt: "Lírio do Vale", en: "Lily of the Valley" },
      { pt: "Frutas Vermelhas", en: "Sweet Berries" },
      { pt: "Cacau", en: "Cocoa Beans" },
      { pt: "Bambu", en: "Bamboo" }
    ]
  },
  [BiomeType.MOUNTAIN]: {
    animals: [
      { en: "Mountain Goat", pt: "Cabra da Montanha" },
      { en: "Eagle", pt: "Águia" },
      { en: "Cougar", pt: "Puma" },
      { en: "Llama", pt: "Lhama" },
      { en: "Yak", pt: "Iaque" }
    ],
    mineral_resources: [
      { en: "Granite", pt: "Granito" },
      { en: "Copper Ore", pt: "Minério de Cobre" },
      { en: "Iron Ore", pt: "Minério de Ferro" },
      { en: "Obsidian", pt: "Obsidiana" }
    ],
    rare_stones: [
      { en: "Ruby", pt: "Rubi" },
      { en: "Gold Nugget", pt: "Pepita de Ouro" },
      { en: "Garnet", pt: "Granada" },
      { en: "Malachite", pt: "Malaquita" }
    ],
    vegetation: [
      { 
        id: "spruce_log",
        pt: "Pinheiro", 
        en: "Spruce",
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
        harvestable_materials: [
          { pt: "Pó Brilhante", en: "Glow Dust" },
          { pt: "Resina Adesiva", en: "Adhesive Resin" },
          { pt: "Pigmento Luminescente", en: "Luminescent Pigment" }
        ]
      },
      { pt: "Flor de Esporo", en: "Spore Blossom" },
      { pt: "Raízes Pendentes", en: "Hanging Roots" },
      { pt: "Bagas Brilhantes", en: "Glow Berries" }
    ]
  },
  [BiomeType.SNOW]: {
    animals: [
      { en: "Polar Bear", pt: "Urso Polar" },
      { en: "Penguin", pt: "Pinguim" },
      { en: "Arctic Fox", pt: "Raposa-do-ártico" },
      { en: "Walrus", pt: "Morsa" },
      { en: "Snow Leopard", pt: "Leopardo-das-neves" }
    ],
    mineral_resources: [
      { en: "Ice", pt: "Gelo" },
      { en: "Packed Ice", pt: "Gelo Compactado" },
      { en: "Silver Ore", pt: "Minério de Prata" },
      { en: "Tungsten", pt: "Tungstênio" }
    ],
    rare_stones: [
      { en: "Diamond", pt: "Diamante" },
      { en: "Opal", pt: "Opala" },
      { en: "Moonstone", pt: "Pedra da Lua" },
      { en: "Celestite", pt: "Celestita" }
    ],
    vegetation: [
      { 
        id: "spruce_log",
        pt: "Pinheiro", 
        en: "Spruce",
        harvestable_materials: [
          { pt: "Madeira Macia", en: "Softwood" },
          { pt: "Pinhas", en: "Pinecones" },
          { pt: "Resina de Pinheiro", en: "Pine Resin" },
          { pt: "Agulhas", en: "Needles" }
        ]
      },
      { pt: "Frutas Vermelhas", en: "Sweet Berries" } 
    ]
  }
};