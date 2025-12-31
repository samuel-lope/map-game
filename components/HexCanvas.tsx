import React, { useRef, useEffect, useMemo, useState } from 'react';
import { BiomeType, HexCoordinate, MapSettings, SavedLocation } from '../types';
import { hexToPixel, getHexRing, pixelToHex, hexDistance } from '../utils/hexMath';
import { getBiome } from '../utils/rng';
import { generateBiomeTextures } from '../utils/biomeTextures';
import { BIOME_COLORS } from '../constants';

interface HexCanvasProps {
  playerPos: HexCoordinate;
  settings: MapSettings;
  width: number;
  height: number;
  savedLocations: SavedLocation[];
  onLocationSelect: (loc: SavedLocation | null) => void;
}

const HexCanvas: React.FC<HexCanvasProps> = ({ 
  playerPos, 
  settings, 
  width, 
  height, 
  savedLocations,
  onLocationSelect
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [textures, setTextures] = useState<Record<BiomeType, CanvasPattern | string> | null>(null);

  // Initialize Textures only once when context is available
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const generated = generateBiomeTextures(ctx);
    setTextures(generated);
  }, []); // Run once on mount

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !textures) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high DPI displays
    const dpr = window.devicePixelRatio || 1;
    // Only set width/height if they differ to avoid flicker
    if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);
    } else {
        // Just reset transform if dimensions matched
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    // Clear Screen
    ctx.fillStyle = '#0f172a'; // Match body background
    ctx.fillRect(0, 0, width, height);

    // Center the camera on the player
    const centerPix = hexToPixel(playerPos.q, playerPos.r, settings.hexSize);
    
    // Translation: Move canvas origin to center of screen, then subtract player position
    const offsetX = width / 2 - centerPix.x;
    const offsetY = height / 2 - centerPix.y;

    ctx.save();
    ctx.translate(offsetX, offsetY);

    // Get Visible Hexes
    const hexes = getHexRing(playerPos, settings.renderRadius + 2);

    // Draw Hexes
    hexes.forEach(hex => {
      drawHex(ctx, hex, settings.hexSize, settings.seed, textures);
    });

    // Draw Saved Location Markers
    savedLocations.forEach(loc => {
      const dist = hexDistance({q: loc.x, r: loc.y}, playerPos);
      if (dist <= settings.renderRadius + 2) {
        drawMarker(ctx, loc, settings.hexSize);
      }
    });

    // Draw Player cursor
    drawPlayer(ctx, playerPos, settings.hexSize);

    ctx.restore();

  }, [playerPos, settings, width, height, savedLocations, textures]);

  // Handle Canvas Clicks
  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Get mouse position relative to canvas
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Calculate the Camera Offset used in rendering
    const centerPix = hexToPixel(playerPos.q, playerPos.r, settings.hexSize);
    const offsetX = width / 2 - centerPix.x;
    const offsetY = height / 2 - centerPix.y;

    // Convert screen pixel to "World" pixel
    const worldX = mouseX - offsetX;
    const worldY = mouseY - offsetY;

    // Convert World pixel to Hex Coordinate
    const clickedHex = pixelToHex(worldX, worldY, settings.hexSize);

    // Check if we clicked on a saved location
    const found = savedLocations.find(loc => {
        return loc.x === clickedHex.q && loc.y === clickedHex.r;
    });

    onLocationSelect(found || null);
  };

  const drawHex = (
    ctx: CanvasRenderingContext2D, 
    hex: HexCoordinate, 
    size: number, 
    seed: string, 
    textureMap: Record<BiomeType, CanvasPattern | string>
) => {
    const { x, y } = hexToPixel(hex.q, hex.r, size);
    
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle_deg = 60 * i - 30;
      const angle_rad = Math.PI / 180 * angle_deg;
      const px = x + size * Math.cos(angle_rad);
      const py = y + size * Math.sin(angle_rad);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();

    const biome = getBiome(hex.q, hex.r, seed);
    
    // Apply Texture
    if (textureMap && textureMap[biome]) {
        // We translate the pattern to the hex position so it looks "anchored" 
        // effectively masking it to the hex, but aligning to world space for seamlessness if desired.
        // However, standard fill works fine for 'repeat' patterns usually.
        ctx.fillStyle = textureMap[biome];
    } else {
        // Fallback
        ctx.fillStyle = BIOME_COLORS[biome];
    }
    
    ctx.fill();

    // --- 3D Lighting Effect (Overlay) ---
    // Simulates sunlight from Top-Left
    const grad = ctx.createLinearGradient(x - size, y - size, x + size, y + size);
    grad.addColorStop(0, 'rgba(255, 255, 255, 0.15)'); // Highlight
    grad.addColorStop(0.5, 'rgba(0,0,0,0)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0.2)'); // Shadow
    
    ctx.fillStyle = grad;
    ctx.fill();

    // Border
    ctx.strokeStyle = 'rgba(0,0,0,0.15)';
    ctx.lineWidth = 1;
    ctx.stroke();

    if (size > 30) {
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.font = '10px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${hex.q},${hex.r}`, x, y);
    }
  };

  const drawMarker = (ctx: CanvasRenderingContext2D, loc: SavedLocation, size: number) => {
    const { x, y } = hexToPixel(loc.x, loc.y, size);

    // Draw a Pin shape
    const pinHeight = size * 1.0;
    const pinWidth = size * 0.6;
    
    // Drop Shadow for marker
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.bezierCurveTo(x - pinWidth, y - pinHeight/2, x - pinWidth, y - pinHeight, x, y - pinHeight);
    ctx.bezierCurveTo(x + pinWidth, y - pinHeight, x + pinWidth, y - pinHeight/2, x, y);
    ctx.closePath();

    ctx.fillStyle = '#DA954B';
    ctx.fill();
    
    // Reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    ctx.lineWidth = 1.5;
    ctx.strokeStyle = '#000000';
    ctx.stroke();

    // Small dot in center of the head
    ctx.beginPath();
    ctx.arc(x, y - pinHeight * 0.6, size * 0.2, 0, Math.PI * 2);
    ctx.fillStyle = '#1e293b'; 
    ctx.fill();
  };

  const drawPlayer = (ctx: CanvasRenderingContext2D, hex: HexCoordinate, size: number) => {
    const { x, y } = hexToPixel(hex.q, hex.r, size);
    
    // Draw a glowing ring
    ctx.beginPath();
    ctx.arc(x, y, size * 0.6, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 15;
    ctx.fill();
    ctx.shadowBlur = 0; 

    // Inner dot
    ctx.beginPath();
    ctx.arc(x, y, size * 0.3, 0, Math.PI * 2);
    ctx.fillStyle = '#ef4444'; // Red
    ctx.fill();
  };

  return (
    <canvas 
      ref={canvasRef} 
      onClick={handleClick}
      style={{ width, height, display: 'block', cursor: 'crosshair' }}
    />
  );
};

export default HexCanvas;