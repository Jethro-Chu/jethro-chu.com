/**
 * Deterministic downhill alpine course generator for "Wok This Slope"
 */

import { SKI_CONFIG } from "./config.ts";
import type { Obstacle } from "./types.ts";

// Deterministic Mulberry32 PRNG
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface CourseProfile {
  length: number;
  width: number;
  obstacles: Obstacle[];
  finishZ: number;
  tableZ: number;
}

export class SkiCourse {
  public readonly length: number;
  public readonly width: number;
  public readonly finishZ: number;
  public readonly tableZ: number;
  public readonly obstacles: Obstacle[] = [];

  constructor() {
    this.length = SKI_CONFIG.COURSE.LENGTH_METERS;
    this.width = SKI_CONFIG.COURSE.WIDTH_METERS;
    this.finishZ = this.length;
    this.tableZ = this.length + 35; // Table is situated in the finish runout
    this.generateObstacles();
  }

  /**
   * Centerline X position and slope pitch at distance z down the course
   */
  public getTrackCenter(z: number): { x: number; y: number; slope: number; curvature: number } {
    // Elevation drops at ~11.5 degrees slope
    const baseSlope = (SKI_CONFIG.COURSE.BASE_SLOPE_DEG * Math.PI) / 180;
    let y = -z * Math.tan(baseSlope);

    // Add rolling moguls / terrain bumps
    if (z > 120 && z < this.finishZ) {
      const mogul = Math.sin(z / 18.0) * Math.cos(z / 29.0) * SKI_CONFIG.SKIER.BUMP_AMPLITUDE;
      y += mogul;
    }

    // Flat plateau after finish line
    if (z >= this.finishZ) {
      const finishY = -this.finishZ * Math.tan(baseSlope);
      // Flatten out smoothly over 30 meters
      const blend = Math.min(1.0, (z - this.finishZ) / 25.0);
      y = finishY - (z - this.finishZ) * Math.tan(baseSlope) * (1 - blend);
    }

    // Centerline S-turns: gentle in beginning, winding in middle, straight at finish
    let x = 0;
    let curvature = 0;

    if (z > 100 && z < this.finishZ - 50) {
      // S-curve pattern
      const f1 = 0.012; // wavelength ~500m
      const f2 = 0.024; // wavelength ~250m
      const bend = Math.sin(z * f1) * 6.5 + Math.sin(z * f2) * 3.5;
      const bendD = Math.cos(z * f1) * 6.5 * f1 + Math.cos(z * f2) * 3.5 * f2;
      const bendDD = -Math.sin(z * f1) * 6.5 * f1 * f1 - Math.sin(z * f2) * 3.5 * f2 * f2;
      // Ease into and out of the bends. Switching the full offset on at
      // 100 m used to teleport the skier sideways by several metres.
      const fadeDistance = 80;
      const fadeStart = 100;
      const fadeEnd = this.finishZ - 50;
      let weight = 1, weightD = 0, weightDD = 0;
      if (z < fadeStart + fadeDistance || z > fadeEnd - fadeDistance) {
        const entering = z < fadeStart + fadeDistance;
        const t = entering ? (z - fadeStart) / fadeDistance : (fadeEnd - z) / fadeDistance;
        weight = t * t * (3 - 2 * t);
        weightD = (entering ? 1 : -1) * 6 * t * (1 - t) / fadeDistance;
        weightDD = 6 * (1 - 2 * t) / (fadeDistance * fadeDistance);
      }
      x = bend * weight;
      const dx_dz = bendD * weight + bend * weightD;
      const d2x_dz2 = bendDD * weight + 2 * bendD * weightD + bend * weightDD;
      curvature = d2x_dz2 / Math.pow(1 + dx_dz * dx_dz, 1.5);
    }

    // Slope angle (pitch in radians)
    const slope = baseSlope;

    return { x, y, slope, curvature };
  }

  /**
   * Ground surface elevation Y at world (x, z)
   */
  public getGroundHeight(worldX: number, worldZ: number): number {
    const center = this.getTrackCenter(worldZ);
    // Transverse banking / corridor verge profile:
    // U-shaped track profile: flat center, rising slightly at edges (banking)
    const relX = worldX - center.x;
    const halfW = this.width / 2;
    let vergeBank = 0;
    if (Math.abs(relX) > halfW - 4) {
      const extra = Math.abs(relX) - (halfW - 4);
      // A rounded snowbank, not a quadratic wall towering over the course.
      vergeBank = 0.22 * extra * extra / (extra + 8);
    }

    return center.y + vergeBank;
  }

  /**
   * Generate pine trees and track obstacles deterministically
   */
  private generateObstacles(): void {
    const rng = mulberry32(SKI_CONFIG.COURSE.SEED);
    let idCounter = 1;

    // Forest verges (lining both left and right edges)
    for (let z = 30; z < this.finishZ + 40; z += 12 + rng() * 10) {
      const center = this.getTrackCenter(z);
      // Left tree line
      const leftDist = -(this.width / 2 + 1.5 + rng() * 6);
      this.obstacles.push({
        id: idCounter++,
        type: "pine",
        distance: z,
        lateralOffset: center.x + leftDist,
        radius: 0.9,
        height: 5.5 + rng() * 3.0,
        rotation: rng() * Math.PI * 2,
        scale: 0.85 + rng() * 0.4,
      });

      // Right tree line
      const rightDist = this.width / 2 + 1.5 + rng() * 6;
      this.obstacles.push({
        id: idCounter++,
        type: "pine",
        distance: z,
        lateralOffset: center.x + rightDist,
        radius: 0.9,
        height: 5.5 + rng() * 3.0,
        rotation: rng() * Math.PI * 2,
        scale: 0.85 + rng() * 0.4,
      });
    }

    // In-course obstacles (scattered pine trees and rocks that player must steer around)
    // Avoid placing any in first 100 meters (tutorial zone) or near finish line (> 910m)
    let obstacleIndex = 0;
    for (let z = 130; z < this.finishZ - 60; z += 24 + rng() * 18, obstacleIndex++) {
      const center = this.getTrackCenter(z);
      // Keep clear navigable corridor: obstacles placed at lateral offsets with room to pass
      const sign = rng() > 0.5 ? 1 : -1;
      const sideOffset = sign * (3.5 + rng() * 6.5);
      const offset = [4, 12, 20].includes(obstacleIndex) ? 0 : sideOffset;

      const isRock = rng() > 0.75;
      this.obstacles.push({
        id: idCounter++,
        type: isRock ? "rock" : "pine",
        distance: z,
        lateralOffset: center.x + offset,
        radius: isRock ? 0.75 : 0.9,
        height: isRock ? 1.2 : 5.0 + rng() * 2.5,
        rotation: rng() * Math.PI * 2,
        scale: 0.8 + rng() * 0.35,
      });
    }

    // Alternating, clearly marked openings force players to plan a line.
    // Each opening is 6 m wide; the usable track spans -12.8 to +12.8 m.
    // Barriers sit between existing obstacles rather than hiding a tree in
    // the opening, and are far enough apart for a controlled traverse.
    const barriers = [
      { z: 218, gap: 4.5 },
      { z: 398, gap: -4.5 },
      { z: 612, gap: 4.5 },
      { z: 780, gap: -4.5 },
    ];
    const edge = this.width / 2 - 1.2;
    const gapHalfWidth = 3;
    for (const { z, gap } of barriers) {
      const centerX = this.getTrackCenter(z).x;
      for (const [left, right] of [[-edge, gap - gapHalfWidth], [gap + gapHalfWidth, edge]]) {
        const width = right - left;
        this.obstacles.push({
          id: idCounter++, type: "barrier", distance: z,
          lateralOffset: centerX + (left + right) / 2,
          width, radius: 0.3, height: 1.4, rotation: 0, scale: 1,
        });
      }
    }
  }

  /**
   * Check collision against nearby obstacles
   */
  public checkCollision(worldX: number, worldZ: number, playerRadius: number = 0.55): Obstacle | null {
    // Only check obstacles in proximity (within 5m along Z)
    for (let i = 0; i < this.obstacles.length; i++) {
      const obs = this.obstacles[i];
      if (Math.abs(obs.distance - worldZ) > 4.0) continue;

      const dx = worldX - obs.lateralOffset;
      const dz = worldZ - obs.distance;
      if (obs.type === "barrier" && obs.width !== undefined) {
        // Circle vs the same thin rectangle drawn by the renderer.
        const outsideX = Math.max(0, Math.abs(dx) - obs.width / 2);
        const outsideZ = Math.max(0, Math.abs(dz) - obs.radius);
        if (outsideX * outsideX + outsideZ * outsideZ < playerRadius * playerRadius) return obs;
        continue;
      }
      const distSq = dx * dx + dz * dz;
      const totalR = playerRadius + obs.radius;

      if (distSq < totalR * totalR) {
        return obs;
      }
    }
    return null;
  }
}
