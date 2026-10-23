'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { Group, Texture } from 'three';
import type { DisplayModelAssets, TextureTier } from '@/lib/data/display-assets';
import {
  applyTextures,
  disposeModel,
  loadGeometry,
  loadTexture,
  textureUrls,
  tierBytes,
} from '@/lib/scene/model-assets';
import { PREVIEW_TIER } from '@/lib/scene/quality';

export type Progress = { loaded: number; total: number };

export type ModelState =
  | { phase: 'loading'; progress: Progress }
  | { phase: 'error'; error: Error }
  | {
      phase: 'ready';
      object: Group;
      /** Texture tier currently on the model. */
      tier: TextureTier;
      /** Download of a different tier in progress, if any. */
      upgrade: (Progress & { tier: TextureTier }) | null;
      upgradeFailed: boolean;
      /** Increments whenever textures change, so the canvas can redraw. */
      version: number;
    };

async function loadTier(
  assets: DisplayModelAssets,
  tier: TextureTier,
  signal: AbortSignal,
  onBytes: (n: number) => void,
) {
  const entries = await Promise.all(
    [...textureUrls(assets, tier)].map(
      async ([name, url]) => [name, await loadTexture(url, signal, onBytes)] as const,
    ),
  );
  return new Map<string, Texture>(entries);
}

/**
 * Loads a model in two steps: geometry plus small preview textures so the object appears
 * quickly, then the target tier in the background. Changing `targetTier` later swaps
 * textures without refetching geometry. Everything is disposed on unmount.
 */
export function useCoffinModel(
  assets: DisplayModelAssets,
  targetTier: TextureTier,
  attempt: number,
): ModelState {
  const initial = (): ModelState => ({
    phase: 'loading',
    progress: { loaded: 0, total: assets.geometry.bytes + tierBytes(assets, PREVIEW_TIER) },
  });
  // State is tagged with the attempt it belongs to, so a retry starts from "loading"
  // without resetting state inside the effect.
  const [tagged, setTagged] = useState<{ attempt: number; state: ModelState }>(() => ({
    attempt,
    state: initial(),
  }));
  const state = tagged.attempt === attempt ? tagged.state : initial();
  const setState = useCallback(
    (next: ModelState | ((current: ModelState) => ModelState)) =>
      setTagged((current) => {
        const base = current.attempt === attempt ? current.state : initial();
        return { attempt, state: typeof next === 'function' ? next(base) : next };
      }),
    // initial() only reads `assets`, which is fixed for the lifetime of an exhibit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [attempt, assets],
  );
  const objectRef = useRef<Group | null>(null);
  const tierRef = useRef<TextureTier>(PREVIEW_TIER);

  // Geometry and preview textures.
  useEffect(() => {
    const controller = new AbortController();
    const total = assets.geometry.bytes + tierBytes(assets, PREVIEW_TIER);
    let loaded = 0;
    let frame = 0;
    // Set when this attempt fails or is cleaned up; later progress events are ignored.
    let settled = false;
    let cancelled = false;
    const onBytes = (n: number) => {
      if (settled) return;
      loaded += n;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (!settled) setState({ phase: 'loading', progress: { loaded, total } });
      });
    };
    let object: Group | null = null;
    Promise.all([
      loadGeometry(assets, controller.signal, onBytes),
      loadTier(assets, PREVIEW_TIER, controller.signal, onBytes),
    ])
      .then(([group, textures]) => {
        settled = true;
        cancelAnimationFrame(frame);
        if (cancelled) {
          disposeModel(group);
          textures.forEach((t) => t.dispose());
          return;
        }
        object = group;
        applyTextures(group, textures);
        objectRef.current = group;
        tierRef.current = PREVIEW_TIER;
        setState({
          phase: 'ready',
          object: group,
          tier: PREVIEW_TIER,
          upgrade: null,
          upgradeFailed: false,
          version: 0,
        });
      })
      .catch((error: Error) => {
        if (cancelled || settled) return;
        settled = true;
        cancelAnimationFrame(frame);
        // Stop the downloads that are still running for this attempt.
        controller.abort();
        setState({ phase: 'error', error });
      });
    return () => {
      cancelled = true;
      settled = true;
      controller.abort();
      cancelAnimationFrame(frame);
      if (object) disposeModel(object);
      objectRef.current = null;
    };
  }, [assets, attempt, setState]);

  // Target tier, once the model is on screen.
  const ready = state.phase === 'ready' ? state.object : null;
  useEffect(() => {
    const object = ready;
    if (!object || tierRef.current === targetTier) return;
    const controller = new AbortController();
    const total = tierBytes(assets, targetTier);
    let loaded = 0;
    let frame = 0;
    const update = (patch: Partial<Extract<ModelState, { phase: 'ready' }>>) =>
      setState((current) => (current.phase === 'ready' ? { ...current, ...patch } : current));
    queueMicrotask(() =>
      update({ upgrade: { loaded: 0, total, tier: targetTier }, upgradeFailed: false }),
    );
    loadTier(assets, targetTier, controller.signal, (n) => {
      loaded += n;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => update({ upgrade: { loaded, total, tier: targetTier } }));
    })
      .then((textures) => {
        if (controller.signal.aborted || objectRef.current !== object) {
          textures.forEach((t) => t.dispose());
          return;
        }
        applyTextures(object, textures).forEach((old) => old.dispose());
        tierRef.current = targetTier;
        cancelAnimationFrame(frame);
        setState((current) =>
          current.phase === 'ready'
            ? { ...current, tier: targetTier, upgrade: null, version: current.version + 1 }
            : current,
        );
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        cancelAnimationFrame(frame);
        update({ upgrade: null, upgradeFailed: true });
      });
    return () => {
      controller.abort();
      cancelAnimationFrame(frame);
    };
  }, [assets, ready, targetTier, setState]);

  return state;
}
