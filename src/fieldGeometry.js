import { clamp, lerp } from "./math.js";

export function isGoalMouthY(field, y) {
  return y >= field.goalTop && y <= field.goalBottom;
}

export function crossingYAtX(ball, prevX, prevY, lineX) {
  const dx = ball.x - prevX;
  if (Math.abs(dx) < 0.0001) return ball.y;
  const t = clamp((lineX - prevX) / dx, 0, 1);
  return lerp(prevY, ball.y, t);
}

export function clampBallXForY(field, ballRadius, x, y) {
  if (isGoalMouthY(field, y)) {
    return clamp(x, -field.goalDepth, field.width + field.goalDepth);
  }
  return clamp(x, ballRadius, field.width - ballRadius);
}

export function ballEdgeInward(field, ball, margin = 58) {
  let x = 0;
  let y = 0;

  if (!isGoalMouthY(field, ball.y)) {
    if (ball.x < margin) x += (margin - ball.x) / margin;
    if (ball.x > field.width - margin) x -= (ball.x - (field.width - margin)) / margin;
  }
  if (ball.y < margin) y += (margin - ball.y) / margin;
  if (ball.y > field.height - margin) y -= (ball.y - (field.height - margin)) / margin;

  const len = Math.hypot(x, y);
  if (!len) return { x: 0, y: 0, len: 0 };
  return { x: x / len, y: y / len, len };
}

export function ballRescueTarget(field, ball, player) {
  const edge = ballEdgeInward(field, ball);
  if (!edge.len) return null;
  const offset = clamp(player.radius * 0.56 + ball.radius + 3, 14, player.radius + ball.radius - 3);
  return {
    x: clamp(ball.x + edge.x * offset, 24, field.width - 24),
    y: clamp(ball.y + edge.y * offset, 28, field.height - 28),
    edge,
  };
}
