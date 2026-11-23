import sanitizeHtml from "sanitize-html";

/** Allow-list sanitizer for rich text authored in the dashboard. */
export function sanitizeRichText(html: string) {
  return sanitizeHtml(html, {
    allowedTags: ["p", "br", "strong", "b", "em", "i", "u", "h2", "h3", "h4", "ul", "ol", "li", "a", "blockquote", "code", "pre"],
    allowedAttributes: { a: ["href", "target", "rel"] },
    allowedSchemes: ["http", "https", "mailto", "tel"],
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer" }, true),
      b: "strong",
      i: "em",
      div: "p",
    },
  }).trim();
}
