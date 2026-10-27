/**
 * BD3D emblem: an anthropoid coffin seen from the front, with the collar and the central
 * inscription column cut out. `drawn` renders the outline as a stroke for the intro.
 */
export const EMBLEM_OUTLINE =
  'M24 2C33.5 2 39 9.5 39 19c0 5 1.5 8 3 12 1.5 4 2 8 1.5 13L38.5 100c-.5 6-4 10-9.5 10H19c-5.5 0-9-4-9.5-10L4.5 44C4 39 4.5 35 6 31c1.5-4 3-7 3-12C9 9.5 14.5 2 24 2Z';
const COLLAR = 'M9.4 36.5C16 43.5 32 43.5 38.6 36.5l.3 3.6C32 47 16 47 9.1 40.1Z';
const COLUMN = 'M22.6 53h2.8v44h-2.8Z';

export default function Emblem({
  className,
  title,
  drawn = false,
}: {
  className?: string;
  title?: string;
  drawn?: boolean;
}) {
  return (
    <svg
      className={className}
      viewBox="0 0 48 112"
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      {drawn && <path className="emblem__stroke" d={EMBLEM_OUTLINE} pathLength={1} fill="none" />}
      <path
        className="emblem__fill"
        d={`${EMBLEM_OUTLINE}${COLLAR}${COLUMN}`}
        fillRule="evenodd"
        clipRule="evenodd"
      />
    </svg>
  );
}
