# BRANIE

**Oude streken, nieuwe straten.** Website van BRANIE, het magazine over Amsterdam van 1950 tot nu.

Gebouwd met React, Vite en TypeScript, met GSAP + ScrollTrigger voor de intro. Gehost op Vercel.

## Lokaal draaien

```bash
npm install
npm run dev        # ontwikkelserver op http://localhost:5173
npm run build      # typecheck + productiebuild in dist/
npm run preview    # productiebuild lokaal bekijken
```

Handige URL-parameters tijdens het testen:

- `/?intro` — toont altijd de volledige intro
- `/?geenintro` — slaat de intro over

## Deployment (Vercel)

De repository is gekoppeld aan Vercel. `vercel.json` regelt het framework (Vite), de build en de
doorverwijzing van alle routes naar `index.html`.

- Een push naar `main` gaat automatisch live (production).
- Elke andere branch of pull request krijgt automatisch een eigen preview-URL.

## Content beheren

Alles wat de redactie aanpast, staat in `src/content/`.

### Algemene instellingen — `src/content/site.ts`

| Veld | Wat |
| --- | --- |
| `logoImage` | Pad naar het definitieve logo (SVG/PNG met transparantie), bijv. `/images/logo-branie.svg`. Leeg = tekstlogo. Het logo verschijnt ook automatisch als glas in het glas-in-loodraam. |
| `coverImage` | Pad naar de cover, bijv. `/images/cover-branie-01.jpg` (staand, ca. 3:4). Leeg = tijdelijke cover. |
| `preorderUrl` | Link naar de bestelomgeving. Leeg = "binnenkort te bestellen" (er wordt geen nep-afrekenproces getoond). |
| `instagramUrl`, `instagramHandle`, `contactEmail` | Voor de footer. Leeg = "volgt". |
| `siteUrl` | De live URL, voor canonical- en og:url-tags. |

Afbeeldingen zet je in `public/images/`. Gebruik bij voorkeur geoptimaliseerde JPG/WebP-bestanden van
maximaal ca. 2000 px breed.

### Rubrieken — `src/content/rubrics.ts`

Naam, korte omschrijving, beschrijving, kleur (`tone`) en optioneel een foto (`image`). De huidige
beschrijvingen zijn concepten.

### Artikelen — `src/content/articles/*.md`

Een nieuw artikel toevoegen = een nieuw `.md`-bestand in deze map. De bestandsnaam wordt de URL
(`mijn-verhaal.md` → `/artikelen/mijn-verhaal`). Bovenaan staat de informatie over het artikel:

```markdown
---
title: "De kop van het artikel"
intro: "Korte introductie die ook op de overzichtspagina's verschijnt."
type: interview            # interview | reportage | recensie | listicle | fotoreportage | essay
rubric: straatcultuur      # slug uit rubrics.ts
author: Naam Schrijver
photographer: Naam Fotograaf
date: 2026-10-14
image: /images/artikelen/mijn-verhaal.jpg
imageAlt: "Beschrijving van de foto"
featured: true             # tonen bij 'Uitgelicht' op de homepage
rating: 4                  # alleen voor recensies (1–5)
details:                   # alleen voor recensies: praktisch informatieblok
  - "Adres: ..."
  - "Open: ..."
---

Hier begint de tekst, in gewone Markdown.

## Tussenkop

> "Een citaat wordt groot uitgelicht."

![Bijschrift](/images/artikelen/foto.jpg)
```

Per type past de opmaak zich aan:

- **interview** — een alinea die volledig vet is (`**BRANIE: vraag?**`) wordt als vraag opgemaakt;
- **listicle** — elke `##`-tussenkop krijgt automatisch een groot nummer;
- **fotoreportage** — foto's worden breder dan de tekstkolom getoond;
- **recensie** — sterren en informatieblok uit `rating` en `details`.

Zolang er nog geen foto is, kun je `![Bijschrift](placeholder:red)` gebruiken (kleuren: `red`, `amber`,
`green`, `blue`, `bordeaux`, `ink`).

De huidige artikelen (`voorbeeld-*.md`, met `placeholder: true`) zijn voorbeelden en kunnen weg zodra
de echte artikelen er zijn.

## De intro

De intro staat in `src/intro/`:

- `glass/window.ts` tekent het glas-in-loodraam (glas, lood, logo, pay-off, daglicht) op canvas;
- `glass/shatter.ts` plant de barsten en de scherven en tekent het breken;
- `glass/stage.ts` koppelt dit aan het zichtbare canvas en verzorgt de glimmers;
- `Intro.tsx` stuurt alles aan met GSAP ScrollTrigger.

Gedrag:

- **Eerste bezoek:** de volledige, scrollgestuurde breekanimatie.
- **Terugkerend bezoek:** een korte, automatische versie (bijgehouden via `localStorage`).
- **`prefers-reduced-motion`:** een stilstaand raam dat rustig vervaagt, zonder breekanimatie.
- Altijd over te slaan via de knop "Intro overslaan" of met Esc. Opnieuw bekijken kan via de footer.
