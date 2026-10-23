'use client';
import { useMemo } from 'react';
import { Line } from '@react-three/drei';
import type { Matrix4, Quaternion, Vector3 } from 'three';
import type { Region } from '@/lib/data/schema';
import { regionOutlineSegments } from '@/lib/scene/regions';

export type RegionStates = {
  selected: string | null;
  hovered: string | null;
  /** Other locations of the active entry, or of a highlighted word. */
  related: ReadonlySet<string>;
};

type Props = {
  /** Every region that should be outlined. */
  regions: Region[];
  states: RegionStates;
  matrix: Matrix4;
  orientation: Quaternion;
  /** Hide idle outlines (the "Regions" toggle); active states stay visible. */
  showIdle: boolean;
};

const STYLE = {
  idle: { color: '#e6b45e', width: 1, opacity: 0.5 },
  related: { color: '#f0c46e', width: 1.8, opacity: 0.9 },
  hovered: { color: '#ffffff', width: 2.2, opacity: 1 },
  selected: { color: '#ffb52e', width: 3.2, opacity: 1 },
} as const;

type State = keyof typeof STYLE;

/**
 * Region outlines drawn as at most four batched line meshes (one per state) instead of one
 * mesh per region. Outline geometry is computed once per region and display transform.
 */
export default function RegionOverlay({ regions, states, matrix, orientation, showIdle }: Props) {
  const outlines = useMemo(
    () => new Map(regions.map((r) => [r.id, regionOutlineSegments(r, matrix, orientation)])),
    [regions, matrix, orientation],
  );

  const batches = useMemo(() => {
    const groups: Record<State, Vector3[]> = { idle: [], related: [], hovered: [], selected: [] };
    for (const [id, points] of outlines) {
      const state: State =
        id === states.selected
          ? 'selected'
          : id === states.hovered
            ? 'hovered'
            : states.related.has(id)
              ? 'related'
              : 'idle';
      if (state === 'idle' && !showIdle) continue;
      groups[state].push(...points);
    }
    return groups;
  }, [outlines, states, showIdle]);

  return (
    <>
      {(Object.keys(STYLE) as State[]).map((state) =>
        batches[state].length >= 2 ? (
          <Line
            key={state}
            points={batches[state]}
            segments
            color={STYLE[state].color}
            lineWidth={STYLE[state].width}
            transparent
            opacity={STYLE[state].opacity}
            renderOrder={state === 'idle' ? 1 : 2}
          />
        ) : null,
      )}
    </>
  );
}
