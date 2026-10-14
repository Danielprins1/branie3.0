import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { navItems, site } from "../content/site";
import PreorderButton from "./PreorderButton";
import Star from "./Star";

export function Logo({ className = "" }: { className?: string }) {
  return site.logoImage ? (
    <img className={`logo__img ${className}`} src={site.logoImage} alt={site.name} />
  ) : (
    <span className={`logo__text ${className}`}>{site.name}</span>
  );
}

export default function Nav() {
  const [open, setOpen] = useState(false);
  const [spins, setSpins] = useState(0);
  const location = useLocation();
  const menuRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => setOpen(false), [location.pathname, location.hash]);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    menuRef.current?.querySelector<HTMLElement>("a")?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Het sterretje draait af en toe onverwacht een rondje
  useEffect(() => {
    const id = window.setInterval(() => setSpins((s) => s + 1), 17000 + Math.random() * 9000);
    return () => clearInterval(id);
  }, []);

  return (
    <header className={`nav${open ? " is-open" : ""}`}>
      <div className="nav__bar wrap">
        <Link to="/" className="nav__logo" aria-label={`${site.name} — naar de homepage`}>
          <Logo />
          <Star className={`nav__star spin-${spins % 2}`} />
        </Link>

        <nav className="nav__links" aria-label="Hoofdmenu">
          <ul>
            {navItems.map((item) => (
              <li key={item.to}>
                <NavLink to={item.to} end={item.to === "/"}>
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <PreorderButton className="btn btn--red nav__cta">Pre-order</PreorderButton>

        <button
          ref={toggleRef}
          type="button"
          className="nav__toggle"
          aria-expanded={open}
          aria-controls="mobiel-menu"
          onClick={() => setOpen((o) => !o)}
        >
          <span className="nav__toggle-label">{open ? "Sluit" : "Menu"}</span>
          <span className="nav__burger" aria-hidden="true">
            <span />
            <span />
          </span>
        </button>
      </div>

      <div id="mobiel-menu" className="nav__menu" ref={menuRef} hidden={!open}>
        <nav aria-label="Mobiel menu">
          <ol>
            {navItems.map((item, i) => (
              <li key={item.to}>
                <NavLink to={item.to} end={item.to === "/"}>
                  <span className="nav__menu-num">0{i + 1}</span>
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ol>
        </nav>
        <PreorderButton className="btn btn--red nav__menu-cta" />
        <p className="nav__menu-payoff script">{site.payoff}</p>
      </div>
    </header>
  );
}
