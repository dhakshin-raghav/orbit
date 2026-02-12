'use client';

import { useRef, useEffect, useCallback, useState } from 'react';
import { springStep, isSpringSettled, SPRINGS } from '@/lib/spring';
import type { GroupUser } from '@/lib/types';

const DEMO_USERS: GroupUser[] = [
  { id: '1', name: 'You', balance: -80, color: '#FF6B6B' },
  { id: '2', name: 'Alex', balance: 30, color: '#4ECDC4' },
  { id: '3', name: 'Sam', balance: 25, color: '#45B7D1' },
  { id: '4', name: 'Jo', balance: 25, color: '#FFEAA7' },
];

interface Bubble {
  user: GroupUser;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  targetRadius: number;
}

interface StreamLine {
  fromId: string;
  toId: string;
  progress: number;
  opacity: number;
}

export default function GravityWellView({
  width,
  height,
}: {
  width: number;
  height: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bubblesRef = useRef<Bubble[]>([]);
  const streamsRef = useRef<StreamLine[]>([]);
  const animRef = useRef<number>(0);
  const dragRef = useRef<{ bubbleId: string; offsetX: number; offsetY: number } | null>(null);
  const [users, setUsers] = useState<GroupUser[]>(DEMO_USERS);
  const usersRef = useRef(users);
  usersRef.current = users;

  // Initialize bubbles
  useEffect(() => {
    if (width === 0 || height === 0) return;
    const cx = width / 2;
    const cy = height / 2 - 40;
    bubblesRef.current = users.map((u, i) => {
      const angle = (i / users.length) * Math.PI * 2 - Math.PI / 2;
      const spread = Math.min(width, height) * 0.22;
      return {
        user: u,
        x: cx + Math.cos(angle) * spread,
        y: cy + Math.sin(angle) * spread,
        vx: 0,
        vy: 0,
        radius: 0,
        targetRadius: getRadiusForBalance(u.balance),
      };
    });
  }, [width, height, users]);

  const draw = useCallback(
    (time: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.clearRect(0, 0, width, height);

      const bubbles = bubblesRef.current;
      const dt = 0.016;

      // Physics: bubbles repel each other
      for (let i = 0; i < bubbles.length; i++) {
        for (let j = i + 1; j < bubbles.length; j++) {
          const a = bubbles[i];
          const b = bubbles[j];
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const minDist = a.radius + b.radius + 20;
          if (dist < minDist) {
            const force = (minDist - dist) * 2;
            const nx = dx / dist;
            const ny = dy / dist;
            a.vx -= nx * force * dt;
            a.vy -= ny * force * dt;
            b.vx += nx * force * dt;
            b.vy += ny * force * dt;
          }
        }
      }

      // Attract to center gently
      const cx = width / 2;
      const cy = height / 2 - 40;
      for (const b of bubbles) {
        if (dragRef.current?.bubbleId === b.user.id) continue;
        const dx = cx - b.x;
        const dy = cy - b.y;
        b.vx += dx * 0.3 * dt;
        b.vy += dy * 0.3 * dt;
        // Damping
        b.vx *= 0.95;
        b.vy *= 0.95;
        b.x += b.vx;
        b.y += b.vy;
        // Spring radius
        const rDiff = b.targetRadius - b.radius;
        b.radius += rDiff * 5 * dt;
      }

      // Draw streams
      for (const stream of streamsRef.current) {
        const fromB = bubbles.find((b) => b.user.id === stream.fromId);
        const toB = bubbles.find((b) => b.user.id === stream.toId);
        if (!fromB || !toB) continue;

        const dx = toB.x - fromB.x;
        const dy = toB.y - fromB.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const nx = dx / dist;
        const ny = dy / dist;

        const startX = fromB.x + nx * fromB.radius;
        const startY = fromB.y + ny * fromB.radius;
        const endX = toB.x - nx * toB.radius;
        const endY = toB.y - ny * toB.radius;

        // Flowing particles along the stream
        const particleCount = 8;
        for (let p = 0; p < particleCount; p++) {
          const t =
            ((stream.progress + p / particleCount) % 1);
          const px = startX + (endX - startX) * t;
          const py = startY + (endY - startY) * t;
          const size = 3 * (1 - Math.abs(t - 0.5) * 2) * stream.opacity;

          ctx.beginPath();
          ctx.arc(px, py, size, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255,255,255,${0.4 * stream.opacity})`;
          ctx.fill();
        }

        // Stream line
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        const cpx = (startX + endX) / 2 + ny * 15;
        const cpy = (startY + endY) / 2 - nx * 15;
        ctx.quadraticCurveTo(cpx, cpy, endX, endY);
        ctx.strokeStyle = `rgba(255,255,255,${0.15 * stream.opacity})`;
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Update stream progress
      for (const s of streamsRef.current) {
        s.progress = (s.progress + dt * 0.8) % 1;
      }

      // Draw bubbles
      for (const b of bubbles) {
        // Outer glow
        const glow = ctx.createRadialGradient(
          b.x,
          b.y,
          b.radius * 0.5,
          b.x,
          b.y,
          b.radius * 2
        );
        glow.addColorStop(0, b.user.color + '30');
        glow.addColorStop(1, b.user.color + '00');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius * 2, 0, Math.PI * 2);
        ctx.fill();

        // Body
        const bodyGrad = ctx.createRadialGradient(
          b.x - b.radius * 0.2,
          b.y - b.radius * 0.2,
          0,
          b.x,
          b.y,
          b.radius
        );
        bodyGrad.addColorStop(0, b.user.color + 'DD');
        bodyGrad.addColorStop(1, b.user.color + '88');
        ctx.fillStyle = bodyGrad;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
        ctx.fill();

        // Border
        ctx.strokeStyle = b.user.color + '60';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Label
        ctx.fillStyle = 'white';
        ctx.font = `bold ${Math.max(10, b.radius * 0.35)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(b.user.name, b.x, b.y - 6);
        ctx.font = `${Math.max(9, b.radius * 0.28)}px monospace`;
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        const balTxt =
          b.user.balance >= 0
            ? `+$${b.user.balance}`
            : `-$${Math.abs(b.user.balance)}`;
        ctx.fillText(balTxt, b.x, b.y + 10);
      }

      // Instructions
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(
        'DRAG A BUBBLE ONTO ANOTHER TO SETTLE DEBTS',
        width / 2,
        height - 30
      );

      animRef.current = requestAnimationFrame(draw);
    },
    [width, height]
  );

  useEffect(() => {
    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [draw]);

  const findBubble = (x: number, y: number) => {
    for (const b of bubblesRef.current) {
      const dx = x - b.x;
      const dy = y - b.y;
      if (dx * dx + dy * dy < b.radius * b.radius) return b;
    }
    return null;
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const bubble = findBubble(x, y);
    if (bubble) {
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      dragRef.current = {
        bubbleId: bubble.user.id,
        offsetX: x - bubble.x,
        offsetY: y - bubble.y,
      };
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const b = bubblesRef.current.find(
      (b) => b.user.id === dragRef.current!.bubbleId
    );
    if (b) {
      b.x = x - dragRef.current.offsetX;
      b.y = y - dragRef.current.offsetY;
      b.vx = 0;
      b.vy = 0;
    }
  };

  const handlePointerUp = () => {
    if (!dragRef.current) return;
    const draggedId = dragRef.current.bubbleId;
    const dragged = bubblesRef.current.find((b) => b.user.id === draggedId);
    dragRef.current = null;

    if (!dragged) return;

    // Check collision with another bubble
    for (const other of bubblesRef.current) {
      if (other.user.id === draggedId) continue;
      const dx = other.x - dragged.x;
      const dy = other.y - dragged.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < dragged.radius + other.radius + 10) {
        // Settle debt: equalize
        settleDebt(dragged.user.id, other.user.id);
        // Add stream visual
        streamsRef.current.push({
          fromId: dragged.user.id,
          toId: other.user.id,
          progress: 0,
          opacity: 1,
        });
        // Fade stream after 2s
        setTimeout(() => {
          streamsRef.current = streamsRef.current.filter(
            (s) => !(s.fromId === dragged.user.id && s.toId === other.user.id)
          );
        }, 2000);
        break;
      }
    }
  };

  const settleDebt = (fromId: string, toId: string) => {
    setUsers((prev) => {
      const updated = [...prev];
      const from = updated.find((u) => u.id === fromId);
      const to = updated.find((u) => u.id === toId);
      if (!from || !to) return prev;

      // Transfer: if from owes (negative) and to is owed (positive)
      if (from.balance < 0 && to.balance > 0) {
        const transfer = Math.min(Math.abs(from.balance), to.balance);
        from.balance += transfer;
        to.balance -= transfer;
      } else if (from.balance > 0 && to.balance < 0) {
        const transfer = Math.min(from.balance, Math.abs(to.balance));
        from.balance -= transfer;
        to.balance += transfer;
      }

      // Update bubble target radii
      for (const b of bubblesRef.current) {
        const u = updated.find((u) => u.id === b.user.id);
        if (u) {
          b.user = u;
          b.targetRadius = getRadiusForBalance(u.balance);
        }
      }

      return updated;
    });
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
        cursor: 'grab',
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    />
  );
}

function getRadiusForBalance(balance: number): number {
  return 25 + Math.abs(balance) * 0.5;
}
