import { parseHTML } from "linkedom";

export function htmlToMarkdownFallback(html: string): string {
  const { document } = parseHTML(html);
  for (const element of document.querySelectorAll(
    "script, style, svg, noscript, template, iframe, nav, header, footer, aside, form",
  )) {
    element.remove();
  }
  return document.body.textContent
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export async function extractHtmlToMarkdown(
  html: string,
  baseUrl: URL,
): Promise<{ markdown: string; title?: string; extractor: "defuddle" | "basic" }> {
  try {
    const { Defuddle } = await import("defuddle/node");
    const { document } = parseHTML(html);
    const result = await Defuddle(document as unknown as Document, baseUrl.toString(), {
      markdown: true,
      useAsync: false,
    });
    const markdown = typeof result.content === "string" ? result.content.trim() : "";
    if (markdown) {
      return {
        markdown,
        title:
          typeof result.title === "string" && result.title.trim() ? result.title.trim() : undefined,
        extractor: "defuddle",
      };
    }
  } catch {
    // Fall through to the basic converter for malformed or unsupported pages.
  }
  return { markdown: htmlToMarkdownFallback(html), extractor: "basic" };
}
