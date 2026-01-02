
import { TerrainType } from '../types';

/**
 * Creates a seamless noise texture for realistic terrain.
 */
function createNoisePattern(ctx: CanvasRenderingContext2D, width: number, height: number, density: number, color: string, size: number = 1) {
  for (let i = 0; i < (width * height * density); i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    ctx.fillStyle = color;
    ctx.globalAlpha = Math.random() * 0.5 + 0.1;
    ctx.fillRect(x, y, size, size);
  }
  ctx.globalAlpha = 1.0;
}

/**
 * Generates a CanvasPattern for a specific terrain.
 */
export function generateBiomeTextures(mainCtx: CanvasRenderingContext2D): Record<TerrainType, CanvasPattern | string> {
  const textures: Partial<Record<TerrainType, CanvasPattern | string>> = {};
  const size = 64; // Texture tile size

  const createTile = (drawFn: (ctx: CanvasRenderingContext2D) => void) => {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      drawFn(ctx);
      const pattern = mainCtx.createPattern(canvas, 'repeat');
      return pattern || undefined;
    }
    return undefined;
  };

  // --- DEEP WATER (Dark, wavy, mysterious) ---
  textures[TerrainType.DEEP_WATER] = createTile((ctx) => {
    // Base
    ctx.fillStyle = '#0f172a'; // Deep Slate Blue
    ctx.fillRect(0, 0, size, size);
    
    // Waves
    ctx.strokeStyle = '#1e3a8a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for(let y=0; y<size; y+=8) {
      ctx.moveTo(0, y);
      ctx.bezierCurveTo(size/3, y-4, size*2/3, y+4, size, y);
    }
    ctx.stroke();
    createNoisePattern(ctx, size, size, 0.05, '#3b82f6', 2);
  });

  // --- WATER (Lighter, ripples) ---
  textures[TerrainType.WATER] = createTile((ctx) => {
    ctx.fillStyle = '#3b82f6'; // Blue 500
    ctx.fillRect(0, 0, size, size);
    
    // Ripples
    ctx.strokeStyle = '#60a5fa'; // Lighter Blue
    ctx.lineWidth = 1;
    for(let i=0; i<8; i++) {
        const x = Math.random() * size;
        const y = Math.random() * size;
        const r = Math.random() * 10 + 5;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI*2);
        ctx.stroke();
    }
    createNoisePattern(ctx, size, size, 0.1, '#eff6ff', 1);
  });

  // --- SAND (Grainy, dunes) ---
  textures[TerrainType.SAND] = createTile((ctx) => {
    ctx.fillStyle = '#e2c58b'; // Real sand color (tan)
    ctx.fillRect(0, 0, size, size);
    
    // Dunes shadows
    ctx.fillStyle = '#d4b476';
    ctx.beginPath();
    ctx.moveTo(0, size);
    ctx.quadraticCurveTo(size/2, size/2, size, size);
    ctx.fill();

    // Grain
    createNoisePattern(ctx, size, size, 0.4, '#bfa16d', 1); // Darker grain
    createNoisePattern(ctx, size, size, 0.1, '#fff', 1);    // Shiny grain
  });

  // --- GRASS (Blade strokes, earthy) ---
  textures[TerrainType.GRASS] = createTile((ctx) => {
    ctx.fillStyle = '#4ade80'; // Base Green
    ctx.fillRect(0, 0, size, size);
    
    // Grass blades
    ctx.strokeStyle = '#166534'; // Dark green
    ctx.lineWidth = 1;
    for(let i=0; i<40; i++) {
        const x = Math.random() * size;
        const y = Math.random() * size;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + (Math.random()*4 - 2), y - (Math.random() * 5 + 2));
        ctx.stroke();
    }
    createNoisePattern(ctx, size, size, 0.2, '#14532d', 1);
  });

  // --- FOREST (Dense, canopy blobs) ---
  textures[TerrainType.FOREST] = createTile((ctx) => {
    ctx.fillStyle = '#166534'; // Dark Green Base
    ctx.fillRect(0, 0, size, size);
    
    // Tree Tops
    ctx.fillStyle = '#14532d'; // Darker Green
    for(let i=0; i<12; i++) {
        const x = Math.random() * size;
        const y = Math.random() * size;
        const r = Math.random() * 8 + 4;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI*2);
        ctx.fill();
    }
    createNoisePattern(ctx, size, size, 0.1, '#052e16', 2);
  });

  // --- MOUNTAIN (Rock facets, jagged) ---
  textures[TerrainType.MOUNTAIN] = createTile((ctx) => {
    ctx.fillStyle = '#78716c'; // Stone Base
    ctx.fillRect(0, 0, size, size);
    
    // Rock Cracks
    ctx.strokeStyle = '#44403c';
    ctx.lineWidth = 1.5;
    for(let i=0; i<5; i++) {
        ctx.beginPath();
        ctx.moveTo(Math.random()*size, Math.random()*size);
        ctx.lineTo(Math.random()*size, Math.random()*size);
        ctx.stroke();
    }
    
    // Stone noise
    createNoisePattern(ctx, size, size, 0.3, '#292524', 2);
    createNoisePattern(ctx, size, size, 0.1, '#a8a29e', 1); // Highlights
  });

  // --- SNOW (White, subtle blue noise, smooth) ---
  textures[TerrainType.SNOW] = createTile((ctx) => {
    ctx.fillStyle = '#f8fafc'; // White base
    ctx.fillRect(0, 0, size, size);
    
    // Subtle drifts
    ctx.fillStyle = '#e2e8f0';
    ctx.beginPath();
    ctx.arc(Math.random()*size, Math.random()*size, 15, 0, Math.PI*2);
    ctx.fill();

    createNoisePattern(ctx, size, size, 0.1, '#cbd5e1', 1);
    createNoisePattern(ctx, size, size, 0.05, '#3b82f6', 1); // Blue tint
  });

  return textures as Record<TerrainType, CanvasPattern>;
}
