export type ParallaxPoint = {
  x: number;
  y: number;
};

export type OrientationBaseline = {
  beta: number;
  gamma: number;
};

type RectGeometry = {
  left: number;
  top: number;
  width: number;
  height: number;
};

export const PARALLAX_CENTER = Object.freeze({ x: 0, y: 0 });

export function clampUnit(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(-1, Math.min(1, value));
}

export function pointerToParallax(
  clientX: number,
  clientY: number,
  rect: RectGeometry,
): ParallaxPoint {
  if (
    !Number.isFinite(clientX) ||
    !Number.isFinite(clientY) ||
    !Number.isFinite(rect.left) ||
    !Number.isFinite(rect.top) ||
    !Number.isFinite(rect.width) ||
    !Number.isFinite(rect.height) ||
    rect.width <= 0 ||
    rect.height <= 0
  ) {
    return PARALLAX_CENTER;
  }

  return {
    x: clampUnit((clientX - (rect.left + rect.width / 2)) / (rect.width / 2)),
    y: clampUnit((clientY - (rect.top + rect.height / 2)) / (rect.height / 2)),
  };
}

export function orientationToParallax(
  beta: number | null,
  gamma: number | null,
  baseline: OrientationBaseline,
  screenAngle = 0,
  range = 12,
): ParallaxPoint {
  if (
    beta === null ||
    gamma === null ||
    !Number.isFinite(beta) ||
    !Number.isFinite(gamma) ||
    !Number.isFinite(baseline.beta) ||
    !Number.isFinite(baseline.gamma) ||
    !Number.isFinite(screenAngle) ||
    !Number.isFinite(range) ||
    range <= 0
  ) {
    return PARALLAX_CENTER;
  }

  const horizontal = (gamma - baseline.gamma) / range;
  const vertical = (beta - baseline.beta) / range;
  const normalizedAngle = ((screenAngle % 360) + 360) % 360;

  let point: ParallaxPoint;
  switch (normalizedAngle) {
    case 90:
      point = { x: vertical, y: -horizontal };
      break;
    case 180:
      point = { x: -horizontal, y: -vertical };
      break;
    case 270:
      point = { x: -vertical, y: horizontal };
      break;
    default:
      point = { x: horizontal, y: vertical };
  }

  return { x: clampUnit(point.x), y: clampUnit(point.y) };
}

export function smoothParallax(
  current: ParallaxPoint,
  target: ParallaxPoint,
  amount = 0.18,
): ParallaxPoint {
  const clampedAmount = Math.max(0, Math.min(1, amount));

  return {
    x: current.x + (target.x - current.x) * clampedAmount,
    y: current.y + (target.y - current.y) * clampedAmount,
  };
}
