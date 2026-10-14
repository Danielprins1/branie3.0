import { Link, useParams } from "react-router-dom";
import { articlesByRubric } from "../content/articles";
import { rubricBySlug, rubrics } from "../content/rubrics";
import { useReveal } from "../hooks/useReveal";
import { useSeo } from "../hooks/useSeo";
import ArticleCard from "../components/ArticleCard";
import Photo from "../components/Photo";
import NotFound from "./NotFound";
import "./listing.css";

export default function RubricPage() {
  const { slug = "" } = useParams();
  const rubric = rubricBySlug(slug);
  useSeo(rubric?.name, rubric?.description);
  useReveal([slug]);
  if (!rubric) return <NotFound />;
  const list = articlesByRubric(rubric.slug);
  const others = rubrics.filter((r) => r.slug !== rubric.slug);

  return (
    <div className={`listing rubric-page tone-${rubric.tone}`}>
      <header className="rubric-page__head">
        <div className="rubric-page__inner wrap">
          <div>
            <p className="kicker">
              <Link to="/rubrieken">Rubrieken</Link> / {rubric.short}
            </p>
            <h1 className="rubric-page__title display">{rubric.name}</h1>
            <p className="rubric-page__desc">{rubric.description}</p>
          </div>
          <Photo src={rubric.image} alt={`Beeld bij ${rubric.name}`} tone={rubric.tone} ratio="4 / 5" className="rubric-page__photo tilt" />
        </div>
      </header>
      <div className="listing__grid wrap">
        {list.map((a, i) => (
          <div className={`reveal listing__item listing__item--${i % 5}`} key={a.slug}>
            <ArticleCard article={a} variant={i === 0 ? "lead" : "compact"} />
          </div>
        ))}
        {list.length === 0 && <p className="listing__empty">Hier verschijnen binnenkort de eerste verhalen.</p>}
      </div>
      <nav className="other-rubrics wrap" aria-label="Andere rubrieken">
        <p className="kicker">Andere rubrieken</p>
        <ul>
          {others.map((r) => (
            <li key={r.slug} className={`tone-${r.tone}`}>
              <Link to={`/rubrieken/${r.slug}`}>{r.name}</Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
