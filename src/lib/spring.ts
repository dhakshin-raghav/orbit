// Damped spring simulation - everything has mass, friction, damping.
// No linear animations allowed in Orbit.

export interface SpringConfig {
  mass: number;
  stiffness: number;
  damping: number;
}

export const SPRINGS = {
  snappy: { mass: 1, stiffness: 300, damping: 22 } as SpringConfig,
  gentle: { mass: 1.2, stiffness: 180, damping: 18 } as SpringConfig,
  heavy: { mass: 1.4, stiffness: 140, damping: 16 } as SpringConfig,
  shatter: { mass: 1, stiffness: 260, damping: 22 } as SpringConfig,
} as const;

export function springStep(
  position: number,
  velocity: number,
  target: number,
  config: SpringConfig,
  dt: number
): { position: number; velocity: number } {
  const displacement = position - target;
  const springForce = -config.stiffness * displacement;
  const dampingForce = -config.damping * velocity;
  const acceleration = (springForce + dampingForce) / config.mass;
  const newVelocity = velocity + acceleration * dt;
  const newPosition = position + newVelocity * dt;
  return { position: newPosition, velocity: newVelocity };
}

export function isSpringSettled(
  position: number,
  velocity: number,
  target: number,
  threshold = 0.5
): boolean {
  return (
    Math.abs(position - target) < threshold &&
    Math.abs(velocity) < threshold
  );
}

// 2D spring
export interface Vec2 {
  x: number;
  y: number;
}

export function springStep2D(
  pos: Vec2,
  vel: Vec2,
  target: Vec2,
  config: SpringConfig,
  dt: number
): { position: Vec2; velocity: Vec2 } {
  const rx = springStep(pos.x, vel.x, target.x, config, dt);
  const ry = springStep(pos.y, vel.y, target.y, config, dt);
  return {
    position: { x: rx.position, y: ry.position },
    velocity: { x: rx.velocity, y: ry.velocity },
  };
}

export function isSpring2DSettled(
  pos: Vec2,
  vel: Vec2,
  target: Vec2,
  threshold = 0.5
): boolean {
  return (
    isSpringSettled(pos.x, vel.x, target.x, threshold) &&
    isSpringSettled(pos.y, vel.y, target.y, threshold)
  );
}
