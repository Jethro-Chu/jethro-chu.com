"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import Link from "next/link";

// ─── Types ──────────────────────────────────────────────────────────────────
type GamePhase = "ready" | "playing" | "gameover";

interface HudState {
  phase: GamePhase;
  score: number;
  distance: number;
  speedKmh: number;
  wokHei: number; // 0 to 100
  burnRisk: number; // 0 to 100 (increases if you don't toss!)
  ingredientsLeft: number;
  maxIngredients: number;
  gatesCleared: number;
  statusMessage: string;
}

interface Ingredient {
  mesh: THREE.Mesh;
  localPos: THREE.Vector3;
  localVel: THREE.Vector3;
  rotVel: THREE.Vector3;
  radius: number;
  inWok: boolean;
  name: string;
}

interface Obstacle {
  mesh: THREE.Group;
  type: "tree" | "rock" | "gate" | "mogul";
  x: number;
  z: number;
  radius: number;
  passed: boolean;
}

// ─── Deterministic Terrain Height Function ──────────────────────────────────
// Shared between the 3D snow mesh vertices and the physics loop so nothing ever clips.
function getWaveHeight(x: number, z: number): number {
  const wave1 = Math.sin(x * 0.08) * Math.cos(z * 0.06) * 1.1;
  const wave2 = Math.sin(x * 0.22 + z * 0.12) * 0.35;
  // Gently flatten the very center spawn lane near z = 0..40
  const spawnFlatten = Math.min(1, Math.abs(z) / 35);
  // Steep canyon walls if you stray too far left/right
  const edgeWall = Math.max(0, Math.abs(x) - 22) ** 1.65 * 0.25;
  return (wave1 + wave2) * spawnFlatten + edgeWall;
}

export default function WokAndSkisPage() {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [webglError, setWebglError] = useState(false);

  const [hud, setHud] = useState<HudState>({
    phase: "ready",
    score: 0,
    distance: 0,
    speedKmh: 0,
    wokHei: 25,
    burnRisk: 0,
    ingredientsLeft: 6,
    maxIngredients: 6,
    gatesCleared: 0,
    statusMessage: "Carve through gates & toss the wok so the stir-fry doesn't burn or spill!",
  });

  // Mutable game control ref so the RAF loop reads instant state
  const gameRef = useRef<{
    phase: GamePhase;
    resetTrigger: boolean;
    tossTrigger: boolean;
    keys: Record<string, boolean>;
  }>({
    phase: "ready",
    resetTrigger: false,
    tossTrigger: false,
    keys: {},
  });

  const startGame = useCallback(() => {
    gameRef.current.phase = "playing";
    gameRef.current.resetTrigger = true;
  }, []);

  const triggerToss = useCallback(() => {
    if (gameRef.current.phase === "playing") {
      gameRef.current.tossTrigger = true;
    } else {
      startGame();
    }
  }, [startGame]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Clear any leftover canvas from React Strict Mode
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }

    const width = container.clientWidth || window.innerWidth || 800;
    const height = container.clientHeight || window.innerHeight || 600;

    // ─── 1. Scene, Camera, Renderer ─────────────────────────────────────────
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xdbeafe);
    scene.fog = new THREE.FogExp2(0xdbeafe, 0.0085);

    const camera = new THREE.PerspectiveCamera(62, width / height, 0.1, 260);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      container.appendChild(renderer.domElement);
    } catch {
      setWebglError(true);
      return;
    }

    // Geometries & materials collector for clean GPU disposal
    const disposables: { dispose: () => void }[] = [];
    const track = <T extends { dispose: () => void }>(res: T): T => {
      disposables.push(res);
      return res;
    };

    // ─── 2. Lights ──────────────────────────────────────────────────────────
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xfffbeb, 1.3);
    dirLight.position.set(35, 65, 25);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    scene.add(dirLight);

    // Warm orange point light under the wok for "Wok Hei" flame glow
    const wokFireLight = new THREE.PointLight(0xff5500, 2.5, 4);
    scene.add(wokFireLight);

    // ─── 3. Procedural Endless Terrain Mesh ─────────────────────────────────
    const TERRAIN_WIDTH = 90;
    const TERRAIN_LENGTH = 150;
    const SEG_W = 54;
    const SEG_L = 75;
    const terrainGeo = track(new THREE.PlaneGeometry(TERRAIN_WIDTH, TERRAIN_LENGTH, SEG_W, SEG_L));
    terrainGeo.rotateX(-Math.PI / 2);

    const terrainMat = track(
      new THREE.MeshStandardMaterial({
        color: 0xf8fafc,
        roughness: 0.75,
        metalness: 0.05,
        flatShading: true,
      })
    );
    const terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
    terrainMesh.receiveShadow = true;
    scene.add(terrainMesh);

    const updateTerrainVertices = (playerZ: number) => {
      const posAttr = terrainGeo.attributes.position as THREE.BufferAttribute;
      terrainMesh.position.z = playerZ - 45;
      for (let i = 0; i < posAttr.count; i++) {
        const vx = posAttr.getX(i);
        const localZ = posAttr.getZ(i);
        const worldZ = localZ + terrainMesh.position.z;
        const wy = getWaveHeight(vx, worldZ);
        posAttr.setY(i, wy);
      }
      posAttr.needsUpdate = true;
      terrainGeo.computeVertexNormals();
    };

    // ─── 4. Skier + Skis + 3D Wok Rig ───────────────────────────────────────
    const playerGroup = new THREE.Group();
    scene.add(playerGroup);

    // Left & Right Skis
    const skiGeo = track(new THREE.BoxGeometry(0.18, 0.05, 2.2));
    const skiMat = track(new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.3 }));
    const leftSki = new THREE.Mesh(skiGeo, skiMat);
    leftSki.position.set(-0.28, 0.05, 0);
    leftSki.castShadow = true;
    const rightSki = new THREE.Mesh(skiGeo, skiMat);
    rightSki.position.set(0.28, 0.05, 0);
    rightSki.castShadow = true;
    playerGroup.add(leftSki, rightSki);

    // Skier Torso & Helmet (stylized low-poly figure)
    const torsoMat = track(new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.6 }));
    const torsoGeo = track(new THREE.BoxGeometry(0.65, 0.85, 0.4));
    const torso = new THREE.Mesh(torsoGeo, torsoMat);
    torso.position.set(0, 0.85, 0.15);
    torso.castShadow = true;
    playerGroup.add(torso);

    const headGeo = track(new THREE.SphereGeometry(0.25, 12, 12));
    const headMat = track(new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.3 }));
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.set(0, 1.48, 0.12);
    playerGroup.add(head);

    // Wok Rig (Held out in front of the skier so the camera clearly sees it)
    const wokRig = new THREE.Group();
    wokRig.position.set(0, 1.05, -1.05);
    playerGroup.add(wokRig);

    // Wok Bowl using LatheGeometry (parabolic bowl radius = 0.88)
    const WOK_RADIUS = 0.88;
    const WOK_DEPTH = 0.36;
    const lathePoints: THREE.Vector2[] = [];
    for (let i = 0; i <= 10; i++) {
      const t = i / 10;
      const r = t * WOK_RADIUS;
      const y = t * t * WOK_DEPTH;
      lathePoints.push(new THREE.Vector2(r, y));
    }
    const wokGeo = track(new THREE.LatheGeometry(lathePoints, 24));
    const wokMat = track(
      new THREE.MeshStandardMaterial({
        color: 0x27272a,
        metalness: 0.65,
        roughness: 0.35,
        side: THREE.DoubleSide,
      })
    );
    const wokMesh = new THREE.Mesh(wokGeo, wokMat);
    wokMesh.castShadow = true;
    wokRig.add(wokMesh);

    // Wooden Wok Handle pointing back toward the skier
    const handleGeo = track(new THREE.CylinderGeometry(0.05, 0.06, 0.65, 10));
    handleGeo.rotateX(Math.PI / 2);
    const handleMat = track(new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.7 }));
    const handleMesh = new THREE.Mesh(handleGeo, handleMat);
    handleMesh.position.set(0, WOK_DEPTH * 0.85, WOK_RADIUS + 0.26);
    handleMesh.rotation.x = -0.25;
    wokRig.add(handleMesh);

    // Flame ring underneath the wok
    const flameGeo = track(new THREE.ConeGeometry(0.38, 0.3, 12));
    flameGeo.rotateX(Math.PI);
    const flameMat = track(
      new THREE.MeshBasicMaterial({ color: 0xff6b00, transparent: true, opacity: 0.8 })
    );
    const flameMesh = new THREE.Mesh(flameGeo, flameMat);
    flameMesh.position.set(0, -0.14, 0);
    wokRig.add(flameMesh);

    // ─── 5. Wok Ingredients (Simulated in Wok-Local Space!) ─────────────────
    const ingredients: Ingredient[] = [];
    const ingredientSpecs = [
      { name: "Golden Egg Fried Rice", color: 0xfacc15, geo: track(new THREE.DodecahedronGeometry(0.14, 0)), r: 0.14 },
      { name: "Jumbo Prawns", color: 0xfb7185, geo: track(new THREE.TorusGeometry(0.1, 0.045, 8, 12, Math.PI * 1.3)), r: 0.13 },
      { name: "Baby Bok Choy", color: 0x4ade80, geo: track(new THREE.ConeGeometry(0.11, 0.24, 7)), r: 0.12 },
      { name: "Crispy Tofu Cube", color: 0xfef08a, geo: track(new THREE.BoxGeometry(0.18, 0.18, 0.18)), r: 0.13 },
      { name: "Sichuan Chili Pepper", color: 0xdc2626, geo: track(new THREE.CylinderGeometry(0.04, 0.08, 0.25, 8)), r: 0.11 },
      { name: "Shiitake Mushroom", color: 0x78350f, geo: track(new THREE.SphereGeometry(0.13, 10, 8)), r: 0.13 },
    ];

    ingredientSpecs.forEach((spec, i) => {
      const mat = track(new THREE.MeshStandardMaterial({ color: spec.color, roughness: 0.4 }));
      const mesh = new THREE.Mesh(spec.geo, mat);
      mesh.castShadow = true;
      wokRig.add(mesh);

      const angle = (i / ingredientSpecs.length) * Math.PI * 2;
      ingredients.push({
        mesh,
        localPos: new THREE.Vector3(Math.cos(angle) * 0.25, 0.25 + i * 0.05, Math.sin(angle) * 0.25),
        localVel: new THREE.Vector3(0, 0, 0),
        rotVel: new THREE.Vector3(Math.random() * 4, Math.random() * 4, Math.random() * 4),
        radius: spec.r,
        inWok: true,
        name: spec.name,
      });
    });

    // ─── 6. Obstacles & Slalom Gates Pool ───────────────────────────────────
    const obstacles: Obstacle[] = [];

    const createObstacleMesh = (type: Obstacle["type"]): THREE.Group => {
      const group = new THREE.Group();
      if (type === "tree") {
        const trunk = new THREE.Mesh(
          track(new THREE.CylinderGeometry(0.22, 0.32, 1.4, 7)),
          track(new THREE.MeshStandardMaterial({ color: 0x5c4033 }))
        );
        trunk.position.y = 0.7;
        group.add(trunk);

        const leavesMat = track(new THREE.MeshStandardMaterial({ color: 0x15803d, flatShading: true }));
        for (let l = 0; l < 3; l++) {
          const cone = new THREE.Mesh(
            track(new THREE.ConeGeometry(1.45 - l * 0.32, 2.2 - l * 0.25, 7)),
            leavesMat
          );
          cone.position.y = 1.9 + l * 1.15;
          cone.castShadow = true;
          group.add(cone);
        }
      } else if (type === "rock") {
        const rock = new THREE.Mesh(
          track(new THREE.DodecahedronGeometry(0.95, 0)),
          track(new THREE.MeshStandardMaterial({ color: 0x64748b, flatShading: true }))
        );
        rock.position.y = 0.55;
        rock.scale.set(1.2, 0.85, 1.0);
        rock.castShadow = true;
        group.add(rock);
      } else if (type === "mogul") {
        const mogul = new THREE.Mesh(
          track(new THREE.SphereGeometry(1.35, 10, 8)),
          track(new THREE.MeshStandardMaterial({ color: 0xe0f2fe, roughness: 0.6, flatShading: true }))
        );
        mogul.scale.set(1.3, 0.45, 1.1);
        mogul.position.y = 0.1;
        group.add(mogul);
      } else if (type === "gate") {
        const GATE_HALF_W = 2.8;
        const poleGeo = track(new THREE.CylinderGeometry(0.08, 0.08, 3.2, 8));
        const leftPole = new THREE.Mesh(
          poleGeo,
          track(new THREE.MeshStandardMaterial({ color: 0xef4444 }))
        );
        leftPole.position.set(-GATE_HALF_W, 1.6, 0);
        const rightPole = new THREE.Mesh(
          poleGeo,
          track(new THREE.MeshStandardMaterial({ color: 0x3b82f6 }))
        );
        rightPole.position.set(GATE_HALF_W, 1.6, 0);

        const banner = new THREE.Mesh(
          track(new THREE.BoxGeometry(GATE_HALF_W * 2, 0.45, 0.05)),
          track(new THREE.MeshStandardMaterial({ color: 0xfef08a }))
        );
        banner.position.set(0, 2.85, 0);
        group.add(leftPole, rightPole, banner);
      }
      return group;
    };

    const placeObstacleAhead = (obs: Obstacle, baseZ: number, indexOffset: number) => {
      const zPos = baseZ - 45 - indexOffset * 6.5 - Math.random() * 8;
      const xSpread = obs.type === "gate" ? 13 : 21;
      const xPos = (Math.random() - 0.5) * 2 * xSpread;
      obs.x = xPos;
      obs.z = zPos;
      obs.passed = false;
      obs.mesh.position.set(xPos, getWaveHeight(xPos, zPos), zPos);
    };

    for (let i = 0; i < 28; i++) {
      const type: Obstacle["type"] =
        i % 5 === 0 ? "gate" : i % 4 === 0 ? "mogul" : i % 3 === 0 ? "rock" : "tree";
      const mesh = createObstacleMesh(type);
      scene.add(mesh);
      const obs: Obstacle = {
        mesh,
        type,
        x: 0,
        z: 0,
        radius: type === "gate" ? 2.8 : type === "tree" ? 0.95 : type === "rock" ? 0.95 : 1.35,
        passed: false,
      };
      placeObstacleAhead(obs, -15, i);
      obstacles.push(obs);
    }

    // ─── 7. Keyboard Input Tracking ─────────────────────────────────────────
    const keys = gameRef.current.keys;
    const onKeyDown = (e: KeyboardEvent) => {
      keys[e.code] = true;
      if (e.code === "Space") {
        e.preventDefault();
        if (gameRef.current.phase === "playing") {
          gameRef.current.tossTrigger = true;
        } else {
          gameRef.current.phase = "playing";
          gameRef.current.resetTrigger = true;
        }
      } else if (e.code === "KeyR") {
        gameRef.current.phase = "playing";
        gameRef.current.resetTrigger = true;
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keys[e.code] = false;
    };
    const onBlur = () => {
      for (const k in keys) keys[k] = false;
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);

    // ─── 8. Physics State & Reset Function ──────────────────────────────────
    const player = {
      x: 0,
      y: 0,
      z: 0,
      vy: 0,
      speed: 14,
      heading: 0,
      turnRate: 0,
      grounded: true,
      score: 0,
      gatesCleared: 0,
      wokHei: 35,
      burnRisk: 0,
      statusMessage: "Carve through gates & press SPACE to toss the wok!",
      wokTiltX: 0,
      wokTiltZ: 0,
      tossAnimTimer: 0,
    };

    const resetSimulation = () => {
      player.x = 0;
      player.z = 0;
      player.y = getWaveHeight(0, 0);
      player.vy = 0;
      player.speed = 14;
      player.heading = 0;
      player.turnRate = 0;
      player.grounded = true;
      player.score = 0;
      player.gatesCleared = 0;
      player.wokHei = 40;
      player.burnRisk = 0;
      player.statusMessage = "Sizzling! Carve with A/D & press SPACE to toss the stir-fry!";
      player.wokTiltX = 0;
      player.wokTiltZ = 0;
      player.tossAnimTimer = 0;

      ingredients.forEach((ing, i) => {
        const angle = (i / ingredients.length) * Math.PI * 2;
        ing.localPos.set(Math.cos(angle) * 0.24, 0.22 + i * 0.04, Math.sin(angle) * 0.24);
        ing.localVel.set(0, 0, 0);
        ing.inWok = true;
        ing.mesh.visible = true;
      });

      obstacles.forEach((obs, i) => placeObstacleAhead(obs, 0, i));
      updateTerrainVertices(0);
    };

    resetSimulation();
    setIsReady(true);

    // ─── 9. Main 60fps Game Loop ────────────────────────────────────────────
    let animId = 0;
    let lastTime = performance.now();
    let hudSyncAccumulator = 0;

    const animate = (now: number) => {
      animId = requestAnimationFrame(animate);
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      if (gameRef.current.resetTrigger) {
        gameRef.current.resetTrigger = false;
        resetSimulation();
      }

      const activePhase = gameRef.current.phase;

      if (activePhase === "playing") {
        // ── A. Steering & Ski Carving Physics ──
        const steerLeft = keys["KeyA"] || keys["ArrowLeft"] ? 1 : 0;
        const steerRight = keys["KeyD"] || keys["ArrowRight"] ? 1 : 0;
        const tuck = keys["KeyW"] || keys["ArrowUp"] ? 1 : 0;
        const brake = keys["KeyS"] || keys["ArrowDown"] ? 1 : 0;

        const targetTurnRate = (steerLeft - steerRight) * 1.85;
        player.turnRate = THREE.MathUtils.lerp(player.turnRate, targetTurnRate, dt * 7);
        player.heading = THREE.MathUtils.clamp(
          player.heading + player.turnRate * dt,
          -Math.PI * 0.42,
          Math.PI * 0.42
        );

        // Downhill acceleration vs edge-carving drag
        const slopeAccel = Math.cos(player.heading) * 6.8 + (tuck ? 5.5 : 0);
        const carvingDrag = Math.abs(Math.sin(player.heading)) * 4.5 + (brake ? 9.5 : 0);
        const airDrag = 0.011 * player.speed * player.speed;

        player.speed = THREE.MathUtils.clamp(
          player.speed + (slopeAccel - carvingDrag - airDrag) * dt,
          6,
          36
        );

        const vx = -Math.sin(player.heading) * player.speed;
        const vz = -Math.cos(player.heading) * player.speed;

        player.x = THREE.MathUtils.clamp(player.x + vx * dt, -26, 26);
        player.z += vz * dt;

        // ── B. Terrain Height & Vertical Jump Physics ──
        const groundY = getWaveHeight(player.x, player.z);
        const nextGroundY = getWaveHeight(player.x + vx * 0.05, player.z + vz * 0.05);
        const groundSlopeVy = (nextGroundY - groundY) / 0.05;

        let verticalJolt = 0;
        if (player.grounded) {
          player.y = groundY;
          if (groundSlopeVy < -3.8 && player.speed > 18) {
            player.grounded = false;
            player.vy = 2.8;
          }
        } else {
          player.vy -= 18.0 * dt;
          player.y += player.vy * dt;
          if (player.y <= groundY) {
            verticalJolt = Math.min(Math.abs(player.vy) * 0.35, 3.2);
            player.y = groundY;
            player.vy = 0;
            player.grounded = true;
          }
        }

        // Update player mesh transform & ski edge banking
        playerGroup.position.set(player.x, player.y, player.z);
        playerGroup.rotation.y = player.heading;
        playerGroup.rotation.z = THREE.MathUtils.lerp(
          playerGroup.rotation.z,
          player.turnRate * 0.28,
          dt * 10
        );

        // Update endless snow mesh around the player
        updateTerrainVertices(player.z);

        // ── C. Wok Toss & Wok Hei Heat Mechanics ──
        player.burnRisk = Math.min(100, player.burnRisk + dt * 11.5);
        player.wokHei = Math.max(0, player.wokHei - dt * 3.2);

        let manualTossImpulse = 0;
        if (gameRef.current.tossTrigger) {
          gameRef.current.tossTrigger = false;
          manualTossImpulse = 3.1;
          player.tossAnimTimer = 0.22;
          player.burnRisk = Math.max(0, player.burnRisk - 48);
          player.wokHei = Math.min(100, player.wokHei + 18);
          player.score += Math.round(25 * (1 + player.wokHei / 50));
          player.statusMessage = "🔥 WOK TOSS! Stir-fry aerated & Wok Hei boosted!";
        }

        if (player.burnRisk >= 100) {
          player.burnRisk = 35;
          const victim = ingredients.find((ing) => ing.inWok);
          if (victim) {
            victim.inWok = false;
            victim.mesh.visible = false;
            player.statusMessage = `⚠️ ${victim.name} burned onto the pan! Press SPACE to toss!`;
          }
        }

        // Animate wok wrist flick
        if (player.tossAnimTimer > 0) {
          player.tossAnimTimer = Math.max(0, player.tossAnimTimer - dt);
        }
        const flickAngle = Math.sin((player.tossAnimTimer / 0.22) * Math.PI) * 0.42;
        wokRig.rotation.x = flickAngle;
        wokRig.rotation.z = -player.turnRate * 0.16;

        // ── D. Local-Space Wok Ingredient Physics ──
        const centrifugalX = player.turnRate * (player.speed / 22) * 3.1;

        ingredients.forEach((ing) => {
          if (!ing.inWok) return;

          if (manualTossImpulse > 0) {
            ing.localVel.y = manualTossImpulse + Math.random() * 0.9;
            ing.localVel.x -= ing.localPos.x * 1.4 + (Math.random() - 0.5) * 0.5;
            ing.localVel.z -= ing.localPos.z * 1.4 + (Math.random() - 0.5) * 0.5;
          }

          if (verticalJolt > 0) {
            ing.localVel.y += verticalJolt;
          }

          // Gravity + centrifugal force in wok-local coordinates
          ing.localVel.x += centrifugalX * dt;
          ing.localVel.y -= 9.2 * dt;

          // Damping
          ing.localVel.multiplyScalar(1 - dt * 1.2);
          ing.localPos.addScaledVector(ing.localVel, dt);

          // Parabolic Wok Bowl Collision: y = (r / WOK_RADIUS)^2 * WOK_DEPTH
          const rSq = ing.localPos.x * ing.localPos.x + ing.localPos.z * ing.localPos.z;
          const r = Math.sqrt(rSq);
          const bowlFloorY =
            Math.pow(Math.min(r, WOK_RADIUS * 1.2) / WOK_RADIUS, 2) * WOK_DEPTH + ing.radius;

          if (ing.localPos.y < bowlFloorY) {
            if (r <= WOK_RADIUS * 0.98) {
              ing.localPos.y = bowlFloorY;
              if (ing.localVel.y < 0) ing.localVel.y *= -0.25;

              if (r > 0.02) {
                const slopeFactor = (2 * WOK_DEPTH * r) / (WOK_RADIUS * WOK_RADIUS);
                const nx = -ing.localPos.x / r;
                const nz = -ing.localPos.z / r;
                ing.localVel.x += nx * slopeFactor * 5.2 * dt;
                ing.localVel.z += nz * slopeFactor * 5.2 * dt;
              }
            }
          }

          // Check if spilled over the rim of the wok
          if (r > WOK_RADIUS * 1.06 && ing.localPos.y < WOK_DEPTH + 0.12) {
            ing.inWok = false;
            ing.mesh.visible = false;
            player.statusMessage = `😱 Spilled ${ing.name} on a sharp turn!`;
          }

          // Update ingredient mesh inside wokRig
          ing.mesh.position.copy(ing.localPos);
          ing.mesh.rotation.x += ing.rotVel.x * dt;
          ing.mesh.rotation.y += ing.rotVel.y * dt;
        });

        // ── E. Obstacle Collisions & Recycling ──
        obstacles.forEach((obs, idx) => {
          const dz = obs.z - player.z;
          const dx = obs.x - player.x;

          if (!obs.passed && Math.abs(dz) < 1.35) {
            if (obs.type === "gate") {
              if (Math.abs(dx) < obs.radius) {
                obs.passed = true;
                player.gatesCleared += 1;
                player.wokHei = Math.min(100, player.wokHei + 22);
                const bonus = Math.round(150 * (1 + player.wokHei / 50));
                player.score += bonus;
                player.statusMessage = `🥢 SLALOM GATE CLEARED! +${bonus} pts!`;
              }
            } else if (Math.hypot(dx, dz) < obs.radius + 0.45) {
              obs.passed = true;
              if (obs.type === "mogul") {
                player.grounded = false;
                player.vy = 4.6;
                player.statusMessage = "🎿 Mogul launch! Watch the wok on landing!";
              } else {
                player.speed = Math.max(7, player.speed * 0.45);
                player.wokHei = Math.max(0, player.wokHei - 30);
                const spilled = ingredients.find((ing) => ing.inWok);
                if (spilled) {
                  spilled.inWok = false;
                  spilled.mesh.visible = false;
                  player.statusMessage = `💥 Crashed into a ${obs.type}! Lost ${spilled.name}!`;
                }
              }
            }
          }

          // Recycle obstacle once it passes behind the camera
          if (obs.z > player.z + 18) {
            placeObstacleAhead(obs, player.z - 85, idx % 8);
          }
        });

        // Distance score accumulation
        const remainingCount = ingredients.filter((i) => i.inWok).length;
        player.score +=
          Math.abs(vz) * dt * (1 + player.wokHei / 60) * (remainingCount / ingredients.length);

        if (remainingCount === 0) {
          gameRef.current.phase = "gameover";
          player.statusMessage = "All ingredients lost! Your wok is empty!";
        }
      }

      // ── F. Camera & Flame Light Follow ──
      const desiredCamPos = new THREE.Vector3(
        player.x * 0.85,
        player.y + 3.4,
        player.z + 5.2
      );
      camera.position.lerp(desiredCamPos, Math.min(1, dt * 8));
      camera.lookAt(player.x, player.y + 0.85, player.z - 6.5);

      wokFireLight.position.set(player.x, player.y + 0.9, player.z - 1.0);
      wokFireLight.intensity = 1.5 + (player.wokHei / 100) * 3.5;
      flameMesh.scale.setScalar(0.75 + (player.wokHei / 100) * 0.75);

      renderer.render(scene, camera);

      // Sync React HUD ~12 times per second
      hudSyncAccumulator += dt;
      if (hudSyncAccumulator > 0.08) {
        hudSyncAccumulator = 0;
        const leftCount = ingredients.filter((i) => i.inWok).length;
        setHud({
          phase: gameRef.current.phase,
          score: Math.floor(player.score),
          distance: Math.floor(Math.abs(player.z)),
          speedKmh: Math.round(player.speed * 3.6),
          wokHei: Math.round(player.wokHei),
          burnRisk: Math.round(player.burnRisk),
          ingredientsLeft: leftCount,
          maxIngredients: ingredients.length,
          gatesCleared: player.gatesCleared,
          statusMessage: player.statusMessage,
        });
      }
    };

    animId = requestAnimationFrame(animate);

    // ─── 10. Window Resize & Cleanup ────────────────────────────────────────
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || window.innerWidth || 800;
      const h = container.clientHeight || window.innerHeight || 600;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("resize", handleResize);

      disposables.forEach((d) => d.dispose());
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-slate-950 select-none font-sans">
      {/* Three.js Canvas Mount */}
      <div ref={mountRef} className="w-full h-full" />

      {/* Initial Pre-Mount Guard */}
      {!isReady && !webglError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 text-white z-30">
          <div className="text-2xl font-bold tracking-widest text-amber-400 animate-pulse">
            PREPARING WOK &amp; SKIS…
          </div>
          <div className="text-sm text-slate-400 mt-2">
            Initializing Three.js alpine physics simulation
          </div>
        </div>
      )}

      {/* WebGL Fallback */}
      {webglError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 text-white z-30 p-6 text-center">
          <div className="text-2xl font-bold text-rose-400 mb-2">WebGL Unavailable</div>
          <p className="text-sm text-slate-300 max-w-sm">
            Hardware acceleration is required to play Wok &amp; Skis. Please enable WebGL in your browser settings.
          </p>
          <Link
            href="/"
            className="mt-6 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-mono font-bold"
          >
            Return to Portfolio
          </Link>
        </div>
      )}

      {/* Top Header: Portfolio link + HUD Bar */}
      <div className="absolute top-4 inset-x-4 flex flex-wrap items-center justify-between gap-3 pointer-events-none z-10">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="pointer-events-auto flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900/85 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 text-xs font-mono font-medium shadow-xl transition-all"
          >
            ← Portfolio
          </Link>

          <div className="hidden sm:flex items-center gap-5 bg-slate-900/85 backdrop-blur-md border border-slate-700/80 px-4 py-2.5 rounded-2xl text-white shadow-xl">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-slate-400">Score</div>
              <div className="text-xl font-black text-amber-400 tabular-nums">
                {hud.score.toLocaleString()}
              </div>
            </div>
            <div className="h-6 w-px bg-slate-700" />
            <div>
              <div className="text-[10px] uppercase tracking-wider text-slate-400">Distance</div>
              <div className="text-lg font-bold tabular-nums">{hud.distance}m</div>
            </div>
            <div className="h-6 w-px bg-slate-700" />
            <div>
              <div className="text-[10px] uppercase tracking-wider text-slate-400">Speed</div>
              <div className="text-lg font-bold text-sky-400 tabular-nums">{hud.speedKmh} km/h</div>
            </div>
            <div className="h-6 w-px bg-slate-700" />
            <div>
              <div className="text-[10px] uppercase tracking-wider text-slate-400">Gates</div>
              <div className="text-lg font-bold text-emerald-400 tabular-nums">{hud.gatesCleared}</div>
            </div>
          </div>
        </div>

        {/* Wok Status Card */}
        <div className="flex items-center gap-4 bg-slate-900/85 backdrop-blur-md border border-slate-700/80 px-4 py-2.5 rounded-2xl text-white shadow-xl">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-slate-400">
              Ingredients ({hud.ingredientsLeft}/{hud.maxIngredients})
            </div>
            <div className="flex gap-1.5 mt-1">
              {Array.from({ length: hud.maxIngredients }).map((_, idx) => (
                <span
                  key={idx}
                  className={`w-3 h-3 rounded-full transition-all ${
                    idx < hud.ingredientsLeft
                      ? "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]"
                      : "bg-slate-700"
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="w-24 sm:w-28">
            <div className="flex justify-between text-[10px] uppercase tracking-wider">
              <span className="text-orange-400 font-semibold">Wok Hei</span>
              <span>{hud.wokHei}%</span>
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mt-1">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-red-500 transition-all duration-100"
                style={{ width: `${hud.wokHei}%` }}
              />
            </div>
          </div>

          <div className="w-24 sm:w-28">
            <div className="flex justify-between text-[10px] uppercase tracking-wider">
              <span className="text-rose-400 font-semibold">Burn Risk</span>
              <span>{hud.burnRisk}%</span>
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mt-1">
              <div
                className={`h-full transition-all duration-100 ${
                  hud.burnRisk > 75 ? "bg-rose-500 animate-pulse" : "bg-amber-300"
                }`}
                style={{ width: `${hud.burnRisk}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Live Status Banner + Steer/Toss Controls */}
      <div className="absolute bottom-6 inset-x-0 flex flex-col items-center gap-3 pointer-events-none z-10 px-4">
        <div className="bg-slate-900/80 backdrop-blur-md border border-slate-700 text-slate-100 px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium shadow-lg max-w-md text-center">
          {hud.statusMessage}
        </div>
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Mobile Steer Left */}
          <button
            onPointerDown={() => {
              gameRef.current.keys["KeyA"] = true;
            }}
            onPointerUp={() => {
              gameRef.current.keys["KeyA"] = false;
            }}
            onPointerLeave={() => {
              gameRef.current.keys["KeyA"] = false;
            }}
            className="sm:hidden px-4 py-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 active:scale-95 text-slate-200 border border-slate-700 font-bold text-xs shadow-lg transition select-none"
            aria-label="Steer Left"
          >
            ◀ LEFT
          </button>

          {/* Toss Button */}
          <button
            onClick={triggerToss}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 active:scale-95 text-slate-950 font-black text-sm tracking-wide shadow-lg cursor-pointer transition select-none"
          >
            🔥 TOSS WOK (SPACE)
          </button>

          {/* Mobile Steer Right */}
          <button
            onPointerDown={() => {
              gameRef.current.keys["KeyD"] = true;
            }}
            onPointerUp={() => {
              gameRef.current.keys["KeyD"] = false;
            }}
            onPointerLeave={() => {
              gameRef.current.keys["KeyD"] = false;
            }}
            className="sm:hidden px-4 py-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 active:scale-95 text-slate-200 border border-slate-700 font-bold text-xs shadow-lg transition select-none"
            aria-label="Steer Right"
          >
            RIGHT ▶
          </button>
        </div>
      </div>

      {/* Start / Game Over Modal Overlay */}
      {hud.phase !== "playing" && (
        <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center z-20 p-4">
          <div className="max-w-md w-full bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-8 text-center text-white shadow-2xl">
            <div className="text-xs font-bold uppercase tracking-widest text-amber-400 mb-1">
              Alpine Culinary Physics
            </div>
            <h1 className="text-3xl font-black tracking-tight mb-3">
              {hud.phase === "ready" ? "WOK & SKIS" : "WOK EMPTY!"}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-6">
              {hud.phase === "ready"
                ? "Carve down the mountain while stir-frying 6 ingredients in a blazing carbon-steel wok. Sharp turns create centrifugal force that slides food toward the rim, and forgetting to toss burns your stir-fry!"
                : `You skied ${hud.distance}m, cleared ${hud.gatesCleared} slalom gates, and plated a final score of ${hud.score.toLocaleString()} points.`}
            </p>

            <div className="grid grid-cols-3 gap-2 text-left bg-slate-800/80 p-3 rounded-2xl mb-6 text-xs text-slate-300 border border-slate-700/60">
              <div>
                <div className="font-bold text-white">A / D or ◀ ▶</div>
                <div>Carve &amp; balance</div>
              </div>
              <div>
                <div className="font-bold text-white">W / S or ▲ ▼</div>
                <div>Tuck / Brake</div>
              </div>
              <div>
                <div className="font-bold text-amber-400">SPACEBAR</div>
                <div>Toss stir-fry</div>
              </div>
            </div>

            <button
              onClick={startGame}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 font-black tracking-wide text-base shadow-lg cursor-pointer transition active:scale-98"
            >
              {hud.phase === "ready" ? "DROP IN & FIRE THE WOK" : "COOK ANOTHER RUN"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
