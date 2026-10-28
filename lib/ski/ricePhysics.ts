/**
 * Instanced Rice Simulation & Cooking Engine for "Wok This Slope"
 * Manages 300 individual rice particles in pan local space and spilled particles in world space.
 */

import * as THREE from "three";
import { SKI_CONFIG } from "./config.ts";
import type { GrainState, SpilledParticle } from "./types.ts";
import { SkiAudioEngine } from "./audio.ts";

export class RiceSimulation {
  public grains: GrainState[] = [];
  public spilledParticles: SpilledParticle[] = [];

  // Instanced Meshes
  public retainedMesh: THREE.InstancedMesh;
  public spilledMesh: THREE.InstancedMesh;

  // Cached Three.js objects
  private dummyMatrix: THREE.Matrix4 = new THREE.Matrix4();
  private dummyQuat: THREE.Quaternion = new THREE.Quaternion();
  private dummyScale: THREE.Vector3 = new THREE.Vector3();
  private dummyPos: THREE.Vector3 = new THREE.Vector3();
  private dummyColor: THREE.Color = new THREE.Color();

  // Statistics
  public retainedCount: number = 300;
  public platedCount: number = 0;
  public avgDoneness: number = 0;
  public avgBurnRisk: number = 0;
  public charredFraction: number = 0;
  public activeCookingCount: number = 0;

  // Audio Engine reference
  private audio: SkiAudioEngine | null = null;

  // Audio throttle for spills
  private lastSpillSoundTime: number = 0;
  private lastPlateSoundTime: number = 0;

  constructor(audioEngine?: SkiAudioEngine) {
    this.audio = audioEngine || null;

    // Build elongated grain geometry (16mm x 7mm)
    const grainGeom = new THREE.CylinderGeometry(
      SKI_CONFIG.RICE.GRAIN_RADIUS,
      SKI_CONFIG.RICE.GRAIN_RADIUS * 1.2,
      SKI_CONFIG.RICE.GRAIN_LENGTH,
      6
    );
    // Align cylinder along grain's longitudinal axis
    grainGeom.rotateX(Math.PI / 2);

    // Retained grains material. Per-grain color comes from instanceColor
    // (set via setColorAt). Do NOT set vertexColors here: the grain geometry
    // has no color attribute, so that flag shades every grain black and the
    // rice renders invisible against the dark pan.
    const grainMat = new THREE.MeshStandardMaterial({
      roughness: 0.45,
      metalness: 0.1,
    });

    this.retainedMesh = new THREE.InstancedMesh(grainGeom, grainMat, SKI_CONFIG.RICE.GRAIN_COUNT);
    this.retainedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    if (this.retainedMesh.instanceColor) {
      this.retainedMesh.instanceColor.setUsage(THREE.DynamicDrawUsage);
    }

    // Spilled particles mesh (max 300 particles). Same instanceColor note
    // as the retained material above: no vertexColors flag.
    const spilledMat = new THREE.MeshStandardMaterial({
      roughness: 0.5,
      metalness: 0.1,
    });
    this.spilledMesh = new THREE.InstancedMesh(grainGeom, spilledMat, SKI_CONFIG.RICE.GRAIN_COUNT);
    // Instances move in world space along the entire slope. Their initial
    // bounds are at the origin and become stale after a spill or crash.
    this.spilledMesh.frustumCulled = false;
    this.spilledMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    if (this.spilledMesh.instanceColor) {
      this.spilledMesh.instanceColor.setUsage(THREE.DynamicDrawUsage);
    }

    this.reset();
  }

  /**
   * Reset simulation to pristine starting state (300 raw settled grains)
   */
  public reset(): void {
    this.grains = [];
    this.spilledParticles = [];
    this.retainedCount = SKI_CONFIG.RICE.GRAIN_COUNT;
    this.platedCount = 0;
    this.avgDoneness = 0;
    this.avgBurnRisk = 0;
    this.charredFraction = 0;
    this.activeCookingCount = 0;

    // Distribute 300 grains in a natural layer at the bottom of the pan
    // Using Vogel's spiral distribution for natural settled pack
    const count = SKI_CONFIG.RICE.GRAIN_COUNT;
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));
    const maxSpawnRadius = SKI_CONFIG.PAN.RADIUS * 0.72;

    for (let i = 0; i < count; i++) {
      const theta = i * goldenAngle;
      const r = Math.sqrt((i + 0.5) / count) * maxSpawnRadius;
      const x = r * Math.cos(theta);
      const z = r * Math.sin(theta);
      const ySurf = SKI_CONFIG.PAN.CURVATURE_A * r * r;

      this.grains.push({
        x,
        y: ySurf + 0.002, // slightly resting on pan bottom
        z,
        vx: 0,
        vy: 0,
        vz: 0,
        doneness: 0.0,
        burnDamage: 0.0,
        retained: true,
        plated: false,
        inContact: true,
      });
    }

    // Initialize instanced colors to raw rice
    const rawColor = new THREE.Color(SKI_CONFIG.COLORS.RAW_RICE);
    for (let i = 0; i < count; i++) {
      this.retainedMesh.setColorAt(i, rawColor);
      this.spilledMesh.setColorAt(i, rawColor);
    }
    if (this.retainedMesh.instanceColor) this.retainedMesh.instanceColor.needsUpdate = true;
    if (this.spilledMesh.instanceColor) this.spilledMesh.instanceColor.needsUpdate = true;

    // Initial matrix upload
    this.updateMeshTransforms();
  }

  /**
   * Physics simulation step
   * @param dt Delta time (seconds)
   * @param panPitch Pitch of pan in radians (forward/backward)
   * @param panRoll Roll of pan in radians (left/right)
   * @param lateralInertia Centrifugal lateral force from skier turns
   * @param verticalBumpImpulse Upward/downward acceleration from terrain moguls
   * @param panWorldTransform World transform matrix of the pan
   * @param isPlatingPhase Whether we are in the serving / plating phase
   * @param plateWorldPos World position of the serving plate
   */
  public step(
    dt: number,
    panPitch: number,
    panRoll: number,
    lateralInertia: number,
    verticalBumpImpulse: number,
    panWorldTransform: THREE.Matrix4,
    isPlatingPhase: boolean,
    plateWorldPos: { x: number; y: number; z: number },
    panWorldVelocity: { x: number; y: number; z: number } = { x: 0, y: 0, z: 0 }
  ): void {
    // Sub-stepping for numerical stability
    const substeps = SKI_CONFIG.RICE.SUBSTEPS;
    const subDt = Math.min(dt, 0.05) / substeps;

    const g = SKI_CONFIG.RICE.GRAVITY;
    const panR = SKI_CONFIG.PAN.RADIUS;
    const panDepth = SKI_CONFIG.PAN.DEPTH;
    const curvA = SKI_CONFIG.PAN.CURVATURE_A;
    const fric = SKI_CONFIG.RICE.FRICTION_COEFF;
    const rest = SKI_CONFIG.RICE.RESTITUTION;

    // Compute effective gravity in pan local frame
    // Pan pitch: positive = tilted forward (rice pulled in -Z direction)
    // Pan roll: positive = tilted right (rice pulled in -X direction)
    const gxLocal = -g * Math.sin(panRoll) + lateralInertia;
    const gyLocal = -g * Math.cos(panPitch) * Math.cos(panRoll) - verticalBumpImpulse;
    const gzLocal = g * Math.sin(panPitch);

    for (let sub = 0; sub < substeps; sub++) {
      // 1. Update retained grains physics
      for (let i = 0; i < this.grains.length; i++) {
        const grain = this.grains[i];
        if (!grain.retained) continue;

        // Static friction: a settled grain sticks to the pan until the
        // tangential pull (bowl slope + pan tilt + turn inertia) exceeds
        // the break-loose threshold. Without this, every grain funnels
        // down the parabolic bowl into a single point at the center.
        let ax = gxLocal;
        let ay = gyLocal;
        let az = gzLocal;
        if (grain.inContact) {
          const nx0 = -2 * curvA * grain.x;
          const nz0 = -2 * curvA * grain.z;
          const nLen0 = Math.sqrt(nx0 * nx0 + 1 + nz0 * nz0);
          const ux = nx0 / nLen0;
          const uy = 1 / nLen0;
          const uz = nz0 / nLen0;
          const gDotN = ax * ux + ay * uy + az * uz;
          const gtx = ax - gDotN * ux;
          const gty = ay - gDotN * uy;
          const gtz = az - gDotN * uz;
          const gtMag = Math.sqrt(gtx * gtx + gty * gty + gtz * gtz);
          const vDotN = grain.vx * ux + grain.vy * uy + grain.vz * uz;
          const vtx = grain.vx - vDotN * ux;
          const vty = grain.vy - vDotN * uy;
          const vtz = grain.vz - vDotN * uz;
          const vtMag = Math.sqrt(vtx * vtx + vty * vty + vtz * vtz);
          if (gtMag < 2.3 && vtMag < 0.5) {
            // Stuck: only the normal component of gravity acts (it is
            // cancelled by the surface in the collision response below)
            ax = gDotN * ux;
            ay = gDotN * uy;
            az = gDotN * uz;
          }
        }

        // Apply local forces
        grain.vx += ax * subDt;
        grain.vy += ay * subDt;
        grain.vz += az * subDt;

        // Apply velocity
        grain.x += grain.vx * subDt;
        grain.y += grain.vy * subDt;
        grain.z += grain.vz * subDt;

        // Pan bottom surface height at radial distance r
        const r = Math.sqrt(grain.x * grain.x + grain.z * grain.z);
        const ySurf = curvA * r * r;

        // Collision with pan bottom
        if (grain.y <= ySurf) {
          grain.y = ySurf;
          grain.inContact = true;

          // Normal vector of the parabolic pan surface
          // n = (-2ax, 1, -2az) normalized
          const nx = -2 * curvA * grain.x;
          const ny = 1.0;
          const nz = -2 * curvA * grain.z;
          const nLen = Math.sqrt(nx * nx + ny * ny + nz * nz);
          const normX = nx / nLen;
          const normY = ny / nLen;
          const normZ = nz / nLen;

          // Normal velocity
          const vDotN = grain.vx * normX + grain.vy * normY + grain.vz * normZ;
          if (vDotN < 0) {
            // Rebound normal velocity with restitution
            grain.vx -= (1 + rest) * vDotN * normX;
            grain.vy -= (1 + rest) * vDotN * normY;
            grain.vz -= (1 + rest) * vDotN * normZ;
          }

          // Apply surface friction to tangential velocity
          const frictionFactor = Math.max(0, 1 - fric * subDt * 18.0);
          grain.vx *= frictionFactor;
          grain.vz *= frictionFactor;
        } else {
          grain.inContact = false;
        }

        // Rim containment vs Spilling
        if (r >= panR) {
          // If the grain has cleared the rim height or is pouring out during steep tilt.
          // Pitch sign: positive pitch raises the pan's front edge (-Z), so
          // pouring over the front rim needs a strongly NEGATIVE pitch.
          const rimHeightAtEdge = panDepth;
          const isPouringForward = isPlatingPhase && panPitch < -0.45 && grain.z < 0;

          if (grain.y >= rimHeightAtEdge || isPouringForward || (grain.vy > 0.6 && r > panR + 0.015)) {
            // GRAIN SPILLS OUT!
            this.spillGrain(grain, i, panWorldTransform, panWorldVelocity);
          } else {
            // Inside rim boundary: bounce back inward
            const pushBack = (panR - 0.002) / r;
            grain.x *= pushBack;
            grain.z *= pushBack;

            // Inward normal (unit vector from edge towards center)
            const rx = -grain.x / panR;
            const rz = -grain.z / panR;
            const vDotR = grain.vx * rx + grain.vz * rz;
            if (vDotR < 0) {
              grain.vx -= (1 + rest) * vDotR * rx;
              grain.vz -= (1 + rest) * vDotR * rz;
            }
          }
        }
      }

      // 2. Pairwise grain separation (stochastic relaxation to avoid O(N^2) bottleneck)
      // Check each grain against a small subset of nearby neighbors
      const sepDist = SKI_CONFIG.RICE.SEPARATION_RADIUS;
      const sepDistSq = sepDist * sepDist;
      const sepForce = SKI_CONFIG.RICE.SEPARATION_STRENGTH * subDt;

      for (let i = 0; i < this.grains.length; i += 2) {
        const gA = this.grains[i];
        if (!gA.retained || !gA.inContact) continue;

        // Check against next 6 grains in array (which share radial/spatial locality)
        const checkLimit = Math.min(this.grains.length, i + 8);
        for (let j = i + 1; j < checkLimit; j++) {
          const gB = this.grains[j];
          if (!gB.retained || !gB.inContact) continue;

          const dx = gA.x - gB.x;
          const dz = gA.z - gB.z;
          const dSq = dx * dx + dz * dz;

          if (dSq < sepDistSq && dSq > 0.000001) {
            const d = Math.sqrt(dSq);
            const overlap = (sepDist - d) * sepForce;
            const nx = dx / d;
            const nz = dz / d;

            gA.x += nx * overlap;
            gA.z += nz * overlap;
            gB.x -= nx * overlap;
            gB.z -= nz * overlap;
          }
        }
      }
    }

    // 3. Thermal cooking progression
    this.updateThermal(dt);

    // 4. Update world-space spilled particles (and plating check)
    this.updateSpilledParticles(dt, isPlatingPhase, plateWorldPos);

    // 5. Update InstancedMesh matrices and colors
    this.updateMeshTransforms();
  }

  /**
   * Apply toss impulse (Spacebar)
   */
  public toss(upwardMultiplier: number = 1.0): void {
    const impulse = SKI_CONFIG.PAN.TOSS_IMPULSE_VY * upwardMultiplier;
    let tossedCount = 0;

    for (let i = 0; i < this.grains.length; i++) {
      const g = this.grains[i];
      if (!g.retained) continue;

      // Impart upward velocity with real redistribution: each grain is
      // aimed at a random landing spot inside the bowl, so a toss cycles
      // grains through the hot center instead of landing them where they
      // started (which burned the batch even with regular tossing).
      // Aiming inside the bowl keeps the spill risk to grains knocked
      // loose at the rim rather than ejecting the whole batch.
      if (g.inContact || g.y < 0.04) {
        g.vy += impulse + (Math.random() - 0.5) * 0.35;
        const targetR = Math.sqrt(Math.random()) * SKI_CONFIG.PAN.RADIUS * 0.68;
        const targetA = Math.random() * Math.PI * 2;
        const flight = 0.45; // approx airborne seconds for the toss impulse
        g.vx = ((Math.cos(targetA) * targetR - g.x) / flight) * (0.65 + Math.random() * 0.3);
        g.vz = ((Math.sin(targetA) * targetR - g.z) / flight) * (0.65 + Math.random() * 0.3);
        g.inContact = false;
        tossedCount++;
      }
    }

    if (tossedCount > 0 && this.audio) {
      this.audio.playToss();
    }
  }

  /** Throw the remaining rice out once when the cooking rig crashes. */
  public scatterOnCrash(
    panWorldTransform: THREE.Matrix4,
    panWorldVelocity: { x: number; y: number; z: number }
  ): void {
    for (let i = 0; i < this.grains.length; i++) {
      const grain = this.grains[i];
      if (!grain.retained) continue;
      // Keep a portion of the downhill momentum while spreading grains
      // through a readable arc around the airborne pan and stove.
      this.spillGrain(grain, i, panWorldTransform, {
        x: panWorldVelocity.x * 0.3,
        y: panWorldVelocity.y,
        z: panWorldVelocity.z * 0.3,
      });
      const particle = this.spilledParticles[this.spilledParticles.length - 1];
      const angle = i * 2.399963229728653;
      const strength = 1.2 + (i % 9) * 0.26;
      particle.vx += Math.cos(angle) * strength;
      particle.vy += 1.8 + (i % 7) * 0.27;
      particle.vz += Math.sin(angle) * strength;
    }
    this.updateMeshTransforms();
  }

  /** Advance the airborne rice during the crash, without cooking it. */
  public stepCrash(dt: number): void {
    this.updateSpilledParticles(Math.min(dt, 0.05), false, { x: 0, y: 0, z: 0 });
    this.updateMeshTransforms();
  }

  /**
   * Spill an individual grain over the pan rim into world coordinates
   */
  private spillGrain(
    grain: GrainState,
    index: number,
    panWorldTransform: THREE.Matrix4,
    panWorldVelocity: { x: number; y: number; z: number } = { x: 0, y: 0, z: 0 }
  ): void {
    grain.retained = false;
    this.retainedCount--;

    // Compute grain's world position from pan transform. Keep it in its own
    // vector: decompose() writes the pan's origin into its first argument,
    // which previously overwrote the grain position and spawned every
    // spilled grain at the pan center.
    const worldPos = new THREE.Vector3(grain.x, grain.y, grain.z);
    worldPos.applyMatrix4(panWorldTransform);

    // Extract pan world rotation to project velocity into world frame
    panWorldTransform.decompose(this.dummyPos, this.dummyQuat, this.dummyScale);

    // Convert local velocity to world velocity
    const localVel = new THREE.Vector3(grain.vx, grain.vy, grain.vz);
    localVel.applyQuaternion(this.dummyQuat);

    // Add extra outward ejection impulse
    const outwardDir = new THREE.Vector3(grain.x, 0.05, grain.z).normalize();
    outwardDir.applyQuaternion(this.dummyQuat);
    localVel.addScaledVector(outwardDir, 0.4);

    // Inherit the pan's world velocity: grains leaving a moving pan keep
    // its momentum. Without this they dropped straight down from the
    // spawn point and landed short whenever the skier was still rolling.
    localVel.x += panWorldVelocity.x;
    localVel.y += panWorldVelocity.y;
    localVel.z += panWorldVelocity.z;

    this.spilledParticles.push({
      x: worldPos.x,
      y: worldPos.y,
      z: worldPos.z,
      vx: localVel.x,
      vy: localVel.y,
      vz: localVel.z,
      life: 2.5,
      maxLife: 2.5,
      doneness: grain.doneness,
      burnDamage: grain.burnDamage,
      settled: false,
      onPlate: false,
    });

    // Sound feedback (throttled)
    const now = performance.now();
    if (this.audio && now - this.lastSpillSoundTime > 60) {
      this.audio.playGrainSpill();
      this.lastSpillSoundTime = now;
    }
  }

  /**
   * Thermal Cooking Model
   */
  private updateThermal(dt: number): void {
    const burnerR = SKI_CONFIG.COOKING.BURNER_RADIUS;
    const cookRate = SKI_CONFIG.COOKING.COOK_RATE;
    const burnRate = SKI_CONFIG.COOKING.BURN_RATE;
    const burnStartDoneness = SKI_CONFIG.COOKING.BURN_START_DONENESS;
    const rimFactor = SKI_CONFIG.COOKING.RIM_COOK_FACTOR;

    let totalDoneness = 0;
    let totalBurn = 0;
    let cookingCount = 0;
    let charredCount = 0;

    for (let i = 0; i < this.grains.length; i++) {
      const g = this.grains[i];
      if (!g.retained) continue;

      if (g.inContact) {
        const r = Math.sqrt(g.x * g.x + g.z * g.z);
        // Heat profile: highest at center burner, lower towards rim
        let heat = 0;
        if (r <= burnerR) {
          heat = 1.0 - (r / burnerR) * 0.45; // 0.55 to 1.0 heat
        } else {
          heat = rimFactor * Math.max(0, 1 - (r - burnerR) / (SKI_CONFIG.PAN.RADIUS - burnerR));
        }

        if (heat > 0.05) {
          cookingCount++;
          // Increase doneness
          g.doneness = Math.min(1.0, g.doneness + cookRate * heat * dt);

          // Once sufficiently cooked, accumulation of burn damage begins
          if (g.doneness >= burnStartDoneness) {
            g.burnDamage = Math.min(1.0, g.burnDamage + burnRate * heat * dt);
          }
        }
      }

      totalDoneness += g.doneness;
      totalBurn += g.burnDamage;
      if (g.burnDamage >= SKI_CONFIG.COOKING.CHARRED_GRAIN_BURN) charredCount++;
    }

    if (this.retainedCount > 0) {
      this.avgDoneness = totalDoneness / this.retainedCount;
      this.avgBurnRisk = totalBurn / this.retainedCount;
      this.charredFraction = charredCount / this.retainedCount;
    } else {
      this.avgDoneness = 0;
      this.avgBurnRisk = 0;
      this.charredFraction = 0;
    }

    this.activeCookingCount = cookingCount;

    // Update audio engine cooking sizzle
    if (this.audio) {
      this.audio.updateCookingSound(this.activeCookingCount, this.avgBurnRisk);
    }
  }

  /**
   * Update world-space spilled particles (and plating check)
   */
  private updateSpilledParticles(
    dt: number,
    isPlatingPhase: boolean,
    plateWorldPos: { x: number; y: number; z: number }
  ): void {
    const g = SKI_CONFIG.RICE.GRAVITY;
    const plateR = SKI_CONFIG.PLATING.PLATE_RADIUS;
    const plateR_Sq = plateR * plateR;

    for (let i = this.spilledParticles.length - 1; i >= 0; i--) {
      const p = this.spilledParticles[i];

      if (p.settled) {
        p.life -= dt;
        if (p.life <= 0 && !p.onPlate) {
          // Remove expired particles that missed the plate
          this.spilledParticles.splice(i, 1);
        }
        continue;
      }

      // World gravity & drag. Age falling grains too: without this they
      // fell through the snow forever and were only culled at y <= -200.
      // The terrain mesh occludes them once they drop below the surface,
      // so expiring on lifetime reads as landing in the snow.
      p.life -= dt;
      if (p.life <= 0) {
        this.spilledParticles.splice(i, 1);
        continue;
      }
      p.vy -= g * dt;
      p.vx *= 0.98;
      p.vz *= 0.98;

      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.z += p.vz * dt;

      // Check collision with serving plate or ground
      if (isPlatingPhase) {
        // Grains passing low over the plate land on it: checking only at
        // table height let a normal pour's momentum carry every grain
        // past the far rim. Capture within a forgiving height band.
        if (p.y <= plateWorldPos.y + 0.4) {
          const dx = p.x - plateWorldPos.x;
          const dz = p.z - plateWorldPos.z;
          const distSq = dx * dx + dz * dz;

          if (distSq <= plateR_Sq) {
            // SUCCESSFUL PLATED GRAIN!
            p.settled = true;
            p.onPlate = true;
            p.y = plateWorldPos.y + 0.02 + Math.random() * 0.015;
            p.vx = 0;
            p.vy = 0;
            p.vz = 0;
            this.platedCount++;

            const now = performance.now();
            if (this.audio && now - this.lastPlateSoundTime > 35) {
              this.audio.playPlateClink();
              this.lastPlateSoundTime = now;
            }
          } else if (p.y <= plateWorldPos.y + 0.02) {
            // Missed plate - landed on table or snow (only settle once
            // actually at table height, not inside the capture band)
            p.settled = true;
            p.onPlate = false;
            p.y = plateWorldPos.y;
            p.vx = 0;
            p.vy = 0;
            p.vz = 0;
          }
        }
      } else {
        // Normal skiing ground impact
        if (p.y <= -200) {
          // Fallen off world
          this.spilledParticles.splice(i, 1);
        }
      }
    }
  }

  /**
   * Update Three.js InstancedMesh matrices and vertex colors
   */
  private updateMeshTransforms(): void {
    let visibleRetained = 0;

    for (let i = 0; i < this.grains.length; i++) {
      const g = this.grains[i];
      if (g.retained) {
        // Position grain in pan local space, lifted a few mm so the drawn
        // grain rests on the pan surface instead of half-sinking into it.
        // A tiny per-grain height jitter keeps the settled layer from
        // looking like one flat sheet of overlapping grains.
        this.dummyPos.set(g.x, g.y + 0.004 + (i % 5) * 0.0016, g.z);

        // Orient grain along velocity or slight natural tilt
        const rotY = Math.atan2(g.vx, g.vz || 0.001);
        const rotX = Math.sin(i * 1.7) * 0.15;
        this.dummyQuat.setFromEuler(new THREE.Euler(rotX, rotY, 0));

        // Drawn larger than the physical grain so individual grains read
        // clearly in the pan at first-person distance (brief requirement).
        this.dummyScale.set(1.7, 1.7, 1.7);
        this.dummyMatrix.compose(this.dummyPos, this.dummyQuat, this.dummyScale);
        this.retainedMesh.setMatrixAt(i, this.dummyMatrix);

        // Compute cooking color
        this.getGrainColor(g.doneness, g.burnDamage, this.dummyColor);
        this.retainedMesh.setColorAt(i, this.dummyColor);
        visibleRetained++;
      } else {
        // Hide non-retained grain by collapsing scale to zero
        this.dummyMatrix.makeScale(0, 0, 0);
        this.retainedMesh.setMatrixAt(i, this.dummyMatrix);
      }
    }

    this.retainedMesh.instanceMatrix.needsUpdate = true;
    if (this.retainedMesh.instanceColor) this.retainedMesh.instanceColor.needsUpdate = true;

    // Update spilled particles mesh
    const maxSpilled = SKI_CONFIG.RICE.GRAIN_COUNT;
    for (let i = 0; i < maxSpilled; i++) {
      if (i < this.spilledParticles.length) {
        const p = this.spilledParticles[i];
        this.dummyPos.set(p.x, p.y, p.z);
        this.dummyQuat.set(0, 0, 0, 1);
        this.dummyScale.set(1.7, 1.7, 1.7);
        this.dummyMatrix.compose(this.dummyPos, this.dummyQuat, this.dummyScale);
        this.spilledMesh.setMatrixAt(i, this.dummyMatrix);

        this.getGrainColor(p.doneness, p.burnDamage, this.dummyColor);
        this.spilledMesh.setColorAt(i, this.dummyColor);
      } else {
        this.dummyMatrix.makeScale(0, 0, 0);
        this.spilledMesh.setMatrixAt(i, this.dummyMatrix);
      }
    }

    this.spilledMesh.instanceMatrix.needsUpdate = true;
    if (this.spilledMesh.instanceColor) this.spilledMesh.instanceColor.needsUpdate = true;
  }

  /**
   * Helper to compute grain color based on doneness and burn
   */
  public getGrainColor(doneness: number, burn: number, outColor: THREE.Color): THREE.Color {
    const raw = new THREE.Color(SKI_CONFIG.COLORS.RAW_RICE);
    const half = new THREE.Color(SKI_CONFIG.COLORS.HALF_COOKED);
    const cooked = new THREE.Color(SKI_CONFIG.COLORS.COOKED_RICE);
    const overcooked = new THREE.Color(SKI_CONFIG.COLORS.OVERCOOKED);
    const burnt = new THREE.Color(SKI_CONFIG.COLORS.BURNT_RICE);

    if (burn > 0.05) {
      // Transition from cooked to overcooked to burnt
      const burnT = Math.min(1.0, burn * 1.5);
      if (burnT < 0.5) {
        outColor.copy(cooked).lerp(overcooked, burnT * 2);
      } else {
        outColor.copy(overcooked).lerp(burnt, (burnT - 0.5) * 2);
      }
    } else {
      // Transition from raw to half-cooked to cooked
      if (doneness < 0.6) {
        outColor.copy(raw).lerp(half, doneness / 0.6);
      } else {
        outColor.copy(half).lerp(cooked, (doneness - 0.6) / 0.4);
      }
    }

    return outColor;
  }

  public dispose(): void {
    this.retainedMesh.geometry.dispose();
    if (Array.isArray(this.retainedMesh.material)) {
      this.retainedMesh.material.forEach((m) => m.dispose());
    } else {
      this.retainedMesh.material.dispose();
    }

    this.spilledMesh.geometry.dispose();
    if (Array.isArray(this.spilledMesh.material)) {
      this.spilledMesh.material.forEach((m) => m.dispose());
    } else {
      this.spilledMesh.material.dispose();
    }
  }
}
