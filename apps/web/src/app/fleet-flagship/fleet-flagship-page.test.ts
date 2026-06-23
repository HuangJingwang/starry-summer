import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, test } from 'vitest';

function readSource(path: string) {
  return readFileSync(join(process.cwd(), path), 'utf8');
}

describe('fleet flagship preview page', () => {
  test('renders the fleet flagship as a Three.js WebGL preview', () => {
    const pageSource = readSource('src/app/fleet-flagship/page.tsx');
    const canvasSource = readSource('src/components/FleetFlagshipCanvas.tsx');
    const packageSource = readSource('package.json');

    expect(packageSource).toContain('"three"');
    expect(pageSource).toContain('<FleetFlagshipCanvas className={styles.canvas} />');
    expect(pageSource).toContain('Astra Veyron Flagship');
    expect(canvasSource).toContain("import * as THREE from 'three';");
    expect(canvasSource).toContain('new THREE.WebGLRenderer');
    expect(canvasSource).toContain('new THREE.PerspectiveCamera');
    expect(canvasSource).toContain('new THREE.Points');
    expect(canvasSource).toContain("const SHIP_TEXTURE_PATH = '/images/fleet-flagship/ship-render-side.png';");
    expect(canvasSource).toContain("const SHIP_TEXTURE_VERSION = 'side-profile-v1';");
    expect(canvasSource).toContain('const SHIP_ASPECT_RATIO = 1734 / 442;');
    expect(canvasSource).toContain('const FLIGHT_LOOP_SECONDS = 10;');
    expect(canvasSource).toContain('const INITIAL_FLIGHT_PROGRESS = 0.32;');
    expect(canvasSource).toContain('function getFlightX');
    expect(canvasSource).toContain('+ INITIAL_FLIGHT_PROGRESS) % 1');
    expect(canvasSource).toContain('(elapsed % FLIGHT_LOOP_SECONDS) / FLIGHT_LOOP_SECONDS');
    expect(canvasSource).toContain('textureLoader.load(`${SHIP_TEXTURE_PATH}?v=${SHIP_TEXTURE_VERSION}`)');
    expect(canvasSource).toContain('new THREE.TextureLoader');
    expect(canvasSource).toContain('function createShipLayer');
    expect(canvasSource).toContain('function createEngineTrail');
    expect(canvasSource).toContain('new THREE.PlaneGeometry');
    expect(canvasSource).toContain('new THREE.PointLight');
    expect(canvasSource).toContain('AdditiveBlending');
    expect(canvasSource).not.toContain('function createFlagshipModel');
    expect(canvasSource).not.toContain('new THREE.ExtrudeGeometry');
    expect(canvasSource).toContain('__fleetFlagshipPreviewReady');
  });
});
