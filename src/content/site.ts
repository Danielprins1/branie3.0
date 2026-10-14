/**
 * Centrale instellingen van de website.
 *
 * Alles wat de redactie zelf wil kunnen aanpassen (teksten, links, logo,
 * cover) staat hier. Lege velden ('') worden netjes opgevangen in de site.
 */
export const site = {
  name: "BRANIE",
  payoff: "Oude streken, nieuwe straten.",
  tagline: "Een magazine over Amsterdam, van 1950 tot nu.",
  description:
    "BRANIE is een nieuw magazine over Amsterdam van 1950 tot nu. Verhalen over de stad, haar inwoners, cultuur, geschiedenis en veranderingen — eigenwijs, humoristisch en een beetje brutaal.",

  /**
   * Logo. Zolang `logoImage` leeg is, wordt `name` als tekstlogo gebruikt
   * (ook in het glas-in-loodraam). Zet hier het pad naar een SVG/PNG met
   * transparante achtergrond, bijv. "/images/logo-branie.svg".
   */
  logoImage: "",

  /**
   * Cover van het magazine. Zolang `coverImage` leeg is, toont de site een
   * duidelijk gemarkeerde tijdelijke cover. Zet hier bijv.
   * "/images/cover-branie-01.jpg" (staande verhouding, ca. 3:4).
   */
  coverImage: "",
  coverAlt: "Cover van BRANIE nummer 01",
  issueLabel: "Nummer 01",

  /**
   * Link naar de bestelomgeving. Leeg = "binnenkort te bestellen".
   * Er wordt bewust géén nep-afrekenproces gesimuleerd.
   */
  preorderUrl: "",

  /** Social en contact. Leeg = wordt in de footer als "volgt" getoond. */
  instagramUrl: "",
  instagramHandle: "",
  contactEmail: "",

  /** Basis-URL van de live site, voor SEO (canonical / og:url). */
  siteUrl: "",
} satisfies Record<string, string>;

export const navItems = [
  { label: "Home", to: "/" },
  { label: "Rubrieken", to: "/rubrieken" },
  { label: "Artikelen", to: "/artikelen" },
  { label: "Over BRANIE", to: "/over" },
] as const;
