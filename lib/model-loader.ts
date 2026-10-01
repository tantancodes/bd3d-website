import { Loader, LoadingManager, type Group } from 'three';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
/** Resolve only after geometry AND every referenced texture have loaded. */
export class CoffinLoader extends Loader<Group> {
  load(base: string, onLoad: (object: Group)=>void, onProgress?: (event: ProgressEvent)=>void, onError?: (error: unknown)=>void) {
    let object: Group | undefined, failed=false;
    const manager=new LoadingManager();
    manager.onLoad=()=>{if(object&&!failed)onLoad(object);};
    const fail=(error:unknown)=>{if(!failed){failed=true;onError?.(error instanceof Error?error:new Error(`Could not load coffin asset: ${String(error)}`));}};
    manager.onError=fail;
    new MTLLoader(manager).load(`${base}.mtl`,materials=>{
      materials.preload();
      new OBJLoader(manager).setMaterials(materials).load(`${base}.obj`,model=>{object=model;},onProgress,fail);
    },onProgress,fail);
  }
}
