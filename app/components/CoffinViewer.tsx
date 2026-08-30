"use client";

import { useState } from "react";
import { Canvas, ThreeEvent } from "@react-three/fiber";
import {
  Center,
  Html,
  OrbitControls,
  useGLTF,
} from "@react-three/drei";

import type { Annotation } from "./ArtifactExperience";

type CoffinViewerProps = {
  annotations: Annotation[];
  onSelectAnnotation: (annotation: Annotation) => void;
};

function ArtifactModel() {
  const { scene } = useGLTF("/models/dog.glb");

  return (
    <Center>
      <primitive
        object={scene}
        scale={1}
        rotation={[Math.PI / 9, 0, 0]}
        onClick={(event: ThreeEvent<MouseEvent>) => {
          event.stopPropagation();

          const x = event.point.x.toFixed(3);
          const y = event.point.y.toFixed(3);
          const z = event.point.z.toFixed(3);

          console.log(`position={[${x}, ${y}, ${z}]}`);
        }}
      />
    </Center>
  );
}

function AnnotationMarker({
  annotation,
  onSelect,
}: {
  annotation: Annotation;
  onSelect: (annotation: Annotation) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <group position={[annotation.x, annotation.y, annotation.z]}>
      <mesh
        onClick={(event) => {
          event.stopPropagation();

          setOpen(!open);
          onSelect(annotation);
        }}
      >
        <sphereGeometry args={[0.12, 32, 32]} />

        <meshStandardMaterial
          color="#c2410c"
          emissive="#7c2d12"
          emissiveIntensity={0.5}
        />
      </mesh>

      {open && (
        <Html
          position={[0, 0.3, 0]}
          center
          distanceFactor={6}
        >
          <div
            className="w-64 rounded-xl border border-black/10 bg-white p-4 text-black shadow-xl"
            onClick={(event) => {
              event.stopPropagation();
            }}
          >
            <p className="mb-1 text-xs uppercase tracking-[0.15em] text-black/40">
              Annotation
            </p>

            <h3 className="mb-2 text-lg font-semibold">
              {annotation.title}
            </h3>

            <p className="text-sm leading-5 text-black/60">
              {annotation.description}
            </p>

            <div className="mt-3 border-t border-black/10 pt-3">
              <p className="text-xs uppercase tracking-[0.15em] text-black/40">
                Translation
              </p>

              <p className="mt-1 text-sm">
                {annotation.translation ??
                  "No translation available."}
              </p>
            </div>

            <button
              className="mt-4 text-xs font-medium underline"
              onClick={(event) => {
                event.stopPropagation();
                setOpen(false);
              }}
            >
              Close
            </button>
          </div>
        </Html>
      )}
    </group>
  );
}

export default function CoffinViewer({
  annotations,
  onSelectAnnotation,
}: CoffinViewerProps) {
  return (
    <div className="h-full w-full">
      <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
        <ambientLight intensity={1.5} />

        <directionalLight
          position={[3, 3, 3]}
          intensity={2}
        />

        <ArtifactModel />

        {annotations.map((annotation) => (
          <AnnotationMarker
            key={annotation.id}
            annotation={annotation}
            onSelect={onSelectAnnotation}
          />
        ))}

        <OrbitControls
          makeDefault
          enableDamping
          dampingFactor={0.08}
        />
      </Canvas>
    </div>
  );
}

useGLTF.preload("/models/dog.glb");