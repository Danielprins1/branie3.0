import { Marked, type Tokens } from "marked";
import { rubricBySlug, type Rubric, type Tone } from "./rubrics";

/**
 * Artikelen worden automatisch ingeladen uit `src/content/articles/*.md`.
 * Een nieuw artikel toevoegen = een nieuw .md-bestand maken. Zie README.
 */
export type ArticleType = "interview" | "reportage" | "recensie" | "listicle" | "fotoreportage" | "essay";

export interface Article {
  slug: string;
  title: string;
  intro: string;
  type: ArticleType;
  rubric: Rubric;
  author: string;
  photographer?: string;
  date: string;
  readingTime: number;
  image?: string;
  imageAlt: string;
  tone: Tone;
  featured: boolean;
  placeholder: boolean;
  rating?: number;
  details: string[];
  html: string;
}

export const typeLabels: Record<ArticleType, string> = {
  interview: "Interview",
  reportage: "Reportage",
  recensie: "Recensie",
  listicle: "Lijstje",
  fotoreportage: "Fotoreportage",
  essay: "Essay",
};

/* ------------------------------------------------------------------ */
/* Frontmatter: eenvoudige `sleutel: waarde`-regels en lijstjes (- item) */
/* ------------------------------------------------------------------ */

type FrontValue = string | number | boolean | string[];

function parseValue(raw: string): FrontValue {
  const v = raw.trim();
  if (/^".*"$/.test(v) || /^'.*'$/.test(v)) return v.slice(1, -1);
  if (v === "true") return true;
  if (v === "false") return false;
  if (/^-?\d+(\.\d+)?$/.test(v)) return Number(v);
  return v;
}

export function parseFrontmatter(source: string): { data: Record<string, FrontValue>; body: string } {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(source);
  if (!match) return { data: {}, body: source };
  const data: Record<string, FrontValue> = {};
  let listKey: string | null = null;
  for (const line of match[1].split(/\r?\n/)) {
    if (!line.trim() || line.trim().startsWith("#")) continue;
    const item = /^\s+-\s+(.*)$/.exec(line);
    if (item && listKey) {
      (data[listKey] as string[]).push(String(parseValue(item[1])));
      continue;
    }
    const kv = /^([A-Za-z_][\w-]*):\s*(.*)$/.exec(line);
    if (!kv) continue;
    if (kv[2] === "") {
      listKey = kv[1];
      data[listKey] = [];
    } else {
      listKey = null;
      data[kv[1]] = parseValue(kv[2]);
    }
  }
  return { data, body: match[2] };
}

/* ------------------------------------------------------------------ */
/* Markdown → HTML, met een paar BRANIE-specifieke uitbreidingen       */
/* ------------------------------------------------------------------ */

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const tones: Tone[] = ["red", "amber", "green", "blue", "bordeaux", "ink"];

const marked = new Marked({
  gfm: true,
  renderer: {
    // ![Bijschrift](placeholder:amber) → grafische placeholder i.p.v. foto.
    image({ href, text, title }: Tokens.Image) {
      const caption = title || text;
      if (href.startsWith("placeholder")) {
        const tone = (href.split(":")[1] as Tone) || "ink";
        const safeTone = tones.includes(tone) ? tone : "ink";
        return `<figure class="md-figure"><span class="ph ph--${safeTone}" role="img" aria-label="${escapeHtml(
          text || "Beeld volgt",
        )}"><span class="ph__label">Beeld volgt</span></span>${
          caption ? `<figcaption>${escapeHtml(caption)}</figcaption>` : ""
        }</figure>`;
      }
      return `<figure class="md-figure"><img src="${escapeHtml(href)}" alt="${escapeHtml(
        text,
      )}" loading="lazy" decoding="async" />${caption ? `<figcaption>${escapeHtml(caption)}</figcaption>` : ""}</figure>`;
    },
  },
});

const files = import.meta.glob("./articles/*.md", { query: "?raw", import: "default", eager: true }) as Record<
  string,
  string
>;

function toArticle(path: string, source: string): Article | null {
  const { data, body } = parseFrontmatter(source);
  const slug = path.split("/").pop()!.replace(/\.md$/, "");
  const rubric = rubricBySlug(String(data.rubric ?? ""));
  if (!rubric) {
    console.warn(`[BRANIE] Artikel "${slug}" heeft een onbekende rubriek: ${String(data.rubric)}`);
    return null;
  }
  const words = body.split(/\s+/).filter(Boolean).length;
  const type = (String(data.type ?? "reportage") as ArticleType) in typeLabels ? (data.type as ArticleType) : "reportage";
  return {
    slug,
    title: String(data.title ?? slug),
    intro: String(data.intro ?? ""),
    type,
    rubric,
    author: String(data.author ?? "Redactie BRANIE"),
    photographer: data.photographer ? String(data.photographer) : undefined,
    date: String(data.date ?? ""),
    readingTime: Math.max(1, Math.round(words / 220)),
    image: data.image ? String(data.image) : undefined,
    imageAlt: String(data.imageAlt ?? data.title ?? ""),
    tone: (data.tone as Tone) || rubric.tone,
    featured: data.featured === true,
    placeholder: data.placeholder === true,
    rating: typeof data.rating === "number" ? data.rating : undefined,
    details: Array.isArray(data.details) ? data.details : [],
    // Een alinea die volledig vet is, is in een interview een vraag
    html: (marked.parse(body) as string).replace(/<p><strong>([\s\S]*?)<\/strong><\/p>/g, '<p class="qa-q"><strong>$1</strong></p>'),
  };
}

export const articles: Article[] = Object.entries(files)
  .map(([path, src]) => toArticle(path, src))
  .filter((a): a is Article => a !== null)
  .sort((a, b) => b.date.localeCompare(a.date));

export const articleBySlug = (slug: string) => articles.find((a) => a.slug === slug);
export const articlesByRubric = (slug: string) => articles.filter((a) => a.rubric.slug === slug);
export const featuredArticles = () => {
  const featured = articles.filter((a) => a.featured);
  return featured.length ? featured : articles.slice(0, 5);
};

export function relatedArticles(article: Article, count = 3): Article[] {
  const sameRubric = articles.filter((a) => a.slug !== article.slug && a.rubric.slug === article.rubric.slug);
  const others = articles.filter((a) => a.slug !== article.slug && a.rubric.slug !== article.rubric.slug);
  return [...sameRubric, ...others].slice(0, count);
}

export function formatDate(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" });
}
