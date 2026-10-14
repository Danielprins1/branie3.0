import { Link } from "react-router-dom";
import { typeLabels, type Article } from "../content/articles";
import Photo from "./Photo";

type Variant = "lead" | "tall" | "wide" | "compact" | "list";

export default function ArticleCard({ article, variant = "compact", index }: { article: Article; variant?: Variant; index?: number }) {
  const a = article;
  return (
    <article className={`acard acard--${variant} tone-${a.tone}`}>
      <Link to={`/artikelen/${a.slug}`} className="acard__link">
        {variant !== "list" && (
          <div className="acard__media">
            <Photo
              src={a.image}
              alt={a.imageAlt}
              tone={a.tone}
              ratio={variant === "lead" ? "4 / 3" : variant === "tall" ? "3 / 4" : variant === "wide" ? "16 / 9" : "4 / 3"}
              className="tilt"
            />
            {a.placeholder && <span className="tag tag--placeholder acard__ph">Voorbeeldartikel</span>}
          </div>
        )}
        <div className="acard__body">
          {typeof index === "number" && <span className="acard__num display" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>}
          <p className="acard__meta kicker">
            <span className="acard__rubric">{a.rubric.name}</span>
            <span aria-hidden="true"> · </span>
            <span>{typeLabels[a.type]}</span>
          </p>
          <h3 className="acard__title">{a.title}</h3>
          {variant !== "list" && variant !== "compact" && <p className="acard__intro">{a.intro}</p>}
          <p className="acard__foot kicker">
            {a.readingTime} min lezen
            {a.placeholder && variant === "list" && <span className="tag tag--placeholder">Voorbeeld</span>}
          </p>
        </div>
      </Link>
    </article>
  );
}
