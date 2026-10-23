import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { collection } from '@/lib/collection';
import { displayAssets, downloadSize } from '@/lib/data/display-assets';
import SiteHeader from '../components/site/SiteHeader';
import SiteFooter from '../components/site/SiteFooter';

export const metadata: Metadata = {
  title: 'Research and provenance',
  description:
    'The sources, annotation method, collections, transformations and editorial limits behind six digital coffin exhibits.',
};

const editions = 'https://sites.cs.st-andrews.ac.uk/people/mn31/egyptian/coffins/';
const mb = (bytes: number) => `${(bytes / 1048576).toFixed(1)} MB`;

export default function Research() {
  return (
    <>
      <a className="skip-link" href="#research">
        Skip to research
      </a>
      <SiteHeader current="research" />
      <main id="research" className="research-page">
        <header className="page-intro">
          <p className="eyebrow">Research and provenance</p>
          <h1>Where everything on this site comes from</h1>
          <p>
            A digital view of an object should keep the relationship between its surface and its
            scholarship. This page sets out the sources, what was changed for the web, and what
            remains open.
          </p>
        </header>

        <section className="prose-section" aria-labelledby="purpose">
          <h2 id="purpose">Purpose</h2>
          <div className="prose">
            <p>
              The Berkeley Book of the Dead in 3D project studies how inscriptions relate to their
              positions on Egyptian coffins. Its annotated models let readers meet each text on the
              surface that carries it.
            </p>
            <p>
              This interface presents six published models with their annotation editions. It is a
              reading tool, not a new critical edition or a replacement for the collection records.
            </p>
            <a className="text-link" href="https://3dcoffins.berkeley.edu/">
              The Berkeley project <ArrowUpRight size={14} aria-hidden="true" />
            </a>
          </div>
        </section>

        <section className="prose-section" aria-labelledby="method">
          <h2 id="method">Method</h2>
          <div className="prose">
            <p>
              Mark-Jan Nederhof’s published viewers associate three-dimensional surface boundaries
              with text identifiers. An inscription, interpretive note or vocabulary entry can refer
              to one region or to several locations on the same object.
            </p>
            <p>
              Selecting an outlined surface opens its linked entry; selecting an entry moves the
              camera to its recorded region and viewing direction. Location arrows step through
              repeated occurrences without duplicating readings.
            </p>
            <p>
              Transcriptions, transliterations and translations keep the published edition’s
              content. Most hieroglyphs are drawn by Nederhof’s ResLite renderer; Amenirdis uses the
              source’s Unicode transcription and composed font.
            </p>
            <p>
              Words in a transliteration link to the edition’s vocabulary only when the spelling
              matches a headword exactly (or its stem before a suffix pronoun, as in pr=f → pr). The
              editions do not align English words with Egyptian ones, so no such alignment is shown.
            </p>
            <p className="citation">
              Rita Lucarelli and Mark-Jan Nederhof, “Digitizing and Annotating Ancient Egyptian
              Coffins: The Book of the Dead in 3D” (2023).{' '}
              <a href="https://doi.org/10.1163/9789004501294_011">
                Read the methodology <ArrowUpRight size={13} aria-hidden="true" />
              </a>
            </p>
          </div>
        </section>

        <section className="prose-section" aria-labelledby="sources">
          <h2 id="sources">The objects</h2>
          <div>
            <p className="prose">
              Each exhibit links to its collection record and to the published annotation edition.
              Names and accession numbers follow the Berkeley records; the source URL for Irethoriru
              keeps the spelling “Irethoreru.”
            </p>
            <div className="source-list">
              {collection.map((c, i) => (
                <article key={c.slug}>
                  <span className="mono">{String(i + 1).padStart(2, '0')}</span>
                  <div>
                    <h3>{c.name}</h3>
                    <p>
                      {c.museum}
                      <br />
                      <span className="mono">{c.accession}</span>
                    </p>
                  </div>
                  <div className="source-links">
                    <a href={`https://3dcoffins.berkeley.edu/coffins/${c.source}`}>
                      Collection record ↗
                    </a>
                    <a href={`${editions}${c.slug}/`}>Annotation edition ↗</a>
                    <Link href={`/exhibits/${c.slug}`} prefetch={false}>
                      Open exhibit →
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="prose-section" aria-labelledby="changes">
          <h2 id="changes">What was changed for the web</h2>
          <div className="prose">
            <p>
              The source OBJ geometry, material files and 4096-pixel textures were copied from the
              published St Andrews viewers and are kept unchanged in the repository, with their
              SHA-256 checksums in the import manifest.
            </p>
            <p>
              For display, each model is converted to a compressed glTF file. Identical vertices are
              merged (none are moved), positions and texture coordinates are stored at 16-bit
              precision, which is finer than one ten-thousandth of the object’s length, and the
              result is compressed with meshoptimizer. Two models whose OBJ files contain no normals
              (Iwefaa and Psamtik) receive smooth normals computed from their own geometry. No
              simplification, smoothing of positions, repainting or reconstruction was done.
            </p>
            <p>
              Textures are offered at 1024 and 2048 pixels as WebP reductions of the originals; the
              full-resolution option serves the original JPEG files. A small version loads first so
              the object appears quickly, and the device’s capability decides the final resolution
              unless the reader chooses one.
            </p>
            <table className="data-table">
              <caption>Download for each object, geometry plus textures</caption>
              <thead>
                <tr>
                  <th scope="col">Object</th>
                  <th scope="col">Preview</th>
                  <th scope="col">Standard</th>
                  <th scope="col">Full resolution</th>
                </tr>
              </thead>
              <tbody>
                {collection.map((c) => {
                  const a = displayAssets(c.slug)!;
                  return (
                    <tr key={c.slug}>
                      <th scope="row">{c.name}</th>
                      <td>{mb(downloadSize(a, 1024))}</td>
                      <td>{mb(downloadSize(a, 2048))}</td>
                      <td>{mb(downloadSize(a, 4096))}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <p>
              Models and annotation coordinates receive the same rotation, centring and uniform
              scale. The longest side of every object is shown at the same size; display units are
              not metres, so the viewer offers no measuring tools.
            </p>
            <p>
              Lighting is physically based: a neutral studio environment and directional lights,
              with tone mapping chosen to keep the photographed colours. The raking-light tool moves
              a single light across the scanned geometry. On these models fine carving is recorded
              in the photographs rather than in the mesh, so raking light shows form and relief, not
              individual signs. No surface detail is inferred from the photographs.
            </p>
          </div>
        </section>

        <section className="prose-section" aria-labelledby="limits">
          <h2 id="limits">Read with the source edition</h2>
          <div className="prose">
            <ul>
              <li>
                Coverage varies. Some regions mark a whole inscription rather than individual signs.
              </li>
              <li>
                Iwefaa’s unlinked “face” region is omitted from selection. No annotation was
                invented for it.
              </li>
              <li>
                Amenirdis and the anonymous coffin have no vocabulary entries in these editions.
              </li>
              <li>
                The anonymous coffin has conflicting labels in its source metadata. This interface
                follows the collection’s anonymous identification.
              </li>
              <li>
                The source’s word-level grammatical popups and critical apparatus are not
                reproduced. Consult the linked edition for those.
              </li>
            </ul>
            <p>
              Mechanical checks confirm the imported coordinates, links and file checksums. An
              Egyptologist should review readings, identifications, transliteration fidelity and the
              meaning of each mapped region.
            </p>
            <h3>Data that would extend the viewer</h3>
            <ul>
              <li>
                High-resolution photogrammetry meshes, from which normal maps could be baked so
                raking light reveals carved signs.
              </li>
              <li>The physical units of each model, to enable measurement.</li>
              <li>Word-level alignment between transliterations and translations.</li>
            </ul>
          </div>
        </section>

        <section className="prose-section" aria-labelledby="credits">
          <h2 id="credits">Credits</h2>
          <div className="prose">
            <p>
              The source editions credit Rita Lucarelli, Kea Johnston and Mark-Jan Nederhof; the
              Psamtik-Seneb edition also credits Matthew Whealton. The models are hosted by the
              University of St Andrews for the Berkeley project.
            </p>
            <p>
              Collection photographs: © Chrysler Museum of Art (2019); © Fine Arts Museums of San
              Francisco (2018); © Phoebe A. Hearst Museum of Anthropology (2017), as stated in the
              respective collection records. Original assets and scholarly content remain
              attributable to their creators and collections; this interface grants no new reuse
              rights.
            </p>
            <a
              className="text-link"
              href="https://drive.google.com/drive/folders/1APjH-mKpCwxDnktbaL-gCNNBxqhYk5Rj"
            >
              Provided authoring resources <ArrowUpRight size={14} aria-hidden="true" />
            </a>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
