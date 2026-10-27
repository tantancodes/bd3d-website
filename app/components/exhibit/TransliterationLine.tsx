import { tokenize, lookup, type Lexicon } from '@/lib/vocabulary';
import type { ExhibitState } from './useExhibitState';

type Props = {
  text: string;
  /** Unique prefix for word keys (entry id + fragment index). */
  keyPrefix: string;
  lexicon: Lexicon;
  state: Pick<ExhibitState, 'openWord' | 'toggleWord' | 'hoverWord'>;
};

/** A transliteration line whose words link to vocabulary entries when the spelling matches. */
export default function TransliterationLine({ text, keyPrefix, lexicon, state }: Props) {
  const tokens = tokenize(text);
  return (
    <p className="transliteration">
      {tokens.map((token, i) => {
        if (!token.word) return <span key={i}>{token.text}</span>;
        const entries = lookup(lexicon, token.text);
        if (!entries.length) return <span key={i}>{token.text}</span>;
        const key = `${keyPrefix}:${i}`;
        const open = state.openWord?.key === key;
        const entryIds = entries.map((e) => e.id);
        return (
          <button
            key={i}
            className="word"
            aria-expanded={open}
            aria-label={`${token.text}: show vocabulary`}
            onClick={() => state.toggleWord({ key, word: token.text, entryIds })}
            onMouseEnter={() => state.hoverWord(entryIds)}
            onMouseLeave={() => state.hoverWord(null)}
            onFocus={() => state.hoverWord(entryIds)}
            onBlur={() => state.hoverWord(null)}
          >
            {token.text}
          </button>
        );
      })}
    </p>
  );
}
