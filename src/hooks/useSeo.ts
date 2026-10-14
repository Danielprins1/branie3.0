import { useEffect } from "react";
import { site } from "../content/site";

function setMeta(selector: string, attr: "name" | "property", key: string, value: string) {
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.content = value;
}

/** Titel en beschrijving per pagina (basis-SEO voor een single page app). */
export function useSeo(title?: string, description?: string) {
  useEffect(() => {
    const full = title ? `${title} — ${site.name}` : `${site.name} — ${site.payoff}`;
    const desc = description || site.description;
    document.title = full;
    setMeta('meta[name="description"]', "name", "description", desc);
    setMeta('meta[property="og:title"]', "property", "og:title", full);
    setMeta('meta[property="og:description"]', "property", "og:description", desc);
    if (site.siteUrl) {
      const url = site.siteUrl.replace(/\/$/, "") + window.location.pathname;
      setMeta('meta[property="og:url"]', "property", "og:url", url);
      let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
      if (!link) {
        link = document.createElement("link");
        link.rel = "canonical";
        document.head.appendChild(link);
      }
      link.href = url;
    }
  }, [title, description]);
}
