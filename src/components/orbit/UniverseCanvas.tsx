'use client';

import { useRef, useEffect, useCallback } from 'react';
import type { Expense } from '@/lib/types';

interface Star {
  x: number;
  y: number;
  radius: number;
  brightness: number;
  twinkleSpeed: number;
  twinkleOffset: number;
}

interface Ripple {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  opacity: number;
  color: string;
}

interface ExpenseOrb {
  x: number;
  y: number;
  radius: number;
  targetRadius: number;
  color: string;
  opacity: number;
  pulsePhase: number;
  emoji: string;
}

interface Props {
  expenses: Expense[];
  ripples: Ripple[];
  walletMode: boolean;
  width: number;
  height: number;
}

function generateStars(count: number, w: number, h: number): Star[] {
  const stars: Star[] = [];
  const rng = mulberry32(42);
  for (let i = 0; i < count; i++) {
    stars.push({
      x: rng() * w,
      y: rng() * h * 0.7,
      radius: rng() * 1.6 + 0.3,
      brightness: rng() * 0.4 + 0.3,
      twinkleSpeed: rng() * 2 + 1,
      twinkleOffset: rng() * Math.PI * 2,
    });
  }
  return stars;
}

function mulberry32(a: number) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export default function UniverseCanvas({
  expenses,
  ripples,
  walletMode,
  width,
  height,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const starsRef = useRef<Star[]>([]);
  const orbsRef = useRef<ExpenseOrb[]>([]);
  const ripplesRef = useRef<Ripple[]>(ripples);
  const frameRef = useRef<number>(0);
  const timeRef = useRef<number>(0);

  ripplesRef.current = ripples;

  // Sync expense orbs
  useEffect(() => {
    const orbs: ExpenseOrb[] = expenses.map((e) => {
      const cat = getCategoryVisual(e.category);
      return {
        x: e.x * width,
        y: e.y * height * 0.6 + 40,
        radius: 0,
        targetRadius: Math.min(8 + e.amount * 0.15, 40),
        color: cat.color,
        opacity: 0.8,
        pulsePhase: Math.random() * Math.PI * 2,
        emoji: cat.emoji,
      };
    });
    orbsRef.current = orbs;
  }, [expenses, width, height]);

  // Generate stars on resize
  useEffect(() => {
    if (width > 0 && height > 0) {
      starsRef.current = generateStars(120, width, height);
    }
  }, [width, height]);

  const draw = useCallback(
    (time: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const dt = (time - timeRef.current) / 1000;
      timeRef.current = time;

      // Background
      const bgGrad = ctx.createRadialGradient(
        width * 0.5,
        height * 0.3,
        0,
        width * 0.5,
        height * 0.3,
        width * 1.2
      );
      if (walletMode) {
        bgGrad.addColorStop(0, '#0a0a0f');
        bgGrad.addColorStop(1, '#050506');
      } else {
        bgGrad.addColorStop(0, '#0a0e1a');
        bgGrad.addColorStop(1, '#020307');
      }
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Stars (fade out in wallet mode)
      if (!walletMode) {
        const stars = starsRef.current;
        for (const star of stars) {
          const twinkle =
            Math.sin(time * 0.001 * star.twinkleSpeed + star.twinkleOffset) *
              0.3 +
            0.7;
          ctx.beginPath();
          ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255,255,255,${star.brightness * twinkle})`;
          ctx.fill();
        }

        // Nebula glow
        const glowGrad = ctx.createRadialGradient(
          width * 0.6,
          height * 0.2,
          0,
          width * 0.6,
          height * 0.2,
          width * 0.25
        );
        glowGrad.addColorStop(0, 'rgba(100,140,255,0.06)');
        glowGrad.addColorStop(0.5, 'rgba(80,60,180,0.03)');
        glowGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = glowGrad;
        ctx.fillRect(0, 0, width, height);
      }

      // Expense orbs with spring toward target size
      for (const orb of orbsRef.current) {
        // Spring radius toward target
        const diff = orb.targetRadius - orb.radius;
        orb.radius += diff * 4 * Math.min(dt, 0.05);

        const pulse = Math.sin(time * 0.002 + orb.pulsePhase) * 2;
        const r = orb.radius + pulse;

        // Glow
        const glowGrad = ctx.createRadialGradient(
          orb.x,
          orb.y,
          r * 0.3,
          orb.x,
          orb.y,
          r * 2.5
        );
        glowGrad.addColorStop(0, orb.color + '40');
        glowGrad.addColorStop(1, orb.color + '00');
        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.arc(orb.x, orb.y, r * 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Core
        ctx.beginPath();
        ctx.arc(orb.x, orb.y, r, 0, Math.PI * 2);
        ctx.fillStyle = orb.color + 'CC';
        ctx.fill();

        // Emoji
        if (orb.radius > 8) {
          ctx.font = `${Math.round(orb.radius * 0.9)}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(orb.emoji, orb.x, orb.y);
        }
      }

      // Ripples
      const activeRipples = ripplesRef.current;
      for (const ripple of activeRipples) {
        if (ripple.opacity <= 0) continue;
        ctx.beginPath();
        ctx.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2);
        ctx.strokeStyle = ripple.color.replace(
          ')',
          `,${ripple.opacity})`
        ).replace('rgb', 'rgba');
        ctx.lineWidth = 2 + (1 - ripple.radius / ripple.maxRadius) * 4;
        ctx.stroke();
      }

      frameRef.current = requestAnimationFrame(draw);
    },
    [width, height, walletMode]
  );

  useEffect(() => {
    timeRef.current = performance.now();
    frameRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frameRef.current);
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{ position: 'absolute', top: 0, left: 0, width, height }}
    />
  );
}

function getCategoryVisual(cat: string) {
  const map: Record<string, { color: string; emoji: string }> = {
    food: { color: '#FF6B6B', emoji: '\uD83C\uDF55' },
    travel: { color: '#4ECDC4', emoji: '\u2708\uFE0F' },
    gear: { color: '#45B7D1', emoji: '\u2699\uFE0F' },
    fun: { color: '#96CEB4', emoji: '\uD83C\uDFAE' },
    health: { color: '#FFEAA7', emoji: '\uD83D\uDC9A' },
  };
  return map[cat] || { color: '#ffffff', emoji: '\u2B50' };
}

export type { Ripple };
