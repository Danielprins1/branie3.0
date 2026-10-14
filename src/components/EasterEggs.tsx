import { useEffect, useRef, useState } from "react";

const lines = [
  "Brutaal hè? Dat hoort zo.",
  "Doe normaal? Nooit van gehoord.",
  "Oude streken, nieuwe straten. En jij typt gewoon BRANIE.",
];

/** Typ ergens op de site "branie" en de stad praat terug. */
export default function EasterEggs() {
  const [msg, setMsg] = useState<string | null>(null);
  const buffer = useRef("");
  const count = useRef(0);

  useEffect(() => {
    let timer = 0;
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))) return;
      if (e.key.length !== 1) return;
      buffer.current = (buffer.current + e.key.toLowerCase()).slice(-6);
      if (buffer.current === "branie") {
        buffer.current = "";
        setMsg(lines[count.current++ % lines.length]);
        clearTimeout(timer);
        timer = window.setTimeout(() => setMsg(null), 4200);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      clearTimeout(timer);
    };
  }, []);

  return (
    <div className="egg-toast-region" role="status" aria-live="polite">
      {msg && <p className="egg-toast">{msg}</p>}
    </div>
  );
}
