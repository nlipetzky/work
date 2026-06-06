import type { Metadata } from "next";
import "./globals.css";
import Nav from "@/components/Nav";

export const metadata: Metadata = {
  title: "Projection — RevOps Engine",
  description: "Trust surface over revops-engine-dev",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-mono">
        <div className="flex h-screen w-screen overflow-hidden">
          <aside className="w-56 shrink-0 border-r border-ink-700 bg-ink-850">
            <Nav />
          </aside>
          <main className="flex-1 overflow-hidden">{children}</main>
        </div>
      </body>
    </html>
  );
}
