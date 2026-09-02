"use client";

import { useRouter } from "next/navigation";
import {
  Globe3D,
  type GlobeMarker,
} from "@/components/ui/3d-globe";

type CoffinMarker = GlobeMarker & {
  slug: string;
};

const coffins: CoffinMarker[] = [
  {
    lat: 30.0444,
    lng: 31.2357,
    src: "/images/bd3d-logo.png",
    label: "Ptahotep",
    size: 0.08,
    slug: "ptahotep",
  },
  {
    lat: 29.9792,
    lng: 31.1342,
    src: "/images/bd3d-logo.png",
    label: "Ankhet",
    size: 0.08,
    slug: "ankhet",
  },
  {
    lat: 25.6872,
    lng: 32.6396,
    src: "/images/bd3d-logo.png",
    label: "Amuniu",
    size: 0.08,
    slug: "amuniu",
  },
  {
    lat: 26.8206,
    lng: 30.8025,
    src: "/images/bd3d-logo.png",
    label: "Hunu",
    size: 0.08,
    slug: "hunu",
  },
];

export default function CoffinGlobe() {
  const router = useRouter();

  return (
    <div className="relative h-[650px] w-full overflow-hidden">
      <Globe3D
        markers={coffins}
        config={{
          radius: 2,
          showAtmosphere: true,
          atmosphereColor: "#6b214f",
          atmosphereIntensity: 0.25,
          atmosphereBlur: 3,

          autoRotateSpeed: 0.2,

          enableZoom: true,
          enablePan: false,

          minDistance: 5,
          maxDistance: 10,

          markerSize: 0.07,

          showWireframe: false,

          ambientIntensity: 1,
          pointLightIntensity: 1.2,

          backgroundColor: null,
        }}
        onMarkerClick={(marker) => {
          const coffin = marker as CoffinMarker;

          router.push(`/coffins/${coffin.slug}`);
        }}
        className="h-full w-full"
      />
    </div>
  );
}