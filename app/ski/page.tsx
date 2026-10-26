"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import Link from "next/link";

// ─── Wok & Skis: single-file arcade downhill cooking game ────────────────────
// Ski (A/D), toss the wok (Space) on the golden sizzle pulse, cook dishes to
// order, serve them for fireworks, and grab slope pickups to keep the wok full.

type GamePhase = "ready" | "playing" | "gameover";

interface HudState {
  phase: GamePhase;
  score: number;
  distance: number;
  speedKmh: number;
  wokHei: number;
  heat: number; // 0-100 smoke/burn pressure (toss to vent)
  dishCook: number; // 0-100 current order progress
  orderName: string;
  orderIndex: number;
  dishesServed: number;
  ingredientsActive: number;
  maxIngredients: number;
  gatesCleared: number;
  combo: number;
  turbo: boolean;
  shield: boolean;
  sizzleActive: boolean;
  statusMessage: string;
  muted: boolean;
}

interface Popup {
  id: number;
  text: string;
  tone: "gold" | "green" | "red" | "blue";
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

type PickupType = "chili" | "prawn" | "bokchoy" | "tofu";

interface Pickup {
  mesh: THREE.Group;
  type: PickupType;
  x: number;
  z: number;
  active: boolean;
  spin: number;
}

const ORDERS = [
  "Dragon's Breath Fried Rice",
  "Alpine Kung Pao Prawns",
  "Black Diamond Mapo Tofu",
  "Summit Garlic Noodles",
  "Glacier Ginger Scallion Fish",
];

const MAX_INGREDIENTS = 8;

// ─── Procedural Web Audio SFX (zero external files) ─────────────────────────
class SoundFX {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private carveGain: GainNode | null = null;
  private carveFilter: BiquadFilterNode | null = null;
  muted = false;

  init() {
    if (this.ctx) {
      if (this.ctx.state === "suspended") void this.ctx.resume();
      return;
    }
    try {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.5;
      this.master.connect(this.ctx.destination);
      // Continuous carving snow noise
      const len = this.ctx.sampleRate * 2;
      const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      src.loop = true;
      this.carveFilter = this.ctx.createBiquadFilter();
      this.carveFilter.type = "bandpass";
      this.carveFilter.frequency.value = 700;
      this.carveFilter.Q.value = 0.8;
      this.carveGain = this.ctx.createGain();
      this.carveGain.gain.value = 0;
      src.connect(this.carveFilter);
      this.carveFilter.connect(this.carveGain);
      this.carveGain.connect(this.master);
      src.start();
    } catch {
      this.ctx = null;
    }
  }

  setMuted(m: boolean) {
    this.muted = m;
    if (this.master && this.ctx) this.master.gain.setTargetAtTime(m ? 0 : 0.5, this.ctx.currentTime, 0.03);
  }

  setCarve(intensity: number, speedFrac: number) {
    if (!this.ctx || !this.carveGain || !this.carveFilter) return;
    const t = this.ctx.currentTime;
    this.carveGain.gain.setTargetAtTime(Math.min(0.22, intensity * 0.2 * (0.4 + speedFrac)), t, 0.09);
    this.carveFilter.frequency.setTargetAtTime(500 + speedFrac * 900 + intensity * 300, t, 0.09);
  }

  private tone(freqA: number, freqB: number, dur: number, type: OscillatorType, vol: number, delay = 0) {
    if (!this.ctx || !this.master || this.muted) return;
    const t0 = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freqA, t0);
    osc.frequency.exponentialRampToValueAtTime(Math.max(30, freqB), t0 + dur);
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    osc.connect(g);
    g.connect(this.master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  private noiseHit(dur: number, freq: number, vol: number, type: BiquadFilterType = "highpass") {
    if (!this.ctx || !this.master || this.muted) return;
    const t0 = this.ctx.currentTime;
    const len = Math.max(1, Math.floor(this.ctx.sampleRate * dur));
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const f = this.ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    src.connect(f);
    f.connect(g);
    g.connect(this.master);
    src.start(t0);
  }

  toss() {
    this.tone(220, 540, 0.16, "square", 0.1); // metallic clang body
    this.tone(1240, 900, 0.1, "triangle", 0.12);
    this.noiseHit(0.22, 2800, 0.16); // sizzle burst
  }
  perfect(combo: number) {
    const base = 620 + Math.min(combo, 10) * 45;
    this.tone(base, base, 0.14, "sine", 0.2);
    this.tone(base * 1.335, base * 1.335, 0.18, "sine", 0.18, 0.06);
    this.noiseHit(0.15, 3400, 0.1);
  }
  gate(combo: number) {
    const base = 520 + Math.min(combo, 12) * 40;
    this.tone(base, base * 1.5, 0.16, "triangle", 0.16);
  }
  served() {
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => this.tone(f, f, 0.32, "triangle", 0.18, i * 0.09));
    this.noiseHit(0.5, 1200, 0.1, "bandpass");
  }
  pickup() {
    this.tone(740, 1180, 0.12, "sine", 0.16);
  }
  chili() {
    this.tone(300, 980, 0.28, "sawtooth", 0.1);
    this.noiseHit(0.3, 2000, 0.12);
  }
  hit() {
    this.tone(130, 38, 0.3, "triangle", 0.4);
    this.noiseHit(0.2, 300, 0.25, "lowpass");
  }
  burn() {
    this.tone(320, 90, 0.35, "sawtooth", 0.14);
  }
}

// ─── Deterministic terrain height (shared by mesh + physics) ────────────────
function getWaveHeight(x: number, z: number): number {
  const wave1 = Math.sin(x * 0.08) * Math.cos(z * 0.06) * 1.1;
  const wave2 = Math.sin(x * 0.22 + z * 0.12) * 0.35;
  const spawnFlatten = Math.min(1, Math.abs(z) / 35);
  const edgeWall = Math.max(0, Math.abs(x) - 22) ** 1.65 * 0.25;
  return (wave1 + wave2) * spawnFlatten + edgeWall;
}

export default function WokAndSkisPage() {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [webglError, setWebglError] = useState(false);
  const [popups, setPopups] = useState<Popup[]>([]);
  const popupId = useRef(0);
  const popupTimers = useRef<number[]>([]);
  const sfxRef = useRef<SoundFX | null>(null);
  if (!sfxRef.current) sfxRef.current = new SoundFX();

  const [hud, setHud] = useState<HudState>({
    phase: "ready",
    score: 0,
    distance: 0,
    speedKmh: 0,
    wokHei: 25,
    heat: 0,
    dishCook: 0,
    orderName: ORDERS[0],
    orderIndex: 0,
    dishesServed: 0,
    ingredientsActive: 6,
    maxIngredients: MAX_INGREDIENTS,
    gatesCleared: 0,
    combo: 0,
    turbo: false,
    shield: false,
    sizzleActive: false,
    statusMessage: "Carve the slope, toss on the golden pulse, cook the order, serve it hot!",
    muted: false,
  });

  const gameRef = useRef<{
    phase: GamePhase;
    resetTrigger: boolean;
    tossTrigger: boolean;
    keys: Record<string, boolean>;
    muted: boolean;
  }>({ phase: "ready", resetTrigger: false, tossTrigger: false, keys: {}, muted: false });

  const addPopup = useCallback((text: string, tone: Popup["tone"]) => {
    const id = ++popupId.current;
    setPopups((prev) => [...prev.slice(-3), { id, text, tone }]);
    const timer = window.setTimeout(() => {
      setPopups((prev) => prev.filter((p) => p.id !== id));
    }, 1700);
    popupTimers.current.push(timer);
  }, []);

  const startGame = useCallback(() => {
    gameRef.current.phase = "playing";
    gameRef.current.resetTrigger = true;
    setHud((current) => ({ ...current, phase: "playing" }));
    sfxRef.current?.init();
  }, []);

  const triggerToss = useCallback(() => {
    if (gameRef.current.phase === "playing") {
      gameRef.current.tossTrigger = true;
    } else {
      startGame();
    }
  }, [startGame]);

  const toggleMute = useCallback(() => {
    const next = !gameRef.current.muted;
    gameRef.current.muted = next;
    sfxRef.current?.setMuted(next);
    setHud((h) => ({ ...h, muted: next }));
  }, []);

  useEffect(() => {
    const timers = popupTimers.current;
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, []);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;
    const sfx = sfxRef.current!;
    sfx.setMuted(gameRef.current.muted);

    while (container.firstChild) container.removeChild(container.firstChild);

    const width = container.clientWidth || window.innerWidth || 800;
    const height = container.clientHeight || window.innerHeight || 600;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xdbeafe);
    scene.fog = new THREE.FogExp2(0xdbeafe, 0.0075);

    const camera = new THREE.PerspectiveCamera(58, width / height, 0.1, 280);
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

    const disposables: { dispose: () => void }[] = [];
    const track = <T extends { dispose: () => void }>(res: T): T => {
      disposables.push(res);
      return res;
    };

    scene.add(new THREE.AmbientLight(0xffffff, 0.8));
    const dirLight = new THREE.DirectionalLight(0xfffbeb, 1.35);
    dirLight.position.set(35, 65, 25);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    scene.add(dirLight);
    const wokFireLight = new THREE.PointLight(0xff5500, 2.2, 4.5);
    scene.add(wokFireLight);

    // ── Terrain ──
    const TERRAIN_WIDTH = 90;
    const TERRAIN_LENGTH = 150;
    const terrainGeo = track(new THREE.PlaneGeometry(TERRAIN_WIDTH, TERRAIN_LENGTH, 54, 75));
    terrainGeo.rotateX(-Math.PI / 2);
    const terrainMat = track(
      new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.8, metalness: 0.05, flatShading: true })
    );
    const terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
    terrainMesh.receiveShadow = true;
    scene.add(terrainMesh);
    const updateTerrainVertices = (playerZ: number) => {
      const posAttr = terrainGeo.attributes.position as THREE.BufferAttribute;
      terrainMesh.position.z = playerZ - 45;
      for (let i = 0; i < posAttr.count; i++) {
        const vx = posAttr.getX(i);
        const worldZ = posAttr.getZ(i) + terrainMesh.position.z;
        posAttr.setY(i, getWaveHeight(vx, worldZ));
      }
      posAttr.needsUpdate = true;
      terrainGeo.computeVertexNormals();
    };

    // ── Player rig: skis, skier, wok on mini-skis ──
    const playerGroup = new THREE.Group();
    scene.add(playerGroup);
    const skiGeo = track(new THREE.BoxGeometry(0.18, 0.05, 2.2));
    const skiMat = track(new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.3 }));
    const leftSki = new THREE.Mesh(skiGeo, skiMat);
    leftSki.position.set(-0.28, 0.05, 0);
    leftSki.castShadow = true;
    const rightSki = new THREE.Mesh(skiGeo, skiMat);
    rightSki.position.set(0.28, 0.05, 0);
    rightSki.castShadow = true;
    playerGroup.add(leftSki, rightSki);

    const torso = new THREE.Mesh(
      track(new THREE.BoxGeometry(0.65, 0.85, 0.4)),
      track(new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.6 }))
    );
    torso.position.set(0, 0.85, 0.15);
    torso.castShadow = true;
    playerGroup.add(torso);
    const head = new THREE.Mesh(
      track(new THREE.SphereGeometry(0.25, 12, 12)),
      track(new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.3 }))
    );
    head.position.set(0, 1.48, 0.12);
    playerGroup.add(head);

    const wokRig = new THREE.Group();
    wokRig.position.set(0, 1.05, -1.05);
    playerGroup.add(wokRig);

    const WOK_RADIUS = 0.88;
    const WOK_DEPTH = 0.36;
    const lathePoints: THREE.Vector2[] = [];
    for (let i = 0; i <= 10; i++) {
      const t = i / 10;
      lathePoints.push(new THREE.Vector2(t * WOK_RADIUS, t * t * WOK_DEPTH));
    }
    const wokMesh = new THREE.Mesh(
      track(new THREE.LatheGeometry(lathePoints, 24)),
      track(new THREE.MeshStandardMaterial({ color: 0x27272a, metalness: 0.65, roughness: 0.35, side: THREE.DoubleSide }))
    );
    wokMesh.castShadow = true;
    wokRig.add(wokMesh);

    const handleGeo = track(new THREE.CylinderGeometry(0.05, 0.06, 0.65, 10));
    handleGeo.rotateX(Math.PI / 2);
    const handleMesh = new THREE.Mesh(
      handleGeo,
      track(new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.7 }))
    );
    handleMesh.position.set(0, WOK_DEPTH * 0.85, WOK_RADIUS + 0.26);
    handleMesh.rotation.x = -0.25;
    wokRig.add(handleMesh);

    // Diegetic aura ring around the wok rim: blue cold, orange cooking,
    // gold pulse = toss/serve window, flashing red = smoking danger.
    const auraMat = track(
      new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.85, side: THREE.DoubleSide })
    );
    const auraRing = new THREE.Mesh(track(new THREE.TorusGeometry(WOK_RADIUS + 0.05, 0.028, 10, 40)), auraMat);
    auraRing.rotation.x = Math.PI / 2;
    auraRing.position.y = WOK_DEPTH + 0.02;
    wokRig.add(auraRing);

    const flameGeo = track(new THREE.ConeGeometry(0.38, 0.3, 12));
    flameGeo.rotateX(Math.PI);
    const flameMat = track(new THREE.MeshBasicMaterial({ color: 0xff6b00, transparent: true, opacity: 0.85 }));
    const flameMesh = new THREE.Mesh(flameGeo, flameMat);
    flameMesh.position.set(0, -0.14, 0);
    wokRig.add(flameMesh);

    // ── Ingredients (8 slots; 6 start in the wok, 2 unlock via pickups) ──
    const ingredients: Ingredient[] = [];
    const ingredientSpecs = [
      { name: "Golden Egg Fried Rice", color: 0xfacc15, geo: track(new THREE.DodecahedronGeometry(0.14, 0)), r: 0.14 },
      { name: "Jumbo Prawns", color: 0xfb7185, geo: track(new THREE.TorusGeometry(0.1, 0.045, 8, 12, Math.PI * 1.3)), r: 0.13 },
      { name: "Baby Bok Choy", color: 0x4ade80, geo: track(new THREE.ConeGeometry(0.11, 0.24, 7)), r: 0.12 },
      { name: "Crispy Tofu Cube", color: 0xfef08a, geo: track(new THREE.BoxGeometry(0.18, 0.18, 0.18)), r: 0.13 },
      { name: "Sichuan Chili Pepper", color: 0xdc2626, geo: track(new THREE.CylinderGeometry(0.04, 0.08, 0.25, 8)), r: 0.11 },
      { name: "Shiitake Mushroom", color: 0x78350f, geo: track(new THREE.SphereGeometry(0.13, 10, 8)), r: 0.13 },
      { name: "Enoki Mushrooms", color: 0xfef3c7, geo: track(new THREE.CylinderGeometry(0.09, 0.11, 0.2, 8)), r: 0.12 },
      { name: "Lap Cheong Sausage", color: 0xb91c1c, geo: track(new THREE.CylinderGeometry(0.06, 0.06, 0.26, 8)), r: 0.12 },
    ];
    ingredientSpecs.forEach((spec, i) => {
      const mesh = new THREE.Mesh(spec.geo, track(new THREE.MeshStandardMaterial({ color: spec.color, roughness: 0.4 })));
      mesh.castShadow = true;
      wokRig.add(mesh);
      const angle = (i / ingredientSpecs.length) * Math.PI * 2;
      ingredients.push({
        mesh,
        localPos: new THREE.Vector3(Math.cos(angle) * 0.25, 0.25 + i * 0.04, Math.sin(angle) * 0.25),
        localVel: new THREE.Vector3(0, 0, 0),
        rotVel: new THREE.Vector3(Math.random() * 4, Math.random() * 4, Math.random() * 4),
        radius: spec.r,
        inWok: i < 6,
        name: spec.name,
      });
      mesh.visible = i < 6;
    });
    const activeCount = () => ingredients.filter((i) => i.inWok).length;

    // ── Obstacles & gates ──
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
          const cone = new THREE.Mesh(track(new THREE.ConeGeometry(1.45 - l * 0.32, 2.2 - l * 0.25, 7)), leavesMat);
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
      } else {
        const GATE_HALF_W = 2.8;
        const poleGeo = track(new THREE.CylinderGeometry(0.08, 0.08, 3.2, 8));
        const leftPole = new THREE.Mesh(poleGeo, track(new THREE.MeshStandardMaterial({ color: 0xef4444 })));
        leftPole.position.set(-GATE_HALF_W, 1.6, 0);
        const rightPole = new THREE.Mesh(poleGeo, track(new THREE.MeshStandardMaterial({ color: 0x3b82f6 })));
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
      const type: Obstacle["type"] = i % 5 === 0 ? "gate" : i % 4 === 0 ? "mogul" : i % 3 === 0 ? "rock" : "tree";
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

    // ── Collectible pickups (chili turbo + ingredient refills) ──
    const pickups: Pickup[] = [];
    const pickupColors: Record<PickupType, number> = { chili: 0xef4444, prawn: 0xfb7185, bokchoy: 0x4ade80, tofu: 0xfef08a };
    const createPickupMesh = (type: PickupType): THREE.Group => {
      const g = new THREE.Group();
      const mat = track(
        new THREE.MeshStandardMaterial({ color: pickupColors[type], emissive: pickupColors[type], emissiveIntensity: 0.9, roughness: 0.3 })
      );
      let body: THREE.Mesh;
      if (type === "chili") {
        body = new THREE.Mesh(track(new THREE.CylinderGeometry(0.09, 0.16, 0.65, 8)), mat);
        body.rotation.z = 0.7;
      } else if (type === "prawn") {
        body = new THREE.Mesh(track(new THREE.TorusGeometry(0.24, 0.1, 8, 14, Math.PI * 1.35)), mat);
      } else if (type === "bokchoy") {
        body = new THREE.Mesh(track(new THREE.ConeGeometry(0.28, 0.6, 8)), mat);
      } else {
        body = new THREE.Mesh(track(new THREE.BoxGeometry(0.42, 0.42, 0.42)), mat);
      }
      body.castShadow = true;
      g.add(body);
      const halo = new THREE.Mesh(
        track(new THREE.TorusGeometry(0.48, 0.03, 8, 24)),
        track(new THREE.MeshBasicMaterial({ color: pickupColors[type], transparent: true, opacity: 0.6 }))
      );
      halo.rotation.x = Math.PI / 2;
      g.add(halo);
      return g;
    };
    const pickupCycle: PickupType[] = ["chili", "prawn", "bokchoy", "tofu", "prawn", "chili", "bokchoy", "tofu"];
    const placePickupAhead = (p: Pickup, baseZ: number, idx: number) => {
      p.z = baseZ - 55 - idx * 16 - Math.random() * 14;
      p.x = (Math.random() - 0.5) * 30;
      p.active = true;
      p.mesh.visible = true;
      p.mesh.position.set(p.x, getWaveHeight(p.x, p.z) + 1.05, p.z);
    };
    for (let i = 0; i < 12; i++) {
      const type = pickupCycle[i % pickupCycle.length];
      const mesh = createPickupMesh(type);
      scene.add(mesh);
      const p: Pickup = { mesh, type, x: 0, z: 0, active: true, spin: Math.random() * Math.PI * 2 };
      placePickupAhead(p, -20, i);
      pickups.push(p);
    }

    // ── Pooled particle system (snow spray, embers, bursts) ──
    const MAX_PARTICLES = 700;
    const pGeo = track(new THREE.BufferGeometry());
    const pPos = new Float32Array(MAX_PARTICLES * 3);
    const pCol = new Float32Array(MAX_PARTICLES * 3);
    for (let i = 0; i < MAX_PARTICLES; i++) pPos[i * 3 + 1] = -9999;
    pGeo.setAttribute("position", new THREE.BufferAttribute(pPos, 3));
    pGeo.setAttribute("color", new THREE.BufferAttribute(pCol, 3));
    const points = new THREE.Points(
      pGeo,
      track(new THREE.PointsMaterial({ size: 0.22, vertexColors: true, transparent: true, opacity: 0.95, depthWrite: false }))
    );
    points.frustumCulled = false;
    scene.add(points);
    interface Particle { life: number; maxLife: number; vx: number; vy: number; vz: number; grav: number; r: number; g: number; b: number }
    const particles: Particle[] = Array.from({ length: MAX_PARTICLES }, () => ({ life: 0, maxLife: 1, vx: 0, vy: 0, vz: 0, grav: 0, r: 1, g: 1, b: 1 }));
    let pCursor = 0;
    const tmpColor = new THREE.Color();
    const emit = (x: number, y: number, z: number, vx: number, vy: number, vz: number, life: number, hex: number, grav = -4) => {
      const p = particles[pCursor];
      const idx = pCursor;
      pCursor = (pCursor + 1) % MAX_PARTICLES;
      p.life = life;
      p.maxLife = life;
      p.vx = vx; p.vy = vy; p.vz = vz; p.grav = grav;
      tmpColor.setHex(hex);
      p.r = tmpColor.r; p.g = tmpColor.g; p.b = tmpColor.b;
      pPos[idx * 3] = x; pPos[idx * 3 + 1] = y; pPos[idx * 3 + 2] = z;
      pCol[idx * 3] = p.r; pCol[idx * 3 + 1] = p.g; pCol[idx * 3 + 2] = p.b;
    };
    const burst = (x: number, y: number, z: number, hex: number, n: number, speed: number, up = 2.2, life = 0.8) => {
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2;
        const s = (0.3 + Math.random() * 0.7) * speed;
        emit(x, y, z, Math.cos(a) * s, up * (0.4 + Math.random() * 0.9), Math.sin(a) * s, life * (0.6 + Math.random() * 0.7), hex, -5);
      }
    };
    const updateParticles = (dt: number) => {
      for (let i = 0; i < MAX_PARTICLES; i++) {
        const p = particles[i];
        if (p.life <= 0) continue;
        p.life -= dt;
        if (p.life <= 0) { pPos[i * 3 + 1] = -9999; continue; }
        p.vy += p.grav * dt;
        pPos[i * 3] += p.vx * dt;
        pPos[i * 3 + 1] += p.vy * dt;
        pPos[i * 3 + 2] += p.vz * dt;
        const fade = Math.min(1, p.life / (p.maxLife * 0.5));
        pCol[i * 3] = p.r * fade; pCol[i * 3 + 1] = p.g * fade; pCol[i * 3 + 2] = p.b * fade;
      }
      (pGeo.attributes.position as THREE.BufferAttribute).needsUpdate = true;
      (pGeo.attributes.color as THREE.BufferAttribute).needsUpdate = true;
    };

    // ── Input ──
    const keys = gameRef.current.keys;
    const onKeyDown = (e: KeyboardEvent) => {
      keys[e.code] = true;
      if (e.code === "Space") {
        e.preventDefault();
        if (gameRef.current.phase === "playing") gameRef.current.tossTrigger = true;
        else {
          gameRef.current.phase = "playing";
          gameRef.current.resetTrigger = true;
          sfx.init();
        }
      } else if (e.code === "KeyR") {
        gameRef.current.phase = "playing";
        gameRef.current.resetTrigger = true;
        sfx.init();
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

    // ── Game state ──
    const player = {
      x: 0, y: 0, z: 0, vy: 0, speed: 14, heading: 0, turnRate: 0, grounded: true,
      score: 0, gatesCleared: 0, combo: 0, comboTimer: 0,
      wokHei: 35, heat: 0, dishCook: 0, orderIndex: 0, dishesServed: 0,
      elapsed: 0, statusMessage: "Carve the slope, toss on the golden pulse, cook the order, serve it hot!",
      wokTiltX: 0, wokTiltZ: 0, tossAnimTimer: 0,
      sizzleNextAt: 3.2, sizzleUntil: 0, heatWarned: false,
      turboUntil: -1, shieldUntil: -1, aerialCatchUntil: -1, lastCollisionAt: -10,
      camBank: 0, fov: 58, shake: 0,
    };
    const sizzleActive = () => player.elapsed >= player.sizzleNextAt && player.elapsed <= player.sizzleUntil;
    const inTurbo = () => player.elapsed < player.turboUntil;
    const inShield = () => player.elapsed < player.shieldUntil;

    const wokWorldPos = (out: THREE.Vector3) => wokRig.getWorldPosition(out);
    const tmpV = new THREE.Vector3();

    const scheduleSizzle = () => {
      player.sizzleNextAt = player.elapsed + 3.4 + Math.random() * 1.6;
      player.sizzleUntil = player.sizzleNextAt + 1.15;
    };

    const ejectIngredient = (reason: string) => {
      const victim = ingredients.find((i) => i.inWok);
      if (victim) {
        victim.inWok = false;
        victim.mesh.visible = false;
        player.statusMessage = reason.replace("{name}", victim.name);
      }
    };

    const serveDish = () => {
      wokWorldPos(tmpV);
      burst(tmpV.x, tmpV.y + 0.3, tmpV.z, 0xffd34d, 46, 3.4, 4.2, 1.1);
      burst(tmpV.x, tmpV.y + 0.3, tmpV.z, 0xff7b1c, 30, 2.4, 3.4, 0.9);
      burst(tmpV.x, tmpV.y + 0.3, tmpV.z, 0xfff3b0, 24, 1.8, 5.0, 1.2);
      player.score += 2500;
      player.dishesServed += 1;
      player.dishCook = 0;
      player.heat = Math.max(0, player.heat - 55);
      player.wokHei = Math.min(100, player.wokHei + 20);
      player.orderIndex = (player.orderIndex + 1) % ORDERS.length;
      // Refill the base six; bonus slots stay as collected (max 8)
      ingredients.forEach((ing, i) => {
        if (i < 6) {
          ing.inWok = true;
          ing.mesh.visible = true;
        }
      });
      player.turboUntil = player.elapsed + 4;
      player.shieldUntil = player.elapsed + 4;
      player.statusMessage = `🍜 ORDER SERVED! +2,500 PTS! Next: ${ORDERS[player.orderIndex]}. Turbo boost!`;
      addPopup("🍜 DISH SERVED! +2500", "gold");
      sfx.served();
      scheduleSizzle();
    };

    const doToss = () => {
      wokWorldPos(tmpV);
      if (player.dishCook >= 100) {
        serveDish();
        return;
      }
      const airborne = !player.grounded;
      const perfect = sizzleActive();
      player.tossAnimTimer = 0.22;
      if (airborne) {
        // Aerial Flame Toss: dramatic auto-catch arc off a mogul launch
        player.wokHei = Math.min(100, player.wokHei + 35);
        player.score += 1000;
        player.dishCook = Math.min(100, player.dishCook + 14);
        player.heat = Math.max(0, player.heat - 30);
        player.aerialCatchUntil = player.elapsed + 1.4;
        ingredients.forEach((ing) => {
          if (!ing.inWok) return;
          ing.localVel.y = 3.6 + Math.random() * 0.8;
          ing.localVel.x = -ing.localPos.x * 1.8 + (Math.random() - 0.5) * 0.4;
          ing.localVel.z = -ing.localPos.z * 1.8 + (Math.random() - 0.5) * 0.4;
        });
        burst(tmpV.x, tmpV.y - 0.15, tmpV.z, 0xff7b1c, 30, 2.2, 2.6, 0.7);
        burst(tmpV.x, tmpV.y - 0.15, tmpV.z, 0xffd34d, 18, 1.6, 3.2, 0.8);
        player.statusMessage = "🚀 AERIAL FLAME TOSS! +1,000 PTS! The wok catches everything!";
        addPopup("🚀 AERIAL FLAME TOSS! +1000", "gold");
        sfx.perfect(player.combo);
      } else if (perfect) {
        player.dishCook = Math.min(100, player.dishCook + 20);
        player.wokHei = Math.min(100, player.wokHei + 18);
        player.score += 250;
        player.heat = 0;
        ingredients.forEach((ing) => {
          if (!ing.inWok) return;
          ing.localVel.y = 3.1 + Math.random() * 0.9;
          ing.localVel.x -= ing.localPos.x * 1.4 + (Math.random() - 0.5) * 0.5;
          ing.localVel.z -= ing.localPos.z * 1.4 + (Math.random() - 0.5) * 0.5;
        });
        burst(tmpV.x, tmpV.y + 0.1, tmpV.z, 0xffa726, 20, 1.7, 2.6, 0.6);
        player.statusMessage = "🔥 PERFECT TOSS! The sizzle window sings! +20% cooked!";
        addPopup("🔥 PERFECT TOSS! +250", "gold");
        sfx.perfect(player.combo);
      } else {
        player.dishCook = Math.min(100, player.dishCook + 5);
        player.wokHei = Math.min(100, player.wokHei + 6);
        player.score += 40;
        player.heat = Math.max(0, player.heat - 42);
        ingredients.forEach((ing) => {
          if (!ing.inWok) return;
          ing.localVel.y = 3.0 + Math.random() * 0.9;
          ing.localVel.x -= ing.localPos.x * 1.3 + (Math.random() - 0.5) * 0.5;
          ing.localVel.z -= ing.localPos.z * 1.3 + (Math.random() - 0.5) * 0.5;
        });
        player.statusMessage = "Wok tossed! Watch the rim: toss when it pulses gold!";
        sfx.toss();
      }
      scheduleSizzle();
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
      player.combo = 0;
      player.comboTimer = 0;
      player.wokHei = 40;
      player.heat = 0;
      player.dishCook = 0;
      player.orderIndex = 0;
      player.dishesServed = 0;
      player.elapsed = 0;
      player.statusMessage = `Order #1: ${ORDERS[0]}! Toss on the golden pulse!`;
      player.tossAnimTimer = 0;
      player.turboUntil = -1;
      player.shieldUntil = -1;
      player.aerialCatchUntil = -1;
      player.lastCollisionAt = -10;
      player.camBank = 0;
      player.shake = 0;
      scheduleSizzle();
      player.sizzleNextAt = 3.0;
      player.sizzleUntil = 4.15;
      ingredients.forEach((ing, i) => {
        const angle = (i / ingredients.length) * Math.PI * 2;
        ing.localPos.set(Math.cos(angle) * 0.24, 0.22 + (i % 6) * 0.04, Math.sin(angle) * 0.24);
        ing.localVel.set(0, 0, 0);
        ing.inWok = i < 6;
        ing.mesh.visible = i < 6;
      });
      obstacles.forEach((obs, i) => placeObstacleAhead(obs, 0, i));
      pickups.forEach((p, i) => placePickupAhead(p, -10, i));
      for (const p of particles) p.life = 0;
      for (let i = 0; i < MAX_PARTICLES; i++) pPos[i * 3 + 1] = -9999;
      updateTerrainVertices(0);
    };

    resetSimulation();
    setIsReady(true);

    // Deterministic browser scenarios for mechanics that are hard to reach on
    // demand. These controls are removed from production builds.
    const testWindow = window as Window & { __wokTest?: {
      prepare: (scenario: string) => void;
      snapshot: () => { ingredients: number; score: number; heat: number; grounded: boolean; turbo: boolean; shield: boolean; served: number };
    } };
    if (process.env.NODE_ENV === "development") {
      testWindow.__wokTest = {
        prepare: (scenario) => {
          if (scenario === "chili" || scenario === "food") {
            const pickup = pickups.find((p) => scenario === "chili" ? p.type === "chili" : p.type !== "chili");
            if (scenario === "food") ejectIngredient("Test setup: lost {name}");
            if (pickup) { pickup.x = player.x; pickup.z = player.z; pickup.active = true; }
          } else if (scenario === "mogul" || scenario === "shieldCrash" || scenario === "crashEmpty") {
            const obstacle = obstacles.find((o) => scenario === "mogul" ? o.type === "mogul" : o.type === "rock");
            if (scenario === "crashEmpty") ingredients.forEach((ing, i) => { ing.inWok = i === 0; ing.mesh.visible = i === 0; });
            if (obstacle) { obstacle.x = player.x; obstacle.z = player.z; obstacle.passed = false; }
          } else if (scenario === "burn") {
            player.heat = 99.9;
          } else if (scenario === "serve") {
            player.dishCook = 100;
          }
        },
        snapshot: () => ({ ingredients: activeCount(), score: player.score, heat: player.heat, grounded: player.grounded, turbo: inTurbo(), shield: inShield(), served: player.dishesServed }),
      };
    }

    // ── Main loop ──
    let animId = 0;
    let lastTime = performance.now();
    let hudSync = 0;
    const desiredCamPos = new THREE.Vector3();
    const camTarget = new THREE.Vector3();

    const animate = (now: number) => {
      animId = requestAnimationFrame(animate);
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      if (gameRef.current.resetTrigger) {
        gameRef.current.resetTrigger = false;
        resetSimulation();
      }
      if (gameRef.current.tossTrigger) {
        gameRef.current.tossTrigger = false;
        if (gameRef.current.phase === "playing") doToss();
      }

      const playing = gameRef.current.phase === "playing";
      let steerInput = 0;

      if (playing) {
        player.elapsed += dt;
        const steerLeft = keys["KeyA"] || keys["ArrowLeft"] ? 1 : 0;
        const steerRight = keys["KeyD"] || keys["ArrowRight"] ? 1 : 0;
        const tuck = keys["KeyW"] || keys["ArrowUp"] ? 1 : 0;
        const brake = keys["KeyS"] || keys["ArrowDown"] ? 1 : 0;
        steerInput = steerLeft - steerRight;

        const targetTurnRate = steerInput * 1.85;
        player.turnRate = THREE.MathUtils.lerp(player.turnRate, targetTurnRate, dt * 7);
        player.heading = THREE.MathUtils.clamp(player.heading + player.turnRate * dt, -Math.PI * 0.42, Math.PI * 0.42);

        const turbo = inTurbo();
        const slopeAccel = Math.cos(player.heading) * 6.8 + (tuck ? 5.5 : 0) + (turbo ? 6.0 : 0);
        const carvingDrag = Math.abs(Math.sin(player.heading)) * 4.5 + (brake ? 9.5 : 0);
        const airDrag = 0.011 * player.speed * player.speed;
        player.speed = THREE.MathUtils.clamp(player.speed + (slopeAccel - carvingDrag - airDrag) * dt, 6, turbo ? 44 : 36);

        const vx = -Math.sin(player.heading) * player.speed;
        const vz = -Math.cos(player.heading) * player.speed;
        player.x = THREE.MathUtils.clamp(player.x + vx * dt, -26, 26);
        player.z += vz * dt;

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
            if (verticalJolt > 1.4) player.shake = Math.min(1, verticalJolt * 0.3);
            if (verticalJolt > 2.3) {
              // Hard landing sloshes the wok: brief spill window + bounce
              player.lastCollisionAt = player.elapsed;
              ingredients.forEach((ing) => { if (ing.inWok) ing.localVel.y += verticalJolt * 0.55; });
            }
          }
        }

        playerGroup.position.set(player.x, player.y, player.z);
        playerGroup.rotation.y = player.heading;
        playerGroup.rotation.z = THREE.MathUtils.lerp(playerGroup.rotation.z, player.turnRate * 0.28, dt * 10);
        updateTerrainVertices(player.z);

        // Carving pocket: clean carving banks the wok into the turn and the
        // pan "catches" the ingredients; only impacts break the pocket.
        const cleanCarve = Math.abs(steerInput) > 0 && player.elapsed - player.lastCollisionAt > 1.2;
        const pocketFactor = cleanCarve ? 0.3 : 1.0;
        wokRig.rotation.z = THREE.MathUtils.lerp(wokRig.rotation.z, -player.turnRate * 0.3, dt * 8);
        wokRig.rotation.x = THREE.MathUtils.lerp(wokRig.rotation.x, 0, dt * 8);

        // Cooking pressure & order progress
        player.heat = Math.min(100, player.heat + dt * 6.5);
        if (player.heat > 68 && !player.heatWarned) {
          player.heatWarned = true;
          player.statusMessage = "💨 The wok is smoking! Toss to vent the heat!";
        }
        if (player.heat >= 100) {
          player.heat = 55;
          player.heatWarned = false;
          ejectIngredient("🔥 {name} burned onto the pan! Toss on the gold pulse!");
          addPopup("🔥 INGREDIENT BURNED!", "red");
          sfx.burn();
        }
        const speedFrac = THREE.MathUtils.clamp(player.speed / 36, 0, 1.2);
        if (player.dishCook < 100) {
          player.dishCook = Math.min(100, player.dishCook + dt * (0.5 + speedFrac * 0.9));
          if (player.dishCook >= 100) {
            player.statusMessage = "✨ DISH READY! Press SPACE to serve it in a firework burst!";
            addPopup("✨ DISH READY — SPACE TO SERVE!", "gold");
          }
        }
        player.wokHei = Math.max(0, player.wokHei - dt * 2.2);
        if (player.comboTimer > 0) {
          player.comboTimer -= dt;
          if (player.comboTimer <= 0) player.combo = 0;
        }

        if (player.tossAnimTimer > 0) player.tossAnimTimer = Math.max(0, player.tossAnimTimer - dt);
        const flick = Math.sin((player.tossAnimTimer / 0.22) * Math.PI) * 0.42;
        if (player.tossAnimTimer > 0) wokRig.rotation.x = flick;

        // ── Ingredient physics in wok-local space ──
        const centrifugalX = player.turnRate * (player.speed / 22) * 3.1 * pocketFactor;
        const aerialCatch = player.elapsed < player.aerialCatchUntil;
        const spillRiskActive = player.elapsed - player.lastCollisionAt < 0.5;
        ingredients.forEach((ing) => {
          if (!ing.inWok) return;
          ing.localVel.x += centrifugalX * dt;
          ing.localVel.y -= 9.2 * dt;
          // Magnetic funnel: falling ingredients get pulled back to center
          if (ing.localVel.y < 0) {
            const rr = Math.hypot(ing.localPos.x, ing.localPos.z) || 0.001;
            const funnel = (aerialCatch ? 6.5 : 2.6) * dt;
            ing.localVel.x -= (ing.localPos.x / rr) * funnel * rr;
            ing.localVel.z -= (ing.localPos.z / rr) * funnel * rr;
          }
          ing.localVel.multiplyScalar(1 - dt * 1.15);
          ing.localPos.addScaledVector(ing.localVel, dt);

          const rSq = ing.localPos.x * ing.localPos.x + ing.localPos.z * ing.localPos.z;
          const r = Math.sqrt(rSq);
          const bowlFloorY = Math.pow(Math.min(r, WOK_RADIUS * 1.2) / WOK_RADIUS, 2) * WOK_DEPTH + ing.radius;
          if (ing.localPos.y < bowlFloorY) {
            ing.localPos.y = bowlFloorY;
            if (ing.localVel.y < 0) ing.localVel.y *= -0.25;
            if (r > 0.02) {
              const slopeFactor = (2 * WOK_DEPTH * r) / (WOK_RADIUS * WOK_RADIUS);
              ing.localVel.x += (-ing.localPos.x / r) * slopeFactor * 5.2 * dt;
              ing.localVel.z += (-ing.localPos.z / r) * slopeFactor * 5.2 * dt;
            }
          }
          // Rim lip: strong inward catch. Ejection only during a fresh
          // impact slosh, never from clean carving or a normal toss.
          if (r > WOK_RADIUS * 0.92) {
            const inward = aerialCatch ? 9 : 5.5;
            ing.localVel.x -= (ing.localPos.x / r) * inward * dt * 3;
            ing.localVel.z -= (ing.localPos.z / r) * inward * dt * 3;
            if (r > WOK_RADIUS * 1.1) {
              if (spillRiskActive && !aerialCatch && ing.localPos.y > WOK_DEPTH * 0.5) {
                ing.inWok = false;
                ing.mesh.visible = false;
                player.statusMessage = `😱 ${ing.name} flew out on the impact! Grab pickups to refill!`;
                addPopup("💥 INGREDIENT LOST!", "red");
              } else {
                const clampR = WOK_RADIUS * 1.02;
                ing.localPos.x *= clampR / r;
                ing.localPos.z *= clampR / r;
              }
            }
          }
          ing.mesh.position.copy(ing.localPos);
          ing.mesh.rotation.x += ing.rotVel.x * dt;
          ing.mesh.rotation.y += ing.rotVel.y * dt;
        });

        // ── Obstacles & gates ──
        obstacles.forEach((obs, idx) => {
          const dz = obs.z - player.z;
          const dx = obs.x - player.x;
          if (!obs.passed && Math.abs(dz) < 1.35) {
            if (obs.type === "gate") {
              if (Math.abs(dx) < obs.radius) {
                obs.passed = true;
                player.gatesCleared += 1;
                player.combo += 1;
                player.comboTimer = 4.5;
                player.wokHei = Math.min(100, player.wokHei + 8);
                player.dishCook = Math.min(100, player.dishCook + 5);
                const bonus = Math.round(120 * (1 + player.wokHei / 60)) + player.combo * 25;
                player.score += bonus;
                player.statusMessage = player.combo >= 2 ? `⛷️ GATE COMBO x${player.combo}! +${bonus} pts!` : `🥢 Gate cleared! +${bonus} pts!`;
                if (player.combo >= 2) addPopup(`⛷️ GATE COMBO x${player.combo}!`, "green");
                sfx.gate(player.combo);
                wokWorldPos(tmpV);
                burst(tmpV.x, tmpV.y + 0.2, tmpV.z, 0x7CFC98, 10, 1.4, 2.2, 0.5);
              }
            } else if (Math.hypot(dx, dz) < obs.radius + 0.45) {
              obs.passed = true;
              if (obs.type === "mogul") {
                player.grounded = false;
                player.vy = 4.6;
                player.statusMessage = "🎿 Mogul launch! Press SPACE mid-air for an AERIAL FLAME TOSS!";
              } else if (inShield()) {
                player.speed = Math.max(8, player.speed * 0.82);
                player.shake = 0.4;
                player.statusMessage = "🛡️ WOK HEI SHIELD blocked the crash!";
                addPopup("🛡️ SHIELD BLOCKED!", "blue");
                sfx.hit();
              } else {
                player.speed = Math.max(7, player.speed * 0.45);
                player.wokHei = Math.max(0, player.wokHei - 26);
                player.lastCollisionAt = player.elapsed;
                player.shake = 1;
                ejectIngredient(`💥 Crashed into a ${obs.type}! Lost {name}!`);
                addPopup("💥 CRASH!", "red");
                sfx.hit();
              }
            }
          }
          if (obs.z > player.z + 18) placeObstacleAhead(obs, player.z - 85, idx % 8);
        });

        // ── Pickups ──
        pickups.forEach((p, idx) => {
          p.spin += dt * 2.4;
          p.mesh.rotation.y = p.spin;
          p.mesh.position.y = getWaveHeight(p.x, p.z) + 1.05 + Math.sin(player.elapsed * 2.4 + idx) * 0.16;
          if (!p.active) return;
          const dx = p.x - player.x;
          const dz = p.z - player.z;
          if (Math.hypot(dx, dz) < 2.8) {
            p.active = false;
            p.mesh.visible = false;
            burst(p.x, getWaveHeight(p.x, p.z) + 1.1, p.z, pickupColors[p.type], 22, 2.0, 2.6, 0.7);
            if (p.type === "chili") {
              player.turboUntil = player.elapsed + 3;
              player.wokHei = Math.min(100, player.wokHei + 25);
              player.score += 150;
              player.statusMessage = "🌶️ SICHUAN CHILI! 3s Flame Turbo + Wok Hei surge!";
              addPopup("🌶️ CHILI TURBO!", "red");
              sfx.chili();
            } else {
              const dormant = ingredients.find((i) => !i.inWok);
              player.score += 300;
              if (dormant) {
                dormant.inWok = true;
                dormant.mesh.visible = true;
                dormant.localPos.set((Math.random() - 0.5) * 0.2, 0.42, (Math.random() - 0.5) * 0.2);
                dormant.localVel.set(0, -0.5, 0);
                player.statusMessage = `🍤 Fresh ${dormant.name} landed in the wok! +300 pts!`;
                addPopup("🍤 INGREDIENT +1! +300", "green");
              } else {
                player.dishCook = Math.min(100, player.dishCook + 8);
                player.statusMessage = "Wok is full! Pickup converted to cooking progress! +300 pts!";
                addPopup("✨ FULL WOK BONUS! +300", "green");
              }
              sfx.pickup();
            }
            placePickupAhead(p, player.z, idx);
          } else if (p.z > player.z + 20) {
            placePickupAhead(p, player.z, idx);
          }
        });

        // A crash or an impact spill can empty the wok too, not just a burn.
        if (activeCount() === 0) {
          gameRef.current.phase = "gameover";
          player.statusMessage = "The wok is empty. Time for a new run!";
        }

        // Score from distance
        player.score += Math.abs(vz) * dt * (1 + player.wokHei / 70) * (activeCount() / MAX_INGREDIENTS) * 2.2;

        // Snow spray when carving hard; embers when Wok Hei is high; smoke when hot
        if (Math.abs(steerInput) > 0.3 && player.grounded) {
          for (let s = 0; s < 2; s++) {
            emit(
              player.x + (Math.random() > 0.5 ? 0.3 : -0.3), player.y + 0.12, player.z + 0.7,
              (Math.random() - 0.5) * 1.6 + steerInput * -1.4, 0.8 + Math.random() * 1.1, 1.6 + Math.random(),
              0.55, 0xffffff, -3.5
            );
          }
        }
        wokWorldPos(tmpV);
        if (player.wokHei > 50 && Math.random() < 0.55) {
          emit(tmpV.x + (Math.random() - 0.5) * 0.5, tmpV.y + 0.1, tmpV.z + (Math.random() - 0.5) * 0.5,
            (Math.random() - 0.5) * 0.3, 1.1 + Math.random() * 0.9, (Math.random() - 0.5) * 0.3,
            0.7, Math.random() > 0.5 ? 0xffa726 : 0xff6b00, 1.2);
        }
        if (player.heat > 68 && Math.random() < 0.4) {
          emit(tmpV.x + (Math.random() - 0.5) * 0.4, tmpV.y + 0.25, tmpV.z + (Math.random() - 0.5) * 0.4,
            (Math.random() - 0.5) * 0.2, 0.9 + Math.random() * 0.5, (Math.random() - 0.5) * 0.2,
            0.9, 0x666666, 0.8);
        }
        sfx.setCarve(Math.abs(steerInput), speedFrac);
      }

      // ── Camera: dynamic FOV, banking, shake ──
      const speedFracC = THREE.MathUtils.clamp(player.speed / 36, 0, 1.15);
      const targetFov = Math.min(78, 55 + speedFracC * 17 + (inTurbo() ? 6 : 0));
      player.fov = THREE.MathUtils.lerp(player.fov, targetFov, dt * 3.2);
      if (Math.abs(player.fov - camera.fov) > 0.05) {
        camera.fov = player.fov;
        camera.updateProjectionMatrix();
      }
      desiredCamPos.set(player.x * 0.85, player.y + 3.4, player.z + 5.2);
      if (player.shake > 0) {
        player.shake = Math.max(0, player.shake - dt * 2.4);
        desiredCamPos.x += (Math.random() - 0.5) * player.shake * 0.35;
        desiredCamPos.y += (Math.random() - 0.5) * player.shake * 0.3;
      }
      camera.position.lerp(desiredCamPos, Math.min(1, dt * 8));
      camTarget.set(player.x, player.y + 0.85, player.z - 6.5);
      camera.lookAt(camTarget);
      player.camBank = THREE.MathUtils.lerp(player.camBank, player.turnRate * 0.09, dt * 6);
      camera.rotateZ(player.camBank);

      wokFireLight.position.set(player.x, player.y + 0.9, player.z - 1.0);
      wokFireLight.intensity = 1.2 + (player.wokHei / 100) * 3.2;
      flameMesh.scale.setScalar(0.7 + (player.wokHei / 100) * 0.8 + Math.sin(now * 0.02) * 0.06);

      // ── Diegetic aura ring state ──
      const serveReady = player.dishCook >= 100;
      const smoking = player.heat > 68;
      const goldPulse = serveReady || sizzleActive();
      if (smoking) {
        auraMat.color.setHex(Math.sin(now * 0.03) > 0 ? 0xef4444 : 0x7f1d1d);
        auraMat.opacity = 0.95;
        auraRing.scale.setScalar(1);
      } else if (goldPulse) {
        auraMat.color.setHex(0xffc21c);
        auraMat.opacity = 0.75 + Math.sin(now * 0.018) * 0.25;
        auraRing.scale.setScalar(1 + Math.sin(now * 0.018) * 0.045);
      } else if (player.wokHei < 25) {
        auraMat.color.setHex(0x38bdf8);
        auraMat.opacity = 0.8;
        auraRing.scale.setScalar(1);
      } else {
        auraMat.color.setHex(0xff7b1c);
        auraMat.opacity = 0.85;
        auraRing.scale.setScalar(1);
      }

      updateParticles(dt);
      renderer.render(scene, camera);

      hudSync += dt;
      if (hudSync > 0.08) {
        hudSync = 0;
        setHud({
          phase: gameRef.current.phase,
          score: Math.floor(player.score),
          distance: Math.floor(Math.abs(player.z)),
          speedKmh: Math.round(player.speed * 3.6),
          wokHei: Math.round(player.wokHei),
          heat: Math.round(player.heat),
          dishCook: Math.floor(player.dishCook),
          orderName: ORDERS[player.orderIndex],
          orderIndex: player.orderIndex,
          dishesServed: player.dishesServed,
          ingredientsActive: activeCount(),
          maxIngredients: MAX_INGREDIENTS,
          gatesCleared: player.gatesCleared,
          combo: player.combo,
          turbo: inTurbo(),
          shield: inShield(),
          sizzleActive: sizzleActive() || player.dishCook >= 100,
          statusMessage: player.statusMessage,
          muted: gameRef.current.muted,
        });
      }
    };

    animId = requestAnimationFrame(animate);

    const handleResize = () => {
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
      delete testWindow.__wokTest;
      sfx.setCarve(0, 0);
      disposables.forEach((d) => d.dispose());
      renderer.dispose();
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addPopup]);

  const popupTones: Record<Popup["tone"], string> = {
    gold: "bg-amber-400 text-slate-950 border-amber-200",
    green: "bg-emerald-500 text-white border-emerald-300",
    red: "bg-rose-600 text-white border-rose-300",
    blue: "bg-sky-500 text-white border-sky-300",
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-slate-950 select-none font-sans">
      <style>{`
        @keyframes wok-pop {
          0% { transform: scale(0.4) translateY(10px); opacity: 0; }
          55% { transform: scale(1.18) translateY(-2px); opacity: 1; }
          75% { transform: scale(0.96) translateY(0); }
          100% { transform: scale(1) translateY(0); opacity: 1; }
        }
        @keyframes wok-fadeup {
          0% { opacity: 1; }
          80% { opacity: 1; }
          100% { opacity: 0; transform: translateY(-14px); }
        }
        .wok-popup { animation: wok-pop 0.28s ease-out, wok-fadeup 1.7s ease-in forwards; }
      `}</style>

      <div ref={mountRef} className="w-full h-full" />

      {!isReady && !webglError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 text-white z-30">
          <div className="text-2xl font-bold tracking-widest text-amber-400 animate-pulse">PREPARING WOK &amp; SKIS…</div>
          <div className="text-sm text-slate-400 mt-2">Initializing Three.js alpine physics simulation</div>
        </div>
      )}

      {webglError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 text-white z-30 p-6 text-center">
          <div className="text-2xl font-bold text-rose-400 mb-2">WebGL Unavailable</div>
          <p className="text-sm text-slate-300 max-w-sm">
            Hardware acceleration is required to play Wok &amp; Skis. Please enable WebGL in your browser settings.
          </p>
          <Link href="/" className="mt-6 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-mono font-bold">
            Return to Portfolio
          </Link>
        </div>
      )}

      {/* Header: portfolio, order card, mute */}
      <div className="absolute top-4 inset-x-4 flex items-start justify-between gap-3 pointer-events-none z-20">
        <Link
          href="/"
          className="pointer-events-auto flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900/85 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 text-xs font-mono font-medium shadow-xl transition-all"
        >
          ← Portfolio
        </Link>

        {/* Recipe order card */}
        <div className="flex flex-col items-center bg-slate-900/88 backdrop-blur-md border border-amber-500/40 px-5 py-2.5 rounded-2xl text-white shadow-xl min-w-64 max-w-md">
          <div className="text-[10px] uppercase tracking-widest text-amber-400 font-bold">
            Order #{hud.orderIndex + 1} · Served: {hud.dishesServed}
          </div>
          <div className="text-sm sm:text-base font-black tracking-tight text-center">{hud.orderName}</div>
          <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden mt-1.5 border border-slate-700">
            <div
              className={`h-full transition-all duration-150 ${hud.dishCook >= 100 ? "bg-gradient-to-r from-amber-300 to-yellow-400 animate-pulse" : "bg-gradient-to-r from-amber-500 to-orange-500"}`}
              style={{ width: `${hud.dishCook}%` }}
            />
          </div>
          <div className="text-[10px] font-mono text-slate-300 mt-1">
            {hud.dishCook >= 100 ? "DISH READY! Press SPACE to serve! +2500" : `Dish Cook ${hud.dishCook}% · toss on the gold pulse!`}
          </div>
        </div>

        <button
          onClick={toggleMute}
          aria-label={hud.muted ? "Unmute sound" : "Mute sound"}
          className="pointer-events-auto px-3.5 py-2 rounded-xl bg-slate-900/85 hover:bg-slate-800 text-slate-200 border border-slate-700/80 text-xs font-mono font-bold shadow-xl transition-all"
        >
          {hud.muted ? "🔇 MUTED" : "🔊 SOUND"}
        </button>
      </div>

      {/* Left score cluster */}
      <div className="absolute top-24 left-4 pointer-events-none z-10 hidden sm:block">
        <div className="flex items-center gap-5 bg-slate-900/85 backdrop-blur-md border border-slate-700/80 px-4 py-2.5 rounded-2xl text-white shadow-xl">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-slate-400">Score</div>
            <div className="text-xl font-black text-amber-400 tabular-nums">{hud.score.toLocaleString()}</div>
          </div>
          <div className="h-6 w-px bg-slate-700" />
          <div>
            <div className="text-[10px] uppercase tracking-wider text-slate-400">Distance</div>
            <div className="text-lg font-bold tabular-nums">{hud.distance}m</div>
          </div>
          <div className="h-6 w-px bg-slate-700" />
          <div>
            <div className="text-[10px] uppercase tracking-wider text-slate-400">Speed</div>
            <div className={`text-lg font-bold tabular-nums ${hud.turbo ? "text-orange-400" : "text-sky-400"}`}>{hud.speedKmh} km/h</div>
          </div>
          <div className="h-6 w-px bg-slate-700" />
          <div>
            <div className="text-[10px] uppercase tracking-wider text-slate-400">Dishes</div>
            <div className="text-lg font-bold text-emerald-400 tabular-nums">{hud.dishesServed}</div>
          </div>
        </div>
      </div>

      {/* Wok status card */}
      <div className="absolute top-24 right-4 pointer-events-none z-10">
        <div className="flex items-center gap-4 bg-slate-900/85 backdrop-blur-md border border-slate-700/80 px-4 py-2.5 rounded-2xl text-white shadow-xl">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-slate-400">
              Wok ({hud.ingredientsActive}/{hud.maxIngredients})
            </div>
            <div className="flex gap-1.5 mt-1">
              {Array.from({ length: hud.maxIngredients }).map((_, idx) => (
                <span
                  key={idx}
                  className={`w-3 h-3 rounded-full transition-all ${
                    idx < hud.ingredientsActive ? "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]" : "bg-slate-700"
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
              <div className="h-full bg-gradient-to-r from-amber-500 to-red-500 transition-all duration-100" style={{ width: `${hud.wokHei}%` }} />
            </div>
          </div>
          <div className="w-24 sm:w-28">
            <div className="flex justify-between text-[10px] uppercase tracking-wider">
              <span className={`font-semibold ${hud.heat > 68 ? "text-rose-400 animate-pulse" : "text-slate-300"}`}>{hud.heat > 68 ? "💨 Smoking!" : "Heat"}</span>
              <span>{hud.heat}%</span>
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mt-1">
              <div
                className={`h-full transition-all duration-100 ${hud.heat > 68 ? "bg-rose-500 animate-pulse" : "bg-orange-300"}`}
                style={{ width: `${hud.heat}%` }}
              />
            </div>
          </div>
        </div>
        {(hud.turbo || hud.shield) && (
          <div className="mt-2 text-center text-[11px] font-black font-mono tracking-wider text-orange-300 bg-slate-900/85 border border-orange-500/50 rounded-xl px-3 py-1.5 animate-pulse">
            {hud.shield ? "🛡️ TURBO + SHIELD ACTIVE!" : "🌶️ FLAME TURBO!"}
          </div>
        )}
      </div>

      {/* Arcade popup feed */}
      <div className="absolute top-44 right-4 z-20 flex flex-col items-end gap-2 pointer-events-none">
        {popups.map((p) => (
          <div key={p.id} className={`wok-popup px-4 py-2 rounded-xl border-2 font-black text-sm sm:text-base tracking-wide shadow-2xl ${popupTones[p.tone]}`}>
            {p.text}
          </div>
        ))}
      </div>

      {/* Status + controls */}
      <div className="absolute bottom-6 inset-x-0 flex flex-col items-center gap-3 pointer-events-none z-10 px-4">
        <div
          className={`backdrop-blur-md border px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium shadow-lg max-w-xl text-center transition-all ${
            hud.sizzleActive
              ? "bg-amber-400/90 border-amber-200 text-slate-950 font-black animate-pulse"
              : "bg-slate-900/80 border-slate-700 text-slate-100"
          }`}
        >
          {hud.sizzleActive && hud.phase === "playing" ? "✨ GOLDEN PULSE! TOSS NOW (SPACE)! ✨" : hud.statusMessage}
        </div>
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onPointerDown={() => { gameRef.current.keys["KeyA"] = true; }}
            onPointerUp={() => { gameRef.current.keys["KeyA"] = false; }}
            onPointerLeave={() => { gameRef.current.keys["KeyA"] = false; }}
            className="sm:hidden px-4 py-2.5 rounded-xl bg-slate-900/90 active:scale-95 text-slate-200 border border-slate-700 font-bold text-xs shadow-lg select-none"
            aria-label="Steer Left"
          >
            ◀ LEFT
          </button>
          <button
            onClick={triggerToss}
            className={`px-6 py-2.5 rounded-xl font-black text-sm tracking-wide shadow-lg cursor-pointer transition select-none active:scale-95 ${
              hud.dishCook >= 100 && hud.phase === "playing"
                ? "bg-gradient-to-r from-yellow-300 to-amber-500 text-slate-950 animate-pulse"
                : hud.sizzleActive
                  ? "bg-gradient-to-r from-amber-300 to-yellow-500 text-slate-950"
                  : "bg-gradient-to-r from-amber-500 to-orange-600 text-slate-950"
            }`}
          >
            {hud.dishCook >= 100 && hud.phase === "playing" ? "🍜 SERVE DISH! (SPACE)" : "🔥 TOSS WOK (SPACE)"}
          </button>
          <button
            onPointerDown={() => { gameRef.current.keys["KeyD"] = true; }}
            onPointerUp={() => { gameRef.current.keys["KeyD"] = false; }}
            onPointerLeave={() => { gameRef.current.keys["KeyD"] = false; }}
            className="sm:hidden px-4 py-2.5 rounded-xl bg-slate-900/90 active:scale-95 text-slate-200 border border-slate-700 font-bold text-xs shadow-lg select-none"
            aria-label="Steer Right"
          >
            RIGHT ▶
          </button>
        </div>
      </div>

      {/* Start / game over overlay */}
      {isReady && !webglError && hud.phase !== "playing" && (
        <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center z-30 p-4">
          <div className="max-w-md w-full bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-8 text-center text-white shadow-2xl max-h-full overflow-y-auto">
            <div className="text-xs font-bold uppercase tracking-widest text-amber-400 mb-1">Alpine Culinary Physics</div>
            <h1 className="text-3xl font-black tracking-tight mb-3">{hud.phase === "ready" ? "WOK & SKIS" : "WOK EMPTY!"}</h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-5">
              {hud.phase === "ready"
                ? "Carve down the mountain stir-frying in a carbon-steel wok. Toss on the golden sizzle pulse to cook the order, serve dishes for fireworks, grab chilis and fresh ingredients, and launch off moguls for an Aerial Flame Toss!"
                : `You served ${hud.dishesServed} ${hud.dishesServed === 1 ? "dish" : "dishes"}, skied ${hud.distance}m, cleared ${hud.gatesCleared} gates, and scored ${hud.score.toLocaleString()} points.`}
            </p>
            <div className="grid grid-cols-3 gap-2 text-left bg-slate-800/80 p-3 rounded-2xl mb-5 text-xs text-slate-300 border border-slate-700/60">
              <div>
                <div className="font-bold text-white">A / D or ◀ ▶</div>
                <div>Carve (wok banks in!)</div>
              </div>
              <div>
                <div className="font-bold text-white">W / S or ▲ ▼</div>
                <div>Tuck / Brake</div>
              </div>
              <div>
                <div className="font-bold text-amber-400">SPACEBAR</div>
                <div>Toss · Serve at 100%</div>
              </div>
            </div>
            <div className="text-left bg-slate-800/60 p-3 rounded-2xl mb-6 text-[11px] leading-relaxed text-slate-300 border border-slate-700/50">
              <div><span className="text-amber-300 font-bold">Golden pulse</span> on the wok rim = PERFECT TOSS (+20% cooked). Ignore the smoke too long and an ingredient burns.</div>
              <div className="mt-1"><span className="text-red-400 font-bold">Chili</span> = turbo boost. <span className="text-emerald-300 font-bold">Food pickups</span> refill the wok (max 8). Mogul + Space mid-air = <span className="text-amber-300 font-bold">Aerial Flame Toss +1000</span>.</div>
            </div>
            <button
              onClick={startGame}
              aria-label={hud.phase === "ready" ? "Start game" : "Start another run"}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 font-black tracking-wide text-base shadow-lg cursor-pointer transition active:scale-[0.98]"
            >
              {hud.phase === "ready" ? "DROP IN & FIRE THE WOK" : "COOK ANOTHER RUN"}
            </button>
            <div className="mt-3 text-[10px] font-mono text-slate-500">R restarts anytime · sound starts on first click/key</div>
          </div>
        </div>
      )}
    </div>
  );
}
