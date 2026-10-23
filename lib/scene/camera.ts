import { Vector3, type Matrix4, type Quaternion } from 'three';
import type { Region } from '@/lib/data/schema';
import { regionCentroid, regionNormal } from './regions';

export const HOME_POSITION = new Vector3(0, 0, 7.3);
export const CAMERA_FOV = 38;
export const MIN_DISTANCE = 1;
export const MAX_DISTANCE = 14;
/** Distance from a region's centroid when the camera flies to it. */
export const FOCUS_DISTANCE = 3.4;
/** Horizontal orbit step for the rotate buttons, in radians. */
export const ORBIT_STEP = 0.35;
const ZOOM_IN = 0.8;
const ZOOM_OUT = 1.25;
/** Exponential approach rate for camera flights (per second). */
const FLIGHT_RATE = 6;
const ARRIVAL_EPSILON = 0.001;

export type CameraCommandKind = 'reset' | 'in' | 'out' | 'left' | 'right';

/** A camera request from the UI. `serial` makes repeated identical requests distinct. */
export type CameraCommand = { kind: CameraCommandKind; serial: number };

/** Where the camera is heading: its eye position and the orbit target. */
export type CameraPose = { position: Vector3; target: Vector3 };

/** Pose looking straight at a region along its recorded viewing direction. */
export function focusOnRegion(
  region: Region,
  matrix: Matrix4,
  orientation: Quaternion,
  distance = FOCUS_DISTANCE,
): CameraPose {
  const target = regionCentroid(region, matrix);
  const outward = regionNormal(region, orientation).normalize();
  return { target, position: target.clone().addScaledVector(outward, distance) };
}

/** Pose for a toolbar command, relative to the current eye position and orbit target. */
export function poseForCommand(
  kind: CameraCommandKind,
  position: Vector3,
  target: Vector3,
): CameraPose {
  if (kind === 'reset') return { position: HOME_POSITION.clone(), target: new Vector3() };
  const offset = position.clone().sub(target);
  if (kind === 'left' || kind === 'right') {
    const angle = kind === 'left' ? -ORBIT_STEP : ORBIT_STEP;
    return {
      position: target.clone().add(offset.applyAxisAngle(new Vector3(0, 1, 0), angle)),
      target: target.clone(),
    };
  }
  const factor = kind === 'in' ? ZOOM_IN : ZOOM_OUT;
  const distance = Math.min(MAX_DISTANCE, Math.max(MIN_DISTANCE, offset.length() * factor));
  return { position: target.clone().add(offset.setLength(distance)), target: target.clone() };
}

/**
 * Fraction of the remaining distance to cover this frame. Frame-rate independent;
 * `dt` is clamped so a long stall does not cause a jump. Reduced motion arrives at once.
 */
export function flightStep(dt: number, reducedMotion: boolean): number {
  if (reducedMotion) return 1;
  return 1 - Math.exp(-Math.min(dt, 0.05) * FLIGHT_RATE);
}

export function hasArrived(position: Vector3, destination: Vector3): boolean {
  return position.distanceTo(destination) < ARRIVAL_EPSILON;
}
