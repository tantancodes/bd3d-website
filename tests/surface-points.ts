import {readFileSync} from 'node:fs';
import {Box3,Matrix4,PerspectiveCamera,Quaternion,Raycaster,Vector2,Vector3} from 'three';
import {OBJLoader} from 'three/examples/jsm/loaders/OBJLoader.js';
import type {CoffinData} from '../lib/collection';
/** Independent test projection from the imported source mesh and source polygon vertices. */
export function surfaceTarget(slug:string,width:number,height:number){
 const data: CoffinData=JSON.parse(readFileSync(`data/coffins/${slug}.json`,'utf8'));
 const object=new OBJLoader().parse(readFileSync(`public/models/${slug}/${data.model.name}.obj`,'utf8'));
 const rotation=new Quaternion().setFromAxisAngle(new Vector3(1,0,0),Math.PI*((data.model.settings.length===15 ? 2*data.model.settings[13] : 0)-data.model.settings[6])).multiply(new Quaternion(...data.model.quaternion).normalize());
 object.quaternion.copy(rotation);const box=new Box3().setFromObject(object),size=box.getSize(new Vector3()),center=box.getCenter(new Vector3()),scale=4/Math.max(size.x,size.y,size.z);
 object.position.copy(center).multiplyScalar(-scale);object.scale.setScalar(scale);object.updateMatrixWorld(true);
 const transform=new Matrix4().compose(object.position,rotation,object.scale);
 const camera=new PerspectiveCamera(38,width/height,.1,1000);camera.position.set(0,0,7.3);camera.lookAt(0,0,0);camera.updateMatrixWorld(true);
 const inscriptions=new Set(data.annotations.filter(a=>a.kind==='inscription').map(a=>a.id));
 const regions=data.areas.filter(a=>inscriptions.has(a.textId));
 const ray=new Raycaster();
 for(const region of regions){
  if(new Vector3(...region.direction).applyQuaternion(rotation).dot(new Vector3(0,0,-1))<=0)continue;
  const vertices=region.lines.map(l=>new Vector3(l[0],l[1],l[2]).applyMatrix4(transform));
  const middle=vertices.reduce((a,b)=>a.add(b),new Vector3()).divideScalar(vertices.length);
  const ndc=middle.clone().project(camera);ray.setFromCamera(new Vector2(ndc.x,ndc.y),camera);
  if(!ray.intersectObject(object,true).length)continue;
  if(Math.abs(ndc.x)>.9||Math.abs(ndc.y)>.7)continue;
  return {x:(ndc.x+1)/2*width,y:(1-ndc.y)/2*height,id:region.textId};
 }
 throw new Error(`No front-facing source region for ${slug}`);
}
