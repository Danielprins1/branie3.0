import { Link } from "react-router-dom";
import { featuredArticles } from "../content/articles";
import { site } from "../content/site";
import { useReveal } from "../hooks/useReveal";
import { useSeo } from "../hooks/useSeo";
import ArticleCard from "../components/ArticleCard";
import { MagazineObject } from "../components/Magazine";
import PreorderButton from "../components/PreorderButton";
import RubricGrid from "../components/RubricGrid";
import Star from "../components/Star";
import Ticker from "../components/Ticker";
import "./home.css";

export default function Home() {
  useSeo();
  useReveal();
  const featured = featuredArticles();
  const [lead, ...rest] = featured;
  const second = rest.slice(0, 2);
  const list = rest.slice(2);

  return (
    <>
      {/* ---------------- Hero: het magazine centraal ---------------- */}
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero__inner wrap">
          <div className="hero__copy">
            <p className="kicker hero__kicker">
              <span className="hero__issue">{site.issueLabel}</span> Een nieuw magazine over Amsterdam, 1950 — nu
            </p>
            <h1 id="hero-title" className="hero__title display">
              {site.name}
            </h1>
            <p className="hero__payoff script">{site.payoff}</p>
            <p className="hero__intro">
              Verhalen over de stad, haar inwoners, cultuur en veranderingen. We zetten vroeger en nu naast elkaar —
              eigenwijs, met humor en een beetje brutaal. Geen geschiedenisblad. Wel een blad met geschiedenis.
            </p>
            <div className="hero__actions">
              <PreorderButton />
              <Link to="/artikelen" className="btn btn--ghost">
                Lees online <span className="arrow" aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
          <div className="hero__object">
            <MagazineObject />
            <span className="hero__stamp" aria-hidden="true">
              <Star className="hero__stamp-star" />
              <span>Om vast te houden</span>
            </span>
          </div>
        </div>
        <Ticker
          className="hero__ticker"
          items={["Oude streken", "Nieuwe straten", "Amsterdam 1950 — nu", "Eigenwijs sinds nummer één", "Geen tulpen"]}
        />
      </section>

      {/* ---------------- Manifest ---------------- */}
      <section className="manifest wrap" aria-label="Over het magazine">
        <p className="manifest__text reveal">
          BRANIE is voor iedereen die een band heeft met Amsterdam. Voor wie hier opgroeide, voor wie hier net is
          neergestreken, en voor wie vindt dat de stad <em>vroeger</em> beter was —{" "}
          <del className="manifest__strike">en ongelijk heeft</del> <ins className="manifest__hand">soms gelijk heeft.</ins>
        </p>
        <Link to="/over" className="link-arrow reveal">
          Over BRANIE →
        </Link>
      </section>

      {/* ---------------- Rubrieken ---------------- */}
      <section className="section rubrics wrap" aria-labelledby="rubrieken-titel">
        <header className="section__head">
          <p className="kicker">De inhoud</p>
          <h2 id="rubrieken-titel" className="section__title display">
            Rubrieken
          </h2>
          <Link to="/rubrieken" className="link-arrow section__all">
            Alle rubrieken →
          </Link>
        </header>
        <RubricGrid />
      </section>

      {/* ---------------- Uitgelichte artikelen ---------------- */}
      {lead && (
        <section className="section featured" aria-labelledby="artikelen-titel">
          <div className="wrap">
            <header className="section__head section__head--light">
              <p className="kicker">Online te lezen</p>
              <h2 id="artikelen-titel" className="section__title display">
                Uitgelicht
              </h2>
              <Link to="/artikelen" className="link-arrow section__all">
                Alle artikelen →
              </Link>
            </header>
            <div className="featured__grid">
              <div className="featured__lead reveal">
                <ArticleCard article={lead} variant="lead" />
              </div>
              <div className="featured__side">
                {second.map((a, i) => (
                  <div className="reveal" key={a.slug}>
                    <ArticleCard article={a} variant={i === 0 ? "tall" : "wide"} />
                  </div>
                ))}
              </div>
              {list.length > 0 && (
                <ol className="featured__list reveal" aria-label="Meer artikelen">
                  {list.map((a, i) => (
                    <li key={a.slug}>
                      <ArticleCard article={a} variant="list" index={i + 3} />
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ---------------- Pre-order ---------------- */}
      <section id="pre-order" className="preorder" tabIndex={-1} aria-labelledby="preorder-titel">
        <div className="preorder__inner wrap">
          <div className="preorder__object reveal">
            <MagazineObject className="mag--stack" />
          </div>
          <div className="preorder__copy">
            <p className="kicker">Op papier</p>
            <h2 id="preorder-titel" className="preorder__title display">
              Een blad om te <span className="preorder__keep">bewaren</span>
            </h2>
            <ul className="preorder__why">
              <li>
                <strong>Zwaar papier, grote foto's.</strong> Gemaakt om vast te houden, door te geven en op de
                vensterbank te laten slingeren.
              </li>
              <li>
                <strong>Verhalen die je nergens anders leest.</strong> Over de stad van 1950 tot nu, van mensen die er
                waren.
              </li>
              <li>
                <strong>Onafhankelijk en eigenwijs.</strong> Geen clichés, geen souvenirs. Wel branie.
              </li>
            </ul>
            <div className="preorder__cta">
              <PreorderButton direct className="btn btn--red btn--big">
                Pre-order nu
              </PreorderButton>
              {!site.preorderUrl && (
                <p className="preorder__note">
                  De bestelpagina gaat binnenkort open. Tot die tijd: vertel het door.
                </p>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
