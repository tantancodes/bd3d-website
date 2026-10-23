import { describe, expect, it } from 'vitest';
import { LIGHTING_PRESETS, clampLight, lightDirection, presetFor } from './lighting';

describe('lightDirection', () => {
  it('points right at azimuth 0 and grazes at low elevation', () => {
    const d = lightDirection({ azimuth: 0, elevation: 5 });
    expect(d.x).toBeGreaterThan(0.99);
    expect(d.z).toBeCloseTo(Math.sin((5 * Math.PI) / 180));
  });
  it('comes from the viewer at 90° elevation', () => {
    expect(lightDirection({ azimuth: 123, elevation: 90 }).z).toBeCloseTo(1);
  });
  it('is a unit vector', () => {
    expect(lightDirection({ azimuth: 200, elevation: 33 }).length()).toBeCloseTo(1);
  });
});

describe('clampLight', () => {
  it('wraps azimuth and limits elevation', () => {
    expect(clampLight({ azimuth: -90, elevation: 0 })).toEqual({ azimuth: 270, elevation: 5 });
    expect(clampLight({ azimuth: 725, elevation: 120 })).toEqual({ azimuth: 5, elevation: 90 });
  });
});

describe('presetFor', () => {
  it('recognises presets and returns nothing for custom angles', () => {
    expect(presetFor(LIGHTING_PRESETS[1].mode)?.id).toBe('left');
    expect(presetFor({ kind: 'raking', azimuth: 31, elevation: 17 })).toBeUndefined();
  });
});
