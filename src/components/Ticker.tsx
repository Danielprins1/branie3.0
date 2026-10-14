import Star from "./Star";

/** Doorlopende tekstband. Staat stil bij prefers-reduced-motion. */
export default function Ticker({ items, className = "" }: { items: string[]; className?: string }) {
  const row = (hidden: boolean) => (
    <div className="ticker__row" aria-hidden={hidden || undefined}>
      {items.map((t, i) => (
        <span className="ticker__item" key={i}>
          {t}
          <Star className="ticker__star" />
        </span>
      ))}
    </div>
  );
  return (
    <div className={`ticker ${className}`}>
      <p className="visually-hidden">{items.join(" — ")}</p>
      <div className="ticker__track" aria-hidden="true">
        {row(true)}
        {row(true)}
      </div>
    </div>
  );
}
