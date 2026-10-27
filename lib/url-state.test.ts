import { describe, expect, it } from 'vitest';
import { parseViewerLink, serializeViewerLink } from './url-state';

const regions = new Set(['text:center', 'lex10:0']);

describe('viewer links', () => {
  it('round-trips a region and raking light', () => {
    const query = serializeViewerLink({
      region: 'text:center',
      light: { azimuth: 180, elevation: 12 },
    });
    expect(query).toBe('?region=text%3Acenter&light=180%2C12');
    expect(parseViewerLink(query, regions)).toEqual({
      region: 'text:center',
      light: { azimuth: 180, elevation: 12 },
    });
  });
  it('drops unknown regions and malformed values', () => {
    expect(parseViewerLink('?region=nope&view=sideways&light=a,b', regions)).toEqual({});
  });
  it('keeps a named view when no region is selected', () => {
    expect(parseViewerLink('?view=back', regions)).toEqual({ view: 'back' });
    expect(serializeViewerLink({ view: 'back' })).toBe('?view=back');
  });
  it('clamps light angles', () => {
    expect(parseViewerLink('?light=400,0', regions).light).toEqual({ azimuth: 40, elevation: 5 });
  });
  it('is empty for the default state', () => expect(serializeViewerLink({})).toBe(''));
});
