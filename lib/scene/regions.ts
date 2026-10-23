import { Vector3, type Camera, type Matrix4, type Quaternion, type Vector2 } from 'three';
import type { Region } from '@/lib/data/schema';

/** Ordered polygon vertices of a region (first edge's start, then every edge's end). */
export function regionPolygon(region: Region): Vector3[] {
  const first = region.lines[0];
  if (!first) return [];
  return [
    new Vector3(first[0], first[1], first[2]),
    ...region.lines.map((edge) => new Vector3(edge[3], edge[4], edge[5])),
  ];
}

/**
 * Screen-space hit test ported from the source viewer: projects the region polygon and
 * applies the nonzero winding rule to the pointer (normalized device coordinates).
 * No synthetic regions, tangent-plane fitting, or distance tolerance is introduced.
 */
export function containsProjectedPoint(
  region: Region,
  pointer: Vector2,
  matrix: Matrix4,
  camera: Camera,
): boolean {
  const points = regionPolygon(region).map((p) => p.applyMatrix4(matrix).project(camera));
  if (points.length < 4 || points.some((p) => p.z < -1 || p.z > 1)) return false;
  let winding = 0;
  for (let i = 0; i < points.length; i++) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    const side = (b.x - a.x) * (pointer.y - a.y) - (pointer.x - a.x) * (b.y - a.y);
    if (a.y <= pointer.y && b.y > pointer.y && side > 0) winding++;
    if (a.y > pointer.y && b.y <= pointer.y && side < 0) winding--;
  }
  return winding !== 0;
}

/** Outward surface normal of a region in display space (the recorded direction points inward). */
export function regionNormal(region: Region, orientation: Quaternion): Vector3 {
  return new Vector3(...region.direction).applyQuaternion(orientation).negate();
}

/** True when the surface at `point` faces the camera, so back-facing regions are not picked. */
export function facesCamera(
  region: Region,
  orientation: Quaternion,
  cameraPosition: Vector3,
  point: Vector3,
): boolean {
  return regionNormal(region, orientation).dot(cameraPosition.clone().sub(point)) > 0;
}

/**
 * First region under the pointer that faces the camera, or `undefined`.
 * `point` is the mesh intersection, used only for the facing test.
 */
export function findRegionAt(
  regions: Region[],
  pointer: Vector2,
  point: Vector3,
  camera: Camera,
  matrix: Matrix4,
  orientation: Quaternion,
): Region | undefined {
  return regions.find(
    (region) =>
      facesCamera(region, orientation, camera.position, point) &&
      containsProjectedPoint(region, pointer, matrix, camera),
  );
}

/**
 * Line-segment pairs for drawing a region outline in display space, lifted slightly off
 * the surface along its normal so the outline does not z-fight with the mesh.
 */
export function regionOutlineSegments(
  region: Region,
  matrix: Matrix4,
  orientation: Quaternion,
  lift = 0.006,
): Vector3[] {
  const offset = regionNormal(region, orientation).multiplyScalar(lift);
  return region.lines.flatMap((edge) => [
    new Vector3(edge[0], edge[1], edge[2]).applyMatrix4(matrix).add(offset),
    new Vector3(edge[3], edge[4], edge[5]).applyMatrix4(matrix).add(offset),
  ]);
}

/** Centroid of a region's edge start points in display space. */
export function regionCentroid(region: Region, matrix: Matrix4): Vector3 {
  return region.lines
    .reduce((sum, edge) => sum.add(new Vector3(edge[0], edge[1], edge[2])), new Vector3())
    .divideScalar(region.lines.length)
    .applyMatrix4(matrix);
}
