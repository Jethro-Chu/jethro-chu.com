/**
 * Skier Movement, Pan Tilt, and Camera Controller for "Wok This Slope"
 */

import * as THREE from "three";
import { SKI_CONFIG } from "./config.ts";
import { SkiCourse } from "./course.ts";
import type { SkierState, PanOrientation, GamePhase, FailureReason } from "./types.ts";
import { SkiAudioEngine } from "./audio.ts";

export interface SkierInputState {
  steerLeft: boolean;
  steerRight: boolean;
  tossPressed: boolean;
  mouseDeltaX: number;
  mouseDeltaY: number;
  mouseNormalizedX: number; // For non-pointer-lock fallback (-1 to +1)
  mouseNormalizedY: number;
  pointerLocked: boolean;
}

export class SkierController {
  public state: SkierState;
  public panOrientation: PanOrientation;
  public input: SkierInputState;

  private course: SkiCourse;
  private audio: SkiAudioEngine | null;

  // Options
  public reducedCameraShake: boolean = false;

  // Toss timing
  public tossCooldownTimer: number = 0;
  public tossAnimTimer: number = 0;

  // Camera shake state
  public cameraShakeIntensity: number = 0;

  // Recent accelerations for physics
  public lateralInertia: number = 0;
  public verticalBumpImpulse: number = 0;

  // Collision state
  public hasCrashed: boolean = false;
  public crashReason?: FailureReason;

  constructor(course: SkiCourse, audioEngine?: SkiAudioEngine) {
    this.course = course;
    this.audio = audioEngine || null;

    this.input = {
      steerLeft: false,
      steerRight: false,
      tossPressed: false,
      mouseDeltaX: 0,
      mouseDeltaY: 0,
      mouseNormalizedX: 0,
      mouseNormalizedY: 0,
      pointerLocked: false,
    };

    this.state = this.getInitialState();
    this.panOrientation = {
      pitch: 0,
      roll: 0,
      yaw: 0,
      tossProgress: 0,
      tossVelocity: 0,
    };
  }

  private getInitialState(): SkierState {
    const track = this.course.getTrackCenter(0);
    return {
      distance: 0,
      lateralOffset: 0,
      lateralSpeed: 0,
      speed: 6.0, // Initial push out of the start gate
      acceleration: 0,
      steerAngle: 0,
      slopePitch: track.slope,
      isGrounded: true,
      airTime: 0,
      worldPos: { x: track.x, y: track.y, z: 0 },
    };
  }

  public reset(): void {
    this.state = this.getInitialState();
    this.panOrientation = {
      pitch: 0,
      roll: 0,
      yaw: 0,
      tossProgress: 0,
      tossVelocity: 0,
    };
    this.tossCooldownTimer = 0;
    this.tossAnimTimer = 0;
    this.cameraShakeIntensity = 0;
    this.lateralInertia = 0;
    this.verticalBumpImpulse = 0;
    this.hasCrashed = false;
    this.crashReason = undefined;
    this.input.mouseDeltaX = 0;
    this.input.mouseDeltaY = 0;
  }

  /**
   * Update skier physics, steering, pan orientation, and camera
   */
  public update(
    dt: number,
    phase: GamePhase,
    onTossTriggered?: () => void
  ): { phaseTransition?: GamePhase; failureReason?: FailureReason } {
    // Decay camera shake
    if (this.cameraShakeIntensity > 0) {
      this.cameraShakeIntensity = Math.max(0, this.cameraShakeIntensity - dt * 2.5);
    }

    // Toss timers
    if (this.tossCooldownTimer > 0) {
      this.tossCooldownTimer = Math.max(0, this.tossCooldownTimer - dt);
    }

    if (phase === "countdown") {
      this.updatePanOrientation(dt, false);
      return {};
    }

    if (phase === "skiing") {
      return this.updateSkiing(dt, onTossTriggered);
    }

    if (phase === "plating") {
      return this.updatePlating(dt, onTossTriggered);
    }

    return {};
  }

  private updateSkiing(
    dt: number,
    onTossTriggered?: () => void
  ): { phaseTransition?: GamePhase; failureReason?: FailureReason } {
    const track = this.course.getTrackCenter(this.state.distance);

    // 1. Forward downhill acceleration & speed
    const g = SKI_CONFIG.RICE.GRAVITY;
    const slopeGravity = g * Math.sin(track.slope);
    const drag = SKI_CONFIG.SKIER.DRAG_COEFF * this.state.speed;
    const netAccel = slopeGravity * SKI_CONFIG.SKIER.ACCEL_MPS2 * 0.22 - drag;

    this.state.acceleration = netAccel;
    this.state.speed = Math.max(
      SKI_CONFIG.SKIER.MIN_SPEED_MPS,
      Math.min(SKI_CONFIG.SKIER.MAX_SPEED_MPS, this.state.speed + netAccel * dt)
    );

    // Advance along course
    const prevDistance = this.state.distance;
    this.state.distance += this.state.speed * dt;

    // 2. Lateral steering (A/D or Arrows)
    let steerDir = 0;
    if (this.input.steerLeft) steerDir -= 1;
    if (this.input.steerRight) steerDir += 1;

    const targetLateralSpeed = steerDir * SKI_CONFIG.SKIER.TURN_SPEED;
    this.state.lateralSpeed = THREE.MathUtils.lerp(
      this.state.lateralSpeed,
      targetLateralSpeed,
      SKI_CONFIG.SKIER.TURN_INERTIA * (dt * 60)
    );

    this.state.lateralOffset += this.state.lateralSpeed * dt;

    // Clamp inside course width
    const halfWidth = this.course.width / 2 - 1.2;
    if (Math.abs(this.state.lateralOffset) > halfWidth) {
      this.state.lateralOffset = Math.sign(this.state.lateralOffset) * halfWidth;
      this.state.lateralSpeed = 0;
    }

    // Centripetal acceleration / lateral inertia felt by the pan & rice
    // When turning right (steerDir > 0), centrifugal force pushes rice left (negative X)
    const turnRate = this.state.lateralSpeed / SKI_CONFIG.SKIER.TURN_SPEED;
    this.lateralInertia = -turnRate * (this.state.speed * 0.45);

    // Skier steer banking angle
    this.state.steerAngle = -turnRate * SKI_CONFIG.SKIER.BANKING_FACTOR;

    // 3. World Position calculation
    const currentTrack = this.course.getTrackCenter(this.state.distance);
    const worldX = currentTrack.x + this.state.lateralOffset;
    const worldZ = this.state.distance;
    const groundY = this.course.getGroundHeight(worldX, worldZ);

    // Vertical bumps / moguls
    const prevGroundY = this.course.getGroundHeight(worldX, prevDistance);
    const verticalVelocity = (groundY - prevGroundY) / Math.max(0.001, dt);
    this.verticalBumpImpulse = verticalVelocity * 0.8;

    this.state.worldPos.x = worldX;
    this.state.worldPos.y = groundY;
    this.state.worldPos.z = worldZ;
    this.state.slopePitch = currentTrack.slope;

    // 4. Update Audio Engine
    if (this.audio) {
      const speedFraction = this.state.speed / SKI_CONFIG.SKIER.MAX_SPEED_MPS;
      this.audio.updateSkiSound(speedFraction, this.state.isGrounded);
    }

    // 5. Check Obstacle Collisions
    const collision = this.course.checkCollision(worldX, worldZ, 0.55);
    if (collision) {
      if (this.state.speed >= SKI_CONFIG.SKIER.HEAD_ON_CRASH_SPEED && Math.abs(this.state.lateralOffset - (collision.lateralOffset - currentTrack.x)) < 0.45) {
        // FATAL HEAD-ON COLLISION
        this.hasCrashed = true;
        this.crashReason = "tree_crash";
        this.cameraShakeIntensity = 1.0;
        if (this.audio) this.audio.playImpact(1.0);
        return { phaseTransition: "failed", failureReason: "tree_crash" };
      } else {
        // GLANCING HIT
        this.state.speed *= 0.65; // speed drop
        this.cameraShakeIntensity = 0.55;
        this.lateralInertia += (Math.random() - 0.5) * 8.0;
        this.verticalBumpImpulse += 4.5;
        if (this.audio) this.audio.playImpact(0.5);
      }
    }

    // 6. Pan Orientation & Toss
    this.updatePanOrientation(dt, false);

    if (this.input.tossPressed && this.tossCooldownTimer <= 0) {
      this.triggerToss();
      if (onTossTriggered) onTossTriggered();
    }

    // 7. Check Finish Line reached
    if (this.state.distance >= this.course.finishZ) {
      return { phaseTransition: "plating" };
    }

    return {};
  }

  private updatePlating(
    dt: number,
    onTossTriggered?: () => void
  ): { phaseTransition?: GamePhase; failureReason?: FailureReason } {
    // Decelerate smoothly to stop at table
    const targetDist = this.course.tableZ - 1.2;
    const distRemain = targetDist - this.state.distance;

    if (distRemain > 0.05) {
      this.state.speed = Math.max(0, distRemain * 2.8);
      this.state.distance += this.state.speed * dt;
    } else {
      this.state.speed = 0;
    }

    // Skier centers in front of table
    this.state.lateralOffset = THREE.MathUtils.lerp(this.state.lateralOffset, 0, dt * 3.0);
    const track = this.course.getTrackCenter(this.state.distance);
    this.state.worldPos.x = track.x + this.state.lateralOffset;
    this.state.worldPos.y = this.course.getGroundHeight(this.state.worldPos.x, this.state.distance);
    this.state.worldPos.z = this.state.distance;

    if (this.audio) {
      this.audio.updateSkiSound(0, true);
    }

    // Plating pan orientation: allows tipping forward steeply to dump rice
    this.updatePanOrientation(dt, true);

    // Spacebar during plating gives gentle tap to shake rice onto plate
    if (this.input.tossPressed && this.tossCooldownTimer <= 0) {
      this.triggerToss(0.5); // softer toss / jiggle
      if (onTossTriggered) onTossTriggered();
    }

    return {};
  }

  private updatePanOrientation(dt: number, isPlating: boolean): void {
    const maxPitch = isPlating ? 1.35 : SKI_CONFIG.PAN.MAX_PITCH_RAD; // up to ~77 deg pitch during plating
    const maxRoll = SKI_CONFIG.PAN.MAX_ROLL_RAD;

    let targetPitch = 0;
    let targetRoll = 0;

    if (this.input.pointerLocked) {
      // Sensitivity factor
      const sens = isPlating ? 0.0028 : 0.0018;
      targetPitch = THREE.MathUtils.clamp(
        this.panOrientation.pitch + this.input.mouseDeltaY * sens,
        -0.35,
        maxPitch
      );
      targetRoll = THREE.MathUtils.clamp(
        this.panOrientation.roll + this.input.mouseDeltaX * sens,
        -maxRoll,
        maxRoll
      );
      // Consume delta
      this.input.mouseDeltaX = 0;
      this.input.mouseDeltaY = 0;
    } else {
      // Non-pointer-lock fallback: follow normalized mouse (-1 to +1)
      targetPitch = THREE.MathUtils.clamp(
        this.input.mouseNormalizedY * maxPitch,
        -0.35,
        maxPitch
      );
      targetRoll = THREE.MathUtils.clamp(
        this.input.mouseNormalizedX * maxRoll,
        -maxRoll,
        maxRoll
      );
    }

    // Smooth pan follow
    const lerpFactor = SKI_CONFIG.PAN.TILT_LERP * (dt * 60);
    this.panOrientation.pitch = THREE.MathUtils.lerp(this.panOrientation.pitch, targetPitch, lerpFactor);
    this.panOrientation.roll = THREE.MathUtils.lerp(this.panOrientation.roll, targetRoll, lerpFactor);

    // Toss animation progress
    if (this.tossAnimTimer > 0) {
      this.tossAnimTimer -= dt;
      const progress = 1.0 - this.tossAnimTimer / SKI_CONFIG.PAN.TOSS_DURATION_SEC;
      // Quick pop up, then smooth settle
      this.panOrientation.tossProgress = Math.sin(progress * Math.PI);
    } else {
      this.panOrientation.tossProgress = 0;
    }
  }

  private triggerToss(powerMultiplier: number = 1.0): void {
    this.tossCooldownTimer = SKI_CONFIG.PAN.TOSS_COOLDOWN_SEC;
    this.tossAnimTimer = SKI_CONFIG.PAN.TOSS_DURATION_SEC;
  }

  public clearInputs(): void {
    this.input.steerLeft = false;
    this.input.steerRight = false;
    this.input.tossPressed = false;
    this.input.mouseDeltaX = 0;
    this.input.mouseDeltaY = 0;
  }
}
