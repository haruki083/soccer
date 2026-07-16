export function isSliding(player) {
  return player.slideTimer > 0 && player.stunTimer <= 0;
}

export function createImpactEffect(type, x, y, options = {}, duration) {
  const color =
    options.color ||
    (type === "rocket"
      ? "#ff4f5e"
      : type === "shockwave"
        ? "#ff8fab"
        : type === "magnet"
          ? "#9b5de5"
          : "#ffd166");
  return {
    id: `impact-${Math.random().toString(16).slice(2)}`,
    type,
    x,
    y,
    color,
    radius: options.radius || 1,
    ttl: options.ttl || duration,
    duration: options.ttl || duration,
    height: options.height || 0.18,
  };
}

export function trimImpactEffects(effects, limit = 28) {
  return effects.slice(-limit);
}

export function applyKnockback(player, aim, force, resistance, reaction) {
  const power = force / resistance;
  player.vx = aim.x * power;
  player.vy = aim.y * power;
  player.hitReactionTimer = Math.max(player.hitReactionTimer || 0, reaction);
  player.hitDirX = aim.x;
  player.hitDirY = aim.y;
}

export function slideContactStunDuration(target) {
  return 0.5 + (1 - target.stats.physical) * 1.5;
}
