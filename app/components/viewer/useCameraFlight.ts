import { useEffect, useRef, type RefObject } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import type { Region } from '@/lib/data/schema';
import type { DisplayModel } from '@/lib/scene/orientation';
import {
  flightStep,
  focusOnRegion,
  hasArrived,
  poseForCommand,
  type CameraCommand,
  type CameraPose,
} from '@/lib/scene/camera';

type Options = {
  controls: RefObject<OrbitControlsImpl | null>;
  display: DisplayModel;
  /** Region to frame; re-framed whenever `focusSerial` changes. */
  focus: Region | undefined;
  focusSerial: number;
  command: CameraCommand;
  reducedMotion: boolean;
};

/**
 * Smoothly moves the camera and orbit target towards a destination pose. A drag on the
 * orbit controls cancels the flight (see `cancel`). Rendering is on demand, so each step
 * requests the next frame until the camera arrives.
 */
export function useCameraFlight({
  controls,
  display,
  focus,
  focusSerial,
  command,
  reducedMotion,
}: Options) {
  const flight = useRef<CameraPose | null>(null);
  const { camera, gl, invalidate } = useThree();

  useEffect(() => {
    if (!focus) return;
    flight.current = focusOnRegion(focus, display.matrix, display.orientation);
    invalidate();
  }, [focus, display, focusSerial, invalidate]);

  useEffect(() => {
    if (!controls.current) return;
    flight.current = poseForCommand(command.kind, camera.position, controls.current.target);
    invalidate();
  }, [command, camera, controls, invalidate]);

  useFrame((_, dt) => {
    // Test hooks: end-to-end tests read the camera pose and whether a flight is in progress.
    gl.domElement.setAttribute(
      'data-camera',
      camera.position
        .toArray()
        .map((n) => (Math.abs(n) < 0.00005 ? 0 : n).toFixed(4))
        .join(','),
    );
    gl.domElement.setAttribute('data-camera-moving', String(!!flight.current));

    const destination = flight.current;
    const orbit = controls.current;
    if (!destination || !orbit) return;
    const amount = flightStep(dt, reducedMotion);
    invalidate();
    camera.position.lerp(destination.position, amount);
    orbit.target.lerp(destination.target, amount);
    orbit.update();
    if (hasArrived(camera.position, destination.position)) {
      camera.position.copy(destination.position);
      orbit.target.copy(destination.target);
      orbit.update();
      flight.current = null;
    }
  });

  return {
    /** Stops the current flight, e.g. when the user starts dragging. */
    cancel: () => {
      flight.current = null;
    },
  };
}
