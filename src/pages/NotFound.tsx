import { Link } from "react-router-dom";
import { useSeo } from "../hooks/useSeo";
import "./listing.css";

export default function NotFound() {
  useSeo("Niet gevonden");
  return (
    <div className="listing notfound wrap">
      <p className="kicker">404</p>
      <h1 className="listing__title display">Verdwaald?</h1>
      <p className="listing__lede">
        Deze pagina bestaat niet (meer). Net als de helft van de snackbars uit 1975. Probeer het via de homepage.
      </p>
      <p>
        <Link to="/" className="btn">
          Naar de homepage <span className="arrow" aria-hidden="true">→</span>
        </Link>
      </p>
    </div>
  );
}
