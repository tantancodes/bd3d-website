import type { Metadata, Viewport } from 'next';
import '@fontsource-variable/schibsted-grotesk';
import '@fontsource/ibm-plex-mono/400.css';
import '@fontsource/ibm-plex-mono/500.css';
import '@fontsource/noto-serif/400-italic.css';
import './styles/tokens.css';
import './styles/base.css';
import './styles/site.css';
import './styles/viewer.css';

const description =
  'Six ancient Egyptian coffins as interactive 3D models, with their inscriptions mapped to the surface and read in hieroglyphs, transliteration and translation.';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
  title: { default: 'BD3D · The Book of the Dead in 3D', template: '%s · BD3D' },
  description,
  openGraph: {
    title: 'BD3D · The Book of the Dead in 3D',
    description,
    type: 'website',
    images: ['/images/coffins/psamtikseneb.jpg'],
  },
};

export const viewport: Viewport = {
  themeColor: '#0e0f0e',
  colorScheme: 'dark',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
