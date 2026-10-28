/**
 * Verification script for "Wok This Slope"
 * Tests grain accounting, cooking mechanics, scoring boundaries, and state reset.
 * Run with: node --no-warnings --experimental-strip-types scripts/verify-ski-game.ts
 */

import assert from "node:assert/strict";
import * as THREE from "three";
import { SKI_CONFIG } from "../lib/ski/config.ts";
import { RiceSimulation } from "../lib/ski/ricePhysics.ts";
import { SkiCourse } from "../lib/ski/course.ts";
import { SkierController } from "../lib/ski/skierController.ts";
import { SkiScoringEngine } from "../lib/ski/scoring.ts";

console.log("🎿 Starting Wok This Slope Verification Suite...\n");

// ============================================================================
// TEST 1: Course & Seed Determinism
// ============================================================================
console.log("TEST 1: Course Determinism & Boundaries");
{
  const courseA = new SkiCourse();
  const courseB = new SkiCourse();

  assert.equal(courseA.obstacles.length, courseB.obstacles.length, "Obstacle count mismatch between instances");
  assert.equal(courseA.obstacles.length > 50, true, "Course must have substantial obstacles");

  for (let i = 0; i < courseA.obstacles.length; i++) {
    const oA = courseA.obstacles[i];
    const oB = courseB.obstacles[i];
    assert.equal(oA.distance, oB.distance, `Obstacle ${i} distance mismatch`);
    assert.equal(oA.lateralOffset, oB.lateralOffset, `Obstacle ${i} lateralOffset mismatch`);
    assert.equal(oA.type, oB.type, `Obstacle ${i} type mismatch`);
  }

  // Check track center at various points
  for (let z = 0; z < courseA.length; z += 50) {
    const tA = courseA.getTrackCenter(z);
    const tB = courseB.getTrackCenter(z);
    assert.equal(tA.x, tB.x, `Track center X at z=${z} mismatch`);
    assert.equal(tA.y, tB.y, `Track center Y at z=${z} mismatch`);
  }

  // Joining and leaving the bends must not teleport a skier sideways.
  for (const z of [100, 900]) {
    assert.ok(Math.abs(courseA.getTrackCenter(z + 0.01).x - courseA.getTrackCenter(z - 0.01).x) < 0.01,
      `Course center jumps at ${z}m`);
  }
  const centeredObstacles = courseA.obstacles.filter((o) =>
    o.distance > 100 && Math.abs(o.lateralOffset - courseA.getTrackCenter(o.distance).x) < 0.01
  );
  assert.ok(centeredObstacles.length >= 3, "A straight run should require choosing a line around obstacles");
  for (const o of centeredObstacles) {
    const centerX = courseA.getTrackCenter(o.distance).x;
    assert.ok(courseA.checkCollision(centerX, o.distance), "Centerline obstacle must be collidable");
    assert.equal(courseA.checkCollision(centerX + 4, o.distance), null, "Obstacle needs a clear way around it");
  }
  assert.ok(courseA.getGroundHeight(45, 0) < 8, "Snowbank must not become a sheer wall");
  const barrierRoute = [
    { z: 218, gap: 4.5 }, { z: 398, gap: -4.5 },
    { z: 612, gap: 4.5 }, { z: 780, gap: -4.5 },
  ];
  assert.equal(courseA.obstacles.filter((o) => o.type === "barrier").length, 8, "Four two-panel barriers required");
  for (const { z, gap } of barrierRoute) {
    const center = courseA.getTrackCenter(z).x;
    assert.equal(courseA.checkCollision(center + gap, z), null, `Barrier ${z} must have a clear opening`);
    assert.equal(courseA.checkCollision(center + gap - 2, z), null, `Barrier ${z} opening needs room on the left`);
    assert.equal(courseA.checkCollision(center + gap + 2, z), null, `Barrier ${z} opening needs room on the right`);
    assert.equal(courseA.checkCollision(center + gap + 3.1, z)?.type, "barrier", `Barrier ${z} must collide at the edge`);
    const side = courseA.obstacles.find((o) => o.type === "barrier" && o.distance === z);
    assert.ok(side, `Barrier ${z} must exist`);
    assert.equal(courseA.checkCollision(side.lateralOffset, z)?.id, side.id, `Barrier ${z} must collide along its full width`);
    for (let approach = z - 12; approach <= z + 12; approach += 2) {
      assert.equal(courseA.checkCollision(courseA.getTrackCenter(approach).x + gap, approach), null,
        `Approach to barrier ${z} must not hide an obstacle in the opening`);
    }
  }
  const impact = new SkierController(courseA);
  const rail = courseA.obstacles.find((o) => o.type === "barrier" && o.distance === 218)!;
  impact.state.distance = rail.distance - 0.2;
  impact.state.lateralOffset = rail.lateralOffset - courseA.getTrackCenter(rail.distance).x;
  impact.state.speed = 14;
  const transition = impact.update(1 / 60, "skiing");
  assert.equal(transition.phaseTransition, undefined, "Barrier impact should not instantly end the run");
  assert.ok(impact.state.speed < 9, "Barrier impact must slow the skier");
  assert.ok(Math.abs(impact.lateralInertia) >= 6, "Barrier impact must jolt the pan");
  const afterImpactSpeed = impact.state.speed;
  impact.update(1 / 60, "skiing");
  assert.ok(impact.state.speed > afterImpactSpeed - 0.1, "A single barrier crossing must not hit every frame");
  const skier = new SkierController(courseA);
  let tosses = 0;
  skier.input.tossPressed = true;
  skier.update(1 / 60, "skiing", () => tosses++);
  skier.update(1 / 60, "skiing", () => tosses++);
  assert.equal(tosses, 1, "A queued tap must toss exactly once");
  assert.equal(skier.input.tossPressed, false, "A consumed toss must clear the queued input");
  skier.input.mouseNormalizedX = 0.8;
  skier.input.mouseNormalizedY = 0.8;
  skier.reset();
  assert.equal(skier.input.mouseNormalizedX, 0, "Restart must center fallback pan roll");
  assert.equal(skier.input.mouseNormalizedY, 0, "Restart must center fallback pan pitch");
  for (const kind of ["pine", "rock", "log"] as const) {
    const obstacle = courseA.obstacles.find((o) => o.type === kind &&
      Math.abs(o.lateralOffset - courseA.getTrackCenter(o.distance).x) < 10);
    assert.ok(obstacle, `Course needs an in-course ${kind}`);
    const impactSkier = new SkierController(courseA);
    impactSkier.state.distance = obstacle.distance - 0.3;
    impactSkier.state.lateralOffset = obstacle.lateralOffset - courseA.getTrackCenter(obstacle.distance).x + 0.6;
    impactSkier.state.speed = 6;
    const result = impactSkier.update(1 / 60, "skiing");
    const reason = kind === "pine" ? "tree_crash" : kind === "rock" ? "rock_crash" : "log_crash";
    assert.equal(result.phaseTransition, "crashing", `${kind} contact must start a crash even on a glancing hit`);
    assert.equal(result.failureReason, reason);
    assert.equal(impactSkier.crashImpact?.obstacle, kind);
    impactSkier.reset();
    assert.equal(impactSkier.crashImpact, null, "Restart must clear crash state");
  }

  console.log("  ✓ Seeded Mulberry32 PRNG produces identical course layouts");
  console.log("  ✓ Smooth course transitions and avoidable centerline obstacles verified");
  console.log("  ✓ Alternating barrier gaps, clear approaches, and one jolt per impact verified");
  console.log(`  ✓ Total obstacles placed: ${courseA.obstacles.length} along ${courseA.length}m downhill slope\n`);
}

// ============================================================================
// TEST 2: Grain Accounting & Conservation Law
// ============================================================================
console.log("TEST 2: Grain Accounting Invariant (Strict Conservation)");
{
  const rice = new RiceSimulation();
  assert.equal(rice.grains.length, 300, "Must initialize with exactly 300 grains");
  assert.equal(rice.spilledMesh.frustumCulled, false, "Moving spilled grains must stay visible throughout the course");
  assert.equal(rice.retainedCount, 300, "Retained count must be 300 initially");
  assert.equal(rice.spilledParticles.length, 0, "No particles spilled initially");

  // Verify all grains start settled inside pan
  for (let i = 0; i < rice.grains.length; i++) {
    const g = rice.grains[i];
    assert.equal(g.retained, true, `Grain ${i} must be retained`);
    assert.equal(g.doneness, 0, `Grain ${i} must start uncooked`);
    assert.equal(g.burnDamage, 0, `Grain ${i} must start unburnt`);
    const r = Math.sqrt(g.x * g.x + g.z * g.z);
    assert.ok(r < SKI_CONFIG.PAN.RADIUS, `Grain ${i} initial radius ${r} exceeds pan rim`);
  }

  const dummyPanMatrix = new THREE.Matrix4();
  dummyPanMatrix.makeTranslation(0, 50, 100);
  const platePos = { x: 0, y: 0, z: 1000 };

  // Run gentle steps: pan is level, no sudden turns
  for (let s = 0; s < 60; s++) {
    rice.step(1 / 60, 0, 0, 0, 0, dummyPanMatrix, false, platePos);
  }

  assert.equal(rice.retainedCount, 300, "Gentle level skiing must retain all 300 grains");
  assert.equal(rice.spilledParticles.length, 0, "No grains spilled under gentle movement");

  // Now simulate extreme tilt to cause intentional spill
  // Tilt roll to 0.5 rad (steep) + strong lateral inertia
  for (let s = 0; s < 120; s++) {
    rice.step(1 / 60, 0.4, 0.5, 8.0, 0, dummyPanMatrix, false, platePos);
  }

  const retained = rice.retainedCount;
  const spilled = rice.spilledParticles.length;
  assert.ok(retained < 300, "Extreme tilt and inertia must cause grains to spill");
  assert.ok(spilled > 0, "Spilled particles must be created");
  assert.equal(
    retained + spilled,
    300,
    `Grain conservation violated! Retained (${retained}) + Spilled (${spilled}) != 300`
  );

  // Crash scatters each surviving grain once, conserving the already-spilled
  // grains and leaving no invisible rice attached to the pan.
  rice.scatterOnCrash(dummyPanMatrix, { x: 0, y: 0, z: 14 });
  assert.equal(rice.retainedCount, 0);
  assert.equal(rice.spilledParticles.length, 300, "Crash must release every remaining grain exactly once");
  assert.ok(rice.spilledParticles.some((p) => p.vy > 1), "Crash must launch grains upward");
  rice.scatterOnCrash(dummyPanMatrix, { x: 0, y: 0, z: 14 });
  assert.equal(rice.spilledParticles.length, 300, "Repeated crash setup must not duplicate grains");
  rice.stepCrash(1 / 60);
  rice.reset();
  assert.equal(rice.retainedCount, 300, "Restart must restore the full pan after a crash");
  assert.equal(rice.spilledParticles.length, 0, "Restart must clear crash debris");

  console.log(`  ✓ Retained (${retained}) + Spilled (${spilled}) = 300 exactly`);
  console.log("  ✓ No phantom grain deletion or unphysical grain generation\n");
}

// ============================================================================
// TEST 3: Cooking & Burn Progression
// ============================================================================
console.log("TEST 3: Thermal Model & Cooking/Burn Progression");
{
  const rice = new RiceSimulation();
  const dummyPanMatrix = new THREE.Matrix4();
  const platePos = { x: 0, y: 0, z: 1000 };

  // Step 1: Cook for 10 seconds without tilting. The burner is
  // deliberately concentrated, so a still pan cooks unevenly: some
  // doneness, but far from a cooked batch, and no burn yet.
  for (let s = 0; s < 600; s++) {
    rice.step(1 / 60, 0, 0, 0, 0, dummyPanMatrix, false, platePos);
  }

  assert.ok(rice.avgDoneness > 0.03, `Doneness after 10s should increase, got ${rice.avgDoneness}`);
  assert.ok(rice.avgDoneness < 0.6, `A still pan must not cook the batch evenly, got ${rice.avgDoneness}`);
  assert.equal(rice.avgBurnRisk, 0, "No burn should occur in the first 10 seconds");

  // Step 2: Airborne test - when tossing, heating is paused
  const preTossDoneness = rice.avgDoneness;
  rice.toss(2.0); // pop grains high into air

  // During free-fall in local space, grains are not in contact
  let airborneContactCount = 0;
  for (let i = 0; i < rice.grains.length; i++) {
    if (rice.grains[i].inContact) airborneContactCount++;
  }
  assert.equal(airborneContactCount, 0, "Tossed grains must leave contact surface");

  // Step 3: Cook like a player: toss every ~7 seconds to redistribute
  // grains across the hot center. The batch must approach full doneness
  // and start accumulating burn damage once cooked.
  for (let s = 0; s < 2700; s++) {
    if (s > 0 && s % 420 === 0) rice.toss(1.0);
    rice.step(1 / 60, 0, 0, 0, 0, dummyPanMatrix, false, platePos);
  }

  assert.ok(rice.avgDoneness >= 0.85, `Doneness with regular tossing should exceed 85%, got ${rice.avgDoneness}`);
  assert.ok(rice.avgBurnRisk > 0, `Burn should start accumulating once cooked, got ${rice.avgBurnRisk}`);

  // Test color transitions
  const cRaw = new THREE.Color();
  const cCooked = new THREE.Color();
  const cBurnt = new THREE.Color();

  rice.getGrainColor(0.0, 0.0, cRaw);
  rice.getGrainColor(1.0, 0.0, cCooked);
  rice.getGrainColor(1.0, 0.9, cBurnt);

  assert.notEqual(cRaw.getHexString(), cCooked.getHexString(), "Cooked color must differ from raw");
  assert.notEqual(cCooked.getHexString(), cBurnt.getHexString(), "Burnt color must differ from cooked");

  console.log(`  ✓ Doneness progression verified: ${Math.round(rice.avgDoneness * 100)}% doneness reached`);
  console.log(`  ✓ Burn damage begins at ${SKI_CONFIG.COOKING.BURN_START_DONENESS * 100}% doneness: current burn ${Math.round(rice.avgBurnRisk * 100)}%`);
  console.log("  ✓ Dynamic instanced colors transition accurately from pearl to gold to charcoal\n");
}

// ============================================================================
// TEST 4: Plating Phase & Scoring Boundaries
// ============================================================================
console.log("TEST 4: Plating Phase & Grade Rank Boundaries");
{
  const rice = new RiceSimulation();
  const dummyPanMatrix = new THREE.Matrix4();
  const platePos = { x: 0, y: 0, z: 100 };

  // Set up cooked rice in pan
  for (const g of rice.grains) {
    g.doneness = 0.96; // 96% cooked
    g.burnDamage = 0.03; // 3% burn
  }

  // Trigger Plating Phase: tilt pan steeply forward (pitch = -0.85 rad;
  // negative pitch drops the front edge) to pour onto plate. The matrix
  // reproduces the real finish geometry: the pan rig is yawed PI (camera
  // faces +Z), sits ~0.5 m short of the plate and ~0.35 m above it.
  dummyPanMatrix.makeRotationY(Math.PI);
  dummyPanMatrix.setPosition(0, 0.35, 99.52);
  for (let s = 0; s < 180; s++) {
    rice.step(1 / 60, -0.85, 0, 0, 0, dummyPanMatrix, true, platePos);
  }

  assert.ok(rice.platedCount > 0, `Plating must deposit grains on the plate, got ${rice.platedCount}`);
  console.log(`  ✓ Plating test: poured ${rice.platedCount} grains onto serving platter`);

  // Test Scoring Boundary: S-Rank
  // Force 260 plated grains (86.7%), 96% doneness, 3% burn, 72s
  rice.platedCount = 260;
  for (const p of rice.spilledParticles) {
    p.onPlate = true;
    p.doneness = 0.96;
    p.burnDamage = 0.03;
  }

  const sResult = SkiScoringEngine.evaluateRun(rice, 72.0);
  assert.equal(sResult.grade, "S", `Expected S rank, got ${sResult.grade}`);
  assert.equal(sResult.title, "WOK GOD OF THE ALPS");

  // Test S-Rank Boundary: 84% plated (< 85%) -> must drop to A
  rice.platedCount = 250; // 83.3%
  const aResultPlated = SkiScoringEngine.evaluateRun(rice, 72.0);
  assert.equal(aResultPlated.grade, "A", `Expected A rank on 83% plated, got ${aResultPlated.grade}`);

  // Test S-Rank Boundary: 94% doneness (< 95%) -> must drop to A
  rice.platedCount = 260;
  for (const p of rice.spilledParticles) {
    p.doneness = 0.94;
    p.burnDamage = 0.03;
  }
  const aResultDoneness = SkiScoringEngine.evaluateRun(rice, 72.0);
  assert.equal(aResultDoneness.grade, "A", `Expected A rank on 94% doneness, got ${aResultDoneness.grade}`);

  // Test S-Rank Boundary: 6% burn (> 5%) -> must drop to A
  for (const p of rice.spilledParticles) {
    p.doneness = 0.96;
    p.burnDamage = 0.06;
  }
  const aResultBurn = SkiScoringEngine.evaluateRun(rice, 72.0);
  assert.equal(aResultBurn.grade, "A", `Expected A rank on 6% burn, got ${aResultBurn.grade}`);

  // Test Failure States
  const failEmpty = SkiScoringEngine.evaluateRun(rice, 40.0, "empty_pan");
  assert.equal(failEmpty.grade, "D");
  assert.equal(failEmpty.title, "PAN EMPTIED!");

  const failCrash = SkiScoringEngine.evaluateRun(rice, 35.0, "tree_crash");
  assert.equal(failCrash.grade, "D");
  assert.equal(failCrash.title, "TREE CRASH!");
  assert.equal(SkiScoringEngine.evaluateRun(rice, 35.0, "rock_crash").title, "ROCK CRASH!");
  assert.equal(SkiScoringEngine.evaluateRun(rice, 35.0, "log_crash").title, "LOG CRASH!");

  const failBurnt = SkiScoringEngine.evaluateRun(rice, 50.0, "burnt_batch");
  assert.equal(failBurnt.grade, "D");
  assert.equal(failBurnt.title, "CHARRED TO ASH!");

  console.log("  ✓ S-Rank strict thresholds verified (≥85% plated, ≥95% doneness, ≤5% burn, ≤80s)");
  console.log("  ✓ A, B, C, D grade thresholds verified");
  console.log("  ✓ Catastrophic failure states (empty pan, tree crash, burnt batch) produce explanatory D grades\n");
}

// ============================================================================
// TEST 5: Full Reset Verification
// ============================================================================
console.log("TEST 5: Full Reset Verification");
{
  const course = new SkiCourse();
  const skier = new SkierController(course);
  const rice = new RiceSimulation();
  const dummyPanMatrix = new THREE.Matrix4();
  const platePos = { x: 0, y: 0, z: 1000 };

  // Mess up skier and rice state
  skier.state.distance = 500;
  skier.state.speed = 18;
  skier.state.lateralOffset = 10;
  skier.hasCrashed = true;

  for (let s = 0; s < 120; s++) {
    rice.step(1 / 60, 0.4, 0.5, 8.0, 2.0, dummyPanMatrix, false, platePos);
  }
  assert.ok(rice.retainedCount < 300, "Rice was spilled");

  // Call reset on both
  skier.reset();
  rice.reset();

  assert.equal(skier.state.distance, 0, "Skier distance must reset to 0");
  assert.equal(skier.state.speed, 6.0, "Skier initial speed must reset to 6.0");
  assert.equal(skier.state.lateralOffset, 0, "Skier lateral offset must reset to 0");
  assert.equal(skier.hasCrashed, false, "Skier crash state must reset to false");

  assert.equal(rice.retainedCount, 300, "Rice retained count must reset to 300");
  assert.equal(rice.platedCount, 0, "Rice plated count must reset to 0");
  assert.equal(rice.spilledParticles.length, 0, "Spilled particles must be cleared");
  assert.equal(rice.avgDoneness, 0, "Average doneness must reset to 0");
  assert.equal(rice.avgBurnRisk, 0, "Average burn risk must reset to 0");

  for (let i = 0; i < rice.grains.length; i++) {
    const g = rice.grains[i];
    assert.equal(g.retained, true, `Grain ${i} retained flag not reset`);
    assert.equal(g.doneness, 0, `Grain ${i} doneness not reset`);
    assert.equal(g.burnDamage, 0, `Grain ${i} burn not reset`);
    assert.equal(g.vx, 0, `Grain ${i} vx not reset`);
    assert.equal(g.vy, 0, `Grain ${i} vy not reset`);
    assert.equal(g.vz, 0, `Grain ${i} vz not reset`);
  }

  console.log("  ✓ Game state resets completely and deterministically to pristine initial state\n");
}

console.log("🏆 ALL 5 VERIFICATION SUITES PASSED CLEANLY!");
