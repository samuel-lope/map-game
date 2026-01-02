
import React, { useRef, useEffect } from 'react';
import { ExploredBounds, HexCoordinate, Language, MapSettings } from '../types';
import { getTerrain } from '../utils/rng';
import { TERRAIN_COLORS } from '../constants';
import { hexToPixel, getHexRing } from '../utils/hexMath';

interface MinimapModalProps {
  seed: string;
  bounds: ExploredBounds;
  playerPos: HexCoordinate;
  onClose: () => void;
  language: Language;
  settings: MapSettings;
}

const MinimapModal: React.FC<MinimapModalProps> = ({ seed, bounds, playerPos, onClose, language, settings }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Pre-calculate corners for hexagon drawing
  const HEX_CORNERS = [0, 1, 2, 3, 4, 5].map(i => {
    const angle_deg = 60 * i - 30;
    const angle_rad = Math.PI / 180 * angle_deg;
    return {
      x: Math.cos(angle_rad),
      y: Math.sin(angle_rad)
    };
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const canvasSize = 600;
    const dpr = window.devicePixelRatio || 1;
    
    canvas.width = canvasSize * dpr;
    canvas.height = canvasSize * dpr;
    
    ctx.scale(dpr, dpr);

    // Background
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvasSize, canvasSize);

    // --- CONFIGURATION ---
    // User requested "max scale of 5 pix/hex". 
    // We interpret this as a fixed zoom level for the minimap view.
    const HEX_SIZE = 5; 
    
    // Calculate how many hexes fit in the radius of the canvas
    const renderRadius = Math.ceil((canvasSize / 2) / (HEX_SIZE * 1.5)) + 2;

    // Center of canvas
    const centerX = canvasSize / 2;
    const centerY = canvasSize / 2;

    // Generate hexes around the player
    const hexes = getHexRing(playerPos, renderRadius);

    // Helper to draw a single hex
    const drawHex = (q: number, r: number, color: string) => {
       // Get pixel position relative to player (player is at 0,0 world space conceptually for this view)
       // We calculate the delta from player to place it on canvas center
       const relativeQ = q - playerPos.q;
       const relativeR = r - playerPos.r;

       // Use hexToPixel on the relative coord
       const p = hexToPixel(relativeQ, relativeR, HEX_SIZE);
       
       const x = centerX + p.x;
       const y = centerY + p.y;

       // Optimization: Skip drawing if out of canvas bounds
       if (x < -HEX_SIZE || x > canvasSize + HEX_SIZE || y < -HEX_SIZE || y > canvasSize + HEX_SIZE) return;

       ctx.beginPath();
       ctx.moveTo(x + HEX_CORNERS[0].x * HEX_SIZE, y + HEX_CORNERS[0].y * HEX_SIZE);
       for (let i = 1; i < 6; i++) {
         ctx.lineTo(x + HEX_CORNERS[i].x * HEX_SIZE, y + HEX_CORNERS[i].y * HEX_SIZE);
       }
       ctx.closePath();
       ctx.fillStyle = color;
       ctx.fill();
    };

    // Draw Map
    hexes.forEach(hex => {
       const terrain = getTerrain(hex.q, hex.r, settings);
       drawHex(hex.q, hex.r, TERRAIN_COLORS[terrain]);
    });

    // Draw Player Marker
    // Player is exactly at centerX, centerY because we shifted everything relative to them
    ctx.beginPath();
    ctx.arc(centerX, centerY, HEX_SIZE, 0, Math.PI * 2);
    ctx.fillStyle = '#ef4444';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.fill();
    ctx.stroke();

    // Draw Overlay Text
    ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
    ctx.fillRect(10, 10, 200, 50);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '12px monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(language === 'pt' ? 'Escala Fixa: 5px/hex' : 'Fixed Scale: 5px/hex', 20, 20);
    ctx.fillText(language === 'pt' ? `Raio Visível: ~${renderRadius} hex` : `View Radius: ~${renderRadius} hex`, 20, 35);

  }, [seed, bounds, playerPos, settings, language]);

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden max-w-full max-h-full animate-in fade-in zoom-in duration-200">
        
        <div className="flex justify-between items-center p-4 border-b border-slate-800 bg-slate-800/50">
          <h2 className="text-white font-bold text-lg tracking-wider uppercase">
            {language === 'pt' ? 'Visualização Tática' : 'Tactical View'}
          </h2>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-700 hover:bg-slate-600 text-white flex items-center justify-center transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="p-4 bg-slate-950 overflow-auto flex items-center justify-center">
            <canvas 
                ref={canvasRef} 
                style={{ width: '600px', height: '600px', maxWidth: '100%', maxHeight: '80vh' }}
                className="rounded border border-slate-800 shadow-inner bg-[#0f172a]"
            />
        </div>

        <div className="p-3 bg-slate-800/50 text-xs text-slate-500 text-center border-t border-slate-800">
             {language === 'pt' 
                ? 'Visualização de área ampla centralizada na posição atual.' 
                : 'Wide area visualization centered on current position.'}
        </div>
      </div>
    </div>
  );
};

export default MinimapModal;
