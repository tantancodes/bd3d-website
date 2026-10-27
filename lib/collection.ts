export type Coffin = {
  slug: string;
  name: string;
  accession: string;
  museum: string;
  location: string;
  material: string;
  period: string;
  subtitle: string;
  description: string;
  source: string;
  color: string;
  /** Annotators credited by the source edition, in the edition's order. */
  annotators: string[];
};

const editionCredits = ['Rita Lucarelli', 'Kea Johnston', 'Mark-Jan Nederhof'];
export const collection: Coffin[] = [
  {
    slug: 'psamtikseneb',
    name: 'Psamtik-Seneb',
    accession: 'CMA 71.2254',
    museum: 'Chrysler Museum of Art',
    location: 'Norfolk, Virginia',
    material: 'Stone',
    period: '26th Dynasty',
    subtitle: 'Words for an eternal life',
    description:
      'Follow the inscriptions from the central columns to the sides of the coffin. Text, image, and the protection of the gods come together on its surface.',
    source: 'chrysler-museum-art-712254',
    color: '#d8c9b6',
    annotators: ['Rita Lucarelli', 'Kea Johnston', 'Matthew Whealton', 'Mark-Jan Nederhof'],
  },
  {
    slug: 'irethoreru',
    name: 'Irethoriru',
    accession: 'FAMSF 2002.2a–b',
    museum: 'Fine Arts Museums of San Francisco',
    location: 'San Francisco, California',
    material: 'Wood',
    period: 'Probably 30th Dynasty–early Ptolemaic',
    subtitle: 'A passage into the afterlife',
    description:
      'Explore Book of the Dead spell 72 and Pyramid Text 368 across the coffin’s inscribed columns. The original viewer uses the spelling Irethoreru.',
    source: 'fine-arts-museums-san-francisco-20022a-b',
    color: '#c5c6ba',
    annotators: editionCredits,
  },
  {
    slug: 'iwefaa2',
    name: 'Iwefaa',
    accession: 'PAHMA 6-19912',
    museum: 'Phoebe A. Hearst Museum of Anthropology',
    location: 'Berkeley, California',
    material: 'Wood',
    period: 'Ancient Egypt',
    subtitle: 'An image of protection',
    description:
      'A painted vignette and two lines of inscription connect image and text. Read passages combining Book of the Dead spells 51 and 52.',
    source: 'pahma-6-19912',
    color: '#d0b8a5',
    annotators: editionCredits,
  },
  {
    slug: 'anonymous1',
    name: 'An anonymous woman',
    accession: 'PAHMA 6-19927',
    museum: 'Phoebe A. Hearst Museum of Anthropology',
    location: 'Berkeley, California',
    material: 'Wood',
    period: 'Ptolemaic Period',
    subtitle: 'A story still being read',
    description:
      'Move around the coffin to discover inscriptions on the head, legs, basin, and feet. The source edition is a work in progress; the owner remains unidentified.',
    source: 'pahma-6-19927',
    color: '#bfc8c3',
    annotators: editionCredits,
  },
  {
    slug: 'amenirdis',
    name: 'Amenirdis',
    accession: 'PAHMA 5-1404c',
    museum: 'Phoebe A. Hearst Museum of Anthropology',
    location: 'Berkeley, California',
    material: 'Wood',
    period: 'Probably 25th–26th Dynasty',
    subtitle: 'A name, preserved',
    description:
      'Read the offering formula down the central inscription, ending with the owner’s title and name. Its linked region encompasses the full inscription strip.',
    source: 'pahma-5-1404c',
    color: '#cfbfac',
    annotators: editionCredits,
  },
  {
    slug: 'psamtik',
    name: 'Psamtik',
    accession: 'PAHMA 5-522',
    museum: 'Phoebe A. Hearst Museum of Anthropology',
    location: 'Berkeley, California',
    material: 'Stone',
    period: '26th Dynasty',
    subtitle: 'The physician’s monument',
    description:
      'This monumental sarcophagus lid belonged to a chief physician. Explore protective texts across its front, sides, and feet, and locate repeated words on the stone.',
    source: 'pahma-5-522',
    color: '#babbb4',
    annotators: editionCredits,
  },
];
export const getCoffin = (slug: string) => collection.find((coffin) => coffin.slug === slug);

/** "A, B & C" — the credit line format used in the reading panel. */
export function formatCredits(names: string[]): string {
  if (names.length < 2) return names.join('');
  return `${names.slice(0, -1).join(', ')} & ${names[names.length - 1]}`;
}
