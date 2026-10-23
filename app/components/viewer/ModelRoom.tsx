'use client';
import { Suspense } from 'react';
import { Canvas, useLoader } from '@react-three/fiber';
import { CoffinLoader } from '@/lib/scene/loader';
import { CAMERA_FOV, HOME_POSITION } from '@/lib/scene/camera';
import CoffinScene, { modelUrl, type SceneProps } from './CoffinScene';
import ModelBoundary from './ModelBoundary';
import ModelLoading from './ModelLoading';

export type { CameraCommand } from '@/lib/scene/camera';

/** The WebGL viewing room: canvas, error boundary and loading state around the scene. */
export default function ModelRoom(props: SceneProps) {
  return (
    <ModelBoundary
      source={props.data.source}
      onRetry={() => useLoader.clear(CoffinLoader, modelUrl(props.data))}
    >
      <Canvas
        frameloop="demand"
        onCreated={({ gl }) => {
          gl.domElement.setAttribute('role', 'img');
          gl.domElement.setAttribute(
            'aria-label',
            'Interactive coffin model. Use the model controls and annotation buttons to explore without dragging.',
          );
        }}
        camera={{ position: HOME_POSITION.toArray(), fov: CAMERA_FOV }}
        dpr={[1, 1.5]}
        fallback={
          <div className="model-failure">
            3D requires WebGL. The inscriptions remain available in the reading panel.
          </div>
        }
        gl={{ antialias: true }}
      >
        <Suspense fallback={<ModelLoading />}>
          <CoffinScene {...props} />
        </Suspense>
      </Canvas>
    </ModelBoundary>
  );
}
