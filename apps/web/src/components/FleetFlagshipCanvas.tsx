'use client';

import { useEffect, useRef } from 'react';

interface StarPoint {
  x: number;
  y: number;
  radius: number;
  alpha: number;
  phase: number;
  speed: number;
}

interface EscortShip {
  x: number;
  y: number;
  scale: number;
  phase: number;
  drift: number;
  depth: number;
}

interface CloudLayer {
  x: number;
  y: number;
  radiusX: number;
  radiusY: number;
  alpha: number;
  hue: number;
  drift: number;
}

const randomBetween = (min: number, max: number) => min + Math.random() * (max - min);

function makeStars(width: number, height: number): StarPoint[] {
  const density = Math.min(1.1, Math.max(0.58, width / 1280));

  return Array.from({ length: Math.floor(260 * density) }, () => ({
    alpha: randomBetween(0.24, 0.9),
    phase: randomBetween(0, Math.PI * 2),
    radius: randomBetween(0.35, 1.55),
    speed: randomBetween(0.0018, 0.006),
    x: Math.random() * width,
    y: Math.random() * height * 0.84,
  }));
}

function makeEscorts(width: number, height: number): EscortShip[] {
  const positions = [
    [0.2, 0.32, 0.56, 0.5],
    [0.72, 0.27, 0.48, 0.42],
    [0.79, 0.48, 0.62, 0.58],
    [0.31, 0.61, 0.42, 0.72],
    [0.58, 0.18, 0.36, 0.35],
    [0.12, 0.5, 0.32, 0.68],
  ];

  return positions.map(([x, y, scale, depth]) => ({
    depth: depth ?? 0.5,
    drift: randomBetween(5, 16),
    phase: randomBetween(0, Math.PI * 2),
    scale: Math.max(18, Math.min(width, height) * (scale ?? 0.45) * 0.052),
    x: width * (x ?? 0.5),
    y: height * (y ?? 0.5),
  }));
}

function makeClouds(width: number, height: number): CloudLayer[] {
  return Array.from({ length: 11 }, (_, index) => ({
    alpha: randomBetween(0.04, 0.12),
    drift: randomBetween(10, 38) * (index % 2 === 0 ? 1 : -1),
    hue: [186, 205, 172, 38][index % 4] ?? 186,
    radiusX: width * randomBetween(0.16, 0.38),
    radiusY: height * randomBetween(0.05, 0.14),
    x: width * randomBetween(-0.06, 1.06),
    y: height * randomBetween(0.46, 0.96),
  }));
}

function drawSkyGradient(context: CanvasRenderingContext2D, width: number, height: number) {
  const sky = context.createLinearGradient(0, 0, 0, height);
  sky.addColorStop(0, '#030616');
  sky.addColorStop(0.42, '#06101d');
  sky.addColorStop(0.72, '#071318');
  sky.addColorStop(1, '#030606');
  context.fillStyle = sky;
  context.fillRect(0, 0, width, height);

  const horizon = context.createRadialGradient(width * 0.72, height * 0.7, 0, width * 0.72, height * 0.7, width * 0.68);
  horizon.addColorStop(0, 'rgba(19, 160, 177, 0.2)');
  horizon.addColorStop(0.36, 'rgba(20, 89, 113, 0.14)');
  horizon.addColorStop(1, 'rgba(3, 6, 14, 0)');
  context.fillStyle = horizon;
  context.fillRect(0, 0, width, height);
}

function drawMoonHalo(context: CanvasRenderingContext2D, width: number, height: number, time: number) {
  const x = width * 0.74;
  const y = height * 0.24;
  const radius = Math.min(width, height) * 0.13;
  const pulse = 1 + Math.sin(time * 0.0016) * 0.025;

  const aura = context.createRadialGradient(x, y, radius * 0.2, x, y, radius * 2.9 * pulse);
  aura.addColorStop(0, 'rgba(213, 248, 255, 0.16)');
  aura.addColorStop(0.3, 'rgba(74, 222, 226, 0.07)');
  aura.addColorStop(0.5, 'rgba(30, 86, 116, 0.04)');
  aura.addColorStop(1, 'rgba(3, 6, 14, 0)');
  context.fillStyle = aura;
  context.beginPath();
  context.arc(x, y, radius * 3.1, 0, Math.PI * 2);
  context.fill();

  const moon = context.createRadialGradient(x - radius * 0.22, y - radius * 0.18, 0, x, y, radius);
  moon.addColorStop(0, 'rgba(255, 255, 246, 0.42)');
  moon.addColorStop(0.38, 'rgba(206, 241, 241, 0.24)');
  moon.addColorStop(0.78, 'rgba(45, 90, 105, 0.14)');
  moon.addColorStop(1, 'rgba(15, 23, 42, 0.08)');
  context.fillStyle = moon;
  context.beginPath();
  context.arc(x, y, radius, 0, Math.PI * 2);
  context.fill();

  context.globalCompositeOperation = 'destination-out';
  context.beginPath();
  context.arc(x + radius * 0.34, y - radius * 0.08, radius * 0.9, 0, Math.PI * 2);
  context.fill();
  context.globalCompositeOperation = 'source-over';

  context.strokeStyle = 'rgba(210, 252, 255, 0.08)';
  context.lineWidth = 1.2;
  context.beginPath();
  context.arc(x, y, radius * 1.04, -0.7, Math.PI * 1.45);
  context.stroke();
}

function drawClouds(context: CanvasRenderingContext2D, clouds: CloudLayer[], width: number, height: number, time: number) {
  clouds.forEach((cloud, index) => {
    const drift = Math.sin(time * 0.0007 + index) * cloud.drift;
    const y = cloud.y + Math.cos(time * 0.0005 + index) * height * 0.012;

    context.save();
    context.globalCompositeOperation = 'screen';
    context.translate(cloud.x + drift, y);
    context.scale(1, cloud.radiusY / cloud.radiusX);
    const haze = context.createRadialGradient(0, 0, 0, 0, 0, cloud.radiusX);
    haze.addColorStop(0, `hsla(${cloud.hue}, 88%, 70%, ${cloud.alpha})`);
    haze.addColorStop(0.52, `hsla(${cloud.hue + 18}, 68%, 46%, ${cloud.alpha * 0.42})`);
    haze.addColorStop(1, 'rgba(3, 6, 14, 0)');
    context.fillStyle = haze;
    context.beginPath();
    context.arc(0, 0, cloud.radiusX, 0, Math.PI * 2);
    context.fill();
    context.restore();
  });

  const mist = context.createLinearGradient(0, height * 0.7, 0, height);
  mist.addColorStop(0, 'rgba(3, 6, 14, 0)');
  mist.addColorStop(0.62, 'rgba(0, 12, 18, 0.46)');
  mist.addColorStop(1, 'rgba(0, 0, 0, 0.92)');
  context.fillStyle = mist;
  context.fillRect(0, height * 0.56, width, height * 0.44);
}

function drawStars(context: CanvasRenderingContext2D, stars: StarPoint[], time: number) {
  stars.forEach((star) => {
    const twinkle = star.alpha + Math.sin(time * star.speed + star.phase) * 0.24;
    context.globalAlpha = Math.max(0.12, Math.min(1, twinkle));
    context.fillStyle = star.radius > 1.2 ? '#d8fbff' : '#9ee9f5';
    context.beginPath();
    context.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
    context.fill();
  });
  context.globalAlpha = 1;
}

function drawDistantEscort(
  context: CanvasRenderingContext2D,
  ship: EscortShip,
  time: number,
) {
  const drift = Math.sin(time * 0.0018 + ship.phase) * ship.drift;
  const width = ship.scale * 2.4;
  const height = ship.scale * 0.58;

  context.save();
  context.translate(ship.x, ship.y + drift);
  context.rotate(-0.04 + ship.depth * 0.06);
  context.globalAlpha = 0.5 + ship.depth * 0.38;

  const trail = context.createLinearGradient(-width * 0.2, 0, -width * 1.6, 0);
  trail.addColorStop(0, 'rgba(99, 238, 255, 0.34)');
  trail.addColorStop(0.48, 'rgba(45, 212, 191, 0.08)');
  trail.addColorStop(1, 'rgba(45, 212, 191, 0)');
  context.fillStyle = trail;
  context.beginPath();
  context.moveTo(-width * 0.18, -height * 0.22);
  context.bezierCurveTo(-width * 0.88, -height * 0.4, -width * 1.35, -height * 0.1, -width * 1.58, 0);
  context.bezierCurveTo(-width * 1.35, height * 0.1, -width * 0.88, height * 0.4, -width * 0.18, height * 0.22);
  context.closePath();
  context.fill();

  const hull = context.createLinearGradient(-width * 0.48, 0, width * 0.56, 0);
  hull.addColorStop(0, 'rgba(15, 25, 39, 0.82)');
  hull.addColorStop(0.5, 'rgba(105, 136, 151, 0.58)');
  hull.addColorStop(1, 'rgba(219, 250, 255, 0.86)');
  context.fillStyle = hull;
  context.strokeStyle = 'rgba(112, 246, 255, 0.32)';
  context.lineWidth = 0.8;
  context.beginPath();
  context.moveTo(width * 0.58, 0);
  context.lineTo(width * 0.06, -height * 0.48);
  context.lineTo(-width * 0.52, -height * 0.16);
  context.lineTo(-width * 0.38, 0);
  context.lineTo(-width * 0.52, height * 0.16);
  context.lineTo(width * 0.06, height * 0.48);
  context.closePath();
  context.fill();
  context.stroke();

  context.fillStyle = 'rgba(216, 252, 255, 0.82)';
  context.beginPath();
  context.ellipse(width * 0.18, 0, width * 0.08, height * 0.14, 0, 0, Math.PI * 2);
  context.fill();
  context.restore();
}

function drawMainEngineTrail(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  shipWidth: number,
  shipHeight: number,
  time: number,
) {
  const pulse = 0.82 + Math.sin(time * 0.006) * 0.18;
  const originX = -shipWidth * 0.5;
  const trailLength = Math.min(width * 0.74, shipWidth * 1.18);

  const trail = context.createLinearGradient(originX, 0, originX - trailLength, 0);
  trail.addColorStop(0, `rgba(255, 242, 204, ${0.58 * pulse})`);
  trail.addColorStop(0.11, `rgba(125, 249, 255, ${0.46 * pulse})`);
  trail.addColorStop(0.36, `rgba(34, 211, 238, ${0.18 * pulse})`);
  trail.addColorStop(0.68, `rgba(45, 212, 191, ${0.08 * pulse})`);
  trail.addColorStop(1, 'rgba(45, 212, 191, 0)');

  context.fillStyle = trail;
  context.beginPath();
  context.moveTo(originX, -shipHeight * 0.2);
  context.bezierCurveTo(
    originX - trailLength * 0.24,
    -shipHeight * 0.64,
    originX - trailLength * 0.78,
    -height * 0.04,
    originX - trailLength,
    0,
  );
  context.bezierCurveTo(
    originX - trailLength * 0.78,
    height * 0.04,
    originX - trailLength * 0.24,
    shipHeight * 0.64,
    originX,
    shipHeight * 0.2,
  );
  context.closePath();
  context.fill();

  const core = context.createRadialGradient(originX - shipWidth * 0.03, 0, 0, originX - shipWidth * 0.03, 0, shipHeight * 0.56);
  core.addColorStop(0, 'rgba(255, 255, 244, 0.94)');
  core.addColorStop(0.22, 'rgba(125, 249, 255, 0.76)');
  core.addColorStop(0.58, 'rgba(34, 211, 238, 0.24)');
  core.addColorStop(1, 'rgba(34, 211, 238, 0)');
  context.fillStyle = core;
  context.beginPath();
  context.ellipse(originX - shipWidth * 0.03, 0, shipHeight * 0.5, shipHeight * 0.34, 0, 0, Math.PI * 2);
  context.fill();

  for (let index = 0; index < 34; index += 1) {
    const local = (time * 0.0005 + index / 34) % 1;
    const particleX = originX - local * trailLength;
    const particleY = Math.sin(local * Math.PI * 5 + index) * shipHeight * (0.12 + (1 - local) * 0.34);
    context.globalAlpha = (1 - local) * 0.58;
    context.fillStyle = index % 4 === 0 ? '#fff7d6' : '#67e8f9';
    context.beginPath();
    context.arc(particleX, particleY, 1.1 + (1 - local) * 2.9, 0, Math.PI * 2);
    context.fill();
  }
  context.globalAlpha = 1;
}

function drawMainShip(context: CanvasRenderingContext2D, width: number, height: number, time: number) {
  const t = time * 0.001;
  const scale = Math.min(width * 0.58 / 170, height * 0.32 / 50);

  context.save();
  context.translate(width * 0.5 - scale * 20, height * 0.5 + Math.sin(t * 1.2) * height * 0.006);
  context.scale(scale, scale);

  const drawPlasmaExhaust = (tx: number, ty: number, baseW: number, length: number) => {
    const spark = Math.sin(t * 35 + tx) * 4;
    const currentLength = length + spark;

    const haloGrad = context.createLinearGradient(tx - currentLength, ty, tx, ty);
    haloGrad.addColorStop(0, 'rgba(34, 211, 238, 0)');
    haloGrad.addColorStop(0.5, 'rgba(56, 189, 248, 0.12)');
    haloGrad.addColorStop(0.85, 'rgba(129, 140, 248, 0.4)');
    haloGrad.addColorStop(1, 'rgba(255, 255, 255, 0.8)');
    context.fillStyle = haloGrad;
    context.beginPath();
    context.moveTo(tx, ty - baseW * 1.5);
    context.lineTo(tx - currentLength * 1.1, ty);
    context.lineTo(tx, ty + baseW * 1.5);
    context.closePath();
    context.fill();

    const coreGrad = context.createLinearGradient(tx - currentLength * 0.7, ty, tx, ty);
    coreGrad.addColorStop(0, 'rgba(129, 140, 248, 0)');
    coreGrad.addColorStop(0.5, 'rgba(34, 211, 238, 0.65)');
    coreGrad.addColorStop(0.9, 'rgba(255, 255, 255, 0.95)');
    coreGrad.addColorStop(1, '#ffffff');
    context.fillStyle = coreGrad;
    context.beginPath();
    context.moveTo(tx, ty - baseW);
    context.lineTo(tx - currentLength * 0.7, ty);
    context.lineTo(tx, ty + baseW);
    context.closePath();
    context.fill();

    context.fillStyle = 'rgba(255, 255, 255, 0.95)';
    context.shadowBlur = 6;
    context.shadowColor = '#22d3ee';
    for (let index = 1; index <= 3; index += 1) {
      const dx = tx - currentLength * 0.22 * index;
      context.beginPath();
      context.moveTo(dx, ty - baseW * 0.4);
      context.lineTo(dx - baseW * 0.9, ty);
      context.lineTo(dx, ty + baseW * 0.4);
      context.lineTo(dx + baseW * 0.9, ty);
      context.closePath();
      context.fill();
    }
    context.shadowBlur = 0;
  };

  drawPlasmaExhaust(-50, 0, 4.2, 70);
  drawPlasmaExhaust(-42, -10, 2.5, 45);
  drawPlasmaExhaust(-42, 10, 2.5, 45);

  const drawNacelle = (ny: number) => {
    const nacGrad = context.createLinearGradient(-42, ny, 16, ny);
    nacGrad.addColorStop(0, '#070c20');
    nacGrad.addColorStop(0.5, '#152458');
    nacGrad.addColorStop(1, '#1e295d');
    context.fillStyle = nacGrad;
    context.strokeStyle = 'rgba(129, 140, 248, 0.5)';
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

    context.strokeStyle = 'rgba(34, 211, 238, 0.8)';
    context.lineWidth = 0.65;
    context.beginPath();
    context.moveTo(-22, ny - 2);
    context.lineTo(-6, ny - 2);
    context.moveTo(-22, ny + 2);
    context.lineTo(-6, ny + 2);
    context.stroke();
  };

  drawNacelle(-16);
  drawNacelle(16);

  context.fillStyle = '#0c1334';
  context.strokeStyle = 'rgba(129, 140, 248, 0.4)';
  context.lineWidth = 0.9;
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

  const topHullGrad = context.createLinearGradient(-48, -12, 85, 0);
  topHullGrad.addColorStop(0, '#0d1b3e');
  topHullGrad.addColorStop(0.4, '#1a2c5a');
  topHullGrad.addColorStop(0.8, '#314b8a');
  topHullGrad.addColorStop(1, '#c5d7fe');

  context.fillStyle = topHullGrad;
  context.strokeStyle = 'rgba(147, 197, 253, 0.75)';
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

  const bottomHullGrad = context.createLinearGradient(-48, 12, 85, 0);
  bottomHullGrad.addColorStop(0, '#050b1d');
  bottomHullGrad.addColorStop(0.5, '#0b1435');
  bottomHullGrad.addColorStop(1, '#182855');

  context.fillStyle = bottomHullGrad;
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
  context.strokeStyle = 'rgba(165, 180, 252, 0.6)';
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

  const towerGrad = context.createLinearGradient(-22, -8, -6, -1);
  towerGrad.addColorStop(0, '#080c1d');
  towerGrad.addColorStop(0.6, '#152458');
  towerGrad.addColorStop(1, '#44bcff');
  context.fillStyle = towerGrad;
  context.strokeStyle = 'rgba(56, 189, 248, 0.85)';
  context.lineWidth = 0.85;
  context.beginPath();
  context.moveTo(-24, -2.5);
  context.lineTo(-20, -9.5);
  context.lineTo(-12, -9.5);
  context.lineTo(-4, -2.5);
  context.closePath();
  context.fill();
  context.stroke();

  context.fillStyle = '#f43f5e';
  context.beginPath();
  context.arc(-13, -9.5, 0.9, 0, Math.PI * 2);
  context.fill();

  const gravityRingPhase = t * 3.8;
  context.save();
  context.translate(10, 0);
  context.strokeStyle = 'rgba(34, 211, 238, 0.55)';
  context.lineWidth = 1.25;
  context.beginPath();
  context.ellipse(0, 0, 4.5, 7.5, Math.PI / 4, 0, Math.PI * 2);
  context.stroke();
  context.fillStyle = '#a78bfa';
  context.beginPath();
  context.arc(Math.cos(gravityRingPhase) * 3.5, Math.sin(gravityRingPhase) * 5.5, 1.3, 0, Math.PI * 2);
  context.shadowBlur = 8;
  context.shadowColor = '#c084fc';
  context.fill();
  context.restore();

  const drawHangarLights = (lx: number, ly: number, color: string) => {
    context.beginPath();
    context.arc(lx, ly, 0.65, 0, Math.PI * 2);
    context.fillStyle = color;
    context.fill();
  };

  const isBlinkerActive = Math.floor(t * 3) % 2 === 0;
  for (let index = 0; index < 5; index += 1) {
    const px = -22 + index * 11;
    drawHangarLights(px - 1, -6.5, 'rgba(254, 240, 138, 0.88)');
    drawHangarLights(px - 3, 6.5, 'rgba(34, 211, 238, 0.85)');
  }

  const dangerColor = isBlinkerActive ? '#ef4444' : 'rgba(239, 68, 68, 0.25)';
  drawHangarLights(20, -16, dangerColor);
  drawHangarLights(20, 16, dangerColor);

  context.strokeStyle = 'rgba(255, 255, 255, 0.88)';
  context.lineWidth = 0.5;
  context.beginPath();
  context.moveTo(85, 0);
  context.lineTo(114, 0);
  context.stroke();

  const pulseR = (t * 18) % 18;
  context.strokeStyle = `rgba(34, 211, 238, ${Math.max(0, 1 - pulseR / 18) * 0.45})`;
  context.lineWidth = 0.4;
  context.beginPath();
  context.arc(114, 0, pulseR * 0.38, 0, Math.PI * 2);
  context.stroke();
  context.restore();
}

function drawForeground(context: CanvasRenderingContext2D, width: number, height: number, time: number) {
  const vignette = context.createRadialGradient(width * 0.5, height * 0.5, height * 0.12, width * 0.5, height * 0.5, width * 0.72);
  vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
  vignette.addColorStop(0.74, 'rgba(0, 0, 0, 0.12)');
  vignette.addColorStop(1, 'rgba(0, 0, 0, 0.58)');
  context.fillStyle = vignette;
  context.fillRect(0, 0, width, height);
}

export function FleetFlagshipCanvas({ className = '' }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');

    if (!canvas || !context) {
      return undefined;
    }

    let animationId = 0;
    let width = 0;
    let height = 0;
    let stars: StarPoint[] = [];
    let escorts: EscortShip[] = [];
    let clouds: CloudLayer[] = [];
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const resizeCanvas = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.offsetWidth || window.innerWidth;
      height = canvas.offsetHeight || window.innerHeight;
      canvas.width = Math.floor(width * ratio);
      canvas.height = Math.floor(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      stars = makeStars(width, height);
      escorts = makeEscorts(width, height);
      clouds = makeClouds(width, height);
    };

    const draw = (time: number) => {
      context.clearRect(0, 0, width, height);
      drawSkyGradient(context, width, height);
      drawStars(context, stars, time);
      drawMainShip(context, width, height, time);
      drawForeground(context, width, height, time);

      (window as Window & { __fleetFlagshipPreviewReady?: boolean }).__fleetFlagshipPreviewReady = true;

      if (!prefersReducedMotion) {
        animationId = window.requestAnimationFrame(draw);
      }
    };

    const resizeObserver = new ResizeObserver(() => {
      resizeCanvas();
      if (prefersReducedMotion) {
        draw(0);
      }
    });

    resizeCanvas();
    resizeObserver.observe(canvas);
    draw(0);

    return () => {
      window.cancelAnimationFrame(animationId);
      resizeObserver.disconnect();
    };
  }, []);

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />;
}
