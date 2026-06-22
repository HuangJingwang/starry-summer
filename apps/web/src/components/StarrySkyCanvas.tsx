'use client';

import { useEffect, useRef } from 'react';

import { SHIP_APPEAR_INTERVAL_MS, selectFleetEncounterVariant } from './starry-sky-encounters';

interface Star {
  x: number;
  y: number;
  radius: number;
  phase: number;
  speed: number;
  color: string;
}

interface ShootingStar {
  x: number;
  y: number;
  length: number;
  speed: number;
  opacity: number;
  active: boolean;
}

interface Nebula {
  x: number;
  y: number;
  radiusX: number;
  radiusY: number;
  hue: number;
  opacity: number;
  phase: number;
  driftX: number;
  driftY: number;
}

interface Starship {
  variant: 'scout' | 'voyager';
  x: number;
  y: number;
  width: number;
  speed: number;
  phase: number;
  drift: number;
  angle: number;
  trailLength: number;
}

interface FeaturedStarship {
  x: number;
  y: number;
  scale: number;
  speed: number;
  phase: number;
  drift: number;
}

const MAX_SHIP_SCREEN_RATIO = 0.045;
const ENGINE_PARTICLES = 6;
const SHOOTING_STAR_INTERVAL_FRAMES = 520;

const randomBetween = (min: number, max: number) => min + Math.random() * (max - min);

const createNebulae = (width: number, height: number): Nebula[] =>
  Array.from({ length: 4 }, (_, index) => ({
    driftX: randomBetween(8, 24) * (index % 2 === 0 ? 1 : -1),
    driftY: randomBetween(6, 18) * (index % 2 === 0 ? -1 : 1),
    hue: [190, 205, 168, 260][index] ?? 205,
    opacity: randomBetween(0.08, 0.16),
    phase: randomBetween(0, Math.PI * 2),
    radiusX: width * randomBetween(0.22, 0.42),
    radiusY: height * randomBetween(0.18, 0.34),
    x: width * randomBetween(0.08, 0.92),
    y: height * randomBetween(0.08, 0.82),
  }));

const createExplorationFleet = (width: number, height: number): Starship[] => {
  const maxShipWidth = Math.max(18, Math.min(width * MAX_SHIP_SCREEN_RATIO, 46));

  const fleet: Starship[] = [
    {
      angle: randomBetween(-0.07, 0.04),
      drift: randomBetween(6, 12),
      phase: randomBetween(0, Math.PI * 2),
      speed: randomBetween(0.18, 0.28),
      trailLength: randomBetween(34, 58),
      variant: 'scout',
      width: maxShipWidth * randomBetween(0.66, 0.78),
      x: width * randomBetween(0.12, 0.26),
      y: height * randomBetween(0.18, 0.36),
    },
    {
      angle: randomBetween(-0.04, 0.08),
      drift: randomBetween(10, 18),
      phase: randomBetween(0, Math.PI * 2),
      speed: randomBetween(0.14, 0.24),
      trailLength: randomBetween(74, 104),
      variant: 'voyager',
      width: maxShipWidth,
      x: width * randomBetween(0.56, 0.78),
      y: height * randomBetween(0.52, 0.78),
    },
  ];

  const ship = fleet[Math.floor(Math.random() * fleet.length)];
  return ship ? [ship] : [];
};

const createFeaturedStarship = (width: number, height: number): FeaturedStarship => ({
  drift: randomBetween(4, 9),
  phase: randomBetween(0, Math.PI * 2),
  scale: width < 640 ? randomBetween(0.24, 0.3) : randomBetween(0.32, 0.38),
  speed: randomBetween(0.2, 0.34),
  x: -120,
  y: height * randomBetween(0.22, 0.36),
});

export function StarrySkyCanvas({ className = '', showFleet = true }: { className?: string; showFleet?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');

    if (!canvas || !context) {
      return undefined;
    }

    let animationId = 0;
    let stars: Star[] = [];
    let nebulae: Nebula[] = [];
    let activeSmallStarship: Starship | null = null;
    let activeStarship: FeaturedStarship | null = null;
    let nextShipAt = window.performance.now() + SHIP_APPEAR_INTERVAL_MS;
    let time = 0;
    const shootingStar: ShootingStar = {
      active: false,
      length: 0,
      opacity: 0,
      speed: 0,
      x: 0,
      y: 0,
    };

    const colors = ['#e0f2fe', '#22d3ee', '#2dd4bf', '#a78bfa', '#f0abfc'] as const;
    const pickColor = () => colors[Math.floor(Math.random() * colors.length)] ?? colors[0];

    const resizeCanvas = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      const width = canvas.offsetWidth || window.innerWidth;
      const height = canvas.offsetHeight || window.innerHeight;

      canvas.width = Math.floor(width * ratio);
      canvas.height = Math.floor(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);

      const density = Math.min(1, width / 1280);
      stars = Array.from({ length: Math.floor(190 * density) + 70 }, () => ({
        color: pickColor(),
        phase: Math.random() * Math.PI * 2,
        radius: Math.random() * 1.45 + 0.35,
        speed: 0.006 + Math.random() * 0.014,
        x: Math.random() * width,
        y: Math.random() * height * 0.92,
      }));

      nebulae = createNebulae(width, height);
      activeSmallStarship = null;
      activeStarship = null;
      nextShipAt = window.performance.now() + SHIP_APPEAR_INTERVAL_MS;
    };

    const triggerShootingStar = () => {
      if (shootingStar.active) {
        return;
      }

      shootingStar.active = true;
      shootingStar.length = 88 + Math.random() * 90;
      shootingStar.opacity = 0.85;
      shootingStar.speed = 7 + Math.random() * 5;
      shootingStar.x = Math.random() * canvas.offsetWidth * 0.55;
      shootingStar.y = Math.random() * canvas.offsetHeight * 0.3;
    };

    const drawNebula = (nebula: Nebula) => {
      const driftTime = time * 0.002;
      const x = nebula.x + Math.sin(driftTime + nebula.phase) * nebula.driftX;
      const y = nebula.y + Math.cos(driftTime * 0.86 + nebula.phase) * nebula.driftY;

      context.save();
      context.globalCompositeOperation = 'screen';
      context.translate(x, y);
      context.scale(1, nebula.radiusY / nebula.radiusX);

      const gradient = context.createRadialGradient(0, 0, 0, 0, 0, nebula.radiusX);
      gradient.addColorStop(0, `hsla(${nebula.hue}, 86%, 72%, ${nebula.opacity})`);
      gradient.addColorStop(0.42, `hsla(${nebula.hue + 18}, 76%, 58%, ${nebula.opacity * 0.38})`);
      gradient.addColorStop(1, 'rgba(2, 4, 11, 0)');

      context.fillStyle = gradient;
      context.beginPath();
      context.arc(0, 0, nebula.radiusX, 0, Math.PI * 2);
      context.fill();
      context.restore();
    };

    const drawEngineTrail = (ship: Starship, shipHeight: number, intensity = 1) => {
      const trail = context.createLinearGradient(-ship.width * 0.36, 0, -ship.trailLength, 0);
      trail.addColorStop(0, `rgba(125, 223, 255, ${0.34 * intensity})`);
      trail.addColorStop(0.38, `rgba(34, 211, 238, ${0.14 * intensity})`);
      trail.addColorStop(1, 'rgba(34, 211, 238, 0)');

      context.fillStyle = trail;
      context.beginPath();
      context.moveTo(-ship.width * 0.34, -shipHeight * 0.16);
      context.bezierCurveTo(-ship.trailLength * 0.48, -shipHeight * 0.28, -ship.trailLength * 0.82, -3, -ship.trailLength, 0);
      context.bezierCurveTo(-ship.trailLength * 0.82, 3, -ship.trailLength * 0.48, shipHeight * 0.28, -ship.width * 0.34, shipHeight * 0.16);
      context.closePath();
      context.fill();

      for (let index = 0; index < ENGINE_PARTICLES; index += 1) {
        const local = (time * 0.012 + ship.phase + index * 0.17) % 1;
        const particleX = -ship.width * 0.45 - local * ship.trailLength;
        const particleY = Math.sin(local * Math.PI * 2 + index) * shipHeight * 0.26;
        const opacity = (1 - local) * 0.32 * intensity;

        context.globalAlpha = opacity;
        context.fillStyle = index % 2 === 0 ? '#8beafe' : '#67e8f9';
        context.beginPath();
        context.arc(particleX, particleY, 0.9 + (1 - local) * 1.4, 0, Math.PI * 2);
        context.fill();
      }
      context.globalAlpha = 1;
    };

    const drawScoutStarship = (ship: Starship, shipHeight: number) => {
      const bodyGradient = context.createLinearGradient(-ship.width * 0.52, 0, ship.width * 0.52, 0);
      bodyGradient.addColorStop(0, 'rgba(89, 116, 154, 0.2)');
      bodyGradient.addColorStop(0.46, 'rgba(182, 220, 255, 0.42)');
      bodyGradient.addColorStop(1, 'rgba(226, 246, 255, 0.72)');

      context.fillStyle = bodyGradient;
      context.strokeStyle = 'rgba(125, 223, 255, 0.4)';
      context.lineWidth = 0.85;
      context.beginPath();
      context.moveTo(ship.width * 0.55, 0);
      context.bezierCurveTo(ship.width * 0.2, -shipHeight * 0.72, -ship.width * 0.3, -shipHeight * 0.54, -ship.width * 0.52, -shipHeight * 0.12);
      context.lineTo(-ship.width * 0.36, 0);
      context.lineTo(-ship.width * 0.52, shipHeight * 0.12);
      context.bezierCurveTo(-ship.width * 0.3, shipHeight * 0.54, ship.width * 0.2, shipHeight * 0.72, ship.width * 0.55, 0);
      context.closePath();
      context.fill();
      context.stroke();

      context.fillStyle = 'rgba(179, 245, 255, 0.58)';
      context.beginPath();
      context.ellipse(ship.width * 0.14, 0, ship.width * 0.12, shipHeight * 0.18, 0, 0, Math.PI * 2);
      context.fill();

      context.strokeStyle = 'rgba(167, 139, 250, 0.18)';
      context.beginPath();
      context.moveTo(-ship.width * 0.08, -shipHeight * 0.38);
      context.lineTo(-ship.width * 0.28, -shipHeight * 0.88);
      context.moveTo(-ship.width * 0.08, shipHeight * 0.38);
      context.lineTo(-ship.width * 0.28, shipHeight * 0.88);
      context.stroke();
    };

    const drawVoyagerStarship = (ship: Starship, shipHeight: number) => {
      const glow = context.createRadialGradient(ship.width * 0.06, 0, 0, ship.width * 0.06, 0, ship.width * 0.76);
      glow.addColorStop(0, 'rgba(103, 232, 249, 0.2)');
      glow.addColorStop(0.42, 'rgba(59, 130, 246, 0.08)');
      glow.addColorStop(1, 'rgba(59, 130, 246, 0)');

      context.fillStyle = glow;
      context.beginPath();
      context.arc(ship.width * 0.06, 0, ship.width * 0.76, 0, Math.PI * 2);
      context.fill();

      const wingGradient = context.createLinearGradient(-ship.width * 0.34, -shipHeight, ship.width * 0.36, shipHeight);
      wingGradient.addColorStop(0, 'rgba(45, 212, 191, 0.12)');
      wingGradient.addColorStop(0.52, 'rgba(148, 163, 184, 0.28)');
      wingGradient.addColorStop(1, 'rgba(167, 139, 250, 0.18)');

      context.fillStyle = wingGradient;
      context.strokeStyle = 'rgba(103, 232, 249, 0.34)';
      context.lineWidth = 0.8;

      context.beginPath();
      context.moveTo(ship.width * 0.5, 0);
      context.bezierCurveTo(ship.width * 0.18, -shipHeight * 1.18, -ship.width * 0.4, -shipHeight * 1.02, -ship.width * 0.58, -shipHeight * 0.2);
      context.bezierCurveTo(-ship.width * 0.25, -shipHeight * 0.34, ship.width * 0.12, -shipHeight * 0.16, ship.width * 0.5, 0);
      context.closePath();
      context.fill();
      context.stroke();

      context.beginPath();
      context.moveTo(ship.width * 0.5, 0);
      context.bezierCurveTo(ship.width * 0.18, shipHeight * 1.18, -ship.width * 0.4, shipHeight * 1.02, -ship.width * 0.58, shipHeight * 0.2);
      context.bezierCurveTo(-ship.width * 0.25, shipHeight * 0.34, ship.width * 0.12, shipHeight * 0.16, ship.width * 0.5, 0);
      context.closePath();
      context.fill();
      context.stroke();

      const hullGradient = context.createLinearGradient(-ship.width * 0.48, 0, ship.width * 0.58, 0);
      hullGradient.addColorStop(0, 'rgba(30, 41, 59, 0.42)');
      hullGradient.addColorStop(0.46, 'rgba(186, 230, 253, 0.48)');
      hullGradient.addColorStop(1, 'rgba(245, 253, 255, 0.82)');

      context.fillStyle = hullGradient;
      context.strokeStyle = 'rgba(203, 251, 255, 0.5)';
      context.beginPath();
      context.moveTo(ship.width * 0.62, 0);
      context.bezierCurveTo(ship.width * 0.3, -shipHeight * 0.5, -ship.width * 0.28, -shipHeight * 0.36, -ship.width * 0.5, 0);
      context.bezierCurveTo(-ship.width * 0.28, shipHeight * 0.36, ship.width * 0.3, shipHeight * 0.5, ship.width * 0.62, 0);
      context.closePath();
      context.fill();
      context.stroke();

      context.strokeStyle = 'rgba(34, 211, 238, 0.56)';
      context.lineWidth = 1.1;
      context.beginPath();
      context.moveTo(-ship.width * 0.32, 0);
      context.lineTo(ship.width * 0.34, 0);
      context.stroke();

      context.fillStyle = 'rgba(236, 254, 255, 0.78)';
      context.beginPath();
      context.ellipse(ship.width * 0.16, 0, ship.width * 0.13, shipHeight * 0.2, 0, 0, Math.PI * 2);
      context.fill();

      context.strokeStyle = 'rgba(103, 232, 249, 0.24)';
      context.lineWidth = 0.7;
      context.beginPath();
      context.ellipse(-ship.width * 0.2, 0, ship.width * 0.44, shipHeight * 0.82, 0, 0, Math.PI * 2);
      context.stroke();
    };

    const drawFeaturedStarship = (ship: FeaturedStarship, width: number, height: number) => {
      const t = time * 0.018;
      const driftY = Math.sin(time * 0.012 + ship.phase) * ship.drift;

      context.save();
      context.translate(ship.x, ship.y + driftY);
      context.scale(ship.scale, ship.scale);

      const drawPlasmaExhaust = (tx: number, ty: number, baseW: number, length: number) => {
        const currentLength = length + Math.sin(t * 1.7 + tx) * 3;
        const halo = context.createLinearGradient(tx - currentLength, ty, tx, ty);
        halo.addColorStop(0, 'rgba(34, 211, 238, 0)');
        halo.addColorStop(0.55, 'rgba(56, 189, 248, 0.12)');
        halo.addColorStop(0.88, 'rgba(129, 140, 248, 0.36)');
        halo.addColorStop(1, 'rgba(255, 255, 255, 0.78)');
        context.fillStyle = halo;
        context.beginPath();
        context.moveTo(tx, ty - baseW * 1.45);
        context.lineTo(tx - currentLength, ty);
        context.lineTo(tx, ty + baseW * 1.45);
        context.closePath();
        context.fill();

        const core = context.createLinearGradient(tx - currentLength * 0.68, ty, tx, ty);
        core.addColorStop(0, 'rgba(129, 140, 248, 0)');
        core.addColorStop(0.52, 'rgba(34, 211, 238, 0.62)');
        core.addColorStop(1, '#ffffff');
        context.fillStyle = core;
        context.beginPath();
        context.moveTo(tx, ty - baseW * 0.8);
        context.lineTo(tx - currentLength * 0.68, ty);
        context.lineTo(tx, ty + baseW * 0.8);
        context.closePath();
        context.fill();
      };

      const drawNacelle = (ny: number) => {
        const nacelle = context.createLinearGradient(-42, ny, 20, ny);
        nacelle.addColorStop(0, '#070c20');
        nacelle.addColorStop(0.48, '#152458');
        nacelle.addColorStop(1, '#24356f');
        context.fillStyle = nacelle;
        context.strokeStyle = 'rgba(129, 140, 248, 0.54)';
        context.lineWidth = 0.85;
        context.beginPath();
        context.moveTo(-42, ny - 3);
        context.lineTo(-30, ny - 6);
        context.lineTo(12, ny - 3);
        context.lineTo(20, ny);
        context.lineTo(12, ny + 3);
        context.lineTo(-30, ny + 6);
        context.lineTo(-42, ny + 3);
        context.closePath();
        context.fill();
        context.stroke();

        context.strokeStyle = 'rgba(34, 211, 238, 0.78)';
        context.lineWidth = 0.65;
        context.beginPath();
        context.moveTo(-22, ny - 2);
        context.lineTo(-6, ny - 2);
        context.moveTo(-22, ny + 2);
        context.lineTo(-6, ny + 2);
        context.stroke();
      };

      drawPlasmaExhaust(-50, 0, 4.2, 62);
      drawPlasmaExhaust(-42, -10, 2.4, 40);
      drawPlasmaExhaust(-42, 10, 2.4, 40);
      drawNacelle(-16);
      drawNacelle(16);

      context.fillStyle = '#0c1334';
      context.strokeStyle = 'rgba(129, 140, 248, 0.36)';
      context.lineWidth = 0.85;
      context.beginPath();
      context.moveTo(-25, -12);
      context.lineTo(-12, -21);
      context.lineTo(8, -21);
      context.lineTo(-2, -12);
      context.moveTo(-25, 12);
      context.lineTo(-12, 21);
      context.lineTo(8, 21);
      context.lineTo(-2, 12);
      context.fill();
      context.stroke();

      const topHull = context.createLinearGradient(-48, -12, 86, 0);
      topHull.addColorStop(0, '#0d1b3e');
      topHull.addColorStop(0.38, '#1a2c5a');
      topHull.addColorStop(0.78, '#314b8a');
      topHull.addColorStop(1, '#c5d7fe');
      context.fillStyle = topHull;
      context.strokeStyle = 'rgba(147, 197, 253, 0.72)';
      context.lineWidth = 0.95;
      context.beginPath();
      context.moveTo(85, 0);
      context.lineTo(44, -5);
      context.lineTo(18, -11);
      context.lineTo(-25, -11);
      context.lineTo(-48, -4);
      context.lineTo(-48, 0);
      context.closePath();
      context.fill();
      context.stroke();

      const bottomHull = context.createLinearGradient(-48, 12, 85, 0);
      bottomHull.addColorStop(0, '#050b1d');
      bottomHull.addColorStop(0.5, '#0b1435');
      bottomHull.addColorStop(1, '#182855');
      context.fillStyle = bottomHull;
      context.strokeStyle = 'rgba(99, 102, 241, 0.45)';
      context.lineWidth = 0.9;
      context.beginPath();
      context.moveTo(85, 0);
      context.lineTo(44, 5);
      context.lineTo(18, 11);
      context.lineTo(-25, 11);
      context.lineTo(-48, 4);
      context.lineTo(-48, 0);
      context.closePath();
      context.fill();
      context.stroke();

      context.fillStyle = 'rgba(30, 41, 89, 0.95)';
      context.strokeStyle = 'rgba(165, 180, 252, 0.58)';
      context.lineWidth = 0.55;
      context.beginPath();
      context.moveTo(65, 0);
      context.lineTo(25, -3.8);
      context.lineTo(2, -4.5);
      context.lineTo(-35, -4.5);
      context.lineTo(-35, 4.5);
      context.lineTo(2, 4.5);
      context.lineTo(25, 3.8);
      context.closePath();
      context.fill();
      context.stroke();

      context.strokeStyle = '#030712';
      context.lineWidth = 1;
      context.beginPath();
      context.moveTo(-42, 0);
      context.lineTo(60, 0);
      context.stroke();

      const tower = context.createLinearGradient(-22, -8, -6, -1);
      tower.addColorStop(0, '#080c1d');
      tower.addColorStop(0.6, '#152458');
      tower.addColorStop(1, '#44bcff');
      context.fillStyle = tower;
      context.strokeStyle = 'rgba(56, 189, 248, 0.82)';
      context.lineWidth = 0.8;
      context.beginPath();
      context.moveTo(-24, -2.5);
      context.lineTo(-20, -9.5);
      context.lineTo(-12, -9.5);
      context.lineTo(-4, -2.5);
      context.closePath();
      context.fill();
      context.stroke();

      const ringPhase = t * 0.22;
      context.save();
      context.translate(10, 0);
      context.strokeStyle = 'rgba(34, 211, 238, 0.5)';
      context.lineWidth = 1.1;
      context.beginPath();
      context.ellipse(0, 0, 4.5, 7.5, Math.PI / 4, 0, Math.PI * 2);
      context.stroke();
      context.fillStyle = '#a78bfa';
      context.beginPath();
      context.arc(Math.cos(ringPhase) * 3.5, Math.sin(ringPhase) * 5.5, 1.15, 0, Math.PI * 2);
      context.fill();
      context.restore();

      for (let index = 0; index < 5; index += 1) {
        const px = -22 + index * 11;
        context.fillStyle = 'rgba(254, 240, 138, 0.82)';
        context.beginPath();
        context.arc(px - 1, -6.5, 0.62, 0, Math.PI * 2);
        context.fill();
        context.fillStyle = 'rgba(34, 211, 238, 0.82)';
        context.beginPath();
        context.arc(px - 3, 6.5, 0.62, 0, Math.PI * 2);
        context.fill();
      }

      context.strokeStyle = 'rgba(255, 255, 255, 0.86)';
      context.lineWidth = 0.5;
      context.beginPath();
      context.moveTo(85, 0);
      context.lineTo(112, 0);
      context.stroke();

      context.restore();
      ship.x += ship.speed;
      return ship.x <= width + 128;
    };

    const drawStarship = (ship: Starship, width: number, height: number) => {
      const shipHeight = ship.width * (ship.variant === 'voyager' ? 0.38 : 0.34);
      const driftY = Math.sin(time * 0.015 + ship.phase) * ship.drift;
      const liftAngle = ship.angle + Math.sin(time * 0.009 + ship.phase) * 0.035;

      context.save();
      context.translate(ship.x, ship.y + driftY);
      context.rotate(liftAngle);

      drawEngineTrail(ship, shipHeight, ship.variant === 'voyager' ? 1.35 : 1);
      if (ship.variant === 'voyager') {
        drawVoyagerStarship(ship, shipHeight);
      } else {
        drawScoutStarship(ship, shipHeight);
      }

      context.restore();
      ship.x += ship.speed;
      return ship.x <= width + ship.width + ship.trailLength;
    };

    const draw = () => {
      const width = canvas.offsetWidth || window.innerWidth;
      const height = canvas.offsetHeight || window.innerHeight;
      time += 1;

      context.clearRect(0, 0, width, height);

      nebulae.forEach(drawNebula);

      stars.forEach((star) => {
        const opacity = 0.35 + Math.sin(time * star.speed + star.phase) * 0.26 + 0.28;
        context.globalAlpha = Math.max(0.18, Math.min(1, opacity));
        context.fillStyle = star.color;
        context.beginPath();
        context.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        context.fill();
      });
      context.globalAlpha = 1;

      if (time % SHOOTING_STAR_INTERVAL_FRAMES === 0 && Math.random() > 0.36) {
        triggerShootingStar();
      }

      if (shootingStar.active) {
        const gradient = context.createLinearGradient(
          shootingStar.x,
          shootingStar.y,
          shootingStar.x - shootingStar.length,
          shootingStar.y - shootingStar.length * 0.28,
        );
        gradient.addColorStop(0, `rgba(226, 232, 240, ${shootingStar.opacity})`);
        gradient.addColorStop(0.38, `rgba(34, 211, 238, ${shootingStar.opacity * 0.72})`);
        gradient.addColorStop(1, 'rgba(34, 211, 238, 0)');
        context.strokeStyle = gradient;
        context.lineWidth = 2;
        context.beginPath();
        context.moveTo(shootingStar.x, shootingStar.y);
        context.lineTo(shootingStar.x - shootingStar.length, shootingStar.y - shootingStar.length * 0.28);
        context.stroke();

        shootingStar.x += shootingStar.speed;
        shootingStar.y += shootingStar.speed * 0.28;
        shootingStar.opacity -= 0.018;

        if (shootingStar.opacity <= 0) {
          shootingStar.active = false;
        }
      }

      if (showFleet) {
        const now = window.performance.now();
        if (!activeStarship && !activeSmallStarship && now >= nextShipAt) {
          if (selectFleetEncounterVariant() === 'flagship') {
            activeStarship = createFeaturedStarship(width, height);
          } else {
            activeSmallStarship = createExplorationFleet(width, height)[0] ?? null;
            if (activeSmallStarship) {
              activeSmallStarship.x = -activeSmallStarship.width - activeSmallStarship.trailLength;
            }
          }
        }

        if (activeSmallStarship) {
          const stillVisible = drawStarship(activeSmallStarship, width, height);
          if (!stillVisible) {
            activeSmallStarship = null;
            nextShipAt = now + SHIP_APPEAR_INTERVAL_MS;
          }
        }

        if (activeStarship) {
          const stillVisible = drawFeaturedStarship(activeStarship, width, height);
          if (!stillVisible) {
            activeStarship = null;
            nextShipAt = now + SHIP_APPEAR_INTERVAL_MS;
          }
        }
      }

      animationId = window.requestAnimationFrame(draw);
    };

    resizeCanvas();
    animationId = window.requestAnimationFrame(draw);
    window.addEventListener('resize', resizeCanvas);

    return () => {
      window.cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [showFleet]);

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />;
}
