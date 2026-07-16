import {
  DEFAULT_AI_MOVEMENT_PROFILE,
  ENEMY_AI_ARCHETYPES,
  ROLE_STATS,
} from "./config.js";
import { clamp, randomRange } from "./math.js";

export function roleStats(role) {
  return { ...ROLE_STATS[role] };
}

export function createEnemyAiProfile(slot, role) {
  const archetype = ENEMY_AI_ARCHETYPES[Math.floor(Math.random() * ENEMY_AI_ARCHETYPES.length)];
  return {
    seed: Math.random(),
    role,
    statBias: {
      speed: randomRange(-0.045, 0.045) + archetype.statBias.speed,
      physical: randomRange(-0.055, 0.055) + archetype.statBias.physical,
      power: randomRange(-0.045, 0.045) + archetype.statBias.power,
    },
    movement: {
      urgency: clamp(archetype.movement.urgency + randomRange(-0.08, 0.08), 0.82, 1.24),
      chaseUrgency: archetype.movement.chaseUrgency + randomRange(-0.045, 0.055),
      pressRadius: archetype.movement.pressRadius + randomRange(-26, 34),
      attackPush: archetype.movement.attackPush + randomRange(-18, 22),
      defendDrop: archetype.movement.defendDrop + randomRange(-18, 24),
      lineShift: randomRange(-28, 28),
      shapeWidth: clamp(archetype.movement.shapeWidth + randomRange(-0.08, 0.08), 0.82, 1.22),
      ballPull: archetype.movement.ballPull + randomRange(-0.035, 0.04),
      laneJitter: randomRange(8, 28),
      lanePhase: randomRange(0, Math.PI * 2) + slot * 0.7,
      keeperDepth: randomRange(-16, 22),
      itemUse: clamp(archetype.movement.itemUse + randomRange(-0.12, 0.14), 0.72, 1.34),
    },
  };
}

export function aiMovementProfile(player) {
  return player?.aiProfile?.movement || DEFAULT_AI_MOVEMENT_PROFILE;
}

export function aiRoleStats(role, teamKey, profile = null) {
  const stats = roleStats(role);
  const boost = teamKey === "away" ? 0.02 : 0;
  for (const key of Object.keys(stats)) {
    stats[key] = clamp(stats[key] + boost + (profile?.statBias?.[key] || 0), 0.05, 0.98);
  }
  return stats;
}
