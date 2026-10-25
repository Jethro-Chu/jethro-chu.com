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
      x = Math.sin(z * f1) * 6.5 + Math.sin(z * f2) * 3.5;

      // Derivative for curvature calculation
      const dx_dz = Math.cos(z * f1) * 6.5 * f1 + Math.cos(z * f2) * 3.5 * f2;
      const d2x_dz2 = -Math.sin(z * f1) * 6.5 * f1 * f1 - Math.sin(z * f2) * 3.5 * f2 * f2;
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
      vergeBank = Math.pow(extra / 4, 2) * 1.8;
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
    for (let z = 130; z < this.finishZ - 60; z += 24 + rng() * 18) {
      const center = this.getTrackCenter(z);
      // Keep clear navigable corridor: obstacles placed at lateral offsets with room to pass
      const sign = rng() > 0.5 ? 1 : -1;
      const offset = sign * (3.5 + rng() * 6.5);

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
      const distSq = dx * dx + dz * dz;
      const totalR = playerRadius + obs.radius;

      if (distSq < totalR * totalR) {
        return obs;
      }
    }
    return null;
  }
}
