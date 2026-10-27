import Link from 'next/link';

const LINKS = [
  { href: '/#collection', label: 'Collection' },
  { href: '/search', label: 'Search' },
  { href: '/research', label: 'Research' },
];

/** Header for the collection, search and research pages. */
export default function SiteHeader({ current }: { current?: 'search' | 'research' }) {
  return (
    <header className="site-header">
      <Link href="/" className="wordmark" aria-label="BD3D home">
        BD<span>3D</span>
      </Link>
      <nav aria-label="Main">
        {LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            aria-current={current && link.href === `/${current}` ? 'page' : undefined}
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
