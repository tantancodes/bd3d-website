import Link from 'next/link';
import SiteHeader from './components/site/SiteHeader';
import SiteFooter from './components/site/SiteFooter';

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main className="page-intro page-intro--center">
        <p className="eyebrow">404</p>
        <h1>This object is not in the collection.</h1>
        <p>The link may be mistyped, or the object may have moved.</p>
        <Link className="button button--primary" href="/#collection">
          Browse the collection
        </Link>
      </main>
      <SiteFooter />
    </>
  );
}
