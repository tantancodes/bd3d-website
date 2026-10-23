'use client';
import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { PMREMGenerator, Vector3, type DirectionalLight } from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { lightDirection, type LightingMode, type RakingLight } from '@/lib/scene/lighting';

type Props = {
  mode: LightingMode;
  /** Radius of the model's bounding sphere, for the shadow camera. */
  radius: number;
  shadows: boolean;
};

/** Key light above-left of the viewer and a weak fill, used for the gallery look. */
const GALLERY_KEY: RakingLight = { azimuth: 125, elevation: 50 };
const GALLERY_FILL: RakingLight = { azimuth: 330, elevation: 20 };
const LIGHT_DISTANCE = 10;
const ORIGIN = new Vector3();

/**
 * Image-based ambient light from a neutral studio environment, plus viewer-relative
 * directional lights. Raking mode turns the environment almost off and uses a single
 * strong light at the chosen angle, with real shadow maps, so only the measured geometry
 * shapes the shading.
 */
export default function StageLighting({ mode, radius, shadows }: Props) {
  const { gl, scene, camera, invalidate } = useThree();
  // OrbitControls registers itself as the default controls; lights aim at its target.
  const controls = useThree((state) => state.controls) as { target?: Vector3 } | null;
  const key = useRef<DirectionalLight>(null);
  const fill = useRef<DirectionalLight>(null);
  const raking = mode.kind === 'raking';

  useEffect(() => {
    const generator = new PMREMGenerator(gl);
    const environment = generator.fromScene(new RoomEnvironment(), 0.04).texture;
    // three.js scenes are mutable objects; assigning the environment is the intended API.
    // eslint-disable-next-line react-hooks/immutability
    scene.environment = environment;
    invalidate();
    return () => {
      scene.environment = null;
      environment.dispose();
      generator.dispose();
    };
  }, [gl, scene, invalidate]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/immutability
    scene.environmentIntensity = raking ? 0.06 : 0.55;
    invalidate();
  }, [scene, raking, invalidate]);

  const keyAngles = useMemo(
    () =>
      mode.kind === 'raking' ? { azimuth: mode.azimuth, elevation: mode.elevation } : GALLERY_KEY,
    [mode],
  );

  useEffect(() => {
    invalidate();
  }, [keyAngles, invalidate]);

  const place = (light: DirectionalLight | null, angles: RakingLight) => {
    if (!light) return;
    const target = controls?.target ?? ORIGIN;
    const direction = lightDirection(angles).applyQuaternion(camera.quaternion);
    light.position.copy(target).addScaledVector(direction, LIGHT_DISTANCE);
    light.target.position.copy(target);
    light.target.updateMatrixWorld();
  };

  // Lights follow the camera so "from the left" always means screen-left.
  useFrame(() => {
    place(key.current, keyAngles);
    place(fill.current, GALLERY_FILL);
  });

  const extent = radius * 1.15;
  return (
    <>
      <directionalLight
        ref={key}
        intensity={raking ? 3.4 : 1.65}
        castShadow={shadows}
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.025}
        shadow-camera-left={-extent}
        shadow-camera-right={extent}
        shadow-camera-top={extent}
        shadow-camera-bottom={-extent}
        shadow-camera-near={LIGHT_DISTANCE - extent * 1.5}
        shadow-camera-far={LIGHT_DISTANCE + extent * 1.5}
      >
        <object3D attach="target" />
      </directionalLight>
      <directionalLight ref={fill} intensity={raking ? 0 : 0.35}>
        <object3D attach="target" />
      </directionalLight>
    </>
  );
}
