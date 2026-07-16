import {
  PLAYER_RADIUS_BASE,
  PLAYER_RADIUS_PHYSICAL_SCALE,
  ROCKET_STUN_MAX,
  ROCKET_STUN_MIN,
  ROLE_VISUALS,
  SHOCKWAVE_STUN_MAX,
  SHOCKWAVE_STUN_MIN,
} from "./config.js";
import { clamp } from "./math.js";

export function tacticalRoleFor(role) {
  return role === "MD" ? "CM" : role;
}

export function roleVisual(role) {
  return ROLE_VISUALS[tacticalRoleFor(role)] || ROLE_VISUALS.CM;
}

export function roleColor(role) {
  return roleVisual(role).color;
}

export function playerRadiusFromStats(stats, role) {
  const roleBonus = role === "GK" ? 2.1 : role === "DF" ? 1.4 : role === "FW" ? -0.2 : 0.35;
  const physicalDrive = Math.pow(clamp(stats.physical, 0, 1), 1.12);
  return PLAYER_RADIUS_BASE + physicalDrive * PLAYER_RADIUS_PHYSICAL_SCALE + roleBonus;
}

export function rocketStunDuration(player) {
  const physical = clamp(player?.stats?.physical ?? 0.5, 0, 1);
  const resistance = Math.pow(physical, 0.85);
  return ROCKET_STUN_MIN + (1 - resistance) * (ROCKET_STUN_MAX - ROCKET_STUN_MIN);
}

export function shockwaveStunDuration(player) {
  const physical = clamp(player?.stats?.physical ?? 0.5, 0, 1);
  const resistance = Math.pow(physical, 0.75);
  return SHOCKWAVE_STUN_MIN + (1 - resistance) * (SHOCKWAVE_STUN_MAX - SHOCKWAVE_STUN_MIN);
}
