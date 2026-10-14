import { site } from "../content/site";
import { useSeo } from "../hooks/useSeo";
import "./listing.css";

export default function Colofon() {
  useSeo("Colofon");
  return (
    <div className="listing">
      <header className="listing__head wrap">
        <p className="kicker">Wie maken het</p>
        <h1 className="listing__title display">Colofon</h1>
      </header>
      <div className="wrap prose colofon">
        <p className="tag tag--placeholder">De gegevens hieronder volgen</p>
        <dl>
          <dt>Uitgave</dt>
          <dd>{site.name}</dd>
          <dt>Hoofdredactie</dt>
          <dd>Volgt</dd>
          <dt>Redactie</dt>
          <dd>Volgt</dd>
          <dt>Art direction &amp; vormgeving</dt>
          <dd>Volgt</dd>
          <dt>Fotografie</dt>
          <dd>Volgt</dd>
          <dt>Contact</dt>
          <dd>{site.contactEmail || "Volgt"}</dd>
        </dl>
      </div>
    </div>
  );
}
