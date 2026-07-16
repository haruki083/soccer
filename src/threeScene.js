import * as THREE from "../vendor/three.module.js";

export function worldX(field, worldScale, x) {
  return (x - field.width / 2) * worldScale;
}

export function worldZ(field, worldScale, y) {
  return (y - field.height / 2) * worldScale;
}

export function worldPosition(field, worldScale, x, y, elevation = 0) {
  return new THREE.Vector3(worldX(field, worldScale, x), elevation, worldZ(field, worldScale, y));
}

function materialKey(type, color, options = {}) {
  return [
    type,
    color,
    options.opacity ?? 1,
    options.emissive ?? "",
    options.roughness ?? "",
    options.metalness ?? "",
  ].join(":");
}

export function standardMaterial(materials, color, options = {}) {
  const key = materialKey("standard", color, options);
  if (!materials.has(key)) {
    const material = new THREE.MeshStandardMaterial({
      color,
      emissive: options.emissive || "#000000",
      emissiveIntensity: options.emissiveIntensity || 0,
      metalness: options.metalness ?? 0.04,
      roughness: options.roughness ?? 0.72,
      transparent: options.opacity !== undefined && options.opacity < 1,
      opacity: options.opacity ?? 1,
    });
    materials.set(key, material);
  }
  return materials.get(key);
}

export function basicMaterial(materials, color, options = {}) {
  const key = materialKey("basic", color, options);
  if (!materials.has(key)) {
    const material = new THREE.MeshBasicMaterial({
      color,
      transparent: options.opacity !== undefined && options.opacity < 1,
      opacity: options.opacity ?? 1,
      depthWrite: options.depthWrite ?? true,
      side: options.side ?? THREE.FrontSide,
    });
    materials.set(key, material);
  }
  return materials.get(key);
}

export function lineMaterial(materials, color, opacity = 1) {
  const key = `line:${color}:${opacity}`;
  if (!materials.has(key)) {
    materials.set(
      key,
      new THREE.LineBasicMaterial({
        color,
        transparent: opacity < 1,
        opacity,
      }),
    );
  }
  return materials.get(key);
}

export function initThreeGeometries(geometries, ballRadius, worldScale) {
  if (geometries.body) return;
  geometries.body = new THREE.CapsuleGeometry(0.78, 1.02, 12, 32);
  geometries.torsoBulge = new THREE.SphereGeometry(0.76, 30, 20);
  geometries.hipBulge = new THREE.SphereGeometry(0.64, 26, 16);
  geometries.shoulder = new THREE.CapsuleGeometry(0.22, 1.42, 8, 18);
  geometries.joint = new THREE.SphereGeometry(0.34, 22, 16);
  geometries.pelvis = new THREE.SphereGeometry(0.58, 28, 18);
  geometries.arm = new THREE.CapsuleGeometry(0.17, 1.06, 8, 16);
  geometries.leg = new THREE.CapsuleGeometry(0.25, 0.82, 10, 18);
  geometries.head = new THREE.SphereGeometry(0.64, 30, 20);
  geometries.neck = new THREE.CylinderGeometry(0.22, 0.28, 0.34, 20);
  geometries.limb = new THREE.CapsuleGeometry(0.18, 1.18, 8, 16);
  geometries.hand = new THREE.CapsuleGeometry(0.12, 0.1, 8, 12);
  geometries.foot = new THREE.SphereGeometry(0.28, 18, 12);
  geometries.shadow = new THREE.CircleGeometry(1.8, 28);
  geometries.marker = new THREE.TorusGeometry(1.72, 0.06, 8, 40);
  geometries.statusRing = new THREE.TorusGeometry(2.02, 0.06, 8, 44);
  geometries.ball = new THREE.SphereGeometry(ballRadius * worldScale, 26, 18);
  geometries.ballPatch = new THREE.TorusGeometry(ballRadius * worldScale * 0.46, 0.018, 8, 24);
  geometries.itemBox = new THREE.BoxGeometry(1.75, 1.75, 1.75);
  geometries.itemCore = new THREE.OctahedronGeometry(1.08, 0);
  geometries.shieldCore = new THREE.TorusGeometry(0.9, 0.14, 12, 32);
  geometries.rocketBody = new THREE.CylinderGeometry(0.32, 0.32, 1.72, 18);
  geometries.rocketNose = new THREE.ConeGeometry(0.48, 0.9, 18);
  geometries.rocketFlame = new THREE.ConeGeometry(0.62, 1.16, 16);
  geometries.rocketTrail = new THREE.CylinderGeometry(0.14, 0.46, 5.8, 18);
  geometries.rocketTrailGlow = new THREE.CylinderGeometry(0.3, 0.8, 6.8, 18);
  geometries.impactRing = new THREE.TorusGeometry(1, 0.045, 8, 64);
  geometries.impactCore = new THREE.SphereGeometry(0.22, 18, 12);
  geometries.patchBox = new THREE.BoxGeometry(1, 1, 1);
  geometries.patchDot = new THREE.SphereGeometry(0.11, 10, 8);
  geometries.visor = new THREE.SphereGeometry(0.5, 18, 10);
  geometries.faceDot = new THREE.SphereGeometry(0.085, 12, 8);
  geometries.faceShade = new THREE.SphereGeometry(0.48, 18, 10);
  geometries.capCrown = new THREE.SphereGeometry(0.66, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.52);
  geometries.capBrim = new THREE.CylinderGeometry(0.48, 0.42, 0.13, 32);
  geometries.capBand = new THREE.TorusGeometry(0.62, 0.035, 8, 48);
  geometries.stunStar = new THREE.TorusGeometry(0.22, 0.035, 7, 16);
}
