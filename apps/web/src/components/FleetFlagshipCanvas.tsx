'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface Starfield {
  geometry: THREE.BufferGeometry;
  points: THREE.Points;
  speeds: Float32Array;
}

interface EngineSpark {
  seed: number;
  sprite: THREE.Sprite;
}

interface ShipLayer {
  engineX: number;
  engineLight: THREE.PointLight;
  engineSparks: EngineSpark[];
  engineTrail: THREE.Group;
  group: THREE.Group;
  hull: THREE.Mesh;
}

interface FlightPath {
  endX: number;
  startX: number;
}

const SHIP_TEXTURE_PATH = '/images/fleet-flagship/ship-render-side.png';
const SHIP_TEXTURE_VERSION = 'side-profile-v1';
const SHIP_ASPECT_RATIO = 1734 / 442;
const SHIP_WORLD_HEIGHT = 2.92;
const FLIGHT_LOOP_SECONDS = 10;
const INITIAL_FLIGHT_PROGRESS = 0.32;
const STAR_COUNT = 1900;
const STAR_DEPTH = 128;

const randomBetween = (min: number, max: number) => min + Math.random() * (max - min);

function getVisibleSceneWidth(camera: THREE.PerspectiveCamera) {
  const visibleHeight = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2) * Math.abs(camera.position.z);

  return visibleHeight * camera.aspect;
}

function getFlightX(path: FlightPath, elapsed: number) {
  const progress = ((elapsed % FLIGHT_LOOP_SECONDS) / FLIGHT_LOOP_SECONDS + INITIAL_FLIGHT_PROGRESS) % 1;

  return THREE.MathUtils.lerp(path.startX, path.endX, progress);
}

function makeCircleTexture(color = '#d8fbff') {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const context = canvas.getContext('2d');

  if (!context) {
    return new THREE.Texture();
  }

  const gradient = context.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, color);
  gradient.addColorStop(0.34, 'rgba(158, 238, 255, 0.72)');
  gradient.addColorStop(1, 'rgba(158, 238, 255, 0)');
  context.fillStyle = gradient;
  context.fillRect(0, 0, 64, 64);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;

  return texture;
}

function makeNebulaTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const context = canvas.getContext('2d');

  if (!context) {
    return new THREE.Texture();
  }

  context.clearRect(0, 0, canvas.width, canvas.height);

  const clouds = [
    { x: 0.16, y: 0.52, r: 0.42, color: 'rgba(45, 212, 191, 0.15)' },
    { x: 0.48, y: 0.34, r: 0.34, color: 'rgba(56, 189, 248, 0.13)' },
    { x: 0.78, y: 0.58, r: 0.4, color: 'rgba(167, 139, 250, 0.12)' },
  ];

  clouds.forEach((cloud) => {
    const radius = canvas.width * cloud.r;
    const gradient = context.createRadialGradient(
      canvas.width * cloud.x,
      canvas.height * cloud.y,
      0,
      canvas.width * cloud.x,
      canvas.height * cloud.y,
      radius,
    );
    gradient.addColorStop(0, cloud.color);
    gradient.addColorStop(0.5, cloud.color.replace('0.15', '0.05').replace('0.13', '0.05').replace('0.12', '0.04'));
    gradient.addColorStop(1, 'rgba(3, 6, 14, 0)');
    context.fillStyle = gradient;
    context.fillRect(0, 0, canvas.width, canvas.height);
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;

  return texture;
}

function makeFlameTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 192;
  const context = canvas.getContext('2d');

  if (!context) {
    return new THREE.Texture();
  }

  const gradient = context.createLinearGradient(512, 96, 0, 96);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 0.96)');
  gradient.addColorStop(0.14, 'rgba(125, 249, 255, 0.76)');
  gradient.addColorStop(0.42, 'rgba(34, 211, 238, 0.34)');
  gradient.addColorStop(0.72, 'rgba(45, 212, 191, 0.12)');
  gradient.addColorStop(1, 'rgba(45, 212, 191, 0)');
  context.fillStyle = gradient;
  context.beginPath();
  context.moveTo(512, 46);
  context.bezierCurveTo(330, 10, 130, 42, 0, 96);
  context.bezierCurveTo(130, 150, 330, 182, 512, 146);
  context.closePath();
  context.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;

  return texture;
}

function createStarfield(starTexture: THREE.Texture): Starfield {
  const positions = new Float32Array(STAR_COUNT * 3);
  const colors = new Float32Array(STAR_COUNT * 3);
  const speeds = new Float32Array(STAR_COUNT);

  for (let index = 0; index < STAR_COUNT; index += 1) {
    positions[index * 3] = randomBetween(-58, 58);
    positions[index * 3 + 1] = randomBetween(-26, 26);
    positions[index * 3 + 2] = randomBetween(-STAR_DEPTH, 10);
    speeds[index] = randomBetween(0.04, 0.18);

    const tint = randomBetween(0.72, 1);
    colors[index * 3] = tint * 0.72;
    colors[index * 3 + 1] = tint * 0.95;
    colors[index * 3 + 2] = 1;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const material = new THREE.PointsMaterial({
    alphaMap: starTexture,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    size: 0.14,
    transparent: true,
    vertexColors: true,
  });

  return {
    geometry,
    points: new THREE.Points(geometry, material),
    speeds,
  };
}

function createEngineSparks(texture: THREE.Texture, engineX: number): EngineSpark[] {
  return Array.from({ length: 62 }, () => {
    const material = new THREE.SpriteMaterial({
      blending: THREE.AdditiveBlending,
      color: Math.random() > 0.24 ? 0x67e8f9 : 0xfff7d6,
      map: texture,
      opacity: randomBetween(0.22, 0.82),
      transparent: true,
    });
    const sprite = new THREE.Sprite(material);
    sprite.position.set(randomBetween(engineX - 2.25, engineX - 0.12), randomBetween(-0.34, 0.18), randomBetween(-0.18, 0.18));
    const size = randomBetween(0.045, 0.16);
    sprite.scale.set(size, size, 1);

    return {
      seed: Math.random() * Math.PI * 2,
      sprite,
    };
  });
}

function createEngineTrail(flameTexture: THREE.Texture, engineX: number) {
  const group = new THREE.Group();
  const material = new THREE.MeshBasicMaterial({
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    map: flameTexture,
    opacity: 0.62,
    transparent: true,
  });

  const wideTrail = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 0.96), material);
  wideTrail.position.set(engineX - 1.18, -0.1, -0.1);
  group.add(wideTrail);

  const softTrail = new THREE.Mesh(
    new THREE.PlaneGeometry(4.3, 1.42),
    new THREE.MeshBasicMaterial({
      blending: THREE.AdditiveBlending,
      color: 0x22d3ee,
      depthWrite: false,
      map: flameTexture,
      opacity: 0.18,
      transparent: true,
    }),
  );
  softTrail.position.set(engineX - 1.58, -0.1, -0.22);
  group.add(softTrail);

  return group;
}

function createShipLayer(shipTexture: THREE.Texture, starTexture: THREE.Texture, flameTexture: THREE.Texture): ShipLayer {
  const group = new THREE.Group();
  group.rotation.set(-0.035, -0.11, 0.015);

  const shipHeight = SHIP_WORLD_HEIGHT;
  const shipWidth = shipHeight * SHIP_ASPECT_RATIO;
  const engineX = -shipWidth * 0.38;
  const hull = new THREE.Mesh(
    new THREE.PlaneGeometry(shipWidth, shipHeight),
    new THREE.MeshBasicMaterial({
      depthWrite: false,
      map: shipTexture,
      transparent: true,
    }),
  );
  hull.position.set(0, 0, 0);
  group.add(hull);

  const silhouette = new THREE.Mesh(
    new THREE.PlaneGeometry(shipWidth * 1.02, shipHeight * 1.02),
    new THREE.MeshBasicMaterial({
      blending: THREE.AdditiveBlending,
      color: 0x67e8f9,
      depthWrite: false,
      map: shipTexture,
      opacity: 0.12,
      transparent: true,
    }),
  );
  silhouette.position.set(-0.03, -0.02, -0.1);
  group.add(silhouette);

  const engineTrail = createEngineTrail(flameTexture, engineX);
  group.add(engineTrail);

  const engineLight = new THREE.PointLight(0x67e8f9, 16, 7);
  engineLight.position.set(engineX, -0.08, 0.32);
  group.add(engineLight);

  const engineSparks = createEngineSparks(starTexture, engineX);
  engineSparks.forEach(({ sprite }) => group.add(sprite));

  return {
    engineX,
    engineLight,
    engineSparks,
    engineTrail,
    group,
    hull,
  };
}

function disposeObject3D(root: THREE.Object3D) {
  root.traverse((object) => {
    if (object instanceof THREE.Mesh || object instanceof THREE.Points || object instanceof THREE.Sprite) {
      object.geometry?.dispose();
      const material = object.material;

      if (Array.isArray(material)) {
        material.forEach((item) => item.dispose());
      } else {
        material.dispose();
      }
    }
  });
}

export function FleetFlagshipCanvas({ className = '' }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return undefined;
    }

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      canvas,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true,
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setClearColor(0x02040b, 1);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.16;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x02040b, 0.013);

    const camera = new THREE.PerspectiveCamera(46, 1, 0.1, 180);
    camera.position.set(0, 0.2, 8.8);

    const textureLoader = new THREE.TextureLoader();
    const shipTexture = textureLoader.load(`${SHIP_TEXTURE_PATH}?v=${SHIP_TEXTURE_VERSION}`);
    shipTexture.colorSpace = THREE.SRGBColorSpace;
    shipTexture.anisotropy = 8;

    const starTexture = makeCircleTexture();
    const flameTexture = makeFlameTexture();
    const starfield = createStarfield(starTexture);
    scene.add(starfield.points);

    const nebula = new THREE.Mesh(
      new THREE.PlaneGeometry(34, 17),
      new THREE.MeshBasicMaterial({
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        map: makeNebulaTexture(),
        opacity: 0.78,
        transparent: true,
      }),
    );
    nebula.position.set(4.8, 0.5, -36);
    scene.add(nebula);

    const planet = new THREE.Mesh(
      new THREE.SphereGeometry(4.8, 64, 32),
      new THREE.MeshBasicMaterial({
        color: 0x0f5462,
        transparent: true,
        opacity: 0.74,
      }),
    );
    planet.position.set(9.6, -5.2, -18);
    scene.add(planet);

    const planetHalo = new THREE.Sprite(
      new THREE.SpriteMaterial({
        blending: THREE.AdditiveBlending,
        color: 0x22d3ee,
        map: starTexture,
        opacity: 0.24,
        transparent: true,
      }),
    );
    planetHalo.position.copy(planet.position);
    planetHalo.scale.set(12, 12, 1);
    scene.add(planetHalo);

    const ship = createShipLayer(shipTexture, starTexture, flameTexture);
    ship.group.position.set(0.28, 0.16, 0);
    scene.add(ship.group);

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const startedAt = performance.now();
    let previousFrameAt = startedAt;
    let animationId = 0;
    let flightPath: FlightPath = {
      endX: 0,
      startX: 0,
    };

    const resize = () => {
      const width = canvas.offsetWidth || window.innerWidth;
      const height = canvas.offsetHeight || window.innerHeight;
      renderer.setSize(width, height, false);
      camera.aspect = width / Math.max(1, height);
      camera.updateProjectionMatrix();

      const scale = Math.min(1.08, Math.max(0.68, width / 1120));
      ship.group.scale.setScalar(scale);
      const visibleWidth = getVisibleSceneWidth(camera);
      const shipWidth = SHIP_WORLD_HEIGHT * SHIP_ASPECT_RATIO * scale;
      flightPath = {
        endX: visibleWidth / 2 + shipWidth * 0.62,
        startX: -visibleWidth / 2 - shipWidth * 0.62,
      };
      ship.group.position.x = getFlightX(flightPath, (performance.now() - startedAt) / 1000);
    };

    const render = () => {
      const frameAt = performance.now();
      const elapsed = (frameAt - startedAt) / 1000;
      const delta = Math.min((frameAt - previousFrameAt) / 1000, 0.05);
      previousFrameAt = frameAt;
      const positions = starfield.geometry.attributes.position as THREE.BufferAttribute;
      const positionArray = positions.array as Float32Array;
      const speedMultiplier = 18;

      for (let index = 0; index < STAR_COUNT; index += 1) {
        const zIndex = index * 3 + 2;
        const currentZ = positionArray[zIndex] ?? -STAR_DEPTH;
        const speed = starfield.speeds[index] ?? 0.08;
        positionArray[zIndex] = currentZ + speed * delta * speedMultiplier;

        if ((positionArray[zIndex] ?? -STAR_DEPTH) > 12) {
          positionArray[index * 3] = randomBetween(-58, 58);
          positionArray[index * 3 + 1] = randomBetween(-26, 26);
          positionArray[zIndex] = -STAR_DEPTH;
        }
      }
      positions.needsUpdate = true;

      ship.group.position.y = 0.16 + Math.sin(elapsed * 1.18) * 0.1;
      ship.group.position.x = getFlightX(flightPath, elapsed);
      ship.group.rotation.x = -0.035 + Math.sin(elapsed * 0.72) * 0.012;
      ship.group.rotation.y = -0.11 + Math.sin(elapsed * 0.48) * 0.025;
      ship.group.rotation.z = 0.015 + Math.sin(elapsed * 0.84) * 0.012;

      ship.engineTrail.scale.x = 0.94 + Math.sin(elapsed * 18) * 0.08;
      ship.engineTrail.scale.y = 0.96 + Math.cos(elapsed * 16) * 0.12;
      ship.engineLight.intensity = 12 + Math.sin(elapsed * 17) * 4;

      ship.engineSparks.forEach(({ sprite, seed }, index) => {
        sprite.position.x -= delta * (0.9 + (index % 5) * 0.2);
        sprite.position.y += Math.sin(elapsed * 4 + seed) * delta * 0.14;
        sprite.position.z += Math.cos(elapsed * 3.4 + seed) * delta * 0.14;

        if (sprite.position.x < ship.engineX - 2.72) {
          sprite.position.x = randomBetween(ship.engineX - 0.26, ship.engineX - 0.06);
          sprite.position.y = randomBetween(-0.42, 0.24);
          sprite.position.z = randomBetween(-0.18, 0.18);
        }

        const fade = Math.max(0, 1 - Math.abs(sprite.position.x - ship.engineX) / 2.72);
        (sprite.material as THREE.SpriteMaterial).opacity = fade * 0.78;
      });

      nebula.position.x = 4.8 + Math.sin(elapsed * 0.08) * 0.8;
      nebula.rotation.z = Math.sin(elapsed * 0.05) * 0.06;
      planet.rotation.y += delta * 0.06;
      camera.position.x = Math.sin(elapsed * 0.16) * 0.14;
      camera.lookAt(0.18, 0.05, 0);

      renderer.render(scene, camera);
      (window as Window & { __fleetFlagshipPreviewReady?: boolean }).__fleetFlagshipPreviewReady = true;

      if (!prefersReducedMotion) {
        animationId = window.requestAnimationFrame(render);
      }
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);
    resize();
    render();

    return () => {
      window.cancelAnimationFrame(animationId);
      resizeObserver.disconnect();
      disposeObject3D(scene);
      renderer.dispose();
      shipTexture.dispose();
      starTexture.dispose();
      flameTexture.dispose();
    };
  }, []);

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />;
}
