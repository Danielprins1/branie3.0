import { useReveal } from "../hooks/useReveal";
import { useSeo } from "../hooks/useSeo";
import RubricGrid from "../components/RubricGrid";
import "./listing.css";

export default function Rubrics() {
  useSeo("Rubrieken", "De vaste rubrieken van BRANIE: van De (on)bekende Amsterdammer tot Sport.");
  useReveal();
  return (
    <div className="listing">
      <header className="listing__head wrap">
        <p className="kicker">De inhoud</p>
        <h1 className="listing__title display">Rubrieken</h1>
        <p className="listing__lede">Zes manieren om naar dezelfde stad te kijken. Kies je ingang.</p>
      </header>
      <div className="wrap">
        <RubricGrid />
      </div>
    </div>
  );
}
