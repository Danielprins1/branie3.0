/**
 * De inhoudelijke pijlers van BRANIE.
 *
 * Let op: de beschrijvingen zijn conceptteksten. Laat de redactie ze
 * aanscherpen op basis van de doelgroepanalyse.
 *
 * `tone` bepaalt de kleur van de rubriek in de vormgeving.
 * `image` is optioneel; leeg = grafische placeholder.
 */
export type Tone = "red" | "amber" | "green" | "blue" | "bordeaux" | "ink";

export interface Rubric {
  slug: string;
  name: string;
  short: string;
  description: string;
  tone: Tone;
  image?: string;
}

export const rubrics: Rubric[] = [
  {
    slug: "de-onbekende-amsterdammer",
    name: "De (on)bekende Amsterdammer",
    short: "Mensen die de stad maken",
    description:
      "De man van de bloemenstal, de vrouw die al veertig jaar hetzelfde café runt, de jongen die de stad vanaf zijn skateboard kent. Portretten van wie je dagelijks passeert — en van wie je dacht te kennen.",
    tone: "red",
  },
  {
    slug: "wonen-en-architectuur",
    name: "Wonen & architectuur",
    short: "Huizen met een verleden",
    description:
      "Van naoorlogse tuinsteden tot gekraakte pakhuizen en nieuwe eilanden. Hoe Amsterdam woont, bouwt, sloopt en weer opnieuw begint.",
    tone: "amber",
  },
  {
    slug: "straatcultuur",
    name: "Straatcultuur",
    short: "Wat er op straat gebeurt",
    description:
      "Provo, punk, graffiti, hiphop en wat er vandaag op de stoep ontstaat. De stad als podium, protestbord en speelplaats.",
    tone: "ink",
  },
  {
    slug: "eten-en-drinken",
    name: "Eten & drinken",
    short: "Van bruin café tot afhaalluik",
    description:
      "Broodjeszaken die blijven, snackbars die verdwenen en keukens die de stad van smaak veranderden. Met een kroket in de ene en een verhaal in de andere hand.",
    tone: "green",
  },
  {
    slug: "vervoer-en-openbare-ruimte",
    name: "Vervoer & openbare ruimte",
    short: "Hoe we ons door de stad bewegen",
    description:
      "Trams, metro-rellen, fietspaden en pleinen die van auto's werden teruggepakt. Over wie de straat eigenlijk toebehoort.",
    tone: "blue",
  },
  {
    slug: "sport",
    name: "Sport",
    short: "Velden, kooien en kantines",
    description:
      "Van trapveldjes en zwembaden tot de kantine van de amateurclub. Sport als spiegel van de buurt — en soms van de hele stad.",
    tone: "bordeaux",
  },
];

export const rubricBySlug = (slug: string) => rubrics.find((r) => r.slug === slug);
