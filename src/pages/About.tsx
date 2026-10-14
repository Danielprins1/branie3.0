import { site } from "../content/site";
import { useReveal } from "../hooks/useReveal";
import { useSeo } from "../hooks/useSeo";
import { MagazineObject } from "../components/Magazine";
import PreorderButton from "../components/PreorderButton";
import Star from "../components/Star";
import "./listing.css";

const traits = [
  ["Rebels en eigenwijs", "We volgen geen trends, we lopen er liever tegenin."],
  ["Amsterdams", "Zonder tulpen, molens of souvenirs. Wel met de stad zoals die echt is."],
  ["Historisch én eigentijds", "Vroeger en nu naast elkaar, zonder nostalgisch te worden."],
  ["Humoristisch", "En soms een beetje absurd. Net als de stad."],
  ["Grafisch en uitgesproken", "Een blad dat je ziet liggen, en dat je wilt oppakken."],
  ["Voor elke generatie", "Van wie hier net woont tot wie hier altijd al was."],
];

export default function About() {
  useSeo("Over BRANIE", site.description);
  useReveal();
  return (
    <div className="listing about">
      <header className="listing__head wrap">
        <p className="kicker">Over</p>
        <h1 className="listing__title display">
          Over <span className="about__name">BRANIE</span>
        </h1>
        <p className="about__payoff script">{site.payoff}</p>
      </header>
      <div className="about__grid wrap">
        <div className="about__text prose">
          <p className="about__lede">
            BRANIE is een nieuw magazine over Amsterdam van 1950 tot nu. We vertellen verhalen over de stad, haar
            inwoners, cultuur, geschiedenis en veranderingen.
          </p>
          <p>
            We zetten vroeger en nu naast elkaar, maar we zijn absoluut geen traditioneel geschiedenisblad. BRANIE is
            eigenwijs, soms provocerend, humoristisch, visueel uitgesproken en een beetje brutaal.
          </p>
          <p>
            Het magazine is bedoeld voor iedereen met een band met Amsterdam — jong en oud, geboren of getogen, of
            gewoon blijven plakken.
          </p>
          <p>
            <em>Branie</em> (de; brutaal lef, durf). Precies.
          </p>
          <PreorderButton />
        </div>
        <div className="about__object reveal">
          <MagazineObject />
        </div>
      </div>
      <section className="traits wrap" aria-labelledby="karakter">
        <h2 id="karakter" className="traits__title display">
          Karakter
        </h2>
        <ol className="traits__list">
          {traits.map(([t, d], i) => (
            <li key={t} className="reveal">
              <span className="traits__num display">{String(i + 1).padStart(2, "0")}</span>
              <h3 className="traits__name">{t}</h3>
              <p>{d}</p>
              {i === 2 && <Star className="traits__star" />}
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
