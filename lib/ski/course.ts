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
   * Max-speed cap at a distance (mirrors the skier's speed ramp so obstacle
   * spacing can be checked against the speed actually reached there).
   */
  public maxSpeedAt(distance: number): number {
    const profile = SKI_CONFIG.SKIER.SPEED_PROFILE;
    if (distance <= profile[0][0]) return profile[0][1];
    for (let i = 1; i < profile.length; i++) {
      const [d1, s1] = profile[i - 1];
      const [d2, s2] = profile[i];
      if (distance <= d2) {
        const t = (distance - d1) / Math.max(1e-6, d2 - d1);
        return s1 + (s2 - s1) * t;
      }
    }
    return profile[profile.length - 1][1];
  }

  /**
   * Lateral shift achievable between two obstacle rows, from steering
   * ability at the speed in force there. The 0.6 factor leaves a safety
   * margin for the steering smoothing and the skier's width, so every
   * pattern keeps an achievable route.
   */
  private maxShiftFor(gapMeters: number, atDistance: number): number {
    const speed = Math.max(8, this.maxSpeedAt(atDistance));
    const dt = gapMeters / speed;
    const raw = SKI_CONFIG.SKIER.TURN_SPEED * dt * 0.6;
    return Math.max(2.8, Math.min(7.5, raw));
  }

  /**
   * Generate pine trees and track obstacles deterministically.
   *
   * Difficulty is phased by distance:
   *  - 0-70 m   warm-up, clear (first threat ~8 s in)
   *  - 70-200 m gentle singles, wide spacing
   *  - 200-450 m mid singles + staggered zig-zags
   *  - 450-950 m dense singles, staggered slaloms, tree clusters (narrow
   *    passages), and progressively tighter barrier gaps
   * Every row's lateral shift from the previous row is clamped to what
   * the steering can cover in the gap, so no pattern is unavoidable.
   * The centre line is blocked often enough that holding still fails.
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

    // Barrier narrow passages: gap narrows with distance (6 m -> 4.2 m).
    // Barriers are non-fatal jolts, so threading the gap is the challenge.
    const barriers: Array<{ z: number; gap: number; half: number }> = [
      { z: 178, gap: 4.2, half: 3.0 },
      { z: 372, gap: -4.2, half: 2.6 },
      { z: 556, gap: 4.2, half: 2.4 },
      { z: 738, gap: -4.2, half: 2.2 },
      { z: 868, gap: 4.0, half: 2.1 },
    ];
    const edge = this.width / 2 - 1.2;
    for (const { z, gap, half } of barriers) {
      const centerX = this.getTrackCenter(z).x;
      for (const [left, right] of [[-edge, gap - half], [gap + half, edge]]) {
        const width = right - left;
        this.obstacles.push({
          id: idCounter++, type: "barrier", distance: z,
          lateralOffset: centerX + (left + right) / 2,
          width, radius: 0.3, height: 1.4, rotation: 0, scale: 1,
        });
      }
    }
    const barrierZs = barriers.map((b) => b.z);
    const nearBarrier = (z: number) => barrierZs.some((bz) => Math.abs(z - bz) < 20);

    const corridorsHalf = edge - 1.2; // obstacles live within +-11.6

    const spacingFor = (z: number): number => {
      if (z < 200) return 22 + rng() * 8; // gentle
      if (z < 450) return 15 + rng() * 6; // mid
      if (z < 750) return 12 + rng() * 5; // hard
      return 10 + rng() * 4; // late dense
    };

    const pushSingle = (z: number, offset: number): void => {
      const center = this.getTrackCenter(z);
      const clamped = Math.max(-corridorsHalf, Math.min(corridorsHalf, offset));
      const roll = rng();
      const isLog = roll > 0.88 && z > 160;
      const isRock = !isLog && roll > 0.68;
      const obstacleHeight = isRock ? 1.2 : 5.0 + rng() * 2.5;
      this.obstacles.push({
        id: idCounter++,
        type: isLog ? "log" : isRock ? "rock" : "pine",
        distance: z,
        lateralOffset: center.x + clamped,
        radius: isLog ? 0.42 : isRock ? 0.75 : 0.9,
        width: isLog ? 3.0 : undefined,
        height: isLog ? 0.84 : obstacleHeight,
        rotation: rng() * Math.PI * 2,
        scale: 0.8 + rng() * 0.35,
      });
    };

    // Cluster: two trees in one row flanking a gap (narrow passage).
    // Gap half-width shrinks with distance; obstacles sit just outside it.
    const pushCluster = (z: number, gapCenter: number, gapHalf: number): void => {
      const center = this.getTrackCenter(z);
      const clearance = 0.9 + 0.48 + 0.35; // tree + player + margin
      const left = gapCenter - gapHalf - clearance;
      const right = gapCenter + gapHalf + clearance;
      const leftC = Math.max(-corridorsHalf, Math.min(corridorsHalf, left));
      const rightC = Math.max(-corridorsHalf, Math.min(corridorsHalf, right));
      this.obstacles.push({
        id: idCounter++, type: "pine", distance: z,
        lateralOffset: center.x + leftC, radius: 0.9,
        height: 5.0 + rng() * 2.5, rotation: rng() * Math.PI * 2,
        scale: 0.8 + rng() * 0.35,
      });
      this.obstacles.push({
        id: idCounter++, type: "pine", distance: z,
        lateralOffset: center.x + rightC, radius: 0.9,
        height: 5.0 + rng() * 2.5, rotation: rng() * Math.PI * 2,
        scale: 0.8 + rng() * 0.35,
      });
    };

    // In-course rows. prevOffset tracks the last row's blocked line so the
    // next row's shift is clamped to an achievable move; forcing a minimum
    // shift (when asked) removes long "hold still and survive" stretches.
    // The first two warm-up rows are side obstacles (idle passes) so new
    // players learn to look; centre blocking starts after that.
    let prevOffset: number | null = null;
    let sinceCenterBlock = 0;
    let rowsPlaced = 0;

    for (let z = 70; z < this.finishZ - 55; ) {
      const gap = spacingFor(z);
      const nextZ = z + gap;
      if (nextZ >= this.finishZ - 55) break;
      if (nearBarrier(nextZ)) {
        z = nextZ;
        continue;
      }
      const zone = nextZ < 200 ? 0 : nextZ < 450 ? 1 : nextZ < 750 ? 2 : 3;

      // Choose pattern for this row. Later zones mix in clusters; staggered
      // zones demand a bigger (but still clamped) shift.
      const roll = rng();
      let isCluster = false;
      let wantShift = 0;
      if (zone === 0) {
        isCluster = false;
        wantShift = 3.0 + rng() * 2.0;
      } else if (zone === 1) {
        isCluster = roll > 0.86;
        wantShift = 3.5 + rng() * 3.0; // staggered zig-zag
      } else if (zone === 2) {
        isCluster = roll > 0.72;
        wantShift = 4.0 + rng() * 3.0;
      } else {
        isCluster = roll > 0.62;
        wantShift = 4.5 + rng() * 3.0;
      }

      const maxShift = this.maxShiftFor(gap, nextZ);
      const shift = Math.min(wantShift, maxShift);

      if (isCluster) {
        // Gap centre chases the previous line (or drifts to a side), then
        // the flanking trees leave one clear slot roughly where the skier
        // is heading — a narrow passage, not a wall.
        let gapCenter: number;
        if (prevOffset === null) {
          gapCenter = (rng() - 0.5) * 6;
        } else {
          const dir = rng() > 0.5 ? 1 : -1;
          gapCenter = prevOffset + dir * shift * 0.45;
          gapCenter = Math.max(-6.5, Math.min(6.5, gapCenter));
        }
        const gapHalf = zone === 1 ? 2.8 : zone === 2 ? 2.4 : 2.1;
        pushCluster(nextZ, gapCenter, gapHalf);
        prevOffset = gapCenter;
        sinceCenterBlock = Math.abs(gapCenter) < 3.5 ? 0 : sinceCenterBlock + 1;
      } else {
        let base: number;
        // Regularly block the centre line so holding still eventually fails.
        // First two rows are side obstacles so the warm-up is learnable.
        if (rowsPlaced < 2) {
          base = (rng() > 0.5 ? 1 : -1) * (4.5 + rng() * 3.5);
          sinceCenterBlock = 2; // next row threatens centre
        } else if (sinceCenterBlock >= 3) {
          base = (rng() - 0.5) * 5; // -2.5..2.5 centre blocker
          sinceCenterBlock = 0;
        } else {
          const dir = rng() > 0.42 ? 1 : -1; // slight same-side bias beats
          base = (prevOffset ?? 0) + dir * shift;
          sinceCenterBlock = Math.abs(base) < 3.5 ? 0 : sinceCenterBlock + 1;
        }
        // Clamp the step itself to what steering can cover.
        if (prevOffset !== null) {
          const d = base - prevOffset;
          if (Math.abs(d) > maxShift) base = prevOffset + Math.sign(d) * maxShift;
        }
        pushSingle(nextZ, base);
        prevOffset = base;
      }
      rowsPlaced += 1;
      z = nextZ;
    }
  }

  /**
   * Nearest obstacle just missed (no collision, inside the close-call
   * band). Used for the small visual near-miss reward; cosmetic only.
   */
  public checkNearMiss(worldX: number, worldZ: number, playerRadius: number): Obstacle | null {
    let best: Obstacle | null = null;
    let bestClearance = Number.POSITIVE_INFINITY;
    for (let i = 0; i < this.obstacles.length; i++) {
      const obs = this.obstacles[i];
      if (Math.abs(obs.distance - worldZ) > 4.0) continue;
      const dx = worldX - obs.lateralOffset;
      const dz = worldZ - obs.distance;
      if ((obs.type === "barrier" || obs.type === "log") && obs.width !== undefined) {
        const outsideX = Math.max(0, Math.abs(dx) - obs.width / 2);
        const outsideZ = Math.max(0, Math.abs(dz) - obs.radius);
        const clearance = Math.sqrt(outsideX * outsideX + outsideZ * outsideZ) - playerRadius;
        if (clearance < 0) continue; // actually colliding
        if (clearance <= SKI_CONFIG.SKIER.NEAR_MISS_BAND && clearance < bestClearance) {
          best = obs;
          bestClearance = clearance;
        }
        continue;
      }
      const dist = Math.sqrt(dx * dx + dz * dz);
      const clearance = dist - (playerRadius + obs.radius);
      if (clearance < 0) continue;
      if (clearance <= SKI_CONFIG.SKIER.NEAR_MISS_BAND && clearance < bestClearance) {
        best = obs;
        bestClearance = clearance;
      }
    }
    return best;
  }

  /**
   * Check collision against nearby obstacles
   */
  public checkCollision(worldX: number, worldZ: number, playerRadius: number = SKI_CONFIG.SKIER.PLAYER_RADIUS): Obstacle | null {
    // Only check obstacles in proximity (within 5m along Z)
    for (let i = 0; i < this.obstacles.length; i++) {
      const obs = this.obstacles[i];
      if (Math.abs(obs.distance - worldZ) > 4.0) continue;

      const dx = worldX - obs.lateralOffset;
      const dz = worldZ - obs.distance;
      if ((obs.type === "barrier" || obs.type === "log") && obs.width !== undefined) {
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
