'use client';
import { useEffect, useMemo, useRef } from 'react';
import { useLoader, useThree, type ThreeEvent } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import type { CoffinData, Region } from '@/lib/data/schema';
import { CoffinLoader } from '@/lib/scene/loader';
import { prepareDisplayModel } from '@/lib/scene/orientation';
import { findRegionAt } from '@/lib/scene/regions';
import { MAX_DISTANCE, MIN_DISTANCE, type CameraCommand } from '@/lib/scene/camera';
import RegionOverlay from './RegionOverlay';
import { useCameraFlight } from './useCameraFlight';

export type SceneProps = {
  data: CoffinData;
  /** Regions that can be picked and are outlined (already filtered by the reading panel). */
  regions: Region[];
  selected: string | null;
  /** Incremented to re-frame the selected region even when the selection is unchanged. */
  focusSerial: number;
  onSelect: (regionId: string) => void;
  command: CameraCommand;
  reduced: boolean;
  showRegions: boolean;
  onReady: () => void;
};

/** Pointer travel (px) beyond which a click is treated as the end of a drag. */
const CLICK_TOLERANCE = 5;

export function modelUrl(data: CoffinData) {
  return `/models/${data.slug}/${data.model.name}`;
}

export default function CoffinScene({
  data,
  regions,
  selected,
  focusSerial,
  onSelect,
  command,
  reduced,
  showRegions,
  onReady,
}: SceneProps) {
  const object = useLoader(CoffinLoader, modelUrl(data));
  useEffect(() => {
    onReady();
  }, [onReady]);

  const display = useMemo(() => prepareDisplayModel(object, data.model), [object, data.model]);
  const controls = useRef<OrbitControlsImpl>(null);
  const { camera } = useThree();
  const focus = data.areas.find((region) => region.id === selected);
  const flight = useCameraFlight({
    controls,
    display,
    focus,
    focusSerial,
    command,
    reducedMotion: reduced,
  });

  function pick(event: ThreeEvent<MouseEvent>) {
    if (event.delta > CLICK_TOLERANCE || !showRegions) return;
    const match = findRegionAt(
      regions,
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

  return (
    <>
      <ambientLight intensity={1.6} />
      <directionalLight position={[3, 5, 6]} intensity={2} />
      <directionalLight position={[-4, 0, 2]} intensity={0.5} />
      <primitive object={display.scene} onClick={pick} dispose={null} />
      {showRegions && (
        <RegionOverlay
          regions={regions}
          selected={selected}
          matrix={display.matrix}
          orientation={display.orientation}
        />
      )}
      <OrbitControls
        ref={controls}
        makeDefault
        enableDamping
        minDistance={MIN_DISTANCE}
        maxDistance={MAX_DISTANCE}
        onStart={flight.cancel}
      />
    </>
  );
}
