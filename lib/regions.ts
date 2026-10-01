import { Vector3 } from 'three';
import type { Region } from './collection';
/** Test in the source region's tangent plane, without changing source coordinates. */
export function containsSurfacePoint(region: Region, point: Vector3): boolean {
  const n = new Vector3(...region.direction).normalize();
  const u = new Vector3().crossVectors(n, Math.abs(n.y) < .9 ? new Vector3(0,1,0) : new Vector3(1,0,0)).normalize();
  const v = new Vector3().crossVectors(n,u);
  const points = region.lines.map(line=>new Vector3(line[0],line[1],line[2]));
  if (points.length < 3) return false;
  const center = points.reduce((sum,p)=>sum.add(p),new Vector3()).divideScalar(points.length);
  const radius = Math.max(...points.map(p=>p.distanceTo(center)));
  // Avoid selecting the opposite side of a closed object through its projected polygon.
  if (Math.abs(point.clone().sub(center).dot(n)) > Math.max(radius*.35,.025)) return false;
  const x=point.dot(u), y=point.dot(v);
  let inside=false;
  for(let i=0,j=points.length-1;i<points.length;j=i++) {
    const xi=points[i].dot(u), yi=points[i].dot(v), xj=points[j].dot(u), yj=points[j].dot(v);
    if((yi>y)!==(yj>y) && x<(xj-xi)*(y-yi)/(yj-yi)+xi) inside=!inside;
  }
  return inside;
}
