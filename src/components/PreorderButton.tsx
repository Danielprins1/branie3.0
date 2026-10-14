import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { site } from "../content/site";

/**
 * Pre-orderknop. Met een ingestelde `site.preorderUrl` gaat hij daarheen;
 * anders naar de pre-ordersectie op de homepage (geen nep-checkout).
 */
export default function PreorderButton({
  children = "Pre-order BRANIE",
  className = "btn btn--red",
  direct = false,
}: {
  children?: ReactNode;
  className?: string;
  direct?: boolean;
}) {
  if (site.preorderUrl) {
    return (
      <a className={className} href={site.preorderUrl} target="_blank" rel="noopener">
        {children} <span className="arrow" aria-hidden="true">→</span>
        <span className="visually-hidden">(opent in een nieuw venster)</span>
      </a>
    );
  }
  if (direct) {
    return (
      <span className={`${className} is-soon`} role="note">
        Binnenkort te bestellen
      </span>
    );
  }
  return (
    <Link className={className} to="/#pre-order">
      {children} <span className="arrow" aria-hidden="true">→</span>
    </Link>
  );
}
