import { Html } from '@react-three/drei';

/** Shown inside the canvas while geometry and every texture are loading. */
export default function ModelLoading() {
  return (
    <Html center>
      <div className="model-loading" role="status">
        <span className="loading-ring" />
        <p>Bringing the object into view</p>
        <small>Loading geometry and textures</small>
      </div>
    </Html>
  );
}
