'use client';

import { useRef, useCallback, useState, useEffect } from 'react';
import { springStep, isSpringSettled, SPRINGS } from '@/lib/spring';

export default function SealView({
  width,
  height,
}: {
  width: number;
  height: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const holdProgressRef = useRef(0);
  const holdVelRef = useRef(0);
  const shatterProgressRef = useRef(0);
  const shatterVelRef = useRef(0);
  const holdingRef = useRef(false);
  const completedRef = useRef(false);
  const animRef = useRef<number>(0);
  const lastTimeRef = useRef(0);
  const [completed, setCompleted] = useState(false);
  const [holding, setHolding] = useState(false);

  // Shatter particles
  const particlesRef = useRef<
    { angle: number; dist: number; speed: number; size: number }[]
  >([]);

  useEffect(() => {
    // Generate shatter particles
    const particles = [];
    for (let i = 0; i < 24; i++) {
      particles.push({
        angle: (i / 24) * Math.PI * 2,
        dist: 0,
        speed: 40 + Math.random() * 60,
        size: 2 + Math.random() * 3,
      });
    }
    particlesRef.current = particles;
  }, []);

  const draw = useCallback(
    (time: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const dt = Math.min((time - lastTimeRef.current) / 1000, 0.05);
      lastTimeRef.current = time;

      ctx.clearRect(0, 0, width, height);

      const cx = width / 2;
      const zoneTop = height * 0.45;
      const cy = zoneTop + (height - zoneTop) / 2 - 20;
      const baseRadius = Math.min(width, height) * 0.15;

      // Spring hold progress
      const holdTarget = holdingRef.current ? 1 : completedRef.current ? 1 : 0;
      const holdResult = springStep(
        holdProgressRef.current,
        holdVelRef.current,
        holdTarget,
        SPRINGS.heavy,
        dt
      );
      holdProgressRef.current = Math.max(0, Math.min(1, holdResult.position));
      holdVelRef.current = holdResult.velocity;

      // Check completion
      if (holdProgressRef.current >= 0.98 && holdingRef.current && !completedRef.current) {
        completedRef.current = true;
        setCompleted(true);
        // Trigger shatter
        shatterProgressRef.current = 0;
        shatterVelRef.current = 0;
        // Vibrate if supported
        if (navigator.vibrate) navigator.vibrate(100);
      }

      // Spring shatter
      if (completedRef.current) {
        const shatterResult = springStep(
          shatterProgressRef.current,
          shatterVelRef.current,
          1,
          SPRINGS.shatter,
          dt
        );
        shatterProgressRef.current = Math.max(
          0,
          Math.min(1, shatterResult.position)
        );
        shatterVelRef.current = shatterResult.velocity;
      }

      const holdP = holdProgressRef.current;
      const shatterP = shatterProgressRef.current;

      // Zone separator line
      ctx.beginPath();
      ctx.moveTo(0, zoneTop);
      ctx.lineTo(width, zoneTop);
      ctx.strokeStyle = 'rgba(255,255,255,0.06)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Zone background
      const zoneGrad = ctx.createLinearGradient(0, zoneTop, 0, height);
      zoneGrad.addColorStop(0, 'rgba(8,8,12,0.95)');
      zoneGrad.addColorStop(1, 'rgba(3,3,5,0.98)');
      ctx.fillStyle = zoneGrad;
      ctx.fillRect(0, zoneTop, width, height - zoneTop);

      // Title
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.letterSpacing = '3px';
      ctx.fillText(
        completedRef.current ? 'SEALED' : 'WALLET MODE',
        cx,
        zoneTop - 30
      );

      // Track ring
      const ringRadius = baseRadius * (completedRef.current ? 1 - shatterP * 0.2 : 1);
      ctx.beginPath();
      ctx.arc(cx, cy, ringRadius, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255,255,255,0.08)';
      ctx.lineWidth = 6;
      ctx.stroke();

      // Progress arc
      const sweepAngle = holdP * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(cx, cy, ringRadius, -Math.PI / 2, -Math.PI / 2 + sweepAngle);
      const arcColor = completedRef.current
        ? `rgba(100,255,180,${0.7 - shatterP * 0.5})`
        : `rgba(255,255,255,${0.4 + holdP * 0.4})`;
      ctx.strokeStyle = arcColor;
      ctx.lineWidth = completedRef.current ? 6 : 6 + holdP * 3;
      ctx.lineCap = 'round';
      ctx.stroke();

      // Shatter particles
      if (completedRef.current && shatterP > 0) {
        for (const p of particlesRef.current) {
          const d = p.speed * shatterP;
          const px = cx + Math.cos(p.angle) * (ringRadius - d);
          const py = cy + Math.sin(p.angle) * (ringRadius - d);
          const opacity = 0.6 * (1 - shatterP);
          ctx.beginPath();
          ctx.arc(px, py, p.size * (1 - shatterP * 0.5), 0, Math.PI * 2);
          ctx.fillStyle = `rgba(100,255,180,${opacity})`;
          ctx.fill();
        }
      }

      // Fingerprint icon (simplified circles)
      const fpAlpha = completedRef.current ? 0.3 : 0.15 + holdP * 0.3;
      ctx.strokeStyle = `rgba(255,255,255,${fpAlpha})`;
      ctx.lineWidth = 1.5;
      for (let i = 1; i <= 4; i++) {
        const r = i * (baseRadius * 0.15);
        ctx.beginPath();
        ctx.arc(cx, cy, r, -Math.PI * 0.7, Math.PI * 0.7);
        ctx.stroke();
      }

      // Center fingerprint text
      ctx.fillStyle = `rgba(255,255,255,${fpAlpha + 0.1})`;
      ctx.font = `${Math.round(baseRadius * 0.5)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('\uD83D\uDD10', cx, cy);

      // Bottom instruction
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(
        completedRef.current ? 'TRANSACTION CONFIRMED' : 'PRESS AND HOLD',
        cx,
        cy + ringRadius + 40
      );

      animRef.current = requestAnimationFrame(draw);
    },
    [width, height]
  );

  useEffect(() => {
    lastTimeRef.current = performance.now();
    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [draw]);

  const handlePointerDown = () => {
    holdingRef.current = true;
    setHolding(true);
    if (completedRef.current) {
      // Reset for another transaction
      completedRef.current = false;
      setCompleted(false);
      holdProgressRef.current = 0;
      holdVelRef.current = 0;
      shatterProgressRef.current = 0;
      shatterVelRef.current = 0;
    }
  };

  const handlePointerUp = () => {
    holdingRef.current = false;
    setHolding(false);
  };

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width,
        height,
        touchAction: 'none',
        cursor: 'pointer',
      }}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onPointerLeave={handlePointerUp}
    />
  );
}
