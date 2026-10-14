/**
 * Barsten en scherven.
 *
 * De scherven zijn Voronoi-cellen van punten op een "spinnenweb" rond het
 * inslagpunt: kleine scherven bij de klap, grote aan de rand. De barsten
 * zijn precies de randen van die scherven, zodat het glas breekt waar het
 * eerst barstte.
 */
import { area, bbox, centroid, clamp, rectPoly, rng, voronoi, type Poly, type Pt } from "./geometry";
import type { GlassWindow } from "./window";

export interface Shard {
  poly: Poly;
  c: Pt;
  sprite: HTMLCanvasElement | null;
  sx: number;
  sy: number;
  sw: number;
  sh: number;
  delay: number;
  vx: number;
  vy: number;
  spin: number;
  flip: number;
  depth: number;
  dir: Pt;
}

interface Crack {
  a: Pt;
  b: Pt;
  t0: number;
  len: number;
}

export interface Shatter {
  shards: Shard[];
  cracks: Crack[];
  ready: boolean;
}

export function planShatter(win: GlassWindow, seed = 2026): Shatter {
  const { width: w, height: h, impact } = win;
  const r = rng(seed);
  const diag = Math.hypot(w, h);
  const small = w < 700;
  const rays = small ? 11 : 15;
  const seeds: Pt[] = [{ x: impact.x + (r() - 0.5) * 6, y: impact.y + (r() - 0.5) * 6 }];
  let radius = small ? 22 : 30;
  let ring = 0;
  const rayAngles = Array.from({ length: rays }, (_, i) => (i / rays) * Math.PI * 2 + (r() - 0.5) * 0.25);
  while (radius < diag * 1.1) {
    const extra = ring > 3 ? 2 : 1;
    const n = rays * extra;
    for (let i = 0; i < n; i++) {
      const base = extra === 1 ? rayAngles[i] : rayAngles[i >> 1] + (i % 2 ? Math.PI / rays : 0);
      const a = base + (r() - 0.5) * (0.5 / extra) + ring * 0.05;
      const rr = radius * (0.85 + r() * 0.3);
      seeds.push({ x: impact.x + Math.cos(a) * rr, y: impact.y + Math.sin(a) * rr });
    }
    radius *= 1.55 + r() * 0.15;
    ring++;
  }
  const cells = voronoi(seeds, rectPoly(0, 0, w, h)).filter((c) => c.length >= 3 && area(c) > 6);
  const maxD = Math.max(
    Math.hypot(impact.x, impact.y),
    Math.hypot(w - impact.x, impact.y),
    Math.hypot(impact.x, h - impact.y),
    Math.hypot(w - impact.x, h - impact.y),
  );

  const shards: Shard[] = cells.map((poly) => {
    const c = centroid(poly);
    const dx = c.x - impact.x;
    const dy = c.y - impact.y;
    const d = Math.hypot(dx, dy) || 1;
    const nd = d / maxD;
    const dir = { x: dx / d, y: dy / d };
    const speed = (0.18 + r() * 0.35) * (1.25 - nd * 0.6) * diag;
    const size = Math.sqrt(area(poly));
    return {
      poly,
      c,
      sprite: null,
      sx: 0,
      sy: 0,
      sw: 0,
      sh: 0,
      delay: nd * 0.32 + r() * 0.08,
      vx: dir.x * speed,
      vy: dir.y * speed - r() * 0.28 * diag,
      spin: (r() - 0.5) * Math.PI * (2.2 - clamp(size / 300, 0, 1.4)),
      flip: (r() - 0.5) * Math.PI * 2.4,
      depth: r() * 0.95 - 0.3,
      dir,
    };
  });

  // barsten = gedeelde randen van de scherven
  const cracks: Crack[] = [];
  const seen = new Set<string>();
  const onEdge = (p: Pt) => p.x < 1 || p.y < 1 || p.x > w - 1 || p.y > h - 1;
  for (const s of shards) {
    for (let i = 0; i < s.poly.length; i++) {
      const a = s.poly[i];
      const b = s.poly[(i + 1) % s.poly.length];
      if (onEdge(a) && onEdge(b)) continue;
      const key = [a, b]
        .map((p) => `${Math.round(p.x)}:${Math.round(p.y)}`)
        .sort()
        .join("|");
      if (seen.has(key)) continue;
      seen.add(key);
      const da = Math.hypot(a.x - impact.x, a.y - impact.y);
      const db = Math.hypot(b.x - impact.x, b.y - impact.y);
      const [near, far] = da < db ? [a, b] : [b, a];
      const len = Math.hypot(b.x - a.x, b.y - a.y);
      if (len < 1) continue;
      // Echte barsten lopen vooral straalsgewijs; dwarsverbindingen alleen bij de klap of af en toe
      const mx = (a.x + b.x) / 2 - impact.x;
      const my = (a.y + b.y) / 2 - impact.y;
      const md = Math.hypot(mx, my) || 1;
      const radial = Math.abs(((b.x - a.x) * mx + (b.y - a.y) * my) / (len * md)) > 0.72;
      if (!radial && md / maxD > 0.14 && r() > 0.3) continue;
      cracks.push({ a: near, b: far, t0: (Math.min(da, db) / maxD) * 0.82 + r() * 0.1, len });
    }
  }
  cracks.sort((x, y) => x.t0 - y.t0);
  return { shards, cracks, ready: false };
}

/** Snijdt de scherven uit het raam. Gebeurt in stukjes zodat de pagina niet hapert. */
export function cutShards(win: GlassWindow, plan: Shatter, done?: () => void) {
  const { canvas, dpr } = win;
  let i = 0;
  const step = (deadline?: IdleDeadline) => {
    const start = performance.now();
    while (i < plan.shards.length) {
      const s = plan.shards[i++];
      const b = bbox(s.poly);
      const pad = 2;
      s.sx = b.x0 - pad;
      s.sy = b.y0 - pad;
      s.sw = b.w + pad * 2;
      s.sh = b.h + pad * 2;
      const c = document.createElement("canvas");
      c.width = Math.max(1, Math.ceil(s.sw * dpr));
      c.height = Math.max(1, Math.ceil(s.sh * dpr));
      const ctx = c.getContext("2d")!;
      ctx.scale(dpr, dpr);
      ctx.translate(-s.sx, -s.sy);
      ctx.beginPath();
      s.poly.forEach((p, k) => (k ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
      ctx.closePath();
      ctx.save();
      ctx.clip();
      ctx.drawImage(canvas, s.sx * dpr, s.sy * dpr, s.sw * dpr, s.sh * dpr, s.sx, s.sy, s.sw, s.sh);
      ctx.restore();
      // gebroken glasrand vangt het licht
      ctx.lineJoin = "round";
      ctx.strokeStyle = "rgba(255,250,235,0.55)";
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.strokeStyle = "rgba(0,0,0,0.35)";
      ctx.lineWidth = 0.6;
      ctx.translate(0.7, 0.7);
      ctx.stroke();
      s.sprite = c;
      const outOfTime = deadline ? deadline.timeRemaining() < 2 : performance.now() - start > 8;
      if (outOfTime) break;
    }
    if (i < plan.shards.length) schedule(step);
    else {
      plan.ready = true;
      done?.();
    }
  };
  schedule(step);
}

const schedule = (fn: (d?: IdleDeadline) => void) => {
  if ("requestIdleCallback" in window) window.requestIdleCallback(fn, { timeout: 120 });
  else setTimeout(() => fn(), 16);
};

/** Tekent de barsten, gegroeid tot `p` (0..1). */
export function drawCracks(ctx: CanvasRenderingContext2D, plan: Shatter, p: number) {
  if (p <= 0) return;
  ctx.save();
  ctx.lineCap = "round";
  const grow = 0.12;
  const visible: [Pt, Pt][] = [];
  for (const c of plan.cracks) {
    if (c.t0 > p) break;
    const f = clamp((p - c.t0) / grow, 0, 1);
    visible.push([c.a, { x: c.a.x + (c.b.x - c.a.x) * f, y: c.a.y + (c.b.y - c.a.y) * f }]);
  }
  const pass = (style: string, width: number, ox: number, oy: number) => {
    ctx.strokeStyle = style;
    ctx.lineWidth = width;
    ctx.beginPath();
    for (const [a, b] of visible) {
      ctx.moveTo(a.x + ox, a.y + oy);
      ctx.lineTo(b.x + ox, b.y + oy);
    }
    ctx.stroke();
  };
  pass("rgba(0,0,0,0.35)", 1.4, 0.8, 0.9);
  pass("rgba(255,255,255,0.16)", 3.4, 0, 0);
  pass("rgba(255,252,240,0.8)", 0.9, 0, 0);
  ctx.restore();
}

/**
 * Tekent de scherven.
 * @param tension 0..1 — vlak voor het breken komt er spanning op het glas
 * @param t       0..1 — het eigenlijke uiteenvallen
 */
export function drawShards(ctx: CanvasRenderingContext2D, plan: Shatter, tension: number, t: number, h: number) {
  const diag = h * 2.2;
  const gravity = 1.5 * diag;
  const span = 1 - 0.4;
  for (const s of plan.shards) {
    if (!s.sprite) continue;
    const lt = clamp((t - s.delay) / span, 0, 1);
    let x = s.c.x;
    let y = s.c.y;
    let rot = 0;
    let scale = 1;
    let scaleX = 1;
    let alpha = 1;
    if (lt === 0) {
      // spanning: haarscheurtjes trekken een fractie open
      const push = tension * 2.2 + (t > 0 ? 3 : 0);
      x += s.dir.x * push;
      y += s.dir.y * push;
      rot = tension * 0.006 * Math.sign(s.spin);
    } else {
      const e = lt;
      x += s.vx * e + s.dir.x * 3;
      y += s.vy * e + 0.5 * gravity * e * e;
      rot = s.spin * e;
      scale = 1 + s.depth * e;
      scaleX = Math.cos(s.flip * e);
      if (Math.abs(scaleX) < 0.06) scaleX = 0.06 * Math.sign(scaleX || 1);
      alpha = lt > 0.72 ? 1 - (lt - 0.72) / 0.28 : 1;
    }
    if (alpha <= 0.01) continue;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.scale(scale * scaleX, scale);
    ctx.drawImage(s.sprite, s.sx - s.c.x, s.sy - s.c.y, s.sw, s.sh);
    if (lt > 0 && Math.abs(scaleX) < 0.6) {
      // een kantelende scherf vangt even het licht of valt in de schaduw
      ctx.globalCompositeOperation = scaleX > 0 ? "screen" : "multiply";
      ctx.globalAlpha = alpha * (0.6 - Math.abs(scaleX)) * 0.6;
      ctx.fillStyle = scaleX > 0 ? "#fff6e0" : "#2a1a10";
      ctx.beginPath();
      s.poly.forEach((p, k) => (k ? ctx.lineTo(p.x - s.c.x, p.y - s.c.y) : ctx.moveTo(p.x - s.c.x, p.y - s.c.y)));
      ctx.fill();
    }
    ctx.restore();
  }
}
