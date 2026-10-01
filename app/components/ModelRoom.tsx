'use client';
import { Suspense, useEffect, useMemo, useRef, Component, type ReactNode } from 'react';
import { Canvas, useFrame, useLoader, useThree, type ThreeEvent } from '@react-three/fiber';
import { Html, Line, OrbitControls, useProgress } from '@react-three/drei';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader.js';
import { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { Box3, Matrix4, Quaternion, Vector3 } from 'three';
import type { CoffinData, Region } from '@/lib/collection';
import { containsSurfacePoint } from '@/lib/regions';
export type CameraCommand = { kind: 'reset'|'in'|'out'|'left'|'right'; serial: number };
type Props = { data: CoffinData; regions: Region[]; selected: string|null; onSelect: (id:string)=>void; command: CameraCommand; reduced: boolean; showRegions: boolean; };
function Loading() { const {progress}=useProgress(); return <Html center><div className="model-loading" role="status"><span className="loading-ring"/><p>Bringing the object into view</p><small>{Math.round(progress)}%</small></div></Html>; }
class ModelBoundary extends Component<{children:ReactNode; source:string}, {failed:boolean}> {
  state={failed:false};
  static getDerivedStateFromError(){return {failed:true};}
  render(){return this.state.failed ? <div className="model-failure"><h3>The model could not load.</h3><p>You can still read the inscriptions in the panel.</p><button onClick={()=>this.setState({failed:false})}>Try again</button><a href={this.props.source}>Open the original viewer ↗</a></div> : this.props.children;}
}
function Scene({data,regions,selected,onSelect,command,reduced,showRegions}:Props) {
  const base=`/models/${data.slug}/${data.model.name}`;
  const materials=useLoader(MTLLoader,`${base}.mtl`);
  const object=useLoader(OBJLoader,`${base}.obj`,loader=>{materials.preload();loader.setMaterials(materials);});
  const {scene,matrix,quaternion}=useMemo(()=>{
    const scene=object.clone(true);
    const quaternion=new Quaternion(...data.model.quaternion).normalize();
    const rotation=new Matrix4().makeRotationFromQuaternion(quaternion);
    scene.applyMatrix4(rotation);
    const box=new Box3().setFromObject(scene), size=box.getSize(new Vector3()), center=box.getCenter(new Vector3());
    const scale=4/Math.max(size.x,size.y,size.z);
    const normalization=new Matrix4().compose(center.multiplyScalar(-scale),new Quaternion(),new Vector3(scale,scale,scale));
    scene.applyMatrix4(normalization);
    return {scene,matrix:normalization.multiply(rotation),quaternion};
  },[object,data.model.quaternion]);
  const controls=useRef<OrbitControlsImpl>(null);
  const flight=useRef<{position:Vector3;target:Vector3}|null>(null);
  const {camera}=useThree();
  const active=data.areas.find(a=>a.id===selected);
  useEffect(()=>{
    if(!active) return;
    const target=active.lines.reduce((sum,l)=>sum.add(new Vector3(l[0],l[1],l[2])),new Vector3()).divideScalar(active.lines.length).applyMatrix4(matrix);
    const direction=new Vector3(...active.direction).applyQuaternion(quaternion).normalize().negate();
    flight.current={target,position:target.clone().addScaledVector(direction,3.4)};
  },[active,matrix,quaternion]);
  useEffect(()=>{
    if(!controls.current) return;
    const target=controls.current.target.clone();
    const offset=camera.position.clone().sub(target);
    if(command.kind==='reset') flight.current={position:new Vector3(0,0,7.3),target:new Vector3()};
    else if(command.kind==='left'||command.kind==='right') flight.current={position:target.clone().add(offset.applyAxisAngle(new Vector3(0,1,0),command.kind==='left' ? -.35:.35)),target};
    else flight.current={position:target.clone().add(offset.setLength(Math.min(14,Math.max(1,offset.length()*(command.kind==='in' ? .8:1.25))))),target};
  },[command,camera]);
  useFrame((_,dt)=>{
    if(!flight.current||!controls.current) return;
    const amount=reduced ? 1 : 1-Math.exp(-dt*6);
    camera.position.lerp(flight.current.position,amount);
    controls.current.target.lerp(flight.current.target,amount);
    controls.current.update();
    if(camera.position.distanceTo(flight.current.position)<.001) flight.current=null;
  });
  function pick(event:ThreeEvent<MouseEvent>){
    if(event.delta>5 || !showRegions) return;
    const point=event.point.clone().applyMatrix4(matrix.clone().invert());
    const match=regions.find(region=>{
      const normal=new Vector3(...region.direction).applyQuaternion(quaternion).negate();
      return normal.dot(camera.position.clone().sub(event.point))>0 && containsSurfacePoint(region,point);
    });
    if(match){event.stopPropagation();onSelect(match.id);}
  }
  return <><ambientLight intensity={1.6}/><directionalLight position={[3,5,6]} intensity={2}/><directionalLight position={[-4,0,2]} intensity={.5}/>
    <primitive object={scene} onClick={pick}/>
    {showRegions && regions.map(region=>{
      const offset=new Vector3(...region.direction).applyQuaternion(quaternion).multiplyScalar(-.006);
      const points=region.lines.flatMap(l=>[new Vector3(l[0],l[1],l[2]).applyMatrix4(matrix).add(offset),new Vector3(l[3],l[4],l[5]).applyMatrix4(matrix).add(offset)]);
      return <Line key={region.id} points={points} segments color={selected===region.id?'#f5c979':'#c4b090'} lineWidth={selected===region.id?3:1} transparent opacity={selected===region.id?1:.45}/>;
    })}
    <OrbitControls ref={controls} makeDefault enableDamping minDistance={1} maxDistance={14} onStart={()=>{flight.current=null;}}/>
  </>;
}
export default function ModelRoom(props:Props){return <ModelBoundary source={props.data.source}><Canvas camera={{position:[0,0,7.3],fov:38}} dpr={[1,1.5]} fallback={<div className="model-failure">3D requires WebGL. The inscriptions remain available in the reading panel.</div>} gl={{antialias:true}}><Suspense fallback={<Loading/>}><Scene {...props}/></Suspense></Canvas></ModelBoundary>;}
