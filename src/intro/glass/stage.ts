/**
 * GlassStage koppelt het raam, de glimmers en de breekanimatie aan één
 * zichtbaar canvas. Het is bewust framework-loos; Intro.tsx stuurt het aan.
 */
import { bbox, clamp, tracePoly, type Poly } from "./geometry";
import { buildWindow, type GlassWindow } from "./window";
import { cutShards, drawCracks, drawShards, planShatter, type Shatter } from "./shatter";

export interface StageOptions {
  title: string;
  payoff: string;
  logoSrc?: string;
  animateLight: boolean;
}

interface Glint {
  poly: Poly;
  start: number;
  dur: number;
  angle: number;
  strength: number;
}

/** Fasen van de intro, als fractie van de totale voortgang. */
export const PHASE = {
  crackStart: 0.04,
  crackEnd: 0.44,
  tensionEnd: 0.5,
} as const;

async function loadFonts() {
  if (!document.fonts?.load) return;
  const fonts = Promise.all([
    document.fonts.load('400 100px "Anton"'),
    document.fonts.load('400 40px "Pinyon Script"'),
  ]);
  await Promise.race([fonts, new Promise((r) => setTimeout(r, 2500))]);
}

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

export class GlassStage {
  private ctx: CanvasRenderingContext2D;
  private win: GlassWindow | null = null;
  private plan: Shatter | null = null;
  private logo: HTMLImageElement | null = null;
  private progress = 0;
  private raf = 0;
  private glints: Glint[] = [];
  private glintTimer = 0;
  private sheenTimer = 0;
  private destroyed = false;
  private size = { w: 0, h: 0 };
  onReady?: () => void;

  constructor(
    private canvas: HTMLCanvasElement,
    private opts: StageOptions,
  ) {
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D niet beschikbaar");
    this.ctx = ctx;
  }

  async init() {
    await loadFonts();
    if (this.opts.logoSrc) this.logo = await loadImage(this.opts.logoSrc);
    if (this.destroyed) return;
    await this.build();
    this.onReady?.();
    if (this.opts.animateLight) this.scheduleGlints();
  }

  private measure() {
    const rect = this.canvas.getBoundingClientRect();
    return { w: Math.max(1, Math.round(rect.width)), h: Math.max(1, Math.round(rect.height)) };
  }

  private async build() {
    const { w, h } = this.measure();
    this.size = { w, h };
    const dpr = Math.min(window.devicePixelRatio || 1, w < 700 ? 2 : 1.5);
    this.canvas.width = Math.round(w * dpr);
    this.canvas.height = Math.round(h * dpr);
    this.win = await buildWindow({
      width: w,
      height: h,
      dpr,
      title: this.opts.title,
      payoff: this.opts.payoff,
      logo: this.logo,
    });
    this.plan = planShatter(this.win);
    const plan = this.plan;
    cutShards(this.win, plan, () => {
      if (this.plan === plan) this.requestRender();
    });
    this.requestRender();
  }

  /** Alleen opnieuw opbouwen als de breedte verandert of de hoogte flink (adresbalk op mobiel). */
  async resize() {
    const { w, h } = this.measure();
    if (w === this.size.w && Math.abs(h - this.size.h) < 120) return;
    await this.build();
  }

  setProgress(p: number) {
    this.progress = clamp(p, 0, 1);
    this.requestRender();
  }

  get ready() {
    return this.win !== null;
  }

  private requestRender() {
    if (this.raf || this.destroyed) return;
    this.raf = requestAnimationFrame(() => {
      this.raf = 0;
      this.render();
      if (this.glints.length) this.requestRender();
    });
  }

  private render() {
    const { ctx, win, plan } = this;
    if (!win || !plan) return;
    const p = this.progress;
    const crack = clamp((p - PHASE.crackStart) / (PHASE.crackEnd - PHASE.crackStart), 0, 1);
    const tension = clamp((p - PHASE.crackEnd) / (PHASE.tensionEnd - PHASE.crackEnd), 0, 1);
    const fall = clamp((p - PHASE.tensionEnd) / (1 - PHASE.tensionEnd), 0, 1);
    ctx.setTransform(win.dpr, 0, 0, win.dpr, 0, 0);
    ctx.clearRect(0, 0, win.width, win.height);

    if (p < PHASE.crackEnd || !plan.ready) {
      ctx.drawImage(win.canvas, 0, 0, win.width, win.height);
      this.drawGlints();
      drawCracks(ctx, plan, crack);
      return;
    }
    // Achter het glas: daglicht stroomt naar binnen en trekt langzaam weg
    ctx.fillStyle = `rgba(255,246,228,${0.7 * (1 - fall) ** 1.6})`;
    ctx.fillRect(0, 0, win.width, win.height);
    drawShards(ctx, plan, tension, fall, win.height);
  }

  /* ---------------------------- glimmers ---------------------------- */

  private scheduleGlints() {
    const next = () => {
      if (this.destroyed) return;
      this.glintTimer = window.setTimeout(
        () => {
          this.addGlint(false);
          next();
        },
        1600 + Math.random() * 3200,
      );
    };
    next();
    const sheen = () => {
      if (this.destroyed) return;
      this.sheenTimer = window.setTimeout(
        () => {
          this.addGlint(true);
          sheen();
        },
        7000 + Math.random() * 6000,
      );
    };
    this.sheenTimer = window.setTimeout(() => {
      this.addGlint(true);
      sheen();
    }, 2200);
  }

  private addGlint(panel: boolean) {
    if (!this.win || this.progress >= PHASE.crackEnd || document.hidden) return;
    const pieces = this.win.pieces;
    const poly = panel ? this.win.panel : pieces[Math.floor(Math.random() * pieces.length)];
    if (!poly) return;
    this.glints.push({
      poly,
      start: performance.now(),
      dur: panel ? 2400 : 1300 + Math.random() * 900,
      angle: (-35 + Math.random() * 20) * (Math.PI / 180),
      strength: panel ? 0.32 : 0.45 + Math.random() * 0.25,
    });
    this.requestRender();
  }

  private drawGlints() {
    if (!this.glints.length) return;
    const now = performance.now();
    const ctx = this.ctx;
    this.glints = this.glints.filter((g) => now - g.start < g.dur);
    for (const g of this.glints) {
      const t = (now - g.start) / g.dur;
      const ease = t * t * (3 - 2 * t);
      const b = bbox(g.poly);
      const span = Math.hypot(b.w, b.h);
      const cx = b.x0 + b.w / 2;
      const cy = b.y0 + b.h / 2;
      ctx.save();
      ctx.beginPath();
      tracePoly(ctx, g.poly);
      ctx.clip();
      ctx.globalCompositeOperation = "screen";
      // het glasvlak licht als geheel iets op
      ctx.fillStyle = `rgba(255,236,200,${Math.sin(Math.PI * t) * 0.16 * g.strength})`;
      ctx.fillRect(b.x0, b.y0, b.w, b.h);
      // en er glijdt een lichtstreep overheen
      ctx.translate(cx, cy);
      ctx.rotate(g.angle);
      const pos = (ease - 0.5) * span * 1.6;
      const band = Math.max(30, span * 0.22);
      const grad = ctx.createLinearGradient(pos - band, 0, pos + band, 0);
      grad.addColorStop(0, "rgba(255,250,235,0)");
      grad.addColorStop(0.5, `rgba(255,250,235,${g.strength * Math.sin(Math.PI * t)})`);
      grad.addColorStop(1, "rgba(255,250,235,0)");
      ctx.fillStyle = grad;
      ctx.fillRect(-span, -span, span * 2, span * 2);
      ctx.restore();
    }
  }

  destroy() {
    this.destroyed = true;
    cancelAnimationFrame(this.raf);
    clearTimeout(this.glintTimer);
    clearTimeout(this.sheenTimer);
    this.glints = [];
    this.win = null;
    this.plan = null;
  }
}
