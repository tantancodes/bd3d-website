"use client";

import { useState } from "react";
import CoffinViewer from "./CoffinViewer";

type Annotation = {
  id: number;
  title: string;
  description: string;
  translation: string;
  transliteration: string;
};

export default function ArtifactExperience() {
  const [selectedAnnotation, setSelectedAnnotation] =
    useState<Annotation | null>(null);

  return (
    <div className="grid h-[650px] grid-cols-[2fr_1fr] overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm">

      {/* 3D VIEWER */}
      <div className="relative bg-[#e9e3d8]">
        <CoffinViewer onSelectAnnotation={setSelectedAnnotation} />

        <div className="absolute bottom-6 left-6 rounded-full bg-white/90 px-4 py-2 text-xs shadow">
          Drag to rotate · Scroll to zoom
        </div>
      </div>

      {/* ANNOTATION PANEL */}
      <aside className="border-l border-black/10 p-10">

        <p className="mb-3 text-xs uppercase tracking-[0.2em] text-black/40">
          Annotation
        </p>

        {selectedAnnotation ? (
          <>
            <h3 className="mb-4 text-2xl font-medium">
              {selectedAnnotation.title}
            </h3>

            <p className="leading-7 text-black/60">
              {selectedAnnotation.description}
            </p>

            <div className="mt-10 border-t border-black/10 pt-8">
              <p className="mb-2 text-xs uppercase tracking-[0.2em] text-black/40">
                Translation
              </p>

              <p className="leading-7">
                {selectedAnnotation.translation}
              </p>
            </div>

            <div className="mt-8">
              <p className="mb-2 text-xs uppercase tracking-[0.2em] text-black/40">
                Transliteration
              </p>

              <p className="italic text-black/70">
                {selectedAnnotation.transliteration}
              </p>
            </div>
          </>
        ) : (
          <>
            <h3 className="mb-4 text-2xl font-medium">
              Select an annotation
            </h3>

            <p className="leading-7 text-black/60">
              Select a marker on the 3D model to explore scholarly
              information about this artifact.
            </p>
          </>
        )}

      </aside>
    </div>
  );
}