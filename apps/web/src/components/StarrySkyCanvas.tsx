'use client';

import { useEffect, useRef } from 'react';

interface Star {
  x: number;
  y: number;
  radius: number;
  phase: number;
  speed: number;
  color: string;
}

interface LightDust {
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  radius: number;
  phase: number;
  speed: number;
  color: string;
}

interface MistLayer {
  x: number;
  y: number;
  radius: number;
  speed: number;
  opacity: number;
}

interface ShootingStar {
  x: number;
  y: number;
  length: number;
  speed: number;
  opacity: number;
  active: boolean;
}

export function StarrySkyCanvas({ className = '' }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');

    if (!canvas || !context) {
      return undefined;
    }

    let animationId = 0;
    let stars: Star[] = [];
    let dust: LightDust[] = [];
    let mist: MistLayer[] = [];
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
      stars = Array.from({ length: Math.floor(145 * density) + 45 }, () => ({
        color: pickColor(),
        phase: Math.random() * Math.PI * 2,
        radius: Math.random() * 1.45 + 0.35,
        speed: 0.006 + Math.random() * 0.014,
        x: Math.random() * width,
        y: Math.random() * height * 0.92,
      }));

      dust = Array.from({ length: Math.floor(22 * density) + 8 }, () => {
        const x = Math.random() * width;
        const y = Math.random() * height;

        return {
          baseX: x,
          baseY: y,
          color: pickColor(),
          phase: Math.random() * Math.PI * 2,
          radius: Math.random() * 2.2 + 1,
          speed: 0.006 + Math.random() * 0.018,
          x,
          y,
        };
      });

      mist = Array.from({ length: 8 }, () => ({
        opacity: 0.08 + Math.random() * 0.09,
        radius: Math.random() * 180 + 130,
        speed: 0.035 + Math.random() * 0.045,
        x: Math.random() * width,
        y: height * (0.28 + Math.random() * 0.5),
      }));
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

    const draw = () => {
      const width = canvas.offsetWidth || window.innerWidth;
      const height = canvas.offsetHeight || window.innerHeight;
      time += 1;

      context.clearRect(0, 0, width, height);

      const skyGradient = context.createRadialGradient(width * 0.62, height * 0.38, 0, width * 0.55, height * 0.45, width * 0.75);
      skyGradient.addColorStop(0, 'rgba(34, 211, 238, 0.16)');
      skyGradient.addColorStop(0.34, 'rgba(45, 212, 191, 0.07)');
      skyGradient.addColorStop(0.72, 'rgba(15, 23, 42, 0.18)');
      skyGradient.addColorStop(1, 'rgba(4, 6, 14, 0)');
      context.fillStyle = skyGradient;
      context.fillRect(0, 0, width, height);

      mist.forEach((layer) => {
        layer.x += layer.speed;

        if (layer.x - layer.radius > width) {
          layer.x = -layer.radius;
        }

        const gradient = context.createRadialGradient(layer.x, layer.y, 0, layer.x, layer.y, layer.radius);
        gradient.addColorStop(0, `rgba(34, 211, 238, ${layer.opacity})`);
        gradient.addColorStop(0.42, `rgba(167, 139, 250, ${layer.opacity * 0.42})`);
        gradient.addColorStop(1, 'rgba(4, 6, 14, 0)');
        context.fillStyle = gradient;
        context.beginPath();
        context.ellipse(layer.x, layer.y, layer.radius, layer.radius * 0.34, -0.12, 0, Math.PI * 2);
        context.fill();
      });

      stars.forEach((star) => {
        const opacity = 0.35 + Math.sin(time * star.speed + star.phase) * 0.26 + 0.28;
        context.globalAlpha = Math.max(0.18, Math.min(1, opacity));
        context.fillStyle = star.color;
        context.beginPath();
        context.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        context.fill();
      });
      context.globalAlpha = 1;

      dust.forEach((particle) => {
        particle.phase += particle.speed;
        particle.x = particle.baseX + Math.sin(particle.phase * 1.7) * 22;
        particle.y = particle.baseY + Math.cos(particle.phase) * 16;

        const glow = context.createRadialGradient(particle.x, particle.y, 0, particle.x, particle.y, particle.radius * 8);
        glow.addColorStop(0, particle.color);
        glow.addColorStop(1, 'rgba(4, 6, 14, 0)');
        context.globalAlpha = 0.36 + Math.sin(particle.phase) * 0.2;
        context.fillStyle = glow;
        context.beginPath();
        context.arc(particle.x, particle.y, particle.radius * 8, 0, Math.PI * 2);
        context.fill();
      });
      context.globalAlpha = 1;

      if (time % 280 === 0 && Math.random() > 0.35) {
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

      animationId = window.requestAnimationFrame(draw);
    };

    resizeCanvas();
    animationId = window.requestAnimationFrame(draw);
    window.addEventListener('resize', resizeCanvas);

    return () => {
      window.cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />;
}
