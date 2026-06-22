import type { Config } from "tailwindcss";

// Absolute content globs so the build does not depend on the process cwd.
// The preview harness launches `next dev` from a different directory, which
// makes relative globs ("./app/**") match nothing and emits zero utilities.
const ROOT = "/Users/nplmini/code/work/systems/projection-ui";

const config: Config = {
  content: [
    `${ROOT}/app/**/*.{ts,tsx}`,
    `${ROOT}/components/**/*.{ts,tsx}`,
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Deepline-ish dark palette
        ink: {
          900: "#0b0e14", // app bg
          850: "#10141c",
          800: "#151a23", // panel bg
          700: "#1d2430", // border / raised
          600: "#2a3342",
        },
        accent: {
          DEFAULT: "#5b9dff",
          dim: "#3a6bd6",
        },
        ok: "#3fb950",
        warn: "#d29922",
        bad: "#f85149",
        muted: "#7d8590",
      },
      fontFamily: {
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
