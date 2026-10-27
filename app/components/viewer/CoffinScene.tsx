'use client';
import { memo, useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { ContactShadows, Html, OrbitControls } from '@react-three/drei';
import { Box3, Sphere, Vector2, type Group, type Mesh } from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import type { CoffinData, Region } from '@/lib/data/schema';
import { prepareDisplayModel } from '@/lib/scene/orientation';
import { findRegionAt, findRegionNear, regionCentroid } from '@/lib/scene/regions';
import { MAX_DISTANCE, MIN_DISTANCE, type CameraCommand } from '@/lib/scene/camera';
import type { LightingMode } from '@/lib/scene/lighting';
import RegionOverlay, { type RegionStates } from './RegionOverlay';
import StageLighting from './StageLighting';
import { useCameraFlight } from './useCameraFlight';

export type SceneProps = {
  data: CoffinData;
  /** Regions that respond to hover and click (filtered by the reading panel). */
  pickable: Region[];
  /** Regions to outline: pickable ones plus any highlighted elsewhere. */
  outlined: Region[];
  states: RegionStates;
  showRegions: boolean;
  /** Text shown next to the hovered region. */
  labelFor: (regionId: string) => string | undefined;
  focusSerial: number;
  command: CameraCommand;
  reduced: boolean;
  lighting: LightingMode;
  /** Anisotropic filtering requested for new textures (applied by the loader). */
  anisotropy: number;
  shadows: boolean;
  onSelect: (regionId: string) => void;
  onHover: (regionId: string | null) => void;
};

/** Pointer travel (px) beyond which a click is treated as the end of a drag. */
const CLICK_TOLERANCE = 5;

function CoffinScene({
  object,
  version,
  data,
  pickable,
  outlined,
  states,
  showRegions,
  labelFor,
  focusSerial,
  command,
  reduced,
  lighting,
  shadows,
  onSelect,
  onHover,
}: SceneProps & { object: Group; version: number }) {
  const { camera, gl, invalidate } = useThree();
  const display = useMemo(() => prepareDisplayModel(object, data.model), [object, data.model]);
  const bounds = useMemo(() => {
    const box = new Box3().setFromObject(display.scene);
    return { floor: box.min.y, radius: box.getBoundingSphere(new Sphere()).radius };
  }, [display]);

  // Shadow flags. Texture filtering is set when textures are created (see model-assets),
  // because changing it afterwards would re-upload every texture to the GPU.
  useEffect(() => {
    display.scene.traverse((child) => {
      const mesh = child as Mesh;
      if (!mesh.isMesh) return;
      mesh.castShadow = shadows;
      mesh.receiveShadow = shadows;
    });
    invalidate();
  }, [display, version, shadows, invalidate]);

  const controls = useRef<OrbitControlsImpl>(null);
  const focus = data.areas.find((region) => region.id === states.selected);
  const flight = useCameraFlight({
    controls,
    display,
    focus,
    focusSerial,
    command,
    reducedMotion: reduced,
  });

  // Hover without raycasting the mesh on every pointer move: project region polygons.
  const latest = useRef({ pickable, onHover, showRegions });
  useEffect(() => {
    latest.current = { pickable, onHover, showRegions };
  });
  useEffect(() => {
    const element = gl.domElement;
    let frame = 0;
    let current: string | null = null;
    const report = (id: string | null) => {
      if (id === current) return;
      current = id;
      element.style.cursor = id ? 'pointer' : '';
      latest.current.onHover(id);
    };
    const move = (event: PointerEvent) => {
      if (event.buttons !== 0 || !latest.current.showRegions) return report(null);
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const rect = element.getBoundingClientRect();
        const pointer = new Vector2(
          ((event.clientX - rect.left) / rect.width) * 2 - 1,
          -((event.clientY - rect.top) / rect.height) * 2 + 1,
        );
        const hit = findRegionNear(
          latest.current.pickable,
          pointer,
          camera,
          display.matrix,
          display.orientation,
        );
        report(hit?.id ?? null);
      });
    };
    const leave = () => {
      cancelAnimationFrame(frame);
      report(null);
    };
    element.addEventListener('pointermove', move);
    element.addEventListener('pointerleave', leave);
    return () => {
      cancelAnimationFrame(frame);
      element.removeEventListener('pointermove', move);
      element.removeEventListener('pointerleave', leave);
    };
  }, [gl, camera, display]);

  function pick(event: ThreeEvent<MouseEvent>) {
    if (event.delta > CLICK_TOLERANCE || !showRegions) return;
    const match = findRegionAt(
      pickable,
      event.pointer,
      event.point,
      camera,
      display.matrix,
      display.orientation,
    );
    if (match) {
      event.stopPropagation();
      onSelect(match.id);
    }
  }

  // Redraw when overlay state changes (rendering is on demand).
  useEffect(() => {
    invalidate();
  }, [states, showRegions, outlined, lighting, invalidate]);

  // Renderer statistics for tests and benchmarks: totals for the previous frame, including
  // shadow passes. (Default priority: a positive priority would disable automatic rendering.)
  useEffect(() => {
    // The renderer is a mutable three.js object; info counters are configured on it.
    // eslint-disable-next-line react-hooks/immutability
    gl.info.autoReset = false;
    return () => {
      gl.info.autoReset = true;
    };
  }, [gl]);
  // Marks when the first frame containing the model has been drawn (for benchmarks).
  const firstFrame = useRef(false);
  useFrame(({ gl: renderer }) => {
    if (!firstFrame.current) {
      firstFrame.current = true;
      requestAnimationFrame(() => {
        renderer.domElement.dataset.firstFrame = String(Math.round(performance.now()));
      });
    }
    renderer.domElement.dataset.drawCalls = String(renderer.info.render.calls);
    renderer.domElement.dataset.triangles = String(renderer.info.render.triangles);
    renderer.domElement.dataset.textures = String(renderer.info.memory.textures);
    renderer.info.reset();
  });

  const hoverRegion = states.hovered ? data.areas.find((r) => r.id === states.hovered) : undefined;
  const hoverLabel = hoverRegion && labelFor(hoverRegion.id);

  return (
    <>
      <StageLighting mode={lighting} radius={bounds.radius} shadows={shadows} />
      <primitive object={display.scene} onClick={pick} dispose={null} />
      <ContactShadows
        position={[0, bounds.floor - 0.02, 0]}
        scale={bounds.radius * 3.2}
        far={bounds.radius * 1.2}
        blur={2.6}
        opacity={0.6}
        resolution={512}
        frames={1}
        color="#000000"
      />
      <RegionOverlay
        regions={outlined}
        states={states}
        matrix={display.matrix}
        orientation={display.orientation}
        showIdle={showRegions}
      />
      {hoverRegion && hoverLabel && (
        <Html
          position={regionCentroid(hoverRegion, display.matrix)}
          className="region-label"
          zIndexRange={[20, 10]}
          pointerEvents="none"
        >
          <span>{hoverLabel}</span>
        </Html>
      )}
      <OrbitControls
        ref={controls}
        makeDefault
        enableDamping
        dampingFactor={0.09}
        minDistance={MIN_DISTANCE}
        maxDistance={MAX_DISTANCE}
        onStart={flight.cancel}
      />
    </>
  );
}

/**
 * Memoized: the loader re-renders its parent on every progress tick, and re-rendering the
 * scene would re-apply props and request a new frame (including shadow passes) each time.
 */
export default memo(CoffinScene);
