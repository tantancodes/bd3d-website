import { describe, expect, it } from 'vitest';
import { autoQuality, resolveQuality } from './quality';

describe('autoQuality', () => {
  it('uses full resolution on a capable desktop', () => {
    expect(autoQuality({ coarsePointer: false, deviceMemory: 16, maxTextureSize: 16384 })).toBe(
      'high',
    );
  });
  it('treats missing hints (Safari, Firefox) as capable on desktop', () => {
    expect(autoQuality({ coarsePointer: false })).toBe('high');
  });
  it('uses standard textures on touch devices', () => {
    expect(autoQuality({ coarsePointer: true, maxTextureSize: 16384 })).toBe('standard');
  });
  it('respects hard texture-size limits', () => {
    expect(autoQuality({ maxTextureSize: 2048 })).toBe('standard');
    expect(autoQuality({ maxTextureSize: 1024 })).toBe('low');
  });
  it('drops to low for data saver and very low memory', () => {
    expect(autoQuality({ saveData: true })).toBe('low');
    expect(autoQuality({ deviceMemory: 2 })).toBe('low');
  });
  it('lets an explicit setting override detection', () => {
    expect(resolveQuality('low', { deviceMemory: 32 })).toBe('low');
    expect(resolveQuality('auto', { coarsePointer: true })).toBe('standard');
  });
});
