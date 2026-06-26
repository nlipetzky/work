import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';

export const metadata: Metadata = { title: 'Canon Studio' };

const NAV = [
  { href: '/', label: 'Overview' },
  { href: '/clusters', label: 'Clusters' },
  { href: '/search', label: 'Search' },
  { href: '/docs', label: 'Docs' },
  { href: '/ingest', label: 'Ingest' },
  { href: '/usage', label: 'Usage' },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen flex">
          <nav className="w-44 shrink-0 border-r border-gray-800 p-4 flex flex-col gap-1">
            <div className="text-xs text-gray-500 uppercase tracking-widest mb-4">Canon Studio</div>
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block px-2 py-1 rounded hover:bg-gray-800 text-gray-300 hover:text-white transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <main className="flex-1 p-6 overflow-auto">{children}</main>
        </div>
      </body>
    </html>
  );
}
