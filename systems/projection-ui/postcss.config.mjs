import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

// PostCSS resolves the Tailwind config relative to process.cwd(). When `next dev`
// is launched from a directory other than this project root (the preview harness
// does exactly that), `tailwindcss: {}` cannot find tailwind.config.ts, silently
// falls back to its default empty-content config, and emits ZERO utility classes —
// the page renders as unstyled raw HTML. Pin the config path to this file's own
// location so it loads from any cwd.
const here = dirname(fileURLToPath(import.meta.url));

const config = {
  plugins: {
    tailwindcss: { config: join(here, "tailwind.config.ts") },
    autoprefixer: {},
  },
};

export default config;
