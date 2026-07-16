import { FIELD, TEAM } from "./config.js";
import { finiteOr } from "./math.js";

function playerSnapshot(player) {
  return {
    id: player.id,
    x: player.x,
    y: player.y,
    vx: player.vx,
    vy: player.vy,
    radius: player.radius,
    role: player.role,
    baseTacticalRole: player.baseTacticalRole,
    tacticalRole: player.tacticalRole,
    aiProfile: player.aiProfile,
    stats: player.stats,
    color: player.color,
    kitId: player.kitId,
    heldItem: player.heldItem,
    heldItemCharges: player.heldItemCharges,
    speedBoostTimer: player.speedBoostTimer,
    powerBoostTimer: player.powerBoostTimer,
    magnetTimer: player.magnetTimer,
    shieldTimer: player.shieldTimer,
    shockwaveTimer: player.shockwaveTimer,
    stunTimer: player.stunTimer,
    slideTimer: player.slideTimer,
    slideCooldown: player.slideCooldown,
    slideDirX: player.slideDirX,
    slideDirY: player.slideDirY,
    slideHitBall: player.slideHitBall,
    hitReactionTimer: player.hitReactionTimer,
    hitDirX: player.hitDirX,
    hitDirY: player.hitDirY,
    facingX: player.facingX,
    facingY: player.facingY,
    stamina: player.stamina,
  };
}

export function onlineSnapshot(match, ball, players, itemDrops, rockets) {
  return {
    match: {
      score: { ...match.score },
      secondsLeft: match.secondsLeft,
      duration: match.duration,
      elapsed: match.elapsed,
      paused: match.paused,
      ended: match.ended,
      speed: match.speed,
    },
    ball: {
      x: ball.x,
      y: ball.y,
      vx: ball.vx,
      vy: ball.vy,
      lastTouch: ball.lastTouch,
    },
    players: players.map(playerSnapshot),
    itemDrops: itemDrops.map((drop) => ({ ...drop })),
    rockets: rockets.map((rocket) => ({ ...rocket })),
  };
}

export function applyOnlineSnapshot(snapshot, match, ball, players) {
  const result = {};
  if (!snapshot) return result;
  if (snapshot.match) {
    match.score.home = finiteOr(snapshot.match.score?.home, 0);
    match.score.away = finiteOr(snapshot.match.score?.away, 0);
    match.secondsLeft = finiteOr(snapshot.match.secondsLeft, 0);
    match.duration = finiteOr(snapshot.match.duration, match.duration);
    match.elapsed = finiteOr(snapshot.match.elapsed, 0);
    match.paused = Boolean(snapshot.match.paused);
    match.ended = Boolean(snapshot.match.ended);
    match.speed = finiteOr(snapshot.match.speed, match.speed);
  }
  if (snapshot.ball) {
    Object.assign(ball, {
      x: finiteOr(snapshot.ball.x, FIELD.width / 2),
      y: finiteOr(snapshot.ball.y, FIELD.height / 2),
      vx: finiteOr(snapshot.ball.vx, 0),
      vy: finiteOr(snapshot.ball.vy, 0),
      carrier: null,
      lastTouch: snapshot.ball.lastTouch === "away" ? "away" : "home",
    });
  }
  if (Array.isArray(snapshot.players)) {
    for (const data of snapshot.players) {
      const player = players.find((entry) => entry.id === data.id);
      if (!player) continue;
      const keepController = player.controller;
      const keepHuman = player.isHuman;
      const keepRemote = player.isRemote;
      Object.assign(player, data);
      player.controller = keepController;
      player.isHuman = keepHuman;
      player.isRemote = keepRemote;
      player.team = TEAM[player.teamKey];
      if (!(player.slideHitPlayers instanceof Set)) player.slideHitPlayers = new Set();
    }
  }
  if (Array.isArray(snapshot.itemDrops)) result.itemDrops = snapshot.itemDrops.map((drop) => ({ ...drop }));
  if (Array.isArray(snapshot.rockets)) result.rockets = snapshot.rockets.map((rocket) => ({ ...rocket }));
  return result;
}
