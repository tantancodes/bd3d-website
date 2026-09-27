"use client";

import * as THREE from "three";
import { Canvas, ThreeEvent } from "@react-three/fiber";
import {
  Center,
  Html,
  OrbitControls,
  useGLTF,
} from "@react-three/drei";
import { useMemo, useState } from "react";

import type {
  Annotation,
  SurfaceAnchor,
} from "./ArtifactExperience";

type CoffinViewerProps = {
  annotations: Annotation[];
  selectedAnnotationId: number | null;
  onSelectAnnotation: (annotation: Annotation) => void;
};

/*
 * Size of the highlighted surface region.
 *
 * Increase this for a larger patch.
 * Decrease it for a tighter patch.
 */
const SURFACE_REGION_RADIUS = 0.22;

/*
 * Small offset above the original mesh.
 * Prevents z-fighting.
 */
const SURFACE_OFFSET = 0.003;

/*
 * ============================================================
 * GET TRIANGLE INDICES
 * ============================================================
 */

function getTriangleVertexIndices(
  geometry: THREE.BufferGeometry,
  faceIndex: number
): [number, number, number] | null {
  const positions = geometry.attributes.position;

  if (!positions) return null;

  const start = faceIndex * 3;

  let a: number;
  let b: number;
  let c: number;

  if (geometry.index) {
    if (start + 2 >= geometry.index.count) {
      return null;
    }

    a = geometry.index.getX(start);
    b = geometry.index.getX(start + 1);
    c = geometry.index.getX(start + 2);
  } else {
    a = start;
    b = start + 1;
    c = start + 2;
  }

  if (
    a >= positions.count ||
    b >= positions.count ||
    c >= positions.count
  ) {
    return null;
  }

  return [a, b, c];
}

/*
 * ============================================================
 * SURFACE ANCHOR -> EXACT LOCAL POINT
 * ============================================================
 */

function getAnchorLocalPoint(
  mesh: THREE.Mesh,
  anchor: SurfaceAnchor
): THREE.Vector3 | null {
  const geometry = mesh.geometry;
  const positions = geometry.attributes.position;

  if (!positions) return null;

  const indices = getTriangleVertexIndices(
    geometry,
    anchor.faceIndex
  );

  if (!indices) return null;

  const [aIndex, bIndex, cIndex] = indices;

  const a = new THREE.Vector3().fromBufferAttribute(
    positions,
    aIndex
  );

  const b = new THREE.Vector3().fromBufferAttribute(
    positions,
    bIndex
  );

  const c = new THREE.Vector3().fromBufferAttribute(
    positions,
    cIndex
  );

  const [u, v, w] = anchor.barycentric;

  return new THREE.Vector3()
    .addScaledVector(a, u)
    .addScaledVector(b, v)
    .addScaledVector(c, w);
}

/*
 * ============================================================
 * FIND TARGET MESH
 * ============================================================
 */

function findMesh(
  scene: THREE.Object3D,
  meshName: string
): THREE.Mesh | null {
  let result: THREE.Mesh | null = null;

  scene.traverse((child) => {
    if (
      child instanceof THREE.Mesh &&
      child.name === meshName
    ) {
      result = child;
    }
  });

  return result;
}

/*
 * ============================================================
 * BUILD HIGHLIGHT PATCH
 * ============================================================
 *
 * We inspect every triangle on the clicked mesh.
 *
 * If the triangle's center is close enough to the
 * saved annotation point, we copy that triangle into
 * a new geometry.
 *
 * Result:
 *
 * The highlight follows the ACTUAL model surface.
 */

function buildSurfaceRegion(
  mesh: THREE.Mesh,
  anchor: SurfaceAnchor,
  radius: number
): THREE.BufferGeometry | null {
  const geometry = mesh.geometry;
  const positions = geometry.attributes.position;

  if (!positions) return null;

  const anchorPoint = getAnchorLocalPoint(
    mesh,
    anchor
  );

  if (!anchorPoint) return null;

  const triangleCount = geometry.index
    ? geometry.index.count / 3
    : positions.count / 3;

  const patchPositions: number[] = [];

  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const c = new THREE.Vector3();

  const center = new THREE.Vector3();

  const edge1 = new THREE.Vector3();
  const edge2 = new THREE.Vector3();
  const normal = new THREE.Vector3();

  for (
    let faceIndex = 0;
    faceIndex < triangleCount;
    faceIndex++
  ) {
    const indices = getTriangleVertexIndices(
      geometry,
      faceIndex
    );

    if (!indices) continue;

    const [aIndex, bIndex, cIndex] = indices;

    a.fromBufferAttribute(
      positions,
      aIndex
    );

    b.fromBufferAttribute(
      positions,
      bIndex
    );

    c.fromBufferAttribute(
      positions,
      cIndex
    );

    center
      .copy(a)
      .add(b)
      .add(c)
      .multiplyScalar(1 / 3);

    /*
     * Only include triangles near the annotation.
     */
    if (
      center.distanceTo(anchorPoint) >
      radius
    ) {
      continue;
    }

    /*
     * Calculate triangle normal.
     */
    edge1.subVectors(b, a);
    edge2.subVectors(c, a);

    normal
      .crossVectors(edge1, edge2)
      .normalize();

    /*
     * Move the copied triangle a tiny amount
     * above the original surface.
     */
    const offset =
      normal.clone().multiplyScalar(
        SURFACE_OFFSET
      );

    const ao = a.clone().add(offset);
    const bo = b.clone().add(offset);
    const co = c.clone().add(offset);

    patchPositions.push(
      ao.x,
      ao.y,
      ao.z,

      bo.x,
      bo.y,
      bo.z,

      co.x,
      co.y,
      co.z
    );
  }

  if (patchPositions.length === 0) {
    return null;
  }

  const patchGeometry =
    new THREE.BufferGeometry();

  patchGeometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(
      patchPositions,
      3
    )
  );

  patchGeometry.computeVertexNormals();
  patchGeometry.computeBoundingSphere();

  return patchGeometry;
}

/*
 * ============================================================
 * SURFACE REGION
 * ============================================================
 */

function SurfaceAnnotationRegion({
  annotation,
  scene,
  selected,
  onSelect,
}: {
  annotation: Annotation & {
    anchor: SurfaceAnchor;
  };
  scene: THREE.Object3D;
  selected: boolean;
  onSelect: (annotation: Annotation) => void;
}) {
  const [hovered, setHovered] =
    useState(false);

  const data = useMemo(() => {
    const mesh = findMesh(
      scene,
      annotation.anchor.mesh
    );

    if (!mesh) {
      console.warn(
        `Could not find mesh "${annotation.anchor.mesh}"`
      );

      return null;
    }

    const geometry = buildSurfaceRegion(
      mesh,
      annotation.anchor,
      SURFACE_REGION_RADIUS
    );

    if (!geometry) {
      return null;
    }

    return {
      mesh,
      geometry,
    };
  }, [scene, annotation]);

  if (!data) {
    return null;
  }

  /*
   * Because the patch geometry uses coordinates
   * belonging to the original mesh, copy the
   * original mesh's transform.
   */
  return (
    <mesh
      geometry={data.geometry}
      position={data.mesh.position}
      rotation={data.mesh.rotation}
      scale={data.mesh.scale}
      renderOrder={20}
      onPointerOver={(event) => {
        event.stopPropagation();

        setHovered(true);

        document.body.style.cursor =
          "pointer";
      }}
      onPointerOut={(event) => {
        event.stopPropagation();

        setHovered(false);

        document.body.style.cursor =
          "default";
      }}
      onClick={(event) => {
        event.stopPropagation();
        onSelect(annotation);
      }}
    >
      <meshStandardMaterial
        color={
          selected
            ? "#f59e0b"
            : hovered
              ? "#fbbf24"
              : "#fde68a"
        }
        transparent
        opacity={
          selected
            ? 0.72
            : hovered
              ? 0.6
              : 0.32
        }
        roughness={0.55}
        metalness={0}
        depthWrite={false}
        side={THREE.DoubleSide}
        polygonOffset
        polygonOffsetFactor={-2}
        polygonOffsetUnits={-2}
      />
    </mesh>
  );
}

/*
 * ============================================================
 * OLD XYZ MARKER
 * ============================================================
 *
 * Temporary compatibility for annotations that
 * have not yet been migrated.
 */

function LegacyAnnotationMarker({
  annotation,
  index,
  selected,
  onSelect,
}: {
  annotation: Annotation;
  index: number;
  selected: boolean;
  onSelect: (annotation: Annotation) => void;
}) {
  return (
    <group
      position={[
        annotation.x,
        annotation.y,
        annotation.z,
      ]}
    >
      <mesh
        scale={selected ? 1.2 : 1}
        onClick={(event) => {
          event.stopPropagation();
          onSelect(annotation);
        }}
      >
        <sphereGeometry
          args={[0.075, 32, 32]}
        />

        <meshStandardMaterial
          color={
            selected
              ? "#171717"
              : "#ffffff"
          }
          emissive={
            selected
              ? "#171717"
              : "#ffffff"
          }
          emissiveIntensity={
            selected ? 0.25 : 0.1
          }
          roughness={0.4}
        />
      </mesh>

      <Html
        position={[0, 0.15, 0]}
        center
        distanceFactor={6}
        pointerEvents="none"
      >
        <div
          className={[
            "flex size-6 items-center justify-center rounded-full border text-[10px] font-medium shadow-sm transition-all",

            selected
              ? "border-neutral-900 bg-neutral-900 text-white"
              : "border-black/10 bg-white/90 text-neutral-700 backdrop-blur",
          ].join(" ")}
        >
          {String(index + 1).padStart(
            2,
            "0"
          )}
        </div>
      </Html>
    </group>
  );
}

/*
 * ============================================================
 * MODEL
 * ============================================================
 */

function ArtifactModel({
  annotations,
  selectedAnnotationId,
  onSelectAnnotation,
}: CoffinViewerProps) {
  const { scene } =
    useGLTF("/models/dog.glb");

  const surfaceAnnotations =
    useMemo(
      () =>
        annotations.filter(
          (
            annotation
          ): annotation is Annotation & {
            anchor: SurfaceAnchor;
          } =>
            annotation.anchor !== undefined
        ),
      [annotations]
    );

  /*
   * Clicking an unannotated part of the model
   * still prints the exact anchor.
   */
  const handleModelClick = (
    event: ThreeEvent<MouseEvent>
  ) => {
    event.stopPropagation();

    const mesh =
      event.object as THREE.Mesh;

    const face = event.face;

    if (
      !face ||
      event.faceIndex === undefined ||
      !mesh.geometry
    ) {
      return;
    }

    const positions =
      mesh.geometry.attributes.position;

    if (!positions) return;

    const a =
      new THREE.Vector3().fromBufferAttribute(
        positions,
        face.a
      );

    const b =
      new THREE.Vector3().fromBufferAttribute(
        positions,
        face.b
      );

    const c =
      new THREE.Vector3().fromBufferAttribute(
        positions,
        face.c
      );

    const localPoint =
      mesh.worldToLocal(
        event.point.clone()
      );

    const barycentric =
      new THREE.Vector3();

    THREE.Triangle.getBarycoord(
      localPoint,
      a,
      b,
      c,
      barycentric
    );

    const anchor: SurfaceAnchor = {
      mesh:
        mesh.name ||
        "unnamed-mesh",

      faceIndex:
        event.faceIndex,

      barycentric: [
        barycentric.x,
        barycentric.y,
        barycentric.z,
      ],
    };

    console.log(
      "📍 NEW SURFACE ANCHOR"
    );

    console.log(
      JSON.stringify(
        anchor,
        null,
        2
      )
    );
  };

  return (
    <Center>
      <group
        rotation={[
          Math.PI / 9,
          0,
          0,
        ]}
      >
        <primitive
          object={scene}
          scale={1}
          onClick={handleModelClick}
        />

        {surfaceAnnotations.map(
          (annotation) => (
            <SurfaceAnnotationRegion
              key={annotation.id}
              annotation={annotation}
              scene={scene}
              selected={
                annotation.id ===
                selectedAnnotationId
              }
              onSelect={
                onSelectAnnotation
              }
            />
          )
        )}
      </group>
    </Center>
  );
}

/*
 * ============================================================
 * VIEWER
 * ============================================================
 */

export default function CoffinViewer({
  annotations,
  selectedAnnotationId,
  onSelectAnnotation,
}: CoffinViewerProps) {
  const safeAnnotations =
    annotations ?? [];

  const legacyAnnotations =
    safeAnnotations.filter(
      (annotation) =>
        !annotation.anchor
    );

  return (
    <div className="h-full w-full">
      <Canvas
        camera={{
          position: [0, 0, 5],
          fov: 45,
        }}
        gl={{
          antialias: true,
          alpha: true,
        }}
      >
        <ambientLight intensity={1.8} />

        <directionalLight
          position={[4, 5, 4]}
          intensity={2}
        />

        <directionalLight
          position={[-4, 1, -2]}
          intensity={0.8}
        />

        <ArtifactModel
          annotations={safeAnnotations}
          selectedAnnotationId={
            selectedAnnotationId
          }
          onSelectAnnotation={
            onSelectAnnotation
          }
        />

        {legacyAnnotations.map(
          (annotation) => {
            const index =
              safeAnnotations.findIndex(
                (item) =>
                  item.id ===
                  annotation.id
              );

            return (
              <LegacyAnnotationMarker
                key={annotation.id}
                annotation={
                  annotation
                }
                index={index}
                selected={
                  annotation.id ===
                  selectedAnnotationId
                }
                onSelect={
                  onSelectAnnotation
                }
              />
            );
          }
        )}

        <OrbitControls
          makeDefault
          enableDamping
          dampingFactor={0.08}
          minDistance={2.5}
          maxDistance={9}
        />
      </Canvas>
    </div>
  );
}

useGLTF.preload(
  "/models/dog.glb"
);