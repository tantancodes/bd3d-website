import { describe, expect, it } from 'vitest';
import { Matrix4, PerspectiveCamera, Quaternion, Vector2, Vector3 } from 'three';
import type { Region } from '@/lib/data/schema';
import { containsProjectedPoint, facesCamera, findRegionAt, regionCentroid } from './regions';

/** A 1 × 1 square in the z = 0 plane, recorded as seen from +z (direction points into it). */
function square(id: string, x = 0): Region {
  const c = [
    [x - 0.5, -0.5, 0],
    [x + 0.5, -0.5, 0],
    [x + 0.5, 0.5, 0],
    [x - 0.5, 0.5, 0],
  ];
  return {
    id,
    textId: 't',
    direction: [0, 0, -1],
    rotation: 0,
    dash: 4,
    lines: c.map((p, i) => [...p, ...c[(i + 1) % 4]]),
  };
}

function camera(z = 5) {
  const cam = new PerspectiveCamera(38, 1, 0.1, 100);
  cam.position.set(0, 0, z);
  cam.lookAt(0, 0, 0);
  cam.updateMatrixWorld();
  return cam;
}

const identity = new Matrix4();
const noRotation = new Quaternion();

describe('containsProjectedPoint', () => {
  it('hits the centre of a facing polygon', () => {
    expect(containsProjectedPoint(square('a'), new Vector2(0, 0), identity, camera())).toBe(true);
  });

  it('misses outside the polygon', () => {
    expect(containsProjectedPoint(square('a'), new Vector2(0.9, 0.9), identity, camera())).toBe(
      false,
    );
  });

  it('respects the display transform applied to region vertices', () => {
    const moved = new Matrix4().makeTranslation(3, 0, 0);
    expect(containsProjectedPoint(square('a'), new Vector2(0, 0), moved, camera())).toBe(false);
  });

  it('rejects regions behind the camera', () => {
    expect(containsProjectedPoint(square('a'), new Vector2(0, 0), identity, camera(-0.05))).toBe(
      false,
    );
  });
});

describe('picking', () => {
  it('only accepts surfaces facing the camera', () => {
    const front = camera(5);
    const back = camera(-5);
    expect(facesCamera(square('a'), noRotation, front.position, new Vector3())).toBe(true);
    expect(facesCamera(square('a'), noRotation, back.position, new Vector3())).toBe(false);
  });

  it('returns the region under the pointer', () => {
    const regions = [square('left', -1.2), square('right', 1.2)];
    const cam = camera();
    const pointer = new Vector3(1.2, 0, 0).project(cam);
    const hit = findRegionAt(
      regions,
      new Vector2(pointer.x, pointer.y),
      new Vector3(1.2, 0, 0),
      cam,
      identity,
      noRotation,
    );
    expect(hit?.id).toBe('right');
  });

  it('computes the centroid of the polygon', () => {
    expect(regionCentroid(square('a', 2), identity).toArray()).toEqual([2, 0, 0]);
  });
});

describe('hover picking', () => {
  it('finds a facing region without a mesh hit and ignores back faces', async () => {
    const { findRegionNear } = await import('./regions');
    const regions = [square('a')];
    expect(findRegionNear(regions, new Vector2(0, 0), camera(5), identity, noRotation)?.id).toBe(
      'a',
    );
    expect(
      findRegionNear(regions, new Vector2(0, 0), camera(-5), identity, noRotation),
    ).toBeUndefined();
  });
});
