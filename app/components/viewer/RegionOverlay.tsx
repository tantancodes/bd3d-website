import { useMemo } from 'react';
import { Line } from '@react-three/drei';
import type { Matrix4, Quaternion } from 'three';
import type { Region } from '@/lib/data/schema';
import { regionOutlineSegments } from '@/lib/scene/regions';

type Props = {
  regions: Region[];
  selected: string | null;
  matrix: Matrix4;
  orientation: Quaternion;
};

const IDLE = { color: '#d1c2a4', width: 1, opacity: 0.45 };
const SELECTED = { color: '#5fe0eb', width: 3, opacity: 1 };

/** Outlines of the visible annotation regions, lifted slightly off the surface. */
export default function RegionOverlay({ regions, selected, matrix, orientation }: Props) {
  // Outline geometry only depends on the regions and the display transform, not on selection.
  const outlines = useMemo(
    () =>
      regions.map((region) => ({
        id: region.id,
        points: regionOutlineSegments(region, matrix, orientation),
      })),
    [regions, matrix, orientation],
  );
  return (
    <>
      {outlines.map(({ id, points }) => {
        const style = id === selected ? SELECTED : IDLE;
        return (
          <Line
            key={id}
            points={points}
            segments
            color={style.color}
            lineWidth={style.width}
            transparent
            opacity={style.opacity}
          />
        );
      })}
    </>
  );
}
