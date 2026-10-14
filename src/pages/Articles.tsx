import { Link, useSearchParams } from "react-router-dom";
import { articles } from "../content/articles";
import { rubrics } from "../content/rubrics";
import { useReveal } from "../hooks/useReveal";
import { useSeo } from "../hooks/useSeo";
import ArticleCard from "../components/ArticleCard";
import "./listing.css";

export default function Articles() {
  const [params] = useSearchParams();
  const filter = params.get("rubriek");
  const shown = filter ? articles.filter((a) => a.rubric.slug === filter) : articles;
  useSeo("Artikelen", "Alle online verhalen van BRANIE, het magazine over Amsterdam van 1950 tot nu.");
  useReveal([filter]);

  return (
    <div className="listing">
      <header className="listing__head wrap">
        <p className="kicker">Online te lezen</p>
        <h1 className="listing__title display">Artikelen</h1>
        <p className="listing__lede">
          Verhalen die het blad haalden, en verhalen die er net niet in pasten. Allemaal de moeite waard.
        </p>
      </header>
      <nav className="filters wrap" aria-label="Filter op rubriek">
        <ul>
          <li>
            <Link to="/artikelen" aria-current={!filter ? "page" : undefined}>
              Alles
            </Link>
          </li>
          {rubrics.map((r) => (
            <li key={r.slug}>
              <Link to={`/artikelen?rubriek=${r.slug}`} aria-current={filter === r.slug ? "page" : undefined}>
                {r.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <div className="listing__grid wrap">
        {shown.map((a, i) => (
          <div className={`reveal listing__item listing__item--${i % 5}`} key={a.slug}>
            <ArticleCard article={a} variant={i % 5 === 0 ? "lead" : "compact"} />
          </div>
        ))}
        {shown.length === 0 && <p className="listing__empty">Nog geen artikelen in deze rubriek. Binnenkort meer.</p>}
      </div>
    </div>
  );
}
