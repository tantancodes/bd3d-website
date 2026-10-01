import { Vector2, Vector3, type Camera, type Matrix4 } from 'three';
import type { Region } from './collection';
/** Match the source viewer's nonzero screen-space polygon hit test.
 * No synthetic regions, tangent-plane fitting, or distance tolerance is introduced.
 */
export function containsProjectedPoint(region: Region, pointer: Vector2, matrix: Matrix4, camera: Camera): boolean {
  const points = [region.lines[0]?.slice(0,3), ...region.lines.map(line => line.slice(3,6))]
    .filter((p): p is number[] => !!p)
    .map(p => new Vector3(p[0],p[1],p[2]).applyMatrix4(matrix).project(camera));
  if (points.length < 4 || points.some(p=>p.z < -1 || p.z > 1)) return false;
  let winding=0;
  for(let i=0;i<points.length;i++) {
    const a=points[i], b=points[(i+1)%points.length];
    const side=(b.x-a.x)*(pointer.y-a.y)-(pointer.x-a.x)*(b.y-a.y);
    if(a.y<=pointer.y && b.y>pointer.y && side>0) winding++;
    if(a.y>pointer.y && b.y<=pointer.y && side<0) winding--;
  }
  return winding!==0;
}
