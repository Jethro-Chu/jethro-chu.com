/**
 * Types for "Wok This Slope" - Alpine Downhill Fried Rice
 */

export type GamePhase =
  | "ready"       // Title screen
  | "countdown"   // 3... 2... 1... WOK!
  | "skiing"      // Downhill run with wok & rice
  | "plating"     // At the finish line: tipping pan onto serving plate
  | "result"      // Run finished, grading displayed
  | "failed"      // Catastrophic crash, empty pan, or burnt to charcoal
  | "paused";     // Paused by user

export type FailureReason =
  | "empty_pan"   // All rice spilled
  | "tree_crash"  // Direct high-speed collision with pine tree
  | "burnt_batch" // Ruined charcoal batch
  | "out_of_bounds"; // Fell off mountain track

export type GradeRank = "S" | "A" | "B" | "C" | "D";

export interface GrainState {
  // Local pan coordinate system:
  // (x: right, y: up from pan bottom, z: towards handle/back)
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;

  // Thermal state
  doneness: number;   // 0.0 (raw) to 1.0 (fully cooked)
  burnDamage: number; // 0.0 (clean) to 1.0 (charred)

  // Status
  retained: boolean;  // Inside pan
  plated: boolean;    // Landed on plate
  inContact: boolean; // Touching pan bottom
}

export interface SpilledParticle {
  // World coordinates
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  maxLife: number;
  doneness: number;
  burnDamage: number;
  settled: boolean;
  onPlate: boolean;
}

export interface SkierState {
  distance: number;       // Progress along course (meters)
  lateralOffset: number;  // Distance from course centerline (-width/2 to +width/2)
  lateralSpeed: number;   // Lateral velocity
  speed: number;          // Forward speed (m/s)
  acceleration: number;   // Forward accel
  steerAngle: number;     // Current turning angle
  slopePitch: number;     // Current course slope pitch
  isGrounded: boolean;    // Skis touching snow
  airTime: number;        // Time airborne over bumps
  worldPos: { x: number; y: number; z: number };
}

export interface PanOrientation {
  pitch: number;          // Tilt forward/backward (radians)
  roll: number;           // Tilt left/right (radians)
  yaw: number;            // Slight yaw with steering
  tossProgress: number;   // 0 to 1 during toss animation
  tossVelocity: number;   // Upward velocity during toss
}

export interface Obstacle {
  id: number;
  type: "pine" | "rock" | "banner_post" | "barrier";
  distance: number;       // Along course Z
  lateralOffset: number;  // X offset from course center
  radius: number;         // Collision radius
  height: number;
  rotation: number;
  scale: number;
  width?: number;         // Width of a barrier panel, in meters
}

export interface RunResults {
  grade: GradeRank;
  title: string;
  summary: string;
  startingGrains: number;
  retainedAtFinish: number;
  platedGrains: number;
  platedPercent: number;
  avgDoneness: number;
  avgBurnDamage: number;
  timeElapsed: number;
  targetTime: number;
  score: number;
  isPersonalBest: boolean;
  failureReason?: FailureReason;
}

export interface PersonalBest {
  score: number;
  grade: GradeRank;
  platedPercent: number;
  avgDoneness: number;
  avgBurnDamage: number;
  time: number;
  date: string;
}

export interface GameHUDState {
  phase: GamePhase;
  countdownNumber: number;
  grainsRemaining: number;
  platedCount: number;
  speedKmh: number;
  distanceProgress: number; // 0.0 to 1.0
  timeElapsed: number;
  avgDoneness: number;      // 0 to 100%
  avgBurnRisk: number;      // 0 to 100%
  warningText: string | null;
  tossReady: boolean;
}
