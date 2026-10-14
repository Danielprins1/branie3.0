import { useState } from "react";
import { Link } from "react-router-dom";
import { navItems, site } from "../content/site";
import { useIntro } from "../intro/IntroContext";
import { Logo } from "./Nav";

/** Een fiets. In Amsterdam. Je weet hoe dat afloopt. */
function Bike() {
  const [gone, setGone] = useState(false);
  return (
    <button
      type="button"
      className={`bike${gone ? " is-gone" : ""}`}
      onPointerEnter={(e) => e.pointerType === "mouse" && setGone(true)}
      onClick={() => setGone((g) => !g)}
      aria-label={gone ? "Hier stond net nog een fiets" : "Een fiets"}
    >
      <svg viewBox="0 0 64 36" aria-hidden="true" className="bike__svg">
        <g fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="13" cy="25" r="9" />
          <circle cx="51" cy="25" r="9" />
          <path d="M13 25 L24 10 L41 10 L51 25 M24 10 L32 25 L41 10 M32 25 L13 25 M21 6 L28 6 M41 10 L39 4 L45 4" />
        </g>
      </svg>
      <span className="bike__note" aria-hidden={!gone}>
        Hier stond net nog een fiets.
      </span>
    </button>
  );
}

export default function Footer() {
  const { replay } = useIntro();
  const year = new Date().getFullYear();
  return (
    <footer className="footer">
      <div className="footer__mast wrap" aria-hidden="true">
        <Logo className="footer__logo" />
      </div>
      <div className="footer__grid wrap">
        <div className="footer__brand">
          <p className="footer__payoff script">{site.payoff}</p>
          <p className="footer__tagline">{site.tagline}</p>
        </div>

        <nav className="footer__col" aria-label="Footer">
          <h2 className="kicker">Lezen</h2>
          <ul>
            {navItems.map((n) => (
              <li key={n.to}>
                <Link to={n.to}>{n.label}</Link>
              </li>
            ))}
            <li>
              <Link to="/#pre-order">Pre-order</Link>
            </li>
          </ul>
        </nav>

        <div className="footer__col">
          <h2 className="kicker">Volgen &amp; contact</h2>
          <ul>
            <li>
              {site.instagramUrl ? (
                <a href={site.instagramUrl} target="_blank" rel="noopener">
                  Instagram{site.instagramHandle ? ` ${site.instagramHandle}` : ""}
                </a>
              ) : (
                <span>Instagram — volgt</span>
              )}
            </li>
            <li>
              {site.contactEmail ? (
                <a href={`mailto:${site.contactEmail}`}>{site.contactEmail}</a>
              ) : (
                <span>Contact — volgt</span>
              )}
            </li>
            <li>
              <Link to="/colofon">Colofon</Link>
            </li>
          </ul>
        </div>

        <div className="footer__col footer__extra">
          <Bike />
          <button type="button" className="footer__replay" onClick={replay}>
            Bekijk de intro opnieuw
          </button>
        </div>
      </div>
      <div className="footer__base wrap">
        <p>
          © {year} {site.name}. Alle rechten voorbehouden.
        </p>
        <p className="footer__wink">Gemaakt in Amsterdam, niet in een souvenirwinkel.</p>
      </div>
    </footer>
  );
}
