'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import {
  springStep2D,
  isSpring2DSettled,
  SPRINGS,
  type Vec2,
} from '@/lib/spring';
import { CATEGORIES, type OrbitCategory, type Expense } from '@/lib/types';

interface Props {
  onLaunch: (expense: Expense) => void;
  containerHeight: number;
  containerWidth: number;
}

const ZONE_HEIGHT = 280;
const MAX_PULL = 150;
const MAX_HORIZONTAL = 140;

export default function SlingshotView({
  onLaunch,
  containerHeight,
  containerWidth,
}: Props) {
  const [dragOffset, setDragOffset] = useState<Vec2>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [categoryIndex, setCategoryIndex] = useState(0);
  const [amount, setAmount] = useState(0);
  const [launching, setLaunching] = useState(false);
  const [showHint, setShowHint] = useState(true);

  const posRef = useRef<Vec2>({ x: 0, y: 0 });
  const velRef = useRef<Vec2>({ x: 0, y: 0 });
  const targetRef = useRef<Vec2>({ x: 0, y: 0 });
  const animRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const draggingRef = useRef(false);
  const startRef = useRef<{ x: number; y: number } | null>(null);

  const anchorX = containerWidth / 2;
  const anchorY = ZONE_HEIGHT - 70;

  const category = CATEGORIES[categoryIndex];

  const animateSpring = useCallback(() => {
    const now = performance.now();
    const dt = Math.min((now - lastTimeRef.current) / 1000, 0.05);
    lastTimeRef.current = now;

    if (draggingRef.current) {
      animRef.current = requestAnimationFrame(animateSpring);
      return;
    }

    const result = springStep2D(
      posRef.current,
      velRef.current,
      targetRef.current,
      SPRINGS.snappy,
      dt
    );

    posRef.current = result.position;
    velRef.current = result.velocity;

    setDragOffset({ ...result.position });

    if (isSpring2DSettled(result.position, result.velocity, targetRef.current, 0.3)) {
      // Check if we were launching (target was upward)
      if (targetRef.current.y < -50) {
        // Launch complete - fire expense and spring back
        const landX = 0.2 + Math.random() * 0.6;
        const landY = 0.1 + Math.random() * 0.4;
        onLaunch({
          id: crypto.randomUUID(),
          amount,
          category: category.id,
          timestamp: Date.now(),
          x: landX,
          y: landY,
        });
        // Spring back to origin
        targetRef.current = { x: 0, y: 0 };
        velRef.current = { x: 0, y: -50 };
        setLaunching(false);
        animRef.current = requestAnimationFrame(animateSpring);
      } else {
        // Settled at origin
        cancelAnimationFrame(animRef.current);
        setAmount(0);
        setLaunching(false);
      }
      return;
    }

    animRef.current = requestAnimationFrame(animateSpring);
  }, [amount, category.id, onLaunch]);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      draggingRef.current = true;
      setIsDragging(true);
      setShowHint(false);
      startRef.current = { x: e.clientX, y: e.clientY };
      cancelAnimationFrame(animRef.current);
      posRef.current = { ...dragOffset };
      velRef.current = { x: 0, y: 0 };
    },
    [dragOffset]
  );

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!draggingRef.current || !startRef.current) return;

    const dx = e.clientX - startRef.current.x;
    const dy = -(e.clientY - startRef.current.y); // invert Y: pull down = positive

    const clampedX = Math.max(-MAX_HORIZONTAL, Math.min(MAX_HORIZONTAL, dx));
    const clampedY = Math.max(0, Math.min(MAX_PULL, dy));

    posRef.current = { x: clampedX, y: clampedY };
    setDragOffset({ x: clampedX, y: clampedY });

    // Update category from horizontal
    const normalized = (clampedX / MAX_HORIZONTAL + 1) * 0.5;
    const idx = Math.round(normalized * (CATEGORIES.length - 1));
    setCategoryIndex(Math.max(0, Math.min(CATEGORIES.length - 1, idx)));

    // Update amount from vertical
    setAmount(Math.round((clampedY / MAX_PULL) * 200));
  }, []);

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!draggingRef.current) return;
      draggingRef.current = false;
      setIsDragging(false);
      startRef.current = null;

      const pullStrength = posRef.current.y / MAX_PULL;

      if (pullStrength > 0.15) {
        // Launch! Spring to a point above
        const launchY = -(200 + posRef.current.y * 1.5);
        targetRef.current = { x: 0, y: launchY };
        velRef.current = { x: -posRef.current.x * 3, y: -posRef.current.y * 8 };
        setLaunching(true);
      } else {
        // Snap back
        targetRef.current = { x: 0, y: 0 };
      }

      lastTimeRef.current = performance.now();
      animRef.current = requestAnimationFrame(animateSpring);
    },
    [animateSpring]
  );

  useEffect(() => {
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  const tension = Math.min(dragOffset.y / MAX_PULL, 1);
  const dialRotation = (dragOffset.x / MAX_HORIZONTAL) * 30; // degrees
  const puckX = anchorX + dragOffset.x;
  const puckY = anchorY - dragOffset.y;

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: ZONE_HEIGHT,
        touchAction: 'none',
        userSelect: 'none',
      }}
    >
      {/* Tension line */}
      <svg
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
        }}
      >
        <line
          x1={anchorX}
          y1={anchorY}
          x2={puckX}
          y2={puckY}
          stroke={`rgba(255,255,255,${0.15 + tension * 0.6})`}
          strokeWidth={2 + tension * 3}
          strokeLinecap="round"
        />
        {/* Anchor dot */}
        <circle
          cx={anchorX}
          cy={anchorY}
          r={5 + tension * 3}
          fill={`rgba(255,255,255,${0.3 + tension * 0.3})`}
        />
      </svg>

      {/* Amount + Category display */}
      <div
        style={{
          position: 'absolute',
          top: 16,
          left: 0,
          right: 0,
          textAlign: 'center',
          pointerEvents: 'none',
          transition: 'transform 0.1s',
          transform: isDragging ? 'scale(1.05)' : 'scale(1)',
          opacity: isDragging || amount > 0 ? 1 : 0.5,
        }}
      >
        <div
          style={{
            fontSize: 36,
            fontWeight: 700,
            color: 'white',
            fontFamily: 'var(--font-geist-mono)',
            letterSpacing: -1,
          }}
        >
          ${amount}
        </div>
        <div
          style={{
            fontSize: 13,
            letterSpacing: 3,
            color: category.color,
            fontWeight: 600,
            marginTop: 4,
          }}
        >
          {category.emoji} {category.label.toUpperCase()}
        </div>
      </div>

      {/* Category dial (ring) */}
      <div
        style={{
          position: 'absolute',
          left: anchorX - 55,
          top: anchorY - 55,
          width: 110,
          height: 110,
          borderRadius: '50%',
          border: '2px solid rgba(255,255,255,0.12)',
          transform: `rotate(${dialRotation}deg)`,
          pointerEvents: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Dial tick marks */}
        {CATEGORIES.map((_, i) => {
          const angle = (i / CATEGORIES.length) * 360 - 90;
          const rad = (angle * Math.PI) / 180;
          const tx = 50 * Math.cos(rad);
          const ty = 50 * Math.sin(rad);
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                width: 6,
                height: 6,
                borderRadius: '50%',
                backgroundColor:
                  i === categoryIndex
                    ? CATEGORIES[i].color
                    : 'rgba(255,255,255,0.2)',
                left: 55 + tx - 3,
                top: 55 + ty - 3,
                transition: 'background-color 0.15s',
              }}
            />
          );
        })}
        {/* Center dot */}
        <div
          style={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            backgroundColor: 'rgba(255,255,255,0.5)',
          }}
        />
      </div>

      {/* Puck */}
      <div
        style={{
          position: 'absolute',
          left: puckX - 28,
          top: puckY - 28,
          width: 56,
          height: 56,
          borderRadius: '50%',
          background: `radial-gradient(circle at 40% 35%, rgba(255,255,255,0.95), rgba(200,200,220,0.85))`,
          boxShadow: `0 0 ${12 + tension * 20}px rgba(255,255,255,${0.2 + tension * 0.3}), 
                       0 0 ${30 + tension * 40}px ${category.color}40`,
          pointerEvents: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 22,
        }}
      >
        {category.emoji}
      </div>

      {/* Gesture zone (invisible, captures all touch/mouse) */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          cursor: isDragging ? 'grabbing' : 'grab',
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      />

      {/* Hint text */}
      {showHint && !launching && (
        <div
          style={{
            position: 'absolute',
            bottom: 14,
            left: 0,
            right: 0,
            textAlign: 'center',
            fontSize: 11,
            letterSpacing: 2,
            color: 'rgba(255,255,255,0.35)',
            pointerEvents: 'none',
          }}
        >
          PULL BACK TO LAUNCH
        </div>
      )}

      {launching && (
        <div
          style={{
            position: 'absolute',
            bottom: 14,
            left: 0,
            right: 0,
            textAlign: 'center',
            fontSize: 11,
            letterSpacing: 3,
            color: 'rgba(255,255,255,0.4)',
            pointerEvents: 'none',
          }}
        >
          LAUNCHING
        </div>
      )}
    </div>
  );
}
