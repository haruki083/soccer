import { distance, normalize } from "./math.js";

export function randomItemType() {
  const roll = Math.random();
  if (roll < 0.22) return "boost";
  if (roll < 0.4) return "rocket";
  if (roll < 0.56) return "shield";
  if (roll < 0.74) return "power";
  if (roll < 0.9) return "magnet";
  return "shockwave";
}

export function createItemDrop(field) {
  const type = randomItemType();
  return {
    id: `${type}-${Math.random().toString(16).slice(2)}`,
    type,
    x: 180 + Math.random() * (field.width - 360),
    y: 90 + Math.random() * (field.height - 180),
    radius: 15,
    ttl: 13,
    pulse: Math.random() * Math.PI * 2,
  };
}

export function updateItemDrops(match, itemDrops, players, field, itemCharges, onPickup, dt) {
  match.nextItemDrop -= dt;
  let nextDrops = itemDrops;
  if (match.nextItemDrop <= 0) {
    if (nextDrops.length >= 5) {
      match.nextItemDrop = 4.5 + Math.random() * 4.5;
    } else {
      nextDrops = [...nextDrops, createItemDrop(field)];
      match.nextItemDrop = 4.5 + Math.random() * 4.5;
    }
  }

  for (const drop of nextDrops) {
    drop.ttl -= dt;
    drop.pulse += dt * 5;
  }
  nextDrops = nextDrops.filter((drop) => drop.ttl > 0);

  for (const player of players) {
    if (player.heldItem || player.stunTimer > 0) continue;
    const index = nextDrops.findIndex((drop) => distance(player, drop) < player.radius + drop.radius + 3);
    if (index === -1) continue;

    const [drop] = nextDrops.splice(index, 1);
    player.heldItem = drop.type;
    player.heldItemCharges = itemCharges(drop.type);
    onPickup?.(player, drop);
  }
  return nextDrops;
}

export function clearHeldItem(player) {
  player.heldItem = null;
  player.heldItemCharges = 0;
}

export function updateStatusTimers(players, dt) {
  for (const player of players) {
    player.speedBoostTimer = Math.max(0, player.speedBoostTimer - dt);
    player.powerBoostTimer = Math.max(0, player.powerBoostTimer - dt);
    player.magnetTimer = Math.max(0, player.magnetTimer - dt);
    player.shieldTimer = Math.max(0, player.shieldTimer - dt);
    player.shockwaveTimer = Math.max(0, player.shockwaveTimer - dt);
    player.stunTimer = Math.max(0, player.stunTimer - dt);
    player.slideTimer = Math.max(0, player.slideTimer - dt);
    player.slideCooldown = Math.max(0, player.slideCooldown - dt);
    player.hitReactionTimer = Math.max(0, player.hitReactionTimer - dt);
    if (player.slideTimer <= 0) {
      player.slideHitBall = false;
      player.slideHitPlayers?.clear();
    }
  }
}

export function updateImpactEffects(impactEffects, dt) {
  for (const effect of impactEffects) {
    effect.ttl -= dt;
  }
  return impactEffects.filter((effect) => effect.ttl > 0);
}

export function updateActiveItemEffects(players, ball, dt) {
  for (const player of players) {
    if (player.magnetTimer <= 0 || player.stunTimer > 0) continue;
    const dx = player.x - ball.x;
    const dy = player.y - ball.y;
    const d = Math.hypot(dx, dy) || 1;
    const radius = 460 + player.stats.physical * 95;
    if (d > radius || d < player.radius + ball.radius + 7) continue;

    const pull = ((220 + player.stats.power * 220) * (1 - d / radius) + 160) * 1.3;
    ball.carrier = null;
    ball.vx += (dx / d) * pull * dt;
    ball.vy += (dy / d) * pull * dt;
    ball.lastTouch = player.teamKey;
  }
}

export function updateAiItemUse(player, ball, dt, itemUse, nearestOpponentDistance, useHeldItem) {
  if (!player.heldItem || player.stunTimer > 0 || player.controller !== "ai") return;

  const aim = normalize(ball.x - player.x, ball.y - player.y);
  const targetDistance = distance(player, ball);
  player.facingX = aim.x;
  player.facingY = aim.y;

  if (player.heldItem === "boost" && targetDistance < 260 && Math.random() < dt * 0.72 * itemUse) {
    useHeldItem(player);
  } else if (player.heldItem === "power" && targetDistance < 185 && Math.random() < dt * 0.86 * itemUse) {
    useHeldItem(player);
  } else if (player.heldItem === "magnet" && targetDistance < 420 && targetDistance > 84 && Math.random() < dt * 0.76 * itemUse) {
    useHeldItem(player);
  } else if (player.heldItem === "shockwave" && (targetDistance < 165 || nearestOpponentDistance(player) < 92) && Math.random() < dt * 0.78 * itemUse) {
    useHeldItem(player);
  } else if (player.heldItem === "shield" && nearestOpponentDistance(player) < 82 && Math.random() < dt * 0.7 * itemUse) {
    useHeldItem(player);
  } else if (player.heldItem === "rocket" && targetDistance < 430 && Math.random() < dt * 0.58 * itemUse) {
    useHeldItem(player);
  }
}
