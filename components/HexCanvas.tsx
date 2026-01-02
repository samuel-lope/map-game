
import React, { useRef, useEffect, useState } from 'react';
import { TerrainType, HexCoordinate, MapSettings, SavedLocation } from '../types';
import { hexToPixel, getHexRing, pixelToHex, hexDistance } from '../utils/hexMath';
import { getTerrain } from '../utils/rng';
import { generateBiomeTextures } from '../utils/biomeTextures';
import { TERRAIN_COLORS } from '../constants';

interface HexCanvasProps {
  playerPos: HexCoordinate;
  settings: MapSettings;
  width: number;
  height: number;
  rotation: number; // degrees
  savedLocations: SavedLocation[];
  onHexClick: (hex: HexCoordinate) => void;
  selectedLocation: SavedLocation | null;
}

// Pre-calculate corners for a hexagon of size 1 relative to (0,0)
const HEX_CORNERS = [0, 1, 2, 3, 4, 5].map(i => {
  const angle_deg = 60 * i - 30;
  const angle_rad = Math.PI / 180 * angle_deg;
  return {
    x: Math.cos(angle_rad),
    y: Math.sin(angle_rad)
  };
});

const HexCanvas: React.FC<HexCanvasProps> = ({ 
  playerPos, 
  settings, 
  width, 
  height,
  rotation, 
  savedLocations,
  onHexClick,
  selectedLocation
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [textures, setTextures] = useState<Record<TerrainType, CanvasPattern | string> | null>(null);

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

    const dpr = window.devicePixelRatio || 1;
    if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);
    } else {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    // Clear Screen
    ctx.fillStyle = '#0f172a'; // Match body background
    ctx.fillRect(0, 0, width, height);

    ctx.save();

    // 1. Move origin to center of screen
    ctx.translate(Math.floor(width / 2), Math.floor(height / 2));

    // 2. Apply Rotation
    const rad = (rotation * Math.PI) / 180;
    ctx.rotate(rad);

    // 3. Move world so player is at the new origin
    const centerPix = hexToPixel(playerPos.q, playerPos.r, settings.hexSize);
    ctx.translate(-centerPix.x, -centerPix.y);

    // Get Visible Hexes
    const hexes = getHexRing(playerPos, settings.renderRadius + 3);

    // Draw Hexes
    hexes.forEach(hex => {
      drawHex(ctx, hex, settings.hexSize, settings, textures);
    });

    // Draw Saved Location Markers
    savedLocations.forEach(loc => {
      const dist = hexDistance({q: loc.x, r: loc.y}, playerPos);
      if (dist <= settings.renderRadius + 3) {
        drawMarker(ctx, loc, settings.hexSize);
      }
    });

    // Draw Player cursor
    drawPlayer(ctx, playerPos, settings.hexSize);

    ctx.restore();

  }, [playerPos, settings, width, height, rotation, savedLocations, textures, selectedLocation]);

  const getHexFromMouseEvent = (e: React.MouseEvent<HTMLCanvasElement>): HexCoordinate | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    // Get mouse position relative to canvas center
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left - width / 2;
    const my = e.clientY - rect.top - height / 2;

    // Apply Inverse Rotation to Mouse Coordinates
    const rad = (-rotation * Math.PI) / 180;
    const rx = mx * Math.cos(rad) - my * Math.sin(rad);
    const ry = mx * Math.sin(rad) + my * Math.cos(rad);

    // Now calculate World Pixel
    const centerPix = hexToPixel(playerPos.q, playerPos.r, settings.hexSize);
    const worldX = rx + centerPix.x;
    const worldY = ry + centerPix.y;

    // Convert World pixel to Hex Coordinate
    return pixelToHex(worldX, worldY, settings.hexSize);
  };

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const clickedHex = getHexFromMouseEvent(e);
    if (!clickedHex) return;

    onHexClick(clickedHex);
  };

  const drawHex = (
    ctx: CanvasRenderingContext2D, 
    hex: HexCoordinate, 
    size: number, 
    currentSettings: MapSettings, 
    textureMap: Record<TerrainType, CanvasPattern | string>
  ) => {
    const { x, y } = hexToPixel(hex.q, hex.r, size);
    
    ctx.beginPath();
    ctx.moveTo(x + HEX_CORNERS[0].x * size, y + HEX_CORNERS[0].y * size);
    for (let i = 1; i < 6; i++) {
        ctx.lineTo(x + HEX_CORNERS[i].x * size, y + HEX_CORNERS[i].y * size);
    }
    ctx.closePath();

    const terrain = getTerrain(hex.q, hex.r, currentSettings);
    
    // Apply Texture
    if (textureMap && textureMap[terrain]) {
        ctx.fillStyle = textureMap[terrain];
    } else {
        ctx.fillStyle = TERRAIN_COLORS[terrain];
    }
    
    ctx.fill();

    // --- 3D Lighting Effect (Overlay) ---
    const grad = ctx.createLinearGradient(x - size, y - size, x + size, y + size);
    grad.addColorStop(0, 'rgba(255, 255, 255, 0.15)'); // Highlight
    grad.addColorStop(0.5, 'rgba(0,0,0,0)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0.2)'); // Shadow
    
    ctx.fillStyle = grad;
    ctx.fill();

    // Standard Border
    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.lineWidth = 2;
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
    const pinHeight = size * 1.0;
    const pinWidth = size * 0.6;
    
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
    
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    ctx.lineWidth = 1.5;
    ctx.strokeStyle = '#000000';
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(x, y - pinHeight * 0.6, size * 0.2, 0, Math.PI * 2);
    ctx.fillStyle = '#1e293b'; 
    ctx.fill();
  };

  const drawPlayer = (ctx: CanvasRenderingContext2D, hex: HexCoordinate, size: number) => {
    const { x, y } = hexToPixel(hex.q, hex.r, size);
    
    ctx.beginPath();
    ctx.arc(x, y, size * 0.6, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 15;
    ctx.fill();
    ctx.shadowBlur = 0; 

    ctx.beginPath();
    ctx.arc(x, y, size * 0.3, 0, Math.PI * 2);
    ctx.fillStyle = '#ef4444';
    ctx.fill();
  };

  return (
    <canvas 
      ref={canvasRef} 
      onClick={handleClick}
      style={{ width: `${width}px`, height: `${height}px`, display: 'block', cursor: 'crosshair' }}
    />
  );
};

export default HexCanvas;
