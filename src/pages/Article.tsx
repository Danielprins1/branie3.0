import { Link, useParams } from "react-router-dom";
import { articleBySlug, formatDate, relatedArticles, typeLabels } from "../content/articles";
import { useReveal } from "../hooks/useReveal";
import { useSeo } from "../hooks/useSeo";
import ArticleCard from "../components/ArticleCard";
import Photo from "../components/Photo";
import PreorderButton from "../components/PreorderButton";
import NotFound from "./NotFound";
import "./article.css";

function Rating({ value }: { value: number }) {
  const full = Math.round(Math.max(0, Math.min(5, value)));
  return (
    <p className="rating" aria-label={`Beoordeling: ${full} van de 5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={i < full ? "is-on" : ""} aria-hidden="true">
          ✶
        </span>
      ))}
    </p>
  );
}

export default function ArticlePage() {
  const { slug = "" } = useParams();
  const article = articleBySlug(slug);
  useSeo(article?.title, article?.intro);
  useReveal([slug]);
  if (!article) return <NotFound />;
  const a = article;
  const related = relatedArticles(a);

  return (
    <article className={`article article--${a.type} tone-${a.tone}`}>
      <header className="article__head">
        <div className="article__head-inner wrap">
          <nav className="article__crumbs kicker" aria-label="Kruimelpad">
            <Link to="/artikelen">Artikelen</Link>
            <span aria-hidden="true"> / </span>
            <Link to={`/rubrieken/${a.rubric.slug}`}>{a.rubric.name}</Link>
          </nav>
          <p className="article__type">
            <span className="tag">{typeLabels[a.type]}</span>
            {a.placeholder && <span className="tag tag--placeholder">Voorbeeldartikel — tekst volgt</span>}
          </p>
          <h1 className="article__title">{a.title}</h1>
          {a.intro && <p className="article__intro">{a.intro}</p>}
          <p className="article__byline kicker">
            <span>Tekst: {a.author}</span>
            {a.photographer && <span>Beeld: {a.photographer}</span>}
            {a.date && <time dateTime={a.date}>{formatDate(a.date)}</time>}
            <span>{a.readingTime} min lezen</span>
          </p>
        </div>
        <div className="article__hero wrap">
          <Photo src={a.image} alt={a.imageAlt} tone={a.tone} ratio="16 / 9" priority />
        </div>
      </header>

      <div className="article__layout wrap">
        {(a.rating !== undefined || a.details.length > 0) && (
          <aside className="article__box" aria-label="In het kort">
            <p className="kicker">In het kort</p>
            {a.rating !== undefined && <Rating value={a.rating} />}
            {a.details.length > 0 && (
              <ul>
                {a.details.map((d) => (
                  <li key={d}>{d}</li>
                ))}
              </ul>
            )}
          </aside>
        )}
        <div className="article__body prose" dangerouslySetInnerHTML={{ __html: a.html }} />
      </div>

      <aside className="article__plug wrap" aria-label="Het magazine">
        <p className="article__plug-text">
          Dit verhaal komt uit de wereld van <strong>BRANIE</strong>. Het magazine zelf lees je op papier.
        </p>
        <PreorderButton />
      </aside>

      {related.length > 0 && (
        <section className="related" aria-labelledby="gerelateerd">
          <div className="wrap">
            <h2 id="gerelateerd" className="related__title display">
              Lees ook
            </h2>
            <div className="related__grid">
              {related.map((r) => (
                <div className="reveal" key={r.slug}>
                  <ArticleCard article={r} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </article>
  );
}
