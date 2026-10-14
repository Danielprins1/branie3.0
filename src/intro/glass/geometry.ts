export interface Pt {
  x: number;
  y: number;
}
export type Poly = Pt[];

/** Kleine, snelle seeded random generator (mulberry32). */
export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export type Rand = ReturnType<typeof rng>;

export const rectPoly = (x0: number, y0: number, x1: number, y1: number): Poly => [
  { x: x0, y: y0 },
  { x: x1, y: y0 },
  { x: x1, y: y1 },
  { x: x0, y: y1 },
];

/**
 * Knipt een (convexe) polygoon af op het halfvlak n·p <= c.
 * Sutherland–Hodgman voor één snijlijn.
 */
export function clipHalfPlane(poly: Poly, nx: number, ny: number, c: number): Poly {
  const out: Poly = [];
  const n = poly.length;
  for (let i = 0; i < n; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % n];
    const da = nx * a.x + ny * a.y - c;
    const db = nx * b.x + ny * b.y - c;
    if (da <= 0) out.push(a);
    if ((da <= 0) !== (db <= 0)) {
      const t = da / (da - db);
      out.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
    }
  }
  return out;
}

/** Voronoi-cellen van `seeds`, binnen een rechthoek. O(n²), prima voor een paar honderd punten. */
export function voronoi(seeds: Pt[], bounds: Poly): Poly[] {
  return seeds.map((s, i) => {
    let cell = bounds;
    for (let j = 0; j < seeds.length && cell.length > 2; j++) {
      if (i === j) continue;
      const o = seeds[j];
      const nx = o.x - s.x;
      const ny = o.y - s.y;
      const c = nx * ((s.x + o.x) / 2) + ny * ((s.y + o.y) / 2);
      cell = clipHalfPlane(cell, nx, ny, c);
    }
    return cell;
  });
}

export function area(poly: Poly): number {
  let a = 0;
  for (let i = 0, n = poly.length; i < n; i++) {
    const p = poly[i];
    const q = poly[(i + 1) % n];
    a += p.x * q.y - q.x * p.y;
  }
  return Math.abs(a) / 2;
}

export function centroid(poly: Poly): Pt {
  let x = 0;
  let y = 0;
  let a = 0;
  for (let i = 0, n = poly.length; i < n; i++) {
    const p = poly[i];
    const q = poly[(i + 1) % n];
    const f = p.x * q.y - q.x * p.y;
    x += (p.x + q.x) * f;
    y += (p.y + q.y) * f;
    a += f;
  }
  if (Math.abs(a) < 1e-6) {
    const s = poly.reduce((acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }), { x: 0, y: 0 });
    return { x: s.x / poly.length, y: s.y / poly.length };
  }
  return { x: x / (3 * a), y: y / (3 * a) };
}

export function bbox(poly: Poly) {
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (const p of poly) {
    if (p.x < x0) x0 = p.x;
    if (p.y < y0) y0 = p.y;
    if (p.x > x1) x1 = p.x;
    if (p.y > y1) y1 = p.y;
  }
  return { x0, y0, x1, y1, w: x1 - x0, h: y1 - y0 };
}

/** Krimpt een convexe polygoon richting het zwaartepunt (voor loodranden/glans). */
export function shrink(poly: Poly, amount: number): Poly {
  const c = centroid(poly);
  return poly.map((p) => {
    const dx = p.x - c.x;
    const dy = p.y - c.y;
    const d = Math.hypot(dx, dy) || 1;
    const k = Math.max(0, d - amount) / d;
    return { x: c.x + dx * k, y: c.y + dy * k };
  });
}

export function tracePoly(ctx: CanvasRenderingContext2D, poly: Poly) {
  ctx.moveTo(poly[0].x, poly[0].y);
  for (let i = 1; i < poly.length; i++) ctx.lineTo(poly[i].x, poly[i].y);
  ctx.closePath();
}

/** Achthoek (rechthoek met afgeschuinde hoeken). */
export function octagon(cx: number, cy: number, w: number, h: number, chamfer: number): Poly {
  const x0 = cx - w / 2;
  const x1 = cx + w / 2;
  const y0 = cy - h / 2;
  const y1 = cy + h / 2;
  const c = Math.min(chamfer, w / 2, h / 2);
  return [
    { x: x0 + c, y: y0 },
    { x: x1 - c, y: y0 },
    { x: x1, y: y0 + c },
    { x: x1, y: y1 - c },
    { x: x1 - c, y: y1 },
    { x: x0 + c, y: y1 },
    { x: x0, y: y1 - c },
    { x: x0, y: y0 + c },
  ];
}

export const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
