import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

export function createOrbitalScene(host: HTMLDivElement) {
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.3;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 50);
  camera.position.set(0, 0, 8.4);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  const environment = pmrem.fromScene(room, 0.03);
  scene.environment = environment.texture;
  room.dispose();
  pmrem.dispose();

  const chrome = new THREE.MeshPhysicalMaterial({ color: 0xcce4e9, metalness: 1, roughness: 0.17, clearcoat: 1, clearcoatRoughness: 0.12, envMapIntensity: 1.8 });
  const teal = new THREE.MeshPhysicalMaterial({ color: 0x48dbc8, metalness: 0.82, roughness: 0.2, clearcoat: 1, envMapIntensity: 1.5 });
  const fine = new THREE.MeshStandardMaterial({ color: 0x87b4b8, metalness: 0.8, roughness: 0.34 });
  const group = new THREE.Group();
  scene.add(group);

  const shape = new THREE.Shape();
  shape.moveTo(0, 1.45);
  shape.quadraticCurveTo(0.16, 0.2, 1.4, 0);
  shape.quadraticCurveTo(0.16, -0.2, 0, -1.45);
  shape.quadraticCurveTo(-0.16, -0.2, -1.4, 0);
  shape.quadraticCurveTo(-0.16, 0.2, 0, 1.45);
  const starGeometry = new THREE.ExtrudeGeometry(shape, { depth: 0.28, bevelEnabled: true, bevelSegments: 6, steps: 1, bevelSize: 0.16, bevelThickness: 0.18, curveSegments: 28 });
  starGeometry.center();
  const star = new THREE.Mesh(starGeometry, chrome);
  star.rotation.set(0.12, -0.35, -0.18);
  group.add(star);

  const orbit = new THREE.Group();
  orbit.rotation.set(0.92, -0.4, -0.48);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(2.05, 0.045, 14, 160), chrome);
  orbit.add(ring);
  const innerRing = new THREE.Mesh(new THREE.TorusGeometry(1.91, 0.009, 8, 128), fine);
  orbit.add(innerRing);
  const satellite = new THREE.Mesh(new THREE.SphereGeometry(0.19, 24, 24), teal);
  orbit.add(satellite);
  group.add(orbit);
  const orbitTwo = new THREE.Group();
  orbitTwo.rotation.set(-0.9, 0.65, 0.65);
  orbitTwo.add(new THREE.Mesh(new THREE.TorusGeometry(2.28, 0.014, 8, 160), fine));
  const moon = new THREE.Mesh(new THREE.SphereGeometry(0.105, 20, 20), chrome);
  orbitTwo.add(moon);
  group.add(orbitTwo);

  const shard = new THREE.Mesh(new THREE.OctahedronGeometry(0.14), teal);
  shard.position.set(1.6, 1.55, 0.5);
  group.add(shard);
  const shardTwo = new THREE.Mesh(new THREE.OctahedronGeometry(0.08), chrome);
  shardTwo.position.set(-1.8, -1.5, 0.6);
  group.add(shardTwo);

  const positions = new Float32Array(90 * 3);
  for (let index = 0; index < 90; index += 1) {
    const angle = index * 2.39996;
    const radius = 1.9 + ((index * 17) % 31) / 16;
    positions[index * 3] = Math.cos(angle) * radius;
    positions[index * 3 + 1] = Math.sin(angle) * radius;
    positions[index * 3 + 2] = -1.5 + ((index * 7) % 17) / 8;
  }
  const dustGeometry = new THREE.BufferGeometry();
  dustGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const dustMaterial = new THREE.PointsMaterial({ color: 0x94e0df, size: 0.018, transparent: true, opacity: 0.65, sizeAttenuation: true });
  const dust = new THREE.Points(dustGeometry, dustMaterial);
  scene.add(dust);
  scene.add(new THREE.HemisphereLight(0xcdfaff, 0x25466b, 2.4));
  const key = new THREE.DirectionalLight(0xffffff, 4);
  key.position.set(-3, 5, 5);
  scene.add(key);
  const rim = new THREE.PointLight(0x2dd4bf, 35, 15);
  rim.position.set(3, -1, 3);
  scene.add(rim);

  let paused = false;
  let inView = true;
  let destroyed = false;
  let contextUnavailable = false;
  let positioned = false;
  let frame = 0;
  let lastTime = 0;
  let elapsed = 0;
  const pointer = new THREE.Vector2();
  const section = host.closest('section') ?? host;

  function render(time: number) {
    frame = 0;
    if (destroyed || contextUnavailable) return;
    const delta = Math.min((time - lastTime) / 1000, 0.05);
    lastTime = time;
    if (!paused) elapsed += delta;
    if (!paused || !positioned) {
      group.rotation.y = THREE.MathUtils.lerp(group.rotation.y, pointer.x * 0.25, 0.045);
      group.rotation.x = THREE.MathUtils.lerp(group.rotation.x, -pointer.y * 0.16, 0.045);
      group.position.y = Math.sin(elapsed * 0.65) * 0.09;
      star.rotation.y = -0.35 + Math.sin(elapsed * 0.32) * 0.28;
      star.rotation.z = -0.18 + elapsed * 0.07;
      satellite.position.set(Math.cos(elapsed * 0.4 + 0.8) * 2.05, Math.sin(elapsed * 0.4 + 0.8) * 2.05, 0);
      moon.position.set(Math.cos(-elapsed * 0.24 + 2.4) * 2.28, Math.sin(-elapsed * 0.24 + 2.4) * 2.28, 0);
      shard.rotation.y = elapsed * 0.3;
      dust.rotation.z = elapsed * 0.018;
      positioned = true;
    }
    renderer.render(scene, camera);
    host.dataset.ready = 'true';
    if (!paused && inView && !document.hidden) frame = requestAnimationFrame(render);
  }
  function wake() {
    if (!frame && !destroyed && !contextUnavailable) { lastTime = performance.now(); frame = requestAnimationFrame(render); }
  }
  function resize() {
    const { width, height } = host.getBoundingClientRect();
    if (!width || !height) return;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
    wake();
  }
  function move(event: PointerEvent) {
    if (paused || event.pointerType !== 'mouse') return;
    const bounds = section.getBoundingClientRect();
    pointer.set(((event.clientX - bounds.left) / bounds.width - 0.5) * 2, ((event.clientY - bounds.top) / bounds.height - 0.5) * 2);
  }
  function leave() { pointer.set(0, 0); }
  function syncTheme() {
    const day = document.documentElement.dataset.theme === 'summer-day';
    dustMaterial.color.set(day ? 0x317874 : 0x94e0df);
    fine.color.set(day ? 0x517d83 : 0x87b4b8);
    renderer.toneMappingExposure = day ? 1.02 : 1.3;
    wake();
  }
  const resizeObserver = new ResizeObserver(resize);
  const intersection = new IntersectionObserver(([entry]) => {
    if (!entry) return;
    inView = entry.isIntersecting;
    if (inView) wake();
    else { cancelAnimationFrame(frame); frame = 0; }
  });
  const themeObserver = new MutationObserver(syncTheme);
  function visibility() {
    if (document.hidden) { cancelAnimationFrame(frame); frame = 0; }
    else if (inView) wake();
  }
  function contextLost(event: Event) {
    event.preventDefault();
    contextUnavailable = true;
    cancelAnimationFrame(frame);
    frame = 0;
    host.dataset.ready = 'false';
  }
  function contextRestored() { contextUnavailable = false; wake(); }
  renderer.domElement.addEventListener('webglcontextlost', contextLost);
  renderer.domElement.addEventListener('webglcontextrestored', contextRestored);
  host.appendChild(renderer.domElement);
  section.addEventListener('pointermove', move as EventListener, { passive: true });
  section.addEventListener('pointerleave', leave);
  document.addEventListener('visibilitychange', visibility);
  resizeObserver.observe(host);
  intersection.observe(host);
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  resize();
  syncTheme();

  return {
    setPaused(value: boolean) { paused = value; cancelAnimationFrame(frame); frame = 0; wake(); },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      cancelAnimationFrame(frame);
      resizeObserver.disconnect(); intersection.disconnect(); themeObserver.disconnect();
      section.removeEventListener('pointermove', move as EventListener);
      section.removeEventListener('pointerleave', leave);
      document.removeEventListener('visibilitychange', visibility);
      renderer.domElement.removeEventListener('webglcontextlost', contextLost);
      renderer.domElement.removeEventListener('webglcontextrestored', contextRestored);
      const materials = new Set<THREE.Material>();
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh || object instanceof THREE.Points) {
          object.geometry.dispose();
          (Array.isArray(object.material) ? object.material : [object.material]).forEach((material) => materials.add(material));
        }
      });
      materials.forEach((material) => material.dispose());
      environment.dispose();
      renderer.dispose();
      renderer.domElement.remove();
      host.dataset.ready = 'false';
    },
  };
}
