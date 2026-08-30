"use client";

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
  selectedAnnotationId: number | null;
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
    <group position={[annotation.x, annotation.y, annotation.z]}>
      <mesh
        scale={selected ? 1.2 : 1}
        onClick={(event) => {
          event.stopPropagation();
          onSelect(annotation);
        }}
      >
        <sphereGeometry args={[0.075, 32, 32]} />

        <meshStandardMaterial
          color={selected ? "#171717" : "#ffffff"}
          emissive={selected ? "#171717" : "#ffffff"}
          emissiveIntensity={selected ? 0.25 : 0.1}
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
          {String(index + 1).padStart(2, "0")}
        </div>
      </Html>
    </group>
  );
}

export default function CoffinViewer({
  annotations,
  selectedAnnotationId,
  onSelectAnnotation,
}: CoffinViewerProps) {
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

        <ArtifactModel />

        {annotations.map((annotation, index) => (
          <AnnotationMarker
            key={annotation.id}
            annotation={annotation}
            index={index}
            selected={annotation.id === selectedAnnotationId}
            onSelect={onSelectAnnotation}
          />
        ))}

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

useGLTF.preload("/models/dog.glb");