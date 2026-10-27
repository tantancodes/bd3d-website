import { describe, expect, it } from 'vitest';
import { Matrix4, Quaternion, Vector3 } from 'three';
import type { Region } from '@/lib/data/schema';
import {
  FOCUS_DISTANCE,
  HOME_POSITION,
  MAX_DISTANCE,
  MIN_DISTANCE,
  flightStep,
  focusOnRegion,
  poseForCommand,
} from './camera';

const region: Region = {
  id: 'r',
  textId: 't',
  direction: [0, 0, -1],
  rotation: 0,
  dash: 4,
  lines: [
    [1, 0, 0, 2, 0, 0],
    [2, 0, 0, 2, 1, 0],
    [2, 1, 0, 1, 1, 0],
    [1, 1, 0, 1, 0, 0],
  ],
};

describe('focusOnRegion', () => {
  it('targets the centroid and backs off along the outward normal', () => {
    const pose = focusOnRegion(region, new Matrix4(), new Quaternion());
    expect(pose.target.toArray()).toEqual([1.5, 0.5, 0]);
    expect(pose.position.toArray()).toEqual([1.5, 0.5, FOCUS_DISTANCE]);
  });
});

describe('poseForCommand', () => {
  const eye = new Vector3(0, 0, 5);
  const target = new Vector3();

  it('reset returns home', () => {
    expect(poseForCommand('reset', eye, target).position.equals(HOME_POSITION)).toBe(true);
  });

  it('zoom keeps direction and clamps distance', () => {
    expect(poseForCommand('in', eye, target).position.z).toBeCloseTo(4);
    expect(poseForCommand('in', new Vector3(0, 0, 1.1), target).position.length()).toBeCloseTo(
      MIN_DISTANCE,
    );
    expect(poseForCommand('out', new Vector3(0, 0, 13), target).position.length()).toBeCloseTo(
      MAX_DISTANCE,
    );
  });

  it('orbit keeps distance to the target', () => {
    const pose = poseForCommand('left', eye, target);
    expect(pose.position.length()).toBeCloseTo(5);
    expect(pose.position.x).toBeLessThan(0);
    expect(pose.target).not.toBe(target);
  });
});

describe('flightStep', () => {
  it('is immediate with reduced motion', () => expect(flightStep(0.016, true)).toBe(1));
  it('clamps long frames so a stall does not jump', () =>
    expect(flightStep(1, false)).toBe(flightStep(0.05, false)));
});

describe('named views', () => {
  it('places every view at the home distance looking at the centre', async () => {
    const { VIEW_IDS, viewPose } = await import('./camera');
    for (const id of VIEW_IDS) {
      const pose = viewPose(id);
      expect(pose.position.length()).toBeCloseTo(HOME_POSITION.length(), 2);
      expect(pose.target.length()).toBe(0);
    }
  });
  it('front matches the reset pose', async () => {
    const { viewPose } = await import('./camera');
    expect(viewPose('front').position.equals(HOME_POSITION)).toBe(true);
  });
});
