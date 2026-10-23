import { describe, expect, it } from 'vitest';
import { Box3, BoxGeometry, Mesh, Vector3 } from 'three';
import {
  DISPLAY_SIZE,
  normalizationFor,
  prepareDisplayModel,
  sourceOrientation,
} from './orientation';

const settings14 = [0, 0, 0, 0, 0, 0, 0.5, 0, 0, 0, 0, 0, 0, 0];

describe('sourceOrientation', () => {
  it('applies the recorded polar tilt about the x axis', () => {
    const q = sourceOrientation({ name: 'm', quaternion: [0, 0, 0, 1], settings: settings14 });
    // PI * (0 - 0.5): a quarter turn about x, so +y maps to -z.
    const up = new Vector3(0, 1, 0).applyQuaternion(q);
    expect(up.z).toBeCloseTo(-1);
  });

  it('adds the extra initial tilt stored by 15-value editions', () => {
    const q = sourceOrientation({
      name: 'm',
      quaternion: [0, 0, 0, 1],
      settings: [...settings14, 0].map((v, i) => (i === 13 ? 0.25 : v)),
    });
    // tilt = PI * (2 * 0.25 - 0.5) = 0 → identity
    expect(new Vector3(0, 1, 0).applyQuaternion(q).y).toBeCloseTo(1);
  });
});

describe('display normalization', () => {
  it('centres the model and scales its longest side to the display size', () => {
    const box = new Box3(new Vector3(10, 0, 0), new Vector3(12, 1, 0.5));
    const m = normalizationFor(box);
    const min = box.min.clone().applyMatrix4(m);
    const max = box.max.clone().applyMatrix4(m);
    expect(max.x - min.x).toBeCloseTo(DISPLAY_SIZE);
    expect((max.x + min.x) / 2).toBeCloseTo(0);
  });

  it('transforms mesh and region coordinates with the same matrix', () => {
    const mesh = new Mesh(new BoxGeometry(2, 4, 1));
    mesh.position.set(5, 5, 5);
    mesh.updateMatrixWorld();
    const corner = new Vector3(6, 7, 5.5); // a vertex of the box in source space
    const display = prepareDisplayModel(mesh, {
      name: 'm',
      quaternion: [0, 0, 0, 1],
      settings: settings14.map(() => 0),
    });
    const box = new Box3().setFromObject(display.scene);
    const mapped = corner.applyMatrix4(display.matrix);
    expect(box.containsPoint(mapped.clone().multiplyScalar(0.999))).toBe(true);
    expect(Math.max(...box.getSize(new Vector3()).toArray())).toBeCloseTo(DISPLAY_SIZE);
  });
});
