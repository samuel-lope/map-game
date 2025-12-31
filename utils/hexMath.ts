import { HexCoordinate, PixelCoordinate } from '../types';

/**
 * Converts Axial (q, r) to Pixel (x, y) for Pointy Topped Hexagons
 */
export function hexToPixel(q: number, r: number, size: number): PixelCoordinate {
  const x = size * (Math.sqrt(3) * q + (Math.sqrt(3) / 2) * r);
  const y = size * ((3 / 2) * r);
  return { x, y };
}

/**
 * Converts Pixel (x, y) to Axial (q, r).
 * Inverts the hexToPixel matrix.
 */
export function pixelToHex(x: number, y: number, size: number): HexCoordinate {
  const q = (Math.sqrt(3) / 3 * x - 1 / 3 * y) / size;
  const r = (2 / 3 * y) / size;
  return hexRound({ q, r });
}

/**
 * Rounds floating point axial coordinates to the nearest valid hex integer coordinate.
 */
export function hexRound(h: HexCoordinate): HexCoordinate {
  let q = Math.round(h.q);
  let r = Math.round(h.r);
  let s = Math.round(-h.q - h.r);

  const q_diff = Math.abs(q - h.q);
  const r_diff = Math.abs(r - h.r);
  const s_diff = Math.abs(s - (-h.q - h.r));

  if (q_diff > r_diff && q_diff > s_diff) {
    q = -r - s;
  } else if (r_diff > s_diff) {
    r = -q - s;
  }
  
  return { q, r };
}

/**
 * Calculates the distance between two hex coordinates
 */
export function hexDistance(a: HexCoordinate, b: HexCoordinate): number {
  return (Math.abs(a.q - b.q) + Math.abs(a.q + a.r - b.q - b.r) + Math.abs(a.r - b.r)) / 2;
}

/**
 * Generates a spiral of hex coordinates starting from the center outward
 * up to the given radius.
 */
export function getHexRing(center: HexCoordinate, radius: number): HexCoordinate[] {
  const results: HexCoordinate[] = [];
  
  // q coordinate loop
  for (let q = -radius; q <= radius; q++) {
    // r coordinate loop logic based on axial constraints
    const r1 = Math.max(-radius, -q - radius);
    const r2 = Math.min(radius, -q + radius);
    for (let r = r1; r <= r2; r++) {
      results.push({
        q: center.q + q,
        r: center.r + r
      });
    }
  }
  return results;
}

/**
 * Rotates a movement vector (dq, dr) based on the map rotation.
 * If map rotates CW, we must rotate the vector CCW to match visual direction.
 */
export function rotateMoveVector(dq: number, dr: number, rotationDeg: number): HexCoordinate {
  // Normalize rotation to positive 0-360
  const rot = ((rotationDeg % 360) + 360) % 360;
  
  // Calculate 60 degree steps
  const steps = Math.round(rot / 60);
  
  let q = dq;
  let r = dr;

  for(let i=0; i<steps; i++) {
    // Rotate vector 60 degrees Counter-Clockwise (CCW)
    // Formula: (q, r) -> (q + r, -q)
    const newQ = q + r;
    const newR = -q;
    q = newQ;
    r = newR;
  }

  return { q, r };
}