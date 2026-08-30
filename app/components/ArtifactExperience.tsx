"use client";

import { useState } from "react";
import { BookOpen, Languages, MousePointer2, Rotate3D } from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

import CoffinViewer from "./CoffinViewer";

export type Annotation = {
  id: number;
  title: string;
  description: string;
  translation: string | null;
  transliteration: string | null;
  source: string | null;
  x: number;
  y: number;
  z: number;
};

type ArtifactExperienceProps = {
  annotations: Annotation[];
};

export default function ArtifactExperience({
  annotations,
}: ArtifactExperienceProps) {
  const [selectedAnnotation, setSelectedAnnotation] =
    useState<Annotation | null>(null);

  return (
    <>
      <div className="relative h-[680px] overflow-hidden rounded-2xl border bg-muted/20 shadow-sm">
        <CoffinViewer
          annotations={annotations}
          selectedAnnotationId={selectedAnnotation?.id ?? null}
          onSelectAnnotation={setSelectedAnnotation}
        />

        <div className="pointer-events-none absolute left-4 top-4 flex items-center gap-2 md:left-6 md:top-6">
          <Badge
            variant="secondary"
            className="bg-background/80 backdrop-blur-md"
          >
            3D Viewer
          </Badge>
        </div>

        <div className="pointer-events-none absolute bottom-4 left-4 right-4 flex items-end justify-between md:bottom-6 md:left-6 md:right-6">
          <div className="flex items-center gap-1 rounded-xl border bg-background/80 p-1.5 shadow-sm backdrop-blur-md">
            <div className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs text-muted-foreground">
              <Rotate3D className="size-3.5" />
              <span className="hidden sm:inline">Drag to rotate</span>
            </div>

            <div className="h-4 w-px bg-border" />

            <div className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs text-muted-foreground">
              <MousePointer2 className="size-3.5" />
              <span className="hidden sm:inline">Select a marker</span>
            </div>
          </div>

          <div className="rounded-xl border bg-background/80 px-3 py-2 text-xs text-muted-foreground shadow-sm backdrop-blur-md">
            {annotations.length} annotations
          </div>
        </div>
      </div>

      <Sheet
        open={selectedAnnotation !== null}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedAnnotation(null);
          }
        }}
      >
        <SheetContent
          side="right"
          className="w-full overflow-y-auto p-0 sm:max-w-md"
        >
          {selectedAnnotation && (
            <>
              <div className="px-6 pb-6 pt-10">
                <SheetHeader className="text-left">
                  <div className="mb-3">
                    <Badge variant="outline">Annotation</Badge>
                  </div>

                  <SheetTitle className="text-2xl font-medium tracking-tight">
                    {selectedAnnotation.title}
                  </SheetTitle>

                  <SheetDescription className="pt-2 text-sm leading-6">
                    {selectedAnnotation.description}
                  </SheetDescription>
                </SheetHeader>
              </div>

              <Separator />

              <div className="space-y-8 px-6 py-7">
                <section>
                  <div className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.13em] text-muted-foreground">
                    <BookOpen className="size-3.5" />
                    Translation
                  </div>

                  <p className="text-sm leading-7">
                    {selectedAnnotation.translation ??
                      "No translation available."}
                  </p>
                </section>

                <section>
                  <div className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.13em] text-muted-foreground">
                    <Languages className="size-3.5" />
                    Transliteration
                  </div>

                  <p className="text-sm italic leading-7 text-muted-foreground">
                    {selectedAnnotation.transliteration ??
                      "No transliteration available."}
                  </p>
                </section>

                {selectedAnnotation.source && (
                  <>
                    <Separator />

                    <section>
                      <p className="mb-3 text-xs font-medium uppercase tracking-[0.13em] text-muted-foreground">
                        Source
                      </p>

                      <p className="text-sm leading-6 text-muted-foreground">
                        {selectedAnnotation.source}
                      </p>
                    </section>
                  </>
                )}

                <Separator />

                <section>
                  <p className="mb-3 text-xs font-medium uppercase tracking-[0.13em] text-muted-foreground">
                    Spatial position
                  </p>

                  <div className="grid grid-cols-3 gap-2">
                    <Coordinate
                      label="X"
                      value={selectedAnnotation.x}
                    />

                    <Coordinate
                      label="Y"
                      value={selectedAnnotation.y}
                    />

                    <Coordinate
                      label="Z"
                      value={selectedAnnotation.z}
                    />
                  </div>
                </section>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}

function Coordinate({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-lg border bg-muted/30 p-3">
      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </p>

      <p className="mt-1 font-mono text-xs">
        {value.toFixed(3)}
      </p>
    </div>
  );
}