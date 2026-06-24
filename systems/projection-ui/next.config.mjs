/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Build-cache isolation guard. The launchd dev server (port 4180) owns the
  // default `.next`. Any SECOND `next dev` against this same folder (e.g. a preview
  // / screenshot instance) MUST set NEXT_DIST_DIR (e.g. `.next-preview`) so the two
  // processes never write the same cache — concurrent writers corrupt it and cause
  // recurring 404s / phantom "module not found" errors.
  distDir: process.env.NEXT_DIST_DIR || ".next",
};

export default nextConfig;
