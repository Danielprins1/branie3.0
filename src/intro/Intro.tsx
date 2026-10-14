import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { site } from "../content/site";
import { GlassStage, PHASE } from "./glass/stage";
import type { IntroMode } from "./IntroContext";
import "./intro.css";

gsap.registerPlugin(ScrollTrigger);

/** Hoeveel schermhoogtes je scrolt om het glas te breken. */
const SCROLL_SCREENS = 2.4;

interface Props {
  mode: Exclude<IntroMode, "none">;
  onDone: () => void;
}

export default function Intro({ mode, onDone }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const spacerRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const skipRef = useRef<() => void>(() => {});
  const [ready, setReady] = useState(false);
  const [hint, setHint] = useState(true);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let stage: GlassStage;
    try {
      stage = new GlassStage(canvas, {
        title: site.name,
        payoff: site.payoff,
        logoSrc: site.logoImage || undefined,
        animateLight: mode !== "reduced",
      });
    } catch {
      onDone();
      return;
    }

    const introEl = rootRef.current;
    const siteEl = () => document.querySelector<HTMLElement>(".site");
    const state = { p: 0 };
    let finished = false;
    let hintShown = true;
    const tweens: (gsap.core.Tween | gsap.core.Timeline)[] = [];
    const cleanups: (() => void)[] = [];

    const finish = () => {
      if (finished) return;
      finished = true;
      siteEl()?.style.removeProperty("transform");
      onDone();
    };

    const update = () => {
      stage.setProgress(state.p);
      const reveal = gsap.utils.clamp(0, 1, (state.p - PHASE.tensionEnd) / (1 - PHASE.tensionEnd));
      // alleen de betrokken elementen bijwerken, niet de hele pagina
      introEl?.style.setProperty("--intro-reveal", reveal.toFixed(3));
      const site = siteEl();
      if (site && mode === "full") site.style.transform = `scale(${(0.94 + 0.06 * reveal).toFixed(4)})`;
      const showHint = state.p < 0.02;
      if (showHint !== hintShown) {
        hintShown = showHint;
        setHint(showHint);
      }
      if (state.p >= 0.999) finish();
    };

    /** Speelt de rest van de animatie automatisch af. Nog een keer drukken = meteen klaar. */
    let skipping = false;
    const playOut = (duration: number) => {
      if (skipping) return finish();
      skipping = true;
      tweens.forEach((t) => {
        t.scrollTrigger?.kill();
        t.kill();
      });
      const toCrack = Math.max(0, PHASE.crackEnd - state.p);
      const tl = gsap.timeline({ onUpdate: update, onComplete: finish });
      if (toCrack > 0) tl.to(state, { p: PHASE.crackEnd, duration: duration * 0.3, ease: "power1.in" });
      tl.to(state, { p: 1, duration: duration * 0.7, ease: "none" });
      tweens.push(tl);
    };

    if (mode === "reduced") {
      skipRef.current = () => {
        setLeaving(true);
        window.setTimeout(finish, 450);
      };
    } else {
      skipRef.current = () => playOut(1.6);
    }

    stage.onReady = () => {
      setReady(true);
      update();
      if (mode === "full" && spacerRef.current) {
        history.scrollRestoration = "manual";
        window.scrollTo(0, 0);
        tweens.push(
          gsap.to(state, {
            p: 1,
            ease: "none",
            onUpdate: update,
            scrollTrigger: {
              trigger: spacerRef.current,
              start: "top top",
              end: "bottom bottom",
              scrub: 0.6,
            },
          }),
        );
      }
      if (mode === "short") {
        const tl = gsap.timeline({ delay: 0.9, onUpdate: update, onComplete: finish });
        tl.to(state, { p: PHASE.crackEnd, duration: 0.55, ease: "power2.in" });
        tl.to(state, { p: PHASE.tensionEnd, duration: 0.12, ease: "none" });
        tl.to(state, { p: 1, duration: 1.25, ease: "none" });
        tweens.push(tl);
        // Wie al wil, hoeft niet te wachten
        const hurry = () => tl.timeScale(3);
        window.addEventListener("wheel", hurry, { once: true, passive: true });
        window.addEventListener("touchstart", hurry, { once: true, passive: true });
        cleanups.push(() => {
          window.removeEventListener("wheel", hurry);
          window.removeEventListener("touchstart", hurry);
        });
      }
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") skipRef.current();
      else if (mode === "short" && [" ", "ArrowDown", "PageDown", "Enter"].includes(e.key)) skipRef.current();
    };
    window.addEventListener("keydown", onKey);
    if (mode === "reduced") {
      const leave = () => skipRef.current();
      window.addEventListener("wheel", leave, { once: true, passive: true });
      window.addEventListener("touchmove", leave, { once: true, passive: true });
      cleanups.push(() => {
        window.removeEventListener("wheel", leave);
        window.removeEventListener("touchmove", leave);
      });
    }

    let resizeTimer = 0;
    const onResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(async () => {
        await stage.resize();
        stage.setProgress(state.p);
        ScrollTrigger.refresh();
      }, 180);
    };
    window.addEventListener("resize", onResize);

    stage.init().catch(() => finish());

    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
      clearTimeout(resizeTimer);
      cleanups.forEach((c) => c());
      tweens.forEach((t) => {
        t.scrollTrigger?.kill();
        t.kill();
      });
      stage.destroy();
      siteEl()?.style.removeProperty("transform");
      history.scrollRestoration = "auto";
    };
  }, [mode, onDone]);

  return (
    <>
      {mode === "full" && (
        <div ref={spacerRef} className="intro-spacer" style={{ height: `${(SCROLL_SCREENS + 1) * 100}svh` }} />
      )}
      <div
        ref={rootRef}
        className={`intro intro--${mode}${ready ? " is-ready" : ""}${leaving ? " is-leaving" : ""}`}
        role="region"
        aria-label="Intro: glas-in-loodraam met BRANIE — Oude streken, nieuwe straten."
      >
        <canvas ref={canvasRef} className="intro__canvas" aria-hidden="true" />
        {mode !== "reduced" && <div className="intro__light" aria-hidden="true" />}

        <div className={`intro__hint${hint && ready ? "" : " is-hidden"}`} aria-hidden={mode === "short"}>
          {mode === "full" && (
            <>
              <span className="intro__hint-text">Scroll en breek het glas</span>
              <span className="intro__hint-line" />
            </>
          )}
          {mode === "reduced" && (
            <button type="button" className="intro__enter" onClick={() => skipRef.current()}>
              Naar de website
            </button>
          )}
        </div>

        {mode !== "reduced" && (
          <button type="button" className="intro__skip" onClick={() => skipRef.current()}>
            Intro overslaan
          </button>
        )}
      </div>
    </>
  );
}
