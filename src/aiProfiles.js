import {
  AI_DIFFICULTIES,
  DEFAULT_AI_DIFFICULTY,
} from "./appConfig.js";
import {
  DEFAULT_AI_MOVEMENT_PROFILE,
  ENEMY_AI_ARCHETYPES,
  ROLE_STATS,
} from "./config.js";
import { clamp, randomRange } from "./math.js";
import {
  PLAYER_STAT_MAX,
  PLAYER_STAT_MIN,
} from "./stats.js";

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

function aiDifficultyTotal(aiDifficulty) {
  return AI_DIFFICULTIES[aiDifficulty]?.total || AI_DIFFICULTIES[DEFAULT_AI_DIFFICULTY].total;
}

function scaleStatsToTotal(stats, targetTotal) {
  const statRange = PLAYER_STAT_MAX - PLAYER_STAT_MIN;
  const maxRatio = Math.max(1.25, (targetTotal - PLAYER_STAT_MIN * 3) / (statRange * 3));
  const maxPoint = PLAYER_STAT_MIN + maxRatio * statRange;
  const keys = Object.keys(stats);
  const points = {};
  for (const key of keys) points[key] = PLAYER_STAT_MIN + stats[key] * statRange;
  const currentTotal = Object.values(points).reduce((total, value) => total + value, 0);
  const targetAboveMin = Math.max(0, targetTotal - PLAYER_STAT_MIN * 3);
  const currentAboveMin = Math.max(0.001, currentTotal - PLAYER_STAT_MIN * 3);
  const scale = targetAboveMin / currentAboveMin;

  for (const key of keys) {
    points[key] = clamp(PLAYER_STAT_MIN + (points[key] - PLAYER_STAT_MIN) * scale, PLAYER_STAT_MIN, maxPoint);
  }

  let remaining = targetTotal - Object.values(points).reduce((total, value) => total + value, 0);
  for (let pass = 0; pass < 3 && remaining > 0.01; pass += 1) {
    const adjustable = keys.filter((key) => points[key] < maxPoint - 0.01);
    if (!adjustable.length) break;
    const add = remaining / adjustable.length;
    for (const key of adjustable) {
      const accepted = Math.min(add, maxPoint - points[key]);
      points[key] += accepted;
      remaining -= accepted;
    }
  }

  const scaled = {};
  for (const key of keys) scaled[key] = (points[key] - PLAYER_STAT_MIN) / statRange;
  return scaled;
}

export function aiRoleStats(role, teamKey, profile = null, aiDifficulty = DEFAULT_AI_DIFFICULTY) {
  const stats = roleStats(role);
  const boost = teamKey === "away" ? 0.02 : 0;
  for (const key of Object.keys(stats)) {
    stats[key] = Math.max(0, stats[key] + boost + (profile?.statBias?.[key] || 0));
  }
  return scaleStatsToTotal(stats, aiDifficultyTotal(aiDifficulty));
}
