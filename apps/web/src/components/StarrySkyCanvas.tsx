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

      stars.forEach((star) => {
        const opacity = 0.35 + Math.sin(time * star.speed + star.phase) * 0.26 + 0.28;
        context.globalAlpha = Math.max(0.18, Math.min(1, opacity));
        context.fillStyle = star.color;
        context.beginPath();
        context.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        context.fill();
      });
      context.globalAlpha = 1;

      if (time % 150 === 0 && Math.random() > 0.18) {
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
