import { createGetUrl } from "fumadocs-core/source";

export const docsRoute = "/docs";
export const docsContentRoute = "/llms.mdx/docs";

const getContentUrl = createGetUrl(docsContentRoute);

export function getPageMarkdownUrl(page: { slugs: string[]; locale?: string }) {
  const segments = [...page.slugs, "content.md"];

  return { segments, url: getContentUrl(segments, page.locale) };
}

export const appName = "Aquadactyl";

export function getPageImageUrl(page: { slugs: string[]; locale?: string }) {
  const segments = [...page.slugs, "image.png"];

  return {
    segments,
    url:
      "/" + [page.locale, "og", "docs", ...segments].filter(Boolean).join("/"),
  };
}
