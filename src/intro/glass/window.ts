/**
 * Tekent het glas-in-loodraam van BRANIE op een (offscreen) canvas.
 *
 * Opbouw, van achter naar voor:
 *   1. veld van onregelmatige, symmetrisch gecomponeerde glasvlakken
 *   2. lood tussen die vlakken
 *   3. rand van rechthoekige glasstroken
 *   4. middenpaneel (achthoek) met BRANIE in rood glas en de pay-off
 *      als beschilderd glas (grisaille) op een banderol
 *   5. loodwerk van het middenpaneel, soldeerpunten en daglicht
 *
 * Alle glasvlakken krijgen een eigen kleurverloop, textuur (gehamerd glas),
 * kleine kleurafwijkingen, binnenschaduw en een vaag doorschijnend
 * "buitenbeeld", zodat het geen platte vlakken worden.
 */
import {
  area,
  bbox,
  centroid,
  clamp,
  octagon,
  rectPoly,
  rng,
  tracePoly,
  voronoi,
  type Poly,
  type Pt,
  type Rand,
} from "./geometry";

export const GLASS = {
  red: "#a8201b",
  bordeaux: "#5f1124",
  amber: "#db8f18",
  ochre: "#c9a133",
  green: "#1f4e36",
  blue: "#88b8d0",
  deepBlue: "#26496e",
  cream: "#efe1bf",
  clear: "#f6ead0",
} as const;
type GlassColor = keyof typeof GLASS;

export interface WindowOptions {
  width: number;
  height: number;
  dpr: number;
  title: string;
  payoff: string;
  logo?: HTMLImageElement | null;
  seed?: number;
}

export interface GlassWindow {
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
  dpr: number;
  /** Glasvlakken die af en toe oplichten. */
  pieces: Poly[];
  /** Het middenpaneel, voor de glans over het logo. */
  panel: Poly;
  /** Waar het glas het eerst breekt. */
  impact: Pt;
  lead: number;
}

/* ------------------------------------------------------------------ */
/* Kleur                                                               */
/* ------------------------------------------------------------------ */

type RGB = [number, number, number];
const hex = (h: string): RGB => {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const mix = (a: RGB, b: RGB, t: number): RGB => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  a[2] + (b[2] - a[2]) * t,
];
const css = (c: RGB, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
const WHITE: RGB = [255, 250, 235];
const BLACK: RGB = [12, 8, 6];
const shade = (c: RGB, t: number) => (t >= 0 ? mix(c, WHITE, t) : mix(c, BLACK, -t));

/* ------------------------------------------------------------------ */
/* Texturen                                                            */
/* ------------------------------------------------------------------ */

const makeCanvas = (w: number, h: number) => {
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.ceil(w));
  c.height = Math.max(1, Math.ceil(h));
  return c;
};

let textureCache: HTMLCanvasElement | null = null;

/** Gehamerd glas: zachte bobbels + fijne ruis, rond 50% grijs (voor 'overlay'). */
function glassTexture(): HTMLCanvasElement {
  if (textureCache) return textureCache;
  const size = 512;
  const c = makeCanvas(size, size);
  const ctx = c.getContext("2d")!;
  const r = rng(7);
  ctx.fillStyle = "#808080";
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 1600; i++) {
    const x = r() * size;
    const y = r() * size;
    const rad = 4 + r() * r() * 26;
    const light = r() > 0.5;
    const g = ctx.createRadialGradient(x - rad * 0.3, y - rad * 0.3, 0, x, y, rad);
    const a = 0.05 + r() * 0.12;
    g.addColorStop(0, light ? `rgba(255,255,255,${a})` : `rgba(0,0,0,${a})`);
    g.addColorStop(1, "rgba(128,128,128,0)");
    ctx.fillStyle = g;
    // tegelbaar maken: ook aan de overkant tekenen
    for (const ox of [-size, 0, size])
      for (const oy of [-size, 0, size]) {
        if (x + ox + rad < 0 || x + ox - rad > size || y + oy + rad < 0 || y + oy - rad > size) continue;
        ctx.save();
        ctx.translate(ox, oy);
        ctx.fillRect(x - rad, y - rad, rad * 2, rad * 2);
        ctx.restore();
      }
  }
  // lange, zachte trekstrepen (zoals in oud getrokken glas)
  ctx.globalAlpha = 0.06;
  for (let i = 0; i < 40; i++) {
    ctx.strokeStyle = r() > 0.5 ? "#fff" : "#000";
    ctx.lineWidth = 1 + r() * 5;
    ctx.beginPath();
    const y = r() * size;
    ctx.moveTo(0, y);
    ctx.bezierCurveTo(size * 0.3, y + (r() - 0.5) * 30, size * 0.6, y + (r() - 0.5) * 30, size, y);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  // fijne korrel
  const img = ctx.getImageData(0, 0, size, size);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (r() - 0.5) * 22;
    d[i] += n;
    d[i + 1] += n;
    d[i + 2] += n;
  }
  ctx.putImageData(img, 0, 0);
  textureCache = c;
  return c;
}

/**
 * Wat je vaag door het glas heen ziet: lucht, een boomkruin, een gevel.
 * Op lage resolutie getekend en opgeschaald, zodat het vanzelf wazig wordt.
 */
function outsideScene(w: number, h: number, r: Rand): HTMLCanvasElement {
  const s = 1 / 10;
  const c = makeCanvas(w * s, h * s);
  const ctx = c.getContext("2d")!;
  ctx.scale(s, s);
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, "#d9e8ef");
  sky.addColorStop(0.55, "#f3ead6");
  sky.addColorStop(1, "#e7cfa3");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);
  // boomkruin rechtsboven
  for (let i = 0; i < 26; i++) {
    const x = w * (0.62 + r() * 0.45);
    const y = h * (r() * 0.45);
    const rad = Math.min(w, h) * (0.06 + r() * 0.12);
    const g = ctx.createRadialGradient(x, y, 0, x, y, rad);
    g.addColorStop(0, "rgba(40,58,38,0.55)");
    g.addColorStop(1, "rgba(40,58,38,0)");
    ctx.fillStyle = g;
    ctx.fillRect(x - rad, y - rad, rad * 2, rad * 2);
  }
  // gevel van de overburen linksonder, met trapgevel-achtige stap
  ctx.fillStyle = "rgba(70,50,40,0.55)";
  const gx = w * 0.04;
  const gw = w * 0.3;
  const gy = h * 0.58;
  ctx.beginPath();
  ctx.moveTo(gx, h);
  ctx.lineTo(gx, gy + h * 0.08);
  ctx.lineTo(gx + gw * 0.2, gy + h * 0.08);
  ctx.lineTo(gx + gw * 0.2, gy);
  ctx.lineTo(gx + gw * 0.8, gy);
  ctx.lineTo(gx + gw * 0.8, gy + h * 0.08);
  ctx.lineTo(gx + gw, gy + h * 0.08);
  ctx.lineTo(gx + gw, h);
  ctx.fill();
  // zonnevlek linksboven
  const sun = ctx.createRadialGradient(w * 0.18, h * 0.12, 0, w * 0.18, h * 0.12, Math.max(w, h) * 0.5);
  sun.addColorStop(0, "rgba(255,248,225,0.9)");
  sun.addColorStop(1, "rgba(255,248,225,0)");
  ctx.fillStyle = sun;
  ctx.fillRect(0, 0, w, h);
  return c;
}

/* ------------------------------------------------------------------ */
/* Glas en lood                                                        */
/* ------------------------------------------------------------------ */

interface Ctx {
  ctx: CanvasRenderingContext2D;
  w: number;
  h: number;
  r: Rand;
  tex: HTMLCanvasElement;
  outside: HTMLCanvasElement;
  lead: number;
  light: Pt;
}

/** Vult het huidige pad (path) met overtuigend glas. */
function fillGlass(g: Ctx, path: Path2D, bounds: ReturnType<typeof bbox>, color: string, opts: { clear?: boolean } = {}) {
  const { ctx, r } = g;
  const base = shade(hex(color), (r() - 0.5) * 0.12);
  const cx = bounds.x0 + bounds.w / 2;
  const cy = bounds.y0 + bounds.h / 2;
  const rad = Math.max(bounds.w, bounds.h) * 0.75 + 1;

  ctx.save();
  ctx.clip(path);

  // 1. basiskleur met lichtval: helderder aan de kant waar het daglicht vandaan komt
  const lx = cx + (g.light.x - cx) * 0.15 - bounds.w * 0.2;
  const ly = cy + (g.light.y - cy) * 0.15 - bounds.h * 0.25;
  const grad = ctx.createRadialGradient(lx, ly, rad * 0.05, cx, cy, rad);
  grad.addColorStop(0, css(shade(base, opts.clear ? 0.35 : 0.28)));
  grad.addColorStop(0.55, css(base));
  grad.addColorStop(1, css(shade(base, opts.clear ? -0.12 : -0.3)));
  ctx.fillStyle = grad;
  ctx.fillRect(bounds.x0 - 2, bounds.y0 - 2, bounds.w + 4, bounds.h + 4);

  // 2. doorschijnend buitenbeeld, licht verschoven per glasvlak (lichtbreking)
  const ox = (r() - 0.5) * 18;
  const oy = (r() - 0.5) * 18;
  ctx.globalAlpha = opts.clear ? 0.42 : 0.22;
  ctx.globalCompositeOperation = opts.clear ? "source-over" : "multiply";
  ctx.drawImage(g.outside, ox - 10, oy - 10, g.w + 20, g.h + 20);
  if (opts.clear) {
    // het buitenbeeld weer iets terug kleuren naar het glas
    ctx.globalCompositeOperation = "multiply";
    ctx.globalAlpha = 0.55;
    ctx.fillStyle = css(base);
    ctx.fillRect(bounds.x0 - 2, bounds.y0 - 2, bounds.w + 4, bounds.h + 4);
  }

  // 3. kleurwolken: glas is nooit egaal
  ctx.globalCompositeOperation = "source-over";
  for (let i = 0; i < 3; i++) {
    const px = bounds.x0 + r() * bounds.w;
    const py = bounds.y0 + r() * bounds.h;
    const pr = rad * (0.3 + r() * 0.5);
    const cg = ctx.createRadialGradient(px, py, 0, px, py, pr);
    cg.addColorStop(0, css(shade(base, (r() - 0.45) * 0.4), 0.35));
    cg.addColorStop(1, css(base, 0));
    ctx.fillStyle = cg;
    ctx.fillRect(px - pr, py - pr, pr * 2, pr * 2);
  }

  // 4. textuur van gehamerd glas
  ctx.globalCompositeOperation = "overlay";
  ctx.globalAlpha = opts.clear ? 0.55 : 0.7;
  const pattern = ctx.createPattern(g.tex, "repeat")!;
  const m = new DOMMatrix().translateSelf(r() * 512, r() * 512).rotateSelf(r() * 360).scaleSelf(0.6 + r() * 0.5);
  pattern.setTransform(m);
  ctx.fillStyle = pattern;
  ctx.fillRect(bounds.x0 - 2, bounds.y0 - 2, bounds.w + 4, bounds.h + 4);

  // 5. luchtbelletjes
  ctx.globalCompositeOperation = "source-over";
  const bubbles = Math.floor((bounds.w * bounds.h) / 9000);
  for (let i = 0; i < bubbles; i++) {
    if (r() > 0.6) continue;
    const bx = bounds.x0 + r() * bounds.w;
    const by = bounds.y0 + r() * bounds.h;
    const br = 0.6 + r() * 1.6;
    ctx.globalAlpha = 0.35 + r() * 0.3;
    ctx.fillStyle = "rgba(255,255,245,0.9)";
    ctx.beginPath();
    ctx.ellipse(bx, by, br * 1.4, br, r() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }

  // 6. binnenschaduw langs het lood: geeft diepte
  ctx.globalAlpha = 1;
  ctx.lineJoin = "round";
  ctx.strokeStyle = css(shade(base, -0.6), 0.45);
  ctx.lineWidth = g.lead * 3.2;
  ctx.stroke(path);
  ctx.strokeStyle = css(shade(base, -0.4), 0.3);
  ctx.lineWidth = g.lead * 6;
  ctx.stroke(path);
  // en een smalle lichtrand aan de binnenkant
  ctx.strokeStyle = css(shade(base, 0.5), 0.18);
  ctx.lineWidth = g.lead * 1.6;
  ctx.translate(g.lead * 0.5, g.lead * 0.6);
  ctx.stroke(path);

  ctx.restore();
}

/** Lood ("came"): schaduw, donkere kern en een smal glanslijntje bovenop. */
function strokeLead(g: Ctx, draw: (ctx: CanvasRenderingContext2D) => void, width = g.lead) {
  const { ctx } = g;
  ctx.save();
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  // schaduw op het glas
  ctx.translate(width * 0.25, width * 0.4);
  ctx.strokeStyle = "rgba(0,0,0,0.38)";
  ctx.lineWidth = width * 1.55;
  draw(ctx);
  ctx.translate(-width * 0.25, -width * 0.4);
  // kern
  ctx.strokeStyle = "#1c1916";
  ctx.lineWidth = width;
  draw(ctx);
  // afgeronde bovenkant
  ctx.strokeStyle = "#3a352f";
  ctx.lineWidth = width * 0.55;
  draw(ctx);
  // glans
  ctx.translate(-width * 0.12, -width * 0.16);
  ctx.strokeStyle = "rgba(220,215,200,0.32)";
  ctx.lineWidth = Math.max(0.8, width * 0.16);
  draw(ctx);
  ctx.restore();
}

/** Soldeerpunten op de kruisingen van het lood. */
function solderJoints(g: Ctx, polys: Poly[]) {
  const seen = new Map<string, { p: Pt; n: number }>();
  for (const poly of polys)
    for (const p of poly) {
      const key = `${Math.round(p.x / 3)}:${Math.round(p.y / 3)}`;
      const e = seen.get(key);
      if (e) e.n++;
      else seen.set(key, { p, n: 1 });
    }
  const { ctx } = g;
  for (const { p, n } of seen.values()) {
    if (n < 3) continue;
    const rad = g.lead * 0.78;
    const sg = ctx.createRadialGradient(p.x - rad * 0.35, p.y - rad * 0.35, 0, p.x, p.y, rad);
    sg.addColorStop(0, "#77716a");
    sg.addColorStop(0.45, "#3b3631");
    sg.addColorStop(1, "#1a1714");
    ctx.fillStyle = sg;
    ctx.beginPath();
    ctx.ellipse(p.x, p.y, rad, rad * 0.9, 0.4, 0, Math.PI * 2);
    ctx.fill();
  }
}

const pathOf = (poly: Poly) => {
  const p = new Path2D();
  p.moveTo(poly[0].x, poly[0].y);
  for (let i = 1; i < poly.length; i++) p.lineTo(poly[i].x, poly[i].y);
  p.closePath();
  return p;
};

/* ------------------------------------------------------------------ */
/* Compositie                                                          */
/* ------------------------------------------------------------------ */

interface Seed extends Pt {
  ring: number;
  k: number;
}

/** Symmetrische zaadpunten in ringen rond het midden: een art-deco-zonnestraal, maar onregelmatig. */
function fieldSeeds(x0: number, y0: number, x1: number, y1: number, cx: number, cy: number, panelR: number, r: Rand) {
  const w = x1 - x0;
  const h = y1 - y0;
  const left: Seed[] = [];
  const aspect = h / w;
  const maxR = Math.hypot(w, h) * 0.62;
  let ringR = panelR * 0.95;
  let ring = 0;
  while (ringR < maxR) {
    const circumference = Math.PI * 2 * ringR;
    const step = clamp(ringR * 0.5, 48, 210);
    let n = Math.max(8, Math.round(circumference / step));
    if (n % 2) n++;
    const offset = ring % 2 ? 0.5 : 0;
    for (let i = 0; i < n; i++) {
      const a = -Math.PI / 2 + ((i + offset) * Math.PI * 2) / n;
      const cos = Math.cos(a);
      if (cos > 1e-6) continue; // alleen linkerhelft, die spiegelen we
      const jitterA = Math.abs(cos) < 1e-6 ? 0 : (r() - 0.5) * (Math.PI / n) * 0.7;
      const jr = ringR * (1 + (r() - 0.5) * 0.18);
      const ell = 0.72 + 0.28 * aspect;
      left.push({
        x: cx + Math.cos(a + jitterA) * jr,
        y: cy + Math.sin(a + jitterA) * jr * ell,
        ring,
        k: i,
      });
    }
    ringR *= 1.26 + r() * 0.08;
    ring++;
  }
  const seeds: Seed[] = [];
  for (const s of left) {
    if (s.x < x0 - w * 0.4 || s.x > x1 + w * 0.4 || s.y < y0 - h * 0.4 || s.y > y1 + h * 0.4) continue;
    seeds.push(s);
    if (cx - s.x > 1) seeds.push({ ...s, x: 2 * cx - s.x });
  }
  return seeds;
}

/** Kleurparen per ring: zo ontstaat een herkenbaar patroon met genoeg afwisseling. */
const RING_COLORS: [GlassColor, GlassColor][] = [
  ["red", "amber"],
  ["blue", "cream"],
  ["green", "ochre"],
  ["bordeaux", "blue"],
  ["amber", "deepBlue"],
  ["red", "cream"],
  ["green", "blue"],
  ["ochre", "bordeaux"],
];

function colorFor(seed: Seed, r: Rand): { color: GlassColor; clear: boolean } {
  const pair = RING_COLORS[seed.ring % RING_COLORS.length];
  let color = pair[seed.k % 2];
  // af en toe een eigenwijze uitzondering
  if (r() < 0.07) color = (["red", "green", "blue"] as GlassColor[])[Math.floor(r() * 3)];
  return { color, clear: color === "cream" || color === "clear" };
}

export async function buildWindow(opts: WindowOptions): Promise<GlassWindow> {
  const { width: w, height: h, dpr } = opts;
  const canvas = makeCanvas(w * dpr, h * dpr);
  const ctx = canvas.getContext("2d")!;
  ctx.scale(dpr, dpr);
  const r = rng(opts.seed ?? 1950);
  const min = Math.min(w, h);
  const lead = clamp(min * 0.0085, 3.5, 9);
  const g: Ctx = {
    ctx,
    w,
    h,
    r,
    tex: glassTexture(),
    outside: outsideScene(w, h, r),
    lead,
    light: { x: w * 0.15, y: -h * 0.1 },
  };

  ctx.fillStyle = "#1c1916";
  ctx.fillRect(0, 0, w, h);

  /* --- maten van het middenpaneel ---------------------------------- */
  const titleFont = (size: number) => `400 ${size}px Anton, "Arial Narrow", Impact, sans-serif`;
  const scriptFont = (size: number) => `400 ${size}px "Pinyon Script", "Brush Script MT", cursive`;
  const title = opts.title.toUpperCase();
  const letters = [...title];
  ctx.font = titleFont(100);
  const spacing100 = 7;
  const width100 = letters.reduce((s, l) => s + ctx.measureText(l).width, 0) + spacing100 * (letters.length - 1);
  const border = clamp(min * 0.05, 16, 52);
  const widthShare = w < 700 ? 0.8 : 0.7;
  let titleSize = Math.min(h * 0.24, ((w - border * 2) * widthShare * 100) / width100);
  titleSize = Math.max(titleSize, 40);
  const titleW = (width100 * titleSize) / 100;
  ctx.font = titleFont(titleSize);
  const capH = ctx.measureText("B").actualBoundingBoxAscent || titleSize * 0.72;
  const payoffSize = clamp(titleSize * 0.3, 20, 64);
  const ribbonH = payoffSize * 1.75;
  const pad = titleSize * 0.26;
  const panelW = Math.min(w - border * 2 - lead * 6, titleW + pad * 2.6);
  const panelH = capH + ribbonH + pad * 2.9;
  const cx = w / 2;
  const cy = h / 2;
  const frame = clamp(titleSize * 0.09, 8, 22);
  const outerPanel = octagon(cx, cy, panelW + frame * 2, panelH + frame * 2, pad * 1.1 + frame);
  const innerPanel = octagon(cx, cy, panelW, panelH, pad * 1.1);

  /* --- 1 + 2. veld -------------------------------------------------- */
  const fx0 = border;
  const fy0 = border;
  const fx1 = w - border;
  const fy1 = h - border;
  const panelR = Math.max(panelW, panelH) * 0.55;
  const seeds = fieldSeeds(fx0, fy0, fx1, fy1, cx, cy, panelR, r);
  const cells = voronoi(seeds, rectPoly(fx0, fy0, fx1, fy1));
  const pieces: Poly[] = [];
  cells.forEach((cell, i) => {
    if (cell.length < 3 || area(cell) < 4) return;
    const { color, clear } = colorFor(seeds[i], r);
    fillGlass(g, pathOf(cell), bbox(cell), GLASS[color], { clear });
    pieces.push(cell);
  });
  strokeLead(g, (c) => {
    c.beginPath();
    for (const p of pieces) tracePoly(c, p);
    c.stroke();
  });
  solderJoints(g, pieces);

  /* --- 3. rand ------------------------------------------------------ */
  const borderPolys: Poly[] = [];
  const borderColors: GlassColor[] = [];
  const corner = (x: number, y: number) => {
    borderPolys.push(rectPoly(x, y, x + border, y + border));
    borderColors.push("deepBlue");
  };
  corner(0, 0);
  corner(w - border, 0);
  corner(0, h - border);
  corner(w - border, h - border);
  const strip = (len: number, horizontal: boolean, fixed: number) => {
    const n = Math.max(2, Math.round(len / (border * 3.2)));
    const seg = len / n;
    for (let i = 0; i < n; i++) {
      const a = border + i * seg;
      borderPolys.push(
        horizontal ? rectPoly(a, fixed, a + seg, fixed + border) : rectPoly(fixed, a, fixed + border, a + seg),
      );
      borderColors.push(i % 2 ? "amber" : "bordeaux");
    }
  };
  strip(w - border * 2, true, 0);
  strip(w - border * 2, true, h - border);
  strip(h - border * 2, false, 0);
  strip(h - border * 2, false, w - border);
  borderPolys.forEach((p, i) => fillGlass(g, pathOf(p), bbox(p), GLASS[borderColors[i]]));
  // klein "juweeltje" in elke hoek
  for (const [x, y] of [
    [border / 2, border / 2],
    [w - border / 2, border / 2],
    [border / 2, h - border / 2],
    [w - border / 2, h - border / 2],
  ]) {
    const jr = border * 0.24;
    const jp = new Path2D();
    jp.arc(x, y, jr, 0, Math.PI * 2);
    fillGlass(g, jp, { x0: x - jr, y0: y - jr, x1: x + jr, y1: y + jr, w: jr * 2, h: jr * 2 }, GLASS.amber);
    strokeLead(g, (c) => c.stroke(jp), lead * 0.7);
  }
  strokeLead(g, (c) => {
    c.beginPath();
    for (const p of borderPolys) tracePoly(c, p);
    c.stroke();
  });

  /* --- 4. middenpaneel --------------------------------------------- */
  const outerPath = pathOf(outerPanel);
  const innerPath = pathOf(innerPanel);
  const ring = new Path2D();
  ring.addPath(outerPath);
  ring.addPath(innerPath);
  ctx.save();
  ctx.clip(ring, "evenodd");
  fillGlass(g, outerPath, bbox(outerPanel), GLASS.deepBlue);
  ctx.restore();
  fillGlass(g, innerPath, bbox(innerPanel), GLASS.clear, { clear: true });

  // titel: elke letter een eigen stuk rood glas
  const titleBaseline = cy - panelH / 2 + pad * 1.15 + capH;
  let x = cx - titleW / 2;
  const letterBoxes: { l: string; x: number; w: number }[] = [];
  ctx.font = titleFont(titleSize);
  const spacing = (spacing100 * titleSize) / 100;
  for (const l of letters) {
    const lw = ctx.measureText(l).width;
    letterBoxes.push({ l, x, w: lw });
    x += lw + spacing;
  }

  if (opts.logo) {
    drawLogoGlass(g, opts.logo, cx, titleBaseline - capH / 2, titleW, capH * 1.15, dpr);
  } else {
    for (const box of letterBoxes) {
      drawLetterGlass(g, box.l, box.x, titleBaseline, titleSize, capH, titleFont(titleSize), dpr);
    }
    // lood rond de letters
    strokeLead(
      g,
      (c) => {
        c.font = titleFont(titleSize);
        c.textBaseline = "alphabetic";
        for (const box of letterBoxes) c.strokeText(box.l, box.x, titleBaseline);
      },
      lead * 1.15,
    );
  }

  // banderol met de pay-off
  const ribbonW = Math.min(panelW - pad * 0.9, titleW * 1.02);
  const ribbonY = titleBaseline + pad * 0.85;
  const notch = ribbonH * 0.32;
  const rx0 = cx - ribbonW / 2;
  const rx1 = cx + ribbonW / 2;
  const ribbon: Poly = [
    { x: rx0, y: ribbonY },
    { x: rx1, y: ribbonY },
    { x: rx1 - notch, y: ribbonY + ribbonH / 2 },
    { x: rx1, y: ribbonY + ribbonH },
    { x: rx0, y: ribbonY + ribbonH },
    { x: rx0 + notch, y: ribbonY + ribbonH / 2 },
  ];
  const ribbonPath = pathOf(ribbon);
  fillGlass(g, ribbonPath, bbox(ribbon), "#f1d48f", { clear: true });

  // grisaille: met de hand beschilderd glas
  ctx.save();
  ctx.clip(ribbonPath);
  let ps = payoffSize;
  ctx.font = scriptFont(ps);
  const maxTextW = ribbonW - notch * 2.6;
  const tw = ctx.measureText(opts.payoff).width;
  if (tw > maxTextW) {
    ps = (ps * maxTextW) / tw;
    ctx.font = scriptFont(ps);
  }
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const ty = ribbonY + ribbonH * 0.53;
  ctx.shadowColor = "rgba(60,30,10,0.55)";
  ctx.shadowBlur = Math.max(1.5, ps * 0.06);
  ctx.fillStyle = "rgba(48,26,14,0.9)";
  ctx.fillText(opts.payoff, cx, ty);
  ctx.shadowBlur = 0;
  // verf is nooit egaal: textuur eroverheen
  ctx.globalCompositeOperation = "overlay";
  ctx.globalAlpha = 0.5;
  const pattern = ctx.createPattern(g.tex, "repeat")!;
  ctx.fillStyle = pattern;
  ctx.fillRect(rx0, ribbonY, ribbonW, ribbonH);
  ctx.restore();

  strokeLead(g, (c) => {
    c.stroke(outerPath);
    c.stroke(innerPath);
    c.stroke(ribbonPath);
  });
  solderJoints(g, [outerPanel, innerPanel, ribbon, ...borderPolys]);

  /* --- 5. daglicht en patina ---------------------------------------- */
  ctx.save();
  ctx.globalCompositeOperation = "soft-light";
  const day = ctx.createRadialGradient(w * 0.2, -h * 0.05, 0, w * 0.2, -h * 0.05, Math.hypot(w, h) * 0.95);
  day.addColorStop(0, "rgba(255,246,220,0.75)");
  day.addColorStop(0.5, "rgba(255,240,210,0.15)");
  day.addColorStop(1, "rgba(0,0,0,0.35)");
  ctx.fillStyle = day;
  ctx.fillRect(0, 0, w, h);
  ctx.globalCompositeOperation = "source-over";
  // vignet: de dikke muur rond het raam
  const vig = ctx.createRadialGradient(cx, cy, min * 0.35, cx, cy, Math.hypot(w, h) * 0.62);
  vig.addColorStop(0, "rgba(0,0,0,0)");
  vig.addColorStop(1, "rgba(10,6,4,0.42)");
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();

  // de eerste klap valt net naast de N
  const n = letterBoxes[Math.min(3, letterBoxes.length - 1)];
  const impact = { x: n ? n.x + n.w * 0.6 : cx, y: titleBaseline - capH * 0.45 };

  return {
    canvas,
    width: w,
    height: h,
    dpr,
    pieces: [...pieces.filter((p) => !insidePanel(centroid(p), outerPanel)), ...borderPolys],
    panel: outerPanel,
    impact,
    lead,
  };
}

function insidePanel(p: Pt, panel: Poly) {
  const b = bbox(panel);
  return p.x > b.x0 && p.x < b.x1 && p.y > b.y0 && p.y < b.y1;
}

/** Eén letter als stuk glas: verloop + textuur, uitgesneden in de vorm van de letter. */
function drawLetterGlass(
  g: Ctx,
  letter: string,
  x: number,
  baseline: number,
  size: number,
  capH: number,
  font: string,
  dpr: number,
) {
  const { ctx, r } = g;
  ctx.font = font;
  const lw = ctx.measureText(letter).width;
  const padX = size * 0.1;
  const bx = x - padX;
  const by = baseline - capH - size * 0.1;
  const bw = lw + padX * 2;
  const bh = capH + size * 0.2;
  const tmp = makeCanvas(bw * dpr, bh * dpr);
  const t = tmp.getContext("2d")!;
  t.scale(dpr, dpr);
  t.translate(-bx, -by);
  const sub: Ctx = { ...g, ctx: t };
  const rect = new Path2D();
  rect.rect(bx, by, bw, bh);
  const color = r() < 0.2 ? GLASS.bordeaux : GLASS.red;
  fillGlass(sub, rect, { x0: bx, y0: by, x1: bx + bw, y1: by + bh, w: bw, h: bh }, color);
  // uitsnijden
  t.globalCompositeOperation = "destination-in";
  t.font = font;
  t.textBaseline = "alphabetic";
  t.fillStyle = "#000";
  t.fillText(letter, x, baseline);
  // binnenschaduw langs de letterrand
  t.globalCompositeOperation = "source-atop";
  t.lineJoin = "round";
  t.strokeStyle = "rgba(30,0,0,0.5)";
  t.lineWidth = g.lead * 3;
  t.strokeText(letter, x, baseline);
  t.strokeStyle = "rgba(255,220,200,0.22)";
  t.lineWidth = g.lead * 1.2;
  t.strokeText(letter, x + g.lead * 0.6, baseline + g.lead * 0.6);
  ctx.drawImage(tmp, bx, by, bw, bh);
}

/** Vervangbaar logo (afbeelding met transparantie) als glas, met een lood-contour. */
function drawLogoGlass(g: Ctx, img: HTMLImageElement, cx: number, cy: number, maxW: number, maxH: number, dpr: number) {
  const { ctx } = g;
  const ratio = img.naturalWidth / img.naturalHeight || 3;
  let lw = maxW;
  let lh = lw / ratio;
  if (lh > maxH) {
    lh = maxH;
    lw = lh * ratio;
  }
  const x = cx - lw / 2;
  const y = cy - lh / 2;
  // lood: het logo "verdikt" donker eronder
  ctx.save();
  const sil = makeCanvas(lw * dpr, lh * dpr);
  const s = sil.getContext("2d")!;
  s.drawImage(img, 0, 0, sil.width, sil.height);
  s.globalCompositeOperation = "source-in";
  s.fillStyle = "#1c1916";
  s.fillRect(0, 0, sil.width, sil.height);
  const d = g.lead * 0.8;
  for (let a = 0; a < Math.PI * 2; a += Math.PI / 8) ctx.drawImage(sil, x + Math.cos(a) * d, y + Math.sin(a) * d, lw, lh);
  ctx.restore();
  // glas
  const tmp = makeCanvas(lw * dpr, lh * dpr);
  const t = tmp.getContext("2d")!;
  t.scale(dpr, dpr);
  t.translate(-x, -y);
  const rect = new Path2D();
  rect.rect(x, y, lw, lh);
  fillGlass({ ...g, ctx: t }, rect, { x0: x, y0: y, x1: x + lw, y1: y + lh, w: lw, h: lh }, GLASS.red);
  t.setTransform(1, 0, 0, 1, 0, 0);
  t.globalCompositeOperation = "destination-in";
  t.drawImage(img, 0, 0, tmp.width, tmp.height);
  ctx.drawImage(tmp, x, y, lw, lh);
}
