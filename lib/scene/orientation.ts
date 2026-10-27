import { Box3, Matrix4, Quaternion, Vector3, type Object3D } from 'three';
import type { ModelSettings } from '@/lib/data/schema';

/** Longest side of every model after normalization, in scene units (not a physical measure). */
export const DISPLAY_SIZE = 4;

const X_AXIS = new Vector3(1, 0, 0);

/**
 * Orientation that reproduces the source edition's initial view: the recorded model
 * quaternion, preceded by the edition's tilt. Settings index 6 is the initial polar angle;
 * 15-value editions (Amenirdis) also record an initial tilt at index 13.
 */
export function sourceOrientation(model: ModelSettings): Quaternion {
  const tilt = model.settings.length === 15 ? 2 * model.settings[13] : 0;
  return new Quaternion()
    .setFromAxisAngle(X_AXIS, Math.PI * (tilt - model.settings[6]))
    .multiply(new Quaternion(...model.quaternion).normalize());
}

/** Centers a bounding box on the origin and scales its longest side to `size`. */
export function normalizationFor(box: Box3, size = DISPLAY_SIZE): Matrix4 {
  const extent = box.getSize(new Vector3());
  const scale = size / Math.max(extent.x, extent.y, extent.z);
  const center = box.getCenter(new Vector3()).multiplyScalar(-scale);
  return new Matrix4().compose(center, new Quaternion(), new Vector3(scale, scale, scale));
}

export type DisplayModel = {
  /** A transformed clone of the loaded object, ready to add to the scene. */
  scene: Object3D;
  /** Source model space → display space. Applied to region vertices as well as the mesh. */
  matrix: Matrix4;
  /** Rotation part of `matrix`, used for region directions. */
  orientation: Quaternion;
};

/**
 * Clones a loaded model and applies one shared transform (source orientation, then
 * centering and uniform scale) so the mesh and annotation coordinates stay aligned.
 */
export function prepareDisplayModel(object: Object3D, model: ModelSettings): DisplayModel {
  const scene = object.clone(true);
  const orientation = sourceOrientation(model);
  const rotation = new Matrix4().makeRotationFromQuaternion(orientation);
  scene.applyMatrix4(rotation);
  const normalization = normalizationFor(new Box3().setFromObject(scene));
  scene.applyMatrix4(normalization);
  return { scene, matrix: normalization.multiply(rotation), orientation };
}
