import type { Tone } from "../content/rubrics";

interface Props {
  src?: string;
  alt: string;
  tone?: Tone;
  ratio?: string;
  className?: string;
  label?: string;
  priority?: boolean;
  sizes?: string;
}

/**
 * Foto of — zolang er nog geen beeld is aangeleverd — een duidelijk
 * herkenbare grafische placeholder in de kleur van de rubriek.
 */
export default function Photo({ src, alt, tone = "ink", ratio, className = "", label = "Beeld volgt", priority, sizes }: Props) {
  const style = ratio ? { aspectRatio: ratio } : undefined;
  if (src) {
    return (
      <div className={`photo ${className}`} style={style}>
        <img
          src={src}
          alt={alt}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          sizes={sizes}
          {...(priority ? { fetchPriority: "high" as const } : {})}
        />
      </div>
    );
  }
  const variant = [...alt].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7) % 3;
  return (
    <div className={`photo ph ph--${tone} ph--v${variant} ${className}`} style={style} role="img" aria-label={`${alt} (beeld volgt)`}>
      <span className="ph__label">{label}</span>
    </div>
  );
}
