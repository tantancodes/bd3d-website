import Link from 'next/link';

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div>
        <Link href="/" className="wordmark" aria-label="BD3D home">
          BD<span>3D</span>
        </Link>
        <p>
          The Book of the Dead in 3D. A research interface for the UC Berkeley project, built on the
          annotation editions of Rita Lucarelli, Kea Johnston and Mark-Jan Nederhof.
        </p>
      </div>
      <nav aria-label="Footer">
        <Link href="/#collection">Collection</Link>
        <Link href="/search">Search</Link>
        <Link href="/research">Research and provenance</Link>
        <a href="https://3dcoffins.berkeley.edu/">Berkeley project ↗</a>
      </nav>
    </footer>
  );
}
