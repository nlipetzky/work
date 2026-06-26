// Markdown -> plain text. Every expert-FACING body is pasted by hand into a mail client, so it
// must carry zero markdown (no #, **, `code`, bullets, links). This is the single source of truth
// for that transform; apply it at every write boundary that composes an expert ask or packet, so
// stored expert text is plain now and stays plain. Deterministic guarantee, not a model request.
export function toPlainText(s: string): string {
  return (s || "")
    .replace(/\r\n/g, "\n")
    .replace(/^\s{0,3}#{1,6}\s+/gm, "")                    // # headers
    .replace(/\*\*(.+?)\*\*/gs, "$1")                      // **bold**
    .replace(/__(.+?)__/gs, "$1")                          // __bold__
    .replace(/`{1,3}([^`]+?)`{1,3}/g, "$1")                // `code`
    .replace(/^\s{0,3}>\s?/gm, "")                         // > blockquote
    .replace(/^\s{0,3}[-*+]\s+/gm, "- ")                   // bullets -> "- "
    .replace(/\[([^\]]+)\]\((https?:[^)]+)\)/g, "$1 ($2)") // [text](url)
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
