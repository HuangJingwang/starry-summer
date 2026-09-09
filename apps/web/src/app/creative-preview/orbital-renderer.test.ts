// @vitest-environment jsdom

import type { Object3D, Scene } from 'three';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { createOrbitalScene } from './orbital-renderer';

let renderedScene: Scene;
const render = vi.fn((scene: Scene) => { renderedScene = scene; });
const dispose = vi.fn();
vi.mock('three', async (original) => {
  const actual = await original<typeof import('three')>();
  return {
    ...actual,
    WebGLRenderer: class {
      domElement = document.createElement('canvas');
      setPixelRatio() {} setClearColor() {} setSize() {}
      render = render;
      dispose = dispose;
    },
    PMREMGenerator: class {
      fromScene() { return { texture: new actual.Texture(), dispose() {} }; }
      dispose() {}
    },
  };
});

let frames: Map<number, FrameRequestCallback>;
let host: HTMLDivElement;
let controls: ReturnType<typeof createOrbitalScene>;
function frame(time: number) {
  const callbacks = [...frames.values()];
  frames.clear();
  callbacks.forEach((callback) => callback(time));
}
function pose() {
  const transforms: number[][] = [];
  renderedScene.traverse((object: Object3D) => { transforms.push([...object.position.toArray(), object.rotation.x, object.rotation.y, object.rotation.z]); });
  return transforms;
}

beforeEach(() => {
  frames = new Map();
  let id = 0;
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => { frames.set(++id, callback); return id; });
  vi.stubGlobal('cancelAnimationFrame', (frameId: number) => { frames.delete(frameId); });
  vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} });
  vi.stubGlobal('IntersectionObserver', class { observe() {} disconnect() {} });
  vi.spyOn(performance, 'now').mockReturnValue(0);
  render.mockClear();
  dispose.mockClear();
  host = document.createElement('div');
  document.body.append(host);
  controls = createOrbitalScene(host);
});
afterEach(() => { controls.destroy(); host.remove(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe('orbital scene lifecycle', () => {
  test('pausing preserves the rendered pose and stops the frame loop; resuming moves again', () => {
    frame(16);
    frame(32);
    const before = pose();
    controls.setPaused(true);
    frame(48);
    expect(pose()).toEqual(before);
    expect(frames.size).toBe(0);
    controls.setPaused(false);
    frame(64);
    expect(pose()).not.toEqual(before);
    expect(frames.size).toBe(1);
  });

  test('a lost WebGL context stays on the fallback until restoration, and teardown cancels work', () => {
    frame(16);
    expect(host.dataset.ready).toBe('true');
    host.querySelector('canvas')!.dispatchEvent(new Event('webglcontextlost', { cancelable: true }));
    controls.setPaused(false);
    expect(frames.size).toBe(0);
    expect(host.dataset.ready).toBe('false');
    host.querySelector('canvas')!.dispatchEvent(new Event('webglcontextrestored'));
    frame(32);
    expect(host.dataset.ready).toBe('true');
    controls.destroy();
    expect(frames.size).toBe(0);
    expect(host.querySelector('canvas')).toBeNull();
    expect(dispose).toHaveBeenCalledOnce();
  });
});
