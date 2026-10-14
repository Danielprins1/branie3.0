import { Link } from "react-router-dom";
import { articlesByRubric } from "../content/articles";
import { rubrics } from "../content/rubrics";
import Photo from "./Photo";
import Star from "./Star";

/**
 * Rubrieken als redactioneel grid: elke tegel een eigen compositie,
 * formaat en beeldverhouding — geen rij identieke kaarten.
 */
const layouts = ["feature", "portrait", "type", "landscape", "square", "banner"] as const;

export default function RubricGrid() {
  return (
    <div className="rgrid">
      {rubrics.map((r, i) => {
        const layout = layouts[i % layouts.length];
        const count = articlesByRubric(r.slug).length;
        return (
          <article key={r.slug} className={`rtile rtile--${layout} tone-${r.tone} reveal`}>
            <Link to={`/rubrieken/${r.slug}`} className="rtile__link">
              {layout !== "type" && (
                <Photo
                  src={r.image}
                  alt={`Beeld bij de rubriek ${r.name}`}
                  tone={r.tone}
                  className="rtile__photo tilt"
                  ratio={layout === "portrait" ? "3 / 4" : layout === "banner" ? "21 / 9" : layout === "square" ? "1 / 1" : "4 / 3"}
                />
              )}
              <div className="rtile__text">
                <span className="rtile__num display" aria-hidden="true">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <p className="kicker rtile__short">{r.short}</p>
                <h3 className="rtile__name display">{r.name}</h3>
                <p className="rtile__desc">{r.description}</p>
                <span className="link-arrow rtile__more">
                  {count ? `${count} ${count === 1 ? "verhaal" : "verhalen"}` : "Lees de verhalen"} →
                </span>
              </div>
              {layout === "type" && <Star className="rtile__star" />}
            </Link>
          </article>
        );
      })}
    </div>
  );
}
