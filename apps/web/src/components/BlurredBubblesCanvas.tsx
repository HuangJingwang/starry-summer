'use client';

import { useEffect, useRef } from 'react';

type BubbleTheme = 'summer-day' | 'summer-night';

interface Bubble {
  x: number;
  y: number;
  r: number;
  alpha: number;
  color: string;
  vx: number;
  vy: number;
  jitter: number;
  blur: number;
}

const referenceDayColors = ['#f7da3952', '#8fdbe9', '#fffef8'];
const warmGlowColor = referenceDayColors[0];

function getTheme(): BubbleTheme {
  return document.documentElement.dataset.theme === 'summer-day' ? 'summer-day' : 'summer-night';
}

function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function makeNoise2D(random = Math.random) {
  const p = new Uint8Array(512);

  for (let index = 0; index < 256; index += 1) {
    p[index] = (random() * 256) | 0;
  }

  for (let index = 0; index < 256; index += 1) {
    p[index + 256] = p[index] ?? 0;
  }

  function grad2(hash: number, x: number, y: number) {
    const h = hash & 7;
    const u = h < 4 ? x : y;
    const v = h < 4 ? y : x;

    return (h & 1 ? -u : u) + (h & 2 ? -2 * v : 2 * v);
  }

  const g2 = (3.0 - Math.sqrt(3.0)) / 6.0;
  const f2 = 0.5 * (Math.sqrt(3.0) - 1.0);

  return function noise2D(xin: number, yin: number) {
    let n0 = 0;
    let n1 = 0;
    let n2 = 0;
    const s = (xin + yin) * f2;
    const i = Math.floor(xin + s);
    const j = Math.floor(yin + s);
    const t = (i + j) * g2;
    const x0 = xin - (i - t);
    const y0 = yin - (j - t);
    const i1 = x0 > y0 ? 1 : 0;
    const j1 = x0 > y0 ? 0 : 1;
    const x1 = x0 - i1 + g2;
    const y1 = y0 - j1 + g2;
    const x2 = x0 - 1 + 2 * g2;
    const y2 = y0 - 1 + 2 * g2;
    const ii = i & 255;
    const jj = j & 255;

    const t0 = 0.5 - x0 * x0 - y0 * y0;
    if (t0 >= 0) {
      const gi0 = p[ii + (p[jj] ?? 0)] ?? 0;
      n0 = t0 * t0 * t0 * t0 * grad2(gi0, x0, y0);
    }

    const t1 = 0.5 - x1 * x1 - y1 * y1;
    if (t1 >= 0) {
      const gi1 = p[ii + i1 + (p[jj + j1] ?? 0)] ?? 0;
      n1 = t1 * t1 * t1 * t1 * grad2(gi1, x1, y1);
    }

    const t2 = 0.5 - x2 * x2 - y2 * y2;
    if (t2 >= 0) {
      const gi2 = p[ii + 1 + (p[jj + 1] ?? 0)] ?? 0;
      n2 = t2 * t2 * t2 * t2 * grad2(gi2, x2, y2);
    }

    return 40 * (n0 + n1 + n2);
  };
}

export function BlurredBubblesCanvas({ className = '' }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const noiseRef = useRef(makeNoise2D());

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');

    if (!canvas || !context) {
      return undefined;
    }

    let animationId = 0;
    let width = 0;
    let height = 0;
    let ratio = 1;
    let bubbles: Bubble[] = [];
    let theme = getTheme();
    let lastFrame = 0;
    let accumulatedTime = 0;
    let gridCols = 0;
    let gridRows = 0;
    let grid = new Float32Array(0);
    const gridCell = 80;
    const targetFrameMs = 1000 / 6;
    const bottomBandStart = 0.8;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const allocateGrid = () => {
      gridCols = Math.max(1, Math.ceil(width / gridCell));
      gridRows = Math.max(1, Math.ceil(height / gridCell));
      grid = new Float32Array(gridCols * gridRows);
    };

    const stampOccupancy = (x: number, y: number, r: number) => {
      const c0 = Math.floor((x - r) / gridCell);
      const c1 = Math.floor((x + r) / gridCell);
      const r0 = Math.floor((y - r) / gridCell);
      const r1 = Math.floor((y + r) / gridCell);

      for (let cy = r0; cy <= r1; cy += 1) {
        for (let cx = c0; cx <= c1; cx += 1) {
          if (cx < 0 || cy < 0 || cx >= gridCols || cy >= gridRows) {
            continue;
          }

          const index = cy * gridCols + cx;
          grid[index] = (grid[index] ?? 0) + 0.5;
        }
      }
    };

    const lowestOccupancyTarget = () => {
      const startRow = Math.floor(gridRows * bottomBandStart);
      let bestIndex = startRow * gridCols;
      let bestValue = Infinity;

      for (let cy = startRow; cy < gridRows; cy += 1) {
        for (let cx = 0; cx < gridCols; cx += 1) {
          const index = cy * gridCols + cx;
          const value = grid[index] ?? 0;

          if (value < bestValue) {
            bestValue = value;
            bestIndex = index;
          }
        }
      }

      return {
        tx: ((bestIndex % gridCols) + 0.5) * gridCell,
        ty: (Math.floor(bestIndex / gridCols) + 0.5) * gridCell,
      };
    };

    const createBubbles = () => {
      const count = width < 640 ? 4 : 6;
      const minRadius = 250;
      const maxRadius = 400;
      const minDist = Math.max(minRadius * 0.2, 80);
      const nextBubbles: Bubble[] = [];
      let tries = 0;

      while (nextBubbles.length < count && tries < 5000) {
        tries += 1;
        const color = referenceDayColors[nextBubbles.length % referenceDayColors.length] ?? '#8fdbe9';
        const isWarmGlow = color === warmGlowColor;
        const r = isWarmGlow ? rand(150, 240) : rand(minRadius, maxRadius);
        const x = rand(-r / 2, width + r / 2);
        const y = rand(height * bottomBandStart, height * 1.2);
        const ok = nextBubbles.every((bubble) => {
          const distance = Math.hypot(bubble.x - x, bubble.y - y);

          return distance >= (bubble.r + r) * 0.6 && distance >= minDist;
        });

        if (ok) {
          nextBubbles.push({
            alpha: isWarmGlow ? 0.42 : 0.8,
            blur: isWarmGlow ? rand(120, 220) : rand(200, 400),
            color,
            jitter: rand(0.6, 1.2),
            r,
            vx: rand(-0.2, 0.2),
            vy: rand(-0.2, 0.2),
            x,
            y,
          });
        }
      }

      bubbles = nextBubbles;
    };

    const resizeCanvas = () => {
      ratio = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.offsetWidth || window.innerWidth;
      height = canvas.offsetHeight || window.innerHeight;
      canvas.width = Math.floor(width * ratio);
      canvas.height = Math.floor(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      allocateGrid();
      createBubbles();
    };

    const updatePhysics = (time: number) => {
      const { tx, ty } = lowestOccupancyTarget();

      bubbles.forEach((bubble, index) => {
        const noise = noiseRef.current(bubble.x * 0.0008, bubble.y * 0.0008 + time * 0.00015);
        const angle = noise * Math.PI * 2;
        const fx = Math.cos(angle) * 0.12 * bubble.jitter;
        const fy = Math.sin(angle) * 0.12 * bubble.jitter;
        let sx = 0;
        let sy = 0;

        bubbles.forEach((other, otherIndex) => {
          if (index === otherIndex) {
            return;
          }

          const dx = bubble.x - other.x;
          const dy = bubble.y - other.y;
          const distanceSquared = dx * dx + dy * dy;
          const minDistance = (bubble.r + other.r) * 0.4;

          if (distanceSquared < minDistance * minDistance && distanceSquared > 0.001) {
            const distance = Math.sqrt(distanceSquared);
            const push = (minDistance - distance) / minDistance;
            sx += (dx / distance) * push * 0.8;
            sy += (dy / distance) * push * 0.8;
          }
        });

        const dxTarget = tx - bubble.x;
        const dyTarget = ty - bubble.y;
        const targetDistance = Math.hypot(dxTarget, dyTarget) + 0.001;
        const bandMin = height * bottomBandStart;
        const bandMax = height * 1.5;
        let by = 0;

        if (bubble.y < bandMin) {
          by += (bandMin - bubble.y) * 0.01;
        }

        if (bubble.y > bandMax) {
          by -= (bubble.y - bandMax) * 0.01;
        }

        bubble.vx += fx + sx + (dxTarget / targetDistance) * 0.05;
        bubble.vy += fy + sy + (dyTarget / targetDistance) * 0.05 + by;
        bubble.vx *= 0.95;
        bubble.vy *= 0.95;

        const velocity = Math.hypot(bubble.vx, bubble.vy);
        if (velocity > 2) {
          bubble.vx = (bubble.vx / velocity) * 2;
          bubble.vy = (bubble.vy / velocity) * 2;
        }

        bubble.x += bubble.vx;
        bubble.y += bubble.vy;

        if (bubble.x < -bubble.r - bubble.blur / 3) {
          bubble.x = width + bubble.r + bubble.blur / 3;
        }

        if (bubble.x > width + bubble.r + bubble.blur / 3) {
          bubble.x = -bubble.r - bubble.blur / 3;
        }

        bubble.y = Math.min(Math.max(bubble.y, bandMin - bubble.r * 0.25), bandMax + bubble.r * 0.25);
        stampOccupancy(bubble.x, bubble.y, bubble.r * 0.6);
      });
    };

    const drawBubbles = () => {
      bubbles.forEach((bubble) => {
        context.save();
        context.filter = `blur(${bubble.blur}px)`;
        context.globalAlpha = bubble.alpha;
        context.fillStyle = bubble.color;
        context.beginPath();
        context.arc(bubble.x, bubble.y, bubble.r, 0, Math.PI * 2);
        context.fill();
        context.restore();
      });
    };

    const draw = (time: number) => {
      if (document.hidden) {
        animationId = window.requestAnimationFrame(draw);
        return;
      }

      const deltaTime = lastFrame ? time - lastFrame : 0;
      lastFrame = time;
      accumulatedTime += deltaTime;

      if (accumulatedTime < targetFrameMs) {
        animationId = window.requestAnimationFrame(draw);
        return;
      }

      accumulatedTime = 0;
      context.clearRect(0, 0, width, height);

      if (theme === 'summer-day') {
        updatePhysics(time);
        drawBubbles();
      }

      if (!prefersReducedMotion) {
        animationId = window.requestAnimationFrame(draw);
      }
    };

    const resizeObserver = new ResizeObserver(resizeCanvas);
    const themeObserver = new MutationObserver(() => {
      const nextTheme = getTheme();

      if (nextTheme !== theme) {
        theme = nextTheme;
        allocateGrid();
        createBubbles();
        context.clearRect(0, 0, width, height);
        if (theme === 'summer-day') {
          drawBubbles();
        }
      }
    });

    resizeCanvas();
    if (theme === 'summer-day') {
      drawBubbles();
    }
    if (prefersReducedMotion) {
      draw(Number.POSITIVE_INFINITY);
    } else {
      animationId = window.requestAnimationFrame(draw);
    }
    resizeObserver.observe(canvas);
    themeObserver.observe(document.documentElement, { attributeFilter: ['data-theme'], attributes: true });

    return () => {
      if (animationId) {
        window.cancelAnimationFrame(animationId);
      }
      resizeObserver.disconnect();
      themeObserver.disconnect();
    };
  }, []);

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />;
}
