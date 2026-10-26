import { Fragment } from 'react';

/**
 * Words fade in one after another, sharpening from a slight blur (a text-generate effect
 * in CSS). The full sentence stays in the accessibility tree as ordinary text.
 */
export default function RevealText({ text, step = 0.07 }: { text: string; step?: number }) {
  const words = text.split(' ');
  return (
    <>
      {words.map((word, i) => (
        <Fragment key={i}>
          <span
            className="reveal-word"
            style={{ '--i': i, '--step': `${step}s` } as React.CSSProperties}
          >
            {word}
          </span>
          {i < words.length - 1 ? ' ' : null}
        </Fragment>
      ))}
    </>
  );
}
