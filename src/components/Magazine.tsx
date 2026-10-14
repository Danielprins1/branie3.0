import { useRef, type PointerEvent } from "react";
import { site } from "../content/site";
import Star from "./Star";

/**
 * De cover. Zolang `site.coverImage` leeg is, tonen we een tijdelijke,
 * typografische cover die duidelijk als placeholder is gemarkeerd.
 */
export function Cover() {
  if (site.coverImage) {
    return <img className="cover__img" src={site.coverImage} alt={site.coverAlt} decoding="async" />;
  }
  return (
    <div className="cover cover--temp" role="img" aria-label="Tijdelijke cover van BRANIE — de definitieve cover volgt">
      <div className="cover__top">
        <span>{site.issueLabel}</span>
        <span>Amsterdam 1950 — nu</span>
      </div>
      <div className="cover__mast">{site.name}</div>
      <div className="cover__payoff">{site.payoff}</div>
      <div className="cover__art" aria-hidden="true">
        <span className="cover__shape cover__shape--a" />
        <span className="cover__shape cover__shape--b" />
        <span className="cover__shape cover__shape--c" />
        <Star className="cover__star" />
      </div>
      <ul className="cover__lines" aria-hidden="true">
        <li>Coververhaal volgt</li>
        <li>De (on)bekende Amsterdammer</li>
        <li>Straatcultuur &amp; meer</li>
      </ul>
      <span className="cover__sticker">Tijdelijke cover</span>
    </div>
  );
}

/**
 * Het magazine als fysiek object: dikte, rug, papier en schaduw.
 * Kantelt heel licht mee met de muis.
 */
export function MagazineObject({ className = "", tilt = true }: { className?: string; tilt?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!tilt || e.pointerType !== "mouse" || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    ref.current.style.setProperty("--ry", `${-14 + x * 12}deg`);
    ref.current.style.setProperty("--rx", `${4 - y * 8}deg`);
  };
  const onLeave = () => {
    ref.current?.style.removeProperty("--ry");
    ref.current?.style.removeProperty("--rx");
  };
  return (
    <div className={`mag ${className}`} ref={ref} onPointerMove={onMove} onPointerLeave={onLeave}>
      <div className="mag__book">
        <div className="mag__pages" aria-hidden="true" />
        <div className="mag__front">
          <Cover />
          <span className="mag__gloss" aria-hidden="true" />
        </div>
      </div>
      <div className="mag__shadow" aria-hidden="true" />
    </div>
  );
}
