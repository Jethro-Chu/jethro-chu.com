/**
 * 3D Alpine Environment, Skier Rig, and Three.js Renderer for "Wok This Slope"
 */

import * as THREE from "three";
import { SKI_CONFIG } from "./config.ts";
import { SkiCourse } from "./course.ts";
import { SkierController } from "./skierController.ts";
import { RiceSimulation } from "./ricePhysics.ts";
import type { GamePhase } from "./types.ts";

export class SkiRenderer {
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;

  // Scene elements
  private course: SkiCourse;
  private skier: SkierController;
  private rice: RiceSimulation;
  private treeModels = new Map<number, THREE.Group>();
  private fadedTreeMaterials: Array<{ mesh: THREE.Mesh; original: THREE.Material; faded: THREE.Material }> = [];

  // Skier Rig
  private cameraRig: THREE.Group;
  private panRig: THREE.Group;
  private panMesh: THREE.Mesh;
  private stoveRig: THREE.Group;
  private crashing = false;
  private crashElapsed = 0;
  private crashHitPause = 0;
  private crashVariant: 0 | 1 | 2 = 0;
  private crashSpeedNorm = 1;
  private crashSide = 1;
  private crashPanPosition = new THREE.Vector3();
  private crashStovePosition = new THREE.Vector3();
  private crashPanRotation = new THREE.Euler();
  private crashStoveRotation = new THREE.Euler();
  // Crash-tumble base pose (frozen at impact so the tumble is readable).
  private crashBasePos = new THREE.Vector3();
  private crashBaseRot = new THREE.Euler();
  private crashSlideX = 0;

  // Flying yard-sale gear: skis, poles, goggles, hat. Each piece has its
  // own velocity, spin, gravity, bounce and slide. After the crash the
  // gear is cosmetic (no collision); items past their life are culled.
  private flyingItems: Array<{
    mesh: THREE.Object3D;
    vel: THREE.Vector3;
    ang: THREE.Vector3;
    delay: number;
    bounce: number;
    radius: number;
    resting: boolean;
  }> = [];
  private nearMissFlash = 0;
  private fovKick = 0;
  private burnerFlame: THREE.Mesh;
  private burnerLight: THREE.PointLight;
  private leftHand: THREE.Group;
  private rightHand: THREE.Group;
  private leftSkiTip: THREE.Mesh;
  private rightSkiTip: THREE.Mesh;
  private leftPole: THREE.Mesh;
  private rightPole: THREE.Mesh;
  private gogglesGroup: THREE.Group;
  private hatGroup: THREE.Group;
  private leftSkiHome = { pos: new THREE.Vector3(), rot: new THREE.Euler() };
  private rightSkiHome = { pos: new THREE.Vector3(), rot: new THREE.Euler() };
  private leftPoleHome = { pos: new THREE.Vector3(), rot: new THREE.Euler() };
  private rightPoleHome = { pos: new THREE.Vector3(), rot: new THREE.Euler() };

  // Finish Arena & Plate
  public plateWorldPos: { x: number; y: number; z: number };
  private plateMesh: THREE.Mesh;
  private banquetTable: THREE.Group;

  // Particles
  private snowSprayMesh: THREE.InstancedMesh;
  private steamMesh: THREE.InstancedMesh;
  private smokeMesh: THREE.InstancedMesh;
  private confettiMesh: THREE.InstancedMesh | null = null;

  // Particle data pools
  private snowParticles: Array<{ x: number; y: number; z: number; vx: number; vy: number; vz: number; life: number }> = [];
  private steamParticles: Array<{ x: number; y: number; z: number; vx: number; vy: number; vz: number; life: number; scale: number }> = [];
  private smokeParticles: Array<{ x: number; y: number; z: number; vx: number; vy: number; vz: number; life: number; scale: number }> = [];

  // Reusable dummy objects
  private dummyMatrix: THREE.Matrix4 = new THREE.Matrix4();
  private dummyPos: THREE.Vector3 = new THREE.Vector3();
  private dummyQuat: THREE.Quaternion = new THREE.Quaternion();
  private dummyScale: THREE.Vector3 = new THREE.Vector3();

  constructor(
    container: HTMLElement,
    course: SkiCourse,
    skier: SkierController,
    rice: RiceSimulation
  ) {
    this.course = course;
    this.skier = skier;
    this.rice = rice;

    // 1. Setup Scene, Camera, and Fog
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xd9ebf7);
    this.scene.fog = new THREE.FogExp2(0xd9ebf7, 0.0028);

    const aspect = container.clientWidth / container.clientHeight || 16 / 9;
    this.camera = new THREE.PerspectiveCamera(65, aspect, 0.1, 800);
    // Pull the eye back without moving the pan in the world. Its established
    // position relative to the finish plate remains part of the physics.
    this.camera.position.z = 0.28;

    // 2. Setup WebGLRenderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: "high-performance",
    });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(this.renderer.domElement);

    // 3. Lighting
    const ambientLight = new THREE.HemisphereLight(0xe8f4fc, 0x8fa4b3, 0.75);
    this.scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfffaed, 1.4);
    sunLight.position.set(60, 120, -50);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    sunLight.shadow.camera.near = 10;
    sunLight.shadow.camera.far = 400;
    sunLight.shadow.camera.left = -50;
    sunLight.shadow.camera.right = 50;
    sunLight.shadow.camera.top = 50;
    sunLight.shadow.camera.bottom = -50;
    this.scene.add(sunLight);

    // 4. Build Environment & Course Geometry
    this.buildTerrain();
    this.buildDistantMountains();
    this.buildObstacles();

    // 5. Build Finish Table & Serving Plate
    const finishPos = this.course.getTrackCenter(this.course.tableZ);
    this.plateWorldPos = {
      x: finishPos.x,
      y: finishPos.y + 0.88, // Table surface elevation
      z: this.course.tableZ,
    };
    const { table, plate } = this.buildFinishArena(finishPos.x, finishPos.y, this.course.tableZ);
    this.banquetTable = table;
    this.plateMesh = plate;

    // 6. Build Skier Camera Rig & Wok Rig
    const rigData = this.buildSkierRig();
    this.cameraRig = rigData.cameraRig;
    this.panRig = rigData.panRig;
    this.panMesh = rigData.panMesh;
    this.stoveRig = rigData.stoveRig;
    this.burnerFlame = rigData.burnerFlame;
    this.burnerLight = rigData.burnerLight;
    this.leftHand = rigData.leftHand;
    this.rightHand = rigData.rightHand;
    this.leftSkiTip = rigData.leftSkiTip;
    this.rightSkiTip = rigData.rightSkiTip;
    this.leftPole = rigData.leftPole;
    this.rightPole = rigData.rightPole;
    this.gogglesGroup = rigData.gogglesGroup;
    this.hatGroup = rigData.hatGroup;
    this.leftSkiHome.pos.copy(rigData.leftSkiTip.position);
    this.leftSkiHome.rot.copy(rigData.leftSkiTip.rotation);
    this.rightSkiHome.pos.copy(rigData.rightSkiTip.position);
    this.rightSkiHome.rot.copy(rigData.rightSkiTip.rotation);
    this.leftPoleHome.pos.copy(rigData.leftPole.position);
    this.leftPoleHome.rot.copy(rigData.leftPole.rotation);
    this.rightPoleHome.pos.copy(rigData.rightPole.position);
    this.rightPoleHome.rot.copy(rigData.rightPole.rotation);

    this.scene.add(this.cameraRig);

    // Add retained rice mesh to the pan!
    this.panRig.add(this.rice.retainedMesh);
    // Add spilled rice mesh to world scene
    this.scene.add(this.rice.spilledMesh);

    // 7. Particle Systems (Snow spray, cooking steam, burn smoke)
    const particles = this.buildParticleSystems();
    this.snowSprayMesh = particles.snow;
    this.steamMesh = particles.steam;
    this.smokeMesh = particles.smoke;
    this.scene.add(this.snowSprayMesh);
    this.scene.add(this.steamMesh);
    this.scene.add(this.smokeMesh);
  }

  /**
   * Continuous downhill snow terrain mesh
   */
  private buildTerrain(): void {
    const courseLength = this.course.length + 120;
    const segmentsZ = 180;
    const segmentsX = 24;
    const terrainWidth = 90;

    const geom = new THREE.PlaneGeometry(terrainWidth, courseLength, segmentsX, segmentsZ);
    geom.rotateX(-Math.PI / 2);

    const posAttr = geom.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
      const x = posAttr.getX(i);
      const zNorm = posAttr.getZ(i); // ranges from -courseLength/2 to +courseLength/2
      const z = zNorm + courseLength / 2;

      const track = this.course.getTrackCenter(z);
      const groundY = this.course.getGroundHeight(x + track.x, z);

      posAttr.setX(i, x + track.x);
      posAttr.setY(i, groundY);
      posAttr.setZ(i, z);
    }
    geom.computeVertexNormals();

    const snowMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.95,
      metalness: 0.0,
    });

    const terrainMesh = new THREE.Mesh(geom, snowMat);
    terrainMesh.receiveShadow = true;
    this.scene.add(terrainMesh);
  }

  /**
   * Distant low-poly jagged alpine mountain background
   */
  private buildDistantMountains(): void {
    const mountainMat = new THREE.MeshStandardMaterial({
      color: 0x8ca6bd,
      roughness: 0.95,
      metalness: 0.0,
      flatShading: true,
    });

    const mGroup = new THREE.Group();
    // Two side ranges flanking the course plus a far cap beyond the finish.
    // A full ring around the course put a cone on top of the start gate,
    // which the first-person camera then rendered as a giant blue slab.
    const placements: Array<{ x: number; z: number }> = [];
    for (let i = 0; i < 9; i++) {
      const z = -80 + i * 140 + Math.random() * 60;
      placements.push({ x: -(300 + Math.random() * 140), z });
      placements.push({ x: 300 + Math.random() * 140, z: z + 40 });
    }
    placements.push({ x: -140, z: 1330 }, { x: 60, z: 1420 }, { x: 240, z: 1340 });

    for (const p of placements) {
      const radius = 110 + Math.random() * 80;
      const height = 200 + Math.random() * 150;
      const coneGeom = new THREE.ConeGeometry(radius, height, 5);
      const cone = new THREE.Mesh(coneGeom, mountainMat);
      cone.position.set(p.x, -140 + height / 2, p.z);
      cone.rotation.y = Math.random() * Math.PI;
      mGroup.add(cone);
    }
    this.scene.add(mGroup);
  }

  /**
   * Procedural pine trees and track obstacles
   */
  private buildObstacles(): void {
    // Shared geometries
    const trunkGeom = new THREE.CylinderGeometry(0.25, 0.4, 2.2, 5);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x4a3525, roughness: 0.9 });

    const foliageGeom1 = new THREE.ConeGeometry(1.6, 2.8, 6);
    const foliageGeom2 = new THREE.ConeGeometry(1.25, 2.4, 6);
    const foliageGeom3 = new THREE.ConeGeometry(0.85, 2.0, 6);
    const foliageMat = new THREE.MeshStandardMaterial({ color: 0x1f382b, roughness: 0.8, flatShading: true });

    const rockGeom = new THREE.DodecahedronGeometry(1.0, 1);
    const rockMat = new THREE.MeshStandardMaterial({ color: 0x71797e, roughness: 0.95, flatShading: true });
    const railMat = new THREE.MeshStandardMaterial({ color: 0x07533f, roughness: 0.85 });
    const markerMat = new THREE.MeshStandardMaterial({ color: 0xeaf1ed, roughness: 0.8 });

    for (const obs of this.course.obstacles) {
      if (obs.type === "pine") {
        const tree = new THREE.Group();
        const groundY = this.course.getGroundHeight(obs.lateralOffset, obs.distance);

        const trunk = new THREE.Mesh(trunkGeom, trunkMat);
        trunk.position.y = 1.1;
        trunk.castShadow = true;
        tree.add(trunk);

        const f1 = new THREE.Mesh(foliageGeom1, foliageMat);
        f1.position.y = 2.6;
        f1.castShadow = true;
        tree.add(f1);

        const f2 = new THREE.Mesh(foliageGeom2, foliageMat);
        f2.position.y = 4.2;
        f2.castShadow = true;
        tree.add(f2);

        const f3 = new THREE.Mesh(foliageGeom3, foliageMat);
        f3.position.y = 5.6;
        f3.castShadow = true;
        tree.add(f3);

        tree.position.set(obs.lateralOffset, groundY, obs.distance);
        tree.scale.set(obs.scale, obs.scale, obs.scale);
        tree.rotation.y = obs.rotation;
        this.treeModels.set(obs.id, tree);
        this.scene.add(tree);
      } else if (obs.type === "barrier" && obs.width !== undefined) {
        const groundY = this.course.getGroundHeight(obs.lateralOffset, obs.distance);
        const gate = new THREE.Group();
        // Solid horizontal rail and repeated high-contrast diagonal markers.
        // The collision box uses the same width and 0.6 m depth.
        const rail = new THREE.Mesh(new THREE.BoxGeometry(obs.width, 1.0, 0.6), railMat);
        rail.position.y = 0.8;
        rail.castShadow = true;
        gate.add(rail);
        const markerCount = Math.max(1, Math.floor(obs.width / 1.5));
        const stripeWidth = Math.min(0.28, obs.width / (markerCount * 3));
        const stripeGeom = new THREE.BoxGeometry(stripeWidth, 0.86, 0.015);
        for (let i = 0; i < markerCount; i++) {
          const stripe = new THREE.Mesh(stripeGeom, markerMat);
          stripe.position.set(-obs.width / 2 + (i + 0.5) * obs.width / markerCount, 0.8, -0.31);
          stripe.rotation.z = -0.32;
          gate.add(stripe);
        }
        gate.position.set(obs.lateralOffset, groundY, obs.distance);
        this.scene.add(gate);
      } else if (obs.type === "rock") {
        const groundY = this.course.getGroundHeight(obs.lateralOffset, obs.distance);
        const rock = new THREE.Mesh(rockGeom, rockMat);
        rock.position.set(obs.lateralOffset, groundY + 0.4, obs.distance);
        rock.scale.set(obs.scale * 1.2, obs.scale * 0.7, obs.scale * 1.1);
        rock.rotation.set(obs.rotation, obs.rotation * 0.5, 0);
        rock.castShadow = true;
        this.scene.add(rock);
      } else if (obs.type === "log") {
        const width = obs.width ?? 3;
        const groundY = this.course.getGroundHeight(obs.lateralOffset, obs.distance);
        const log = new THREE.Mesh(new THREE.CylinderGeometry(obs.radius, obs.radius, width, 10), trunkMat);
        log.rotation.z = Math.PI / 2;
        log.position.set(obs.lateralOffset, groundY + obs.radius, obs.distance);
        log.castShadow = true;
        this.scene.add(log);
      }
    }
  }

  /**
   * Finish Line arch and banquet table with porcelain serving plate
   */
  private buildFinishArena(x: number, y: number, z: number): { table: THREE.Group; plate: THREE.Mesh } {
    // 1. Finish Arch at course.finishZ
    const archZ = this.course.finishZ;
    const archTrack = this.course.getTrackCenter(archZ);
    const archGroundY = this.course.getGroundHeight(archTrack.x, archZ);

    const archGroup = new THREE.Group();
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x5a3d28, roughness: 0.8 });
    const bannerMat = new THREE.MeshStandardMaterial({ color: 0xbf2626, roughness: 0.6 });

    // Left post
    const postGeom = new THREE.BoxGeometry(0.6, 7.5, 0.6);
    const leftPost = new THREE.Mesh(postGeom, woodMat);
    leftPost.position.set(archTrack.x - 12, archGroundY + 3.75, archZ);
    archGroup.add(leftPost);

    // Right post
    const rightPost = new THREE.Mesh(postGeom, woodMat);
    rightPost.position.set(archTrack.x + 12, archGroundY + 3.75, archZ);
    archGroup.add(rightPost);

    // Crossbeam
    const beamGeom = new THREE.BoxGeometry(25, 0.7, 0.7);
    const beam = new THREE.Mesh(beamGeom, woodMat);
    beam.position.set(archTrack.x, archGroundY + 7.2, archZ);
    archGroup.add(beam);

    // Finish Banner
    const bannerGeom = new THREE.PlaneGeometry(16, 2.0);
    const banner = new THREE.Mesh(bannerGeom, bannerMat);
    banner.position.set(archTrack.x, archGroundY + 5.8, archZ);
    archGroup.add(banner);

    this.scene.add(archGroup);

    // 2. Banquet Serving Table with Plate
    const tableGroup = new THREE.Group();
    tableGroup.position.set(x, y, z);

    // Wooden banquet table
    const tableTopGeom = new THREE.BoxGeometry(3.2, 0.12, 1.6);
    const tableMat = new THREE.MeshStandardMaterial({ color: 0xf7fafc, roughness: 0.7 }); // White tablecloth
    const tableTop = new THREE.Mesh(tableTopGeom, tableMat);
    tableTop.position.y = 0.82;
    tableTop.castShadow = true;
    tableTop.receiveShadow = true;
    tableGroup.add(tableTop);

    // Table legs
    const legGeom = new THREE.CylinderGeometry(0.06, 0.06, 0.82);
    const legMat = new THREE.MeshStandardMaterial({ color: 0x33261d, roughness: 0.8 });
    const legPositions = [
      [-1.4, 0.41, -0.6],
      [1.4, 0.41, -0.6],
      [-1.4, 0.41, 0.6],
      [1.4, 0.41, 0.6],
    ];
    legPositions.forEach(([lx, ly, lz]) => {
      const leg = new THREE.Mesh(legGeom, legMat);
      leg.position.set(lx, ly, lz);
      tableGroup.add(leg);
    });

    // Grand porcelain serving platter with gold trim
    const plateGeom = new THREE.CylinderGeometry(
      SKI_CONFIG.PLATING.PLATE_RADIUS,
      SKI_CONFIG.PLATING.PLATE_RADIUS * 0.85,
      SKI_CONFIG.PLATING.PLATE_HEIGHT,
      32
    );
    const plateMat = new THREE.MeshStandardMaterial({
      color: 0xfcfbf9,
      roughness: 0.15,
      metalness: 0.1,
    });
    const plate = new THREE.Mesh(plateGeom, plateMat);
    plate.position.set(0, 0.88, 0);
    plate.receiveShadow = true;
    tableGroup.add(plate);

    // Golden rim ring on platter
    const rimGeom = new THREE.TorusGeometry(SKI_CONFIG.PLATING.PLATE_RADIUS, 0.012, 8, 32);
    rimGeom.rotateX(Math.PI / 2);
    const rimMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      metalness: 0.85,
      roughness: 0.25,
    });
    const goldRim = new THREE.Mesh(rimGeom, rimMat);
    goldRim.position.set(0, 0.90, 0);
    tableGroup.add(goldRim);

    this.scene.add(tableGroup);

    return { table: tableGroup, plate };
  }

  /**
   * First-Person Skier Rig: Camera, Gloved Hands, Wok on Mini-Skis with Burner
   */
  private buildSkierRig(): {
    cameraRig: THREE.Group;
    panRig: THREE.Group;
    panMesh: THREE.Mesh;
    stoveRig: THREE.Group;
    burnerFlame: THREE.Mesh;
    burnerLight: THREE.PointLight;
    leftHand: THREE.Group;
    rightHand: THREE.Group;
    leftSkiTip: THREE.Mesh;
    rightSkiTip: THREE.Mesh;
    leftPole: THREE.Mesh;
    rightPole: THREE.Mesh;
    gogglesGroup: THREE.Group;
    hatGroup: THREE.Group;
  } {
    const cameraRig = new THREE.Group();
    cameraRig.add(this.camera);

    // Pan Rig is attached in front of camera
    const panRig = new THREE.Group();
    // Position pan in lower foreground (z = -0.72m, y = -0.38m)
    panRig.position.set(0, -0.38, -0.72);
    cameraRig.add(panRig);

    // Build the Metal Wok/Skillet as a lathed parabolic bowl whose inner
    // surface is exactly the physics floor (y = CURVATURE_A * r^2). The
    // previous straight cone wall diverged from that parabola, so grains
    // rested inside the pan mesh and rendered invisible.
    const lathePoints: THREE.Vector2[] = [];
    for (let i = 0; i <= 14; i++) {
      const r = (i / 14) * SKI_CONFIG.PAN.RADIUS;
      lathePoints.push(new THREE.Vector2(r, SKI_CONFIG.PAN.CURVATURE_A * r * r));
    }
    const wokGeom = new THREE.LatheGeometry(lathePoints, 28);

    const panMetalMat = new THREE.MeshStandardMaterial({
      color: SKI_CONFIG.COLORS.PAN_METAL,
      roughness: 0.35,
      metalness: 0.8,
      side: THREE.DoubleSide,
    });

    const panMesh = new THREE.Mesh(wokGeom, panMetalMat);
    panMesh.castShadow = true;
    panRig.add(panMesh);

    // Rim lip at the top of the parabolic wall (y = a * R^2)
    const rimGeom = new THREE.TorusGeometry(SKI_CONFIG.PAN.RADIUS, 0.008, 8, 28);
    rimGeom.rotateX(Math.PI / 2);
    const rimMat = new THREE.MeshStandardMaterial({
      color: SKI_CONFIG.COLORS.PAN_RIM,
      roughness: 0.25,
      metalness: 0.9,
    });
    const rimMesh = new THREE.Mesh(rimGeom, rimMat);
    rimMesh.position.y = SKI_CONFIG.PAN.CURVATURE_A * SKI_CONFIG.PAN.RADIUS * SKI_CONFIG.PAN.RADIUS;
    panRig.add(rimMesh);

    // Long pan handle extending towards player (+Z)
    const handleStart = new THREE.Vector3(0.17, 0.065, 0.19);
    const handleEnd = new THREE.Vector3(0.37, 0.065, 0.44);
    const handleGeom = new THREE.CylinderGeometry(0.016, 0.018, handleStart.distanceTo(handleEnd), 12);
    const handleMat = new THREE.MeshStandardMaterial({ color: 0x1c1e22, roughness: 0.6 });
    const handleMesh = new THREE.Mesh(handleGeom, handleMat);
    handleMesh.position.copy(handleStart).add(handleEnd).multiplyScalar(0.5);
    handleMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), handleEnd.clone().sub(handleStart).normalize());
    panRig.add(handleMesh);

    // A portable tabletop burner, carried on two little skis. Keeping it in
    // its own group lets the stove and pan fly apart separately in a crash.
    const stoveRig = new THREE.Group();
    panRig.add(stoveRig);
    const stoveBodyMat = new THREE.MeshStandardMaterial({ color: 0x8b9491, roughness: 0.65, metalness: 0.35 });
    const stoveTopMat = new THREE.MeshStandardMaterial({ color: 0x17211f, roughness: 0.75, metalness: 0.25 });
    const stoveBody = new THREE.Mesh(new THREE.BoxGeometry(0.61, 0.12, 0.51), stoveBodyMat);
    stoveBody.position.y = -0.14;
    stoveRig.add(stoveBody);
    const stoveTop = new THREE.Mesh(new THREE.BoxGeometry(0.57, 0.012, 0.47), stoveTopMat);
    stoveTop.position.y = -0.075;
    stoveRig.add(stoveTop);
    const stoveControl = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.026, 0.018, 12), stoveTopMat);
    stoveControl.rotation.x = Math.PI / 2;
    stoveControl.position.set(0.19, -0.14, 0.264);
    stoveRig.add(stoveControl);
    const stoveMark = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.034, 0.006), new THREE.MeshStandardMaterial({ color: 0x0b6e59, roughness: 0.8 }));
    stoveMark.position.set(-0.14, -0.14, 0.258);
    stoveRig.add(stoveMark);

    const miniSkiGeom = new THREE.BoxGeometry(0.045, 0.025, 0.9);
    const miniSkiMat = new THREE.MeshStandardMaterial({ color: 0x165f4d, roughness: 0.6 });

    const leftMiniSki = new THREE.Mesh(miniSkiGeom, miniSkiMat);
    leftMiniSki.position.set(-0.19, -0.215, 0.04);
    stoveRig.add(leftMiniSki);

    const rightMiniSki = new THREE.Mesh(miniSkiGeom, miniSkiMat);
    rightMiniSki.position.set(0.19, -0.215, 0.04);
    stoveRig.add(rightMiniSki);

    // Camping Gas Burner mounted under pan center
    const burnerCanisterGeom = new THREE.CylinderGeometry(0.065, 0.065, 0.05, 16);
    const burnerCanisterMat = new THREE.MeshStandardMaterial({ color: 0x2563eb, metalness: 0.6, roughness: 0.4 }); // Blue gas can
    const burnerCanister = new THREE.Mesh(burnerCanisterGeom, burnerCanisterMat);
    burnerCanister.position.set(0, -0.035, 0);
    stoveRig.add(burnerCanister);

    // Flickering Flame Cone
    const flameGeom = new THREE.ConeGeometry(0.04, 0.045, 10);
    flameGeom.rotateX(Math.PI);
    const flameMat = new THREE.MeshBasicMaterial({
      color: 0x60a5fa, // Electric blue flame core
      transparent: true,
      opacity: 0.85,
    });
    const burnerFlame = new THREE.Mesh(flameGeom, flameMat);
    // Fully below the pan bowl: at -0.005 the cone tip poked through the
    // pan floor and showed as a blue hexagon inside the pan.
    burnerFlame.position.set(0, -0.03, 0);
    stoveRig.add(burnerFlame);

    const burnerLight = new THREE.PointLight(0xf97316, 0.55, 0.6);
    burnerLight.position.set(0, 0.06, 0);
    stoveRig.add(burnerLight);

    // Gloved Hands holding the handle
    const gloveMat = new THREE.MeshStandardMaterial({ color: 0x172c2a, roughness: 0.85 });
    const sleeveMat = new THREE.MeshStandardMaterial({ color: 0x286e60, roughness: 0.9 });

    const makeMitten = (isLeft: boolean) => {
      const g = new THREE.Group();
      // Forearm sleeve
      const sleeveEnd = new THREE.Vector3(isLeft ? -0.28 : 0.28, -0.35, 0.49);
      const sleeveGeom = new THREE.CylinderGeometry(0.055, 0.075, sleeveEnd.length(), 10);
      const sleeve = new THREE.Mesh(sleeveGeom, sleeveMat);
      sleeve.position.copy(sleeveEnd).multiplyScalar(0.5);
      sleeve.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), sleeveEnd.clone().normalize());
      g.add(sleeve);

      // Mitten hand
      const handGeom = new THREE.SphereGeometry(0.055, 10, 8);
      handGeom.scale(1, 0.8, 1.3);
      const hand = new THREE.Mesh(handGeom, gloveMat);
      hand.position.set(0, 0, 0);
      g.add(hand);

      return g;
    };

    const leftHand = makeMitten(true);
    leftHand.position.set(-0.29, -0.48, -0.47);
    cameraRig.add(leftHand);

    const rightHand = makeMitten(false);
    rightHand.position.set(0.37, -0.315, -0.28);
    cameraRig.add(rightHand);

    // Full-size skis cutting through snow on the ground (visible in bottom peripheral)
    const skiTipGeom = new THREE.BoxGeometry(0.12, 0.03, 1.4);
    const skiMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.4 });

    const leftSkiTip = new THREE.Mesh(skiTipGeom, skiMat);
    leftSkiTip.position.set(-0.35, -1.3, -0.7);
    leftSkiTip.rotation.x = -0.18;
    cameraRig.add(leftSkiTip);

    const rightSkiTip = new THREE.Mesh(skiTipGeom, skiMat);
    rightSkiTip.position.set(0.35, -1.3, -0.7);
    rightSkiTip.rotation.x = -0.18;
    cameraRig.add(rightSkiTip);

    // Poles: thin shafts with baskets, angled from the hands toward the
    // snow. They ride in view during skiing and become yard-sale debris
    // on a crash, each on its own flight path.
    const poleGeom = new THREE.CylinderGeometry(0.016, 0.02, 1.15, 8);
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x3a4149, roughness: 0.5, metalness: 0.4 });
    const basketGeom = new THREE.CylinderGeometry(0.055, 0.055, 0.02, 10);
    const basketMat = new THREE.MeshStandardMaterial({ color: 0xff8a1f, roughness: 0.7 });
    const gripGeom = new THREE.CylinderGeometry(0.022, 0.022, 0.12, 8);
    const gripMat = new THREE.MeshStandardMaterial({ color: 0x172c2a, roughness: 0.85 });
    const makePole = (isLeft: boolean): THREE.Mesh => {
      const pole = new THREE.Mesh(poleGeom, poleMat);
      const basket = new THREE.Mesh(basketGeom, basketMat);
      basket.position.y = -0.32;
      pole.add(basket);
      const grip = new THREE.Mesh(gripGeom, gripMat);
      grip.position.y = 0.5;
      pole.add(grip);
      pole.castShadow = true;
      pole.position.set(isLeft ? -0.42 : 0.42, -0.62, -0.45);
      pole.rotation.set(0.35, 0, isLeft ? 0.28 : -0.28);
      cameraRig.add(pole);
      return pole;
    };
    const leftPole = makePole(true);
    const rightPole = makePole(false);

    // Goggles + beanie: worn on the head, so they stay off-frame while
    // skiing but launch from the eyes on impact. Kept hidden until a
    // crash so they never block the view.
    const gogglesGroup = new THREE.Group();
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x172c2a, roughness: 0.5 });
    const lensMat = new THREE.MeshStandardMaterial({ color: 0x5fd8be, roughness: 0.15, metalness: 0.3 });
    const lensL = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.07, 0.02), lensMat);
    lensL.position.set(-0.08, 0, 0);
    gogglesGroup.add(lensL);
    const lensR = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.07, 0.02), lensMat);
    lensR.position.set(0.08, 0, 0);
    gogglesGroup.add(lensR);
    const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.05, 0.03), frameMat);
    gogglesGroup.add(bridge);
    const strap = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.025, 0.02), frameMat);
    strap.position.z = -0.02;
    gogglesGroup.add(strap);
    gogglesGroup.position.set(0.08, 0.12, -0.45);
    gogglesGroup.visible = false;
    cameraRig.add(gogglesGroup);

    const hatGroup = new THREE.Group();
    const hatMat = new THREE.MeshStandardMaterial({ color: 0xff8a1f, roughness: 0.9, side: THREE.DoubleSide });
    const dome = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), hatMat);
    hatGroup.add(dome);
    const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.045, 12), hatMat);
    brim.position.y = -0.01;
    hatGroup.add(brim);
    const pom = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 8), new THREE.MeshStandardMaterial({ color: 0xfcfbf9, roughness: 0.95 }));
    pom.position.y = 0.14;
    hatGroup.add(pom);
    hatGroup.position.set(-0.06, 0.24, -0.55);
    hatGroup.visible = false;
    cameraRig.add(hatGroup);

    return {
      cameraRig,
      panRig,
      panMesh,
      stoveRig,
      burnerFlame,
      burnerLight,
      leftHand,
      rightHand,
      leftSkiTip,
      rightSkiTip,
      leftPole,
      rightPole,
      gogglesGroup,
      hatGroup,
    };
  }

  /**
   * Instanced particle systems for snow spray, cooking steam, and burn smoke
   */
  private buildParticleSystems(): {
    snow: THREE.InstancedMesh;
    steam: THREE.InstancedMesh;
    smoke: THREE.InstancedMesh;
  } {
    const sphereGeom = new THREE.SphereGeometry(0.03, 6, 6);

    // Snow spray particles
    // Pale blue-grey reads against the pure-white slope so carve spray and
    // the crash burst stay visible without going dark.
    const snowMat = new THREE.MeshBasicMaterial({ color: 0xc7e0f5, transparent: true, opacity: 0.9 });
    const snow = new THREE.InstancedMesh(sphereGeom, snowMat, 80);

    // Steam particles (wispy white/cream)
    const steamMat = new THREE.MeshBasicMaterial({ color: 0xf0fdf4, transparent: true, opacity: 0.4 });
    const steam = new THREE.InstancedMesh(sphereGeom, steamMat, 60);

    // Smoke particles (dark grey / charred)
    const smokeMat = new THREE.MeshBasicMaterial({ color: 0x27272a, transparent: true, opacity: 0.65 });
    const smoke = new THREE.InstancedMesh(sphereGeom, smokeMat, 60);

    // World-space particles streak along the whole course; the default
    // bounds (origin) would frustum-cull them once the skier passes it.
    snow.frustumCulled = false;
    steam.frustumCulled = false;
    smoke.frustumCulled = false;

    // Hide initially
    for (let i = 0; i < 80; i++) {
      this.dummyMatrix.makeScale(0, 0, 0);
      snow.setMatrixAt(i, this.dummyMatrix);
      if (i < 60) {
        steam.setMatrixAt(i, this.dummyMatrix);
        smoke.setMatrixAt(i, this.dummyMatrix);
      }
    }
    snow.instanceMatrix.needsUpdate = true;
    steam.instanceMatrix.needsUpdate = true;
    smoke.instanceMatrix.needsUpdate = true;

    return { snow, steam, smoke };
  }

  private pickCrashVariant(): 0 | 1 | 2 {
    const impact = this.skier.crashImpact;
    if (!impact) return 0;
    // Sideways hits spin; head-on hits faceplant; logs cartwheel. The
    // obstacle id breaks ties so repeat crashes at the same spot vary.
    if (impact.lateralRatio > 0.32) return 1;
    if (impact.obstacle === "log") return 2;
    if (impact.obstacleId % 3 === 1) return 2;
    if (impact.obstacleId % 3 === 2) return 1;
    return 0;
  }

  /**
   * Yard sale on impact: hit pause, snow burst, and every piece of gear
   * (pan, stove, both skis, both poles, goggles, beanie) leaves on its
   * own flight path. The skier tumbles through one of three variants.
   * Gear flies in world space so it stays put while the camera cartwheels.
   */
  public beginCrash(): void {
    if (this.crashing) return;
    this.crashing = true;
    this.crashElapsed = 0;
    const reduced = this.skier.reducedCameraShake;
    this.crashHitPause = reduced
      ? SKI_CONFIG.CRASH.HIT_PAUSE_REDUCED_SEC
      : SKI_CONFIG.CRASH.HIT_PAUSE_SEC;
    this.crashSide = this.skier.crashImpact?.side || 1;
    this.crashVariant = this.pickCrashVariant();
    const impactSpeed = this.skier.crashImpact?.speed ?? this.skier.state.speed;
    const impactLateral = this.skier.crashImpact?.lateralSpeed ?? 0;
    this.crashSpeedNorm = Math.max(0.55, Math.min(1.45, impactSpeed / 14));
    // Camera tumble starts from the exact impact pose, then slides in the
    // direction of the hit so side impacts visibly drag sideways.
    this.crashBasePos.copy(this.cameraRig.position);
    this.crashBaseRot.copy(this.cameraRig.rotation);
    this.crashSlideX = impactLateral * 0.09 * this.crashSpeedNorm;
    // At impact the camera can be inside a tree's canopy. Fade only that
    // tree so the flying pan and rice remain visible through the branches.
    if (this.skier.crashImpact?.obstacle === "pine") {
      this.treeModels.get(this.skier.crashImpact.obstacleId)?.traverse((object) => {
        if (!(object instanceof THREE.Mesh) || Array.isArray(object.material)) return;
        const original = object.material;
        const faded = original.clone();
        faded.transparent = true;
        faded.opacity = 0.18;
        faded.depthWrite = false;
        object.material = faded;
        this.fadedTreeMaterials.push({ mesh: object, original, faded });
      });
    }
    this.panRig.updateWorldMatrix(true, true);
    this.rice.scatterOnCrash(this.panRig.matrixWorld, {
      x: impactLateral,
      y: 0,
      z: impactSpeed,
    });
    this.cameraRig.attach(this.stoveRig);
    this.crashPanPosition.copy(this.panRig.position);
    this.crashStovePosition.copy(this.stoveRig.position);
    this.crashPanRotation.copy(this.panRig.rotation);
    this.crashStoveRotation.copy(this.stoveRig.rotation);

    // Freeze the impact pose for the hit pause, then release the gear.
    this.launchFlyingGear(impactSpeed, impactLateral);
    this.burstSnow(SKI_CONFIG.CRASH.SNOW_BURST_COUNT);
    this.nearMissFlash = 0;
    this.fovKick = 0;
  }

  private launchFlyingGear(impactSpeed: number, impactLateral: number): void {
    this.flyingItems = [];
    const side = this.crashSide;
    const k = this.crashSpeedNorm;
    const spin = this.crashVariant === 1 ? 1 : -1;

    // Detach the rig-mounted pieces into the world (keeps their world pose).
    this.scene.attach(this.leftSkiTip);
    this.scene.attach(this.rightSkiTip);
    this.scene.attach(this.leftPole);
    this.scene.attach(this.rightPole);
    // Head gear was parented to the camera rig for positioning; detach it too.
    // Delayed pieces stay hidden until their launch beat (stepFlyingGear),
    // including through the hit pause, so they never freeze huge in view.
    this.scene.attach(this.gogglesGroup);
    this.scene.attach(this.hatGroup);
    this.gogglesGroup.visible = false;
    this.hatGroup.visible = false;
    this.leftHand.visible = true;
    this.rightHand.visible = true;

    // Each piece: position (from its mount point), velocity (scaled by
    // impact speed + sideways component), spin, delay (comedic timing: a
    // stray item lands late), bounce and rest size.
    const specs: Array<{ mesh: THREE.Object3D; vx: number; vy: number; vz: number; ax: number; ay: number; az: number; delay: number; bounce: number; radius: number }> = [
      // Left ski splits away to the left, slightly delayed.
      { mesh: this.leftSkiTip, vx: -3.2 * k + impactLateral * 0.25, vy: 4.4 * k, vz: 1.2 * k + impactSpeed * 0.18, ax: 6, ay: spin * 4, az: side * 5, delay: 0, bounce: 0.42, radius: 0.05 },
      // Right ski pops late — the stray that lands a beat after impact.
      { mesh: this.rightSkiTip, vx: 2.4 * k + impactLateral * 0.2, vy: 3.6 * k, vz: 0.8 * k + impactSpeed * 0.14, ax: -5, ay: -spin * 3, az: -side * 4, delay: 0.3, bounce: 0.42, radius: 0.05 },
      // Left pole shoots up and over.
      { mesh: this.leftPole, vx: -2.2 * k, vy: 5.2 * k, vz: 1.6 * k, ax: 3, ay: 5, az: -side * 6, delay: 0.05, bounce: 0.3, radius: 0.08 },
      // Right pole goes wide and low, bouncing past.
      { mesh: this.rightPole, vx: 3.0 * k + impactLateral * 0.3, vy: 3.0 * k, vz: 1.0 * k + impactSpeed * 0.1, ax: -4, ay: -3, az: side * 5, delay: 0.12, bounce: 0.38, radius: 0.08 },
      // Goggles fly off the face forward and high — they land last.
      { mesh: this.gogglesGroup, vx: impactLateral * 0.3, vy: 3.4 * k, vz: (2.2 + impactSpeed * 0.22) * k, ax: 7, ay: spin * 5, az: 3, delay: 0.42, bounce: 0.35, radius: 0.06 },
      // Beanie pops straight up and flutters down behind.
      { mesh: this.hatGroup, vx: -impactLateral * 0.2 + side * 0.8 * k, vy: 4.8 * k, vz: 0.6 * k - impactSpeed * 0.08, ax: 5, ay: -2, az: -side * 3, delay: 0.18, bounce: 0.25, radius: 0.1 },
    ];
    for (const s of specs) {
      if (this.flyingItems.length >= SKI_CONFIG.CRASH.MAX_FLYING_ITEMS) break;
      s.mesh.visible = s.delay === 0;
      this.flyingItems.push({
        mesh: s.mesh,
        vel: new THREE.Vector3(s.vx, s.vy, s.vz),
        ang: new THREE.Vector3(s.ax, s.ay, s.az),
        delay: s.delay,
        bounce: s.bounce,
        radius: s.radius,
        resting: false,
      });
    }
  }

  private burstSnow(count: number): void {
    const ox = this.skier.state.worldPos.x;
    const oy = this.skier.state.worldPos.y;
    const oz = this.skier.state.worldPos.z;
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = 0.4 + Math.random() * 2.6;
      this.snowParticles.push({
        x: ox + Math.cos(a) * 0.4,
        y: oy + 0.2 + Math.random() * 0.6,
        z: oz + 0.6 + Math.random() * 1.2,
        vx: Math.cos(a) * r,
        vy: 1.2 + Math.random() * 3.2,
        vz: Math.sin(a) * r * 0.5 + Math.random() * 1.5,
        life: 0.5 + Math.random() * 0.5,
      });
    }
    this.trimParticles();
  }

  private trimParticles(): void {
    const max = SKI_CONFIG.PARTICLES;
    if (this.snowParticles.length > max.SNOW_MAX) {
      this.snowParticles.splice(0, this.snowParticles.length - max.SNOW_MAX);
    }
    if (this.steamParticles.length > max.STEAM_MAX) {
      this.steamParticles.splice(0, this.steamParticles.length - max.STEAM_MAX);
    }
    if (this.smokeParticles.length > max.SMOKE_MAX) {
      this.smokeParticles.splice(0, this.smokeParticles.length - max.SMOKE_MAX);
    }
  }

  public resetCrash(): void {
    this.restoreCrashedTree();
    this.crashing = false;
    this.crashElapsed = 0;
    this.crashHitPause = 0;
    this.nearMissFlash = 0;
    this.fovKick = 0;
    this.flyingItems = [];
    this.cameraRig.remove(this.stoveRig);
    this.panRig.add(this.stoveRig);
    this.panRig.position.set(0, -0.38, -0.72);
    this.panRig.rotation.set(0, 0, 0);
    this.stoveRig.position.set(0, 0, 0);
    this.stoveRig.rotation.set(0, 0, 0);
    // Return every flying piece to its rig mount.
    const mounts: Array<{ mesh: THREE.Object3D; pos: THREE.Vector3; rot: THREE.Euler }> = [
      { mesh: this.leftSkiTip, pos: this.leftSkiHome.pos, rot: this.leftSkiHome.rot },
      { mesh: this.rightSkiTip, pos: this.rightSkiHome.pos, rot: this.rightSkiHome.rot },
      { mesh: this.leftPole, pos: this.leftPoleHome.pos, rot: this.leftPoleHome.rot },
      { mesh: this.rightPole, pos: this.rightPoleHome.pos, rot: this.rightPoleHome.rot },
    ];
    for (const m of mounts) {
      this.cameraRig.add(m.mesh);
      m.mesh.position.copy(m.pos);
      m.mesh.rotation.copy(m.rot);
      m.mesh.visible = true;
    }
    this.cameraRig.add(this.gogglesGroup);
    this.gogglesGroup.position.set(0.08, 0.12, -0.45);
    this.gogglesGroup.rotation.set(0, 0, 0);
    this.gogglesGroup.visible = false;
    this.cameraRig.add(this.hatGroup);
    this.hatGroup.position.set(-0.06, 0.24, -0.55);
    this.hatGroup.rotation.set(0, 0, 0);
    this.hatGroup.visible = false;
    this.leftHand.visible = true;
    this.rightHand.visible = true;
    // Fully clear particles so repeated crashes stay smooth.
    this.snowParticles = [];
    this.steamParticles = [];
    this.smokeParticles = [];
    // Camera back to the start-gate framing.
    this.camera.fov = 65;
    this.camera.updateProjectionMatrix();
  }

  private restoreCrashedTree(): void {
    for (const { mesh, original, faded } of this.fadedTreeMaterials) {
      mesh.material = original;
      faded.dispose();
    }
    this.fadedTreeMaterials = [];
  }

  /**
   * Main render tick
   */
  public render(dt: number, phase: GamePhase): void {
    const skierState = this.skier.state;
    const panOrientation = this.skier.panOrientation;
    const reduced = this.skier.reducedCameraShake;
    const isCrash = phase === "crashing" && this.crashing;

    // Hit pause: freeze the crash clock for a few frames so the impact
    // reads before the tumble starts. Reduced motion shortens it.
    let simDt = dt;
    if (isCrash && this.crashHitPause > 0) {
      this.crashHitPause = Math.max(0, this.crashHitPause - dt);
      simDt = 0;
    }
    if (isCrash) {
      this.crashElapsed += simDt;
      this.skier.cameraShakeIntensity = Math.max(0, this.skier.cameraShakeIntensity - simDt * 2.2);
    }

    // Near-miss reward: brief FOV kick + snow puff (visual only).
    if (this.skier.nearMissIntensity > 0.9 && phase === "skiing") {
      this.fovKick = reduced ? 0 : 2.2;
      this.nearMissFlash = 1;
      this.burstSmallSpray(6);
      this.skier.nearMissIntensity = 0.6;
    }
    this.nearMissFlash = Math.max(0, this.nearMissFlash - dt * 1.6);
    this.fovKick = Math.max(0, this.fovKick - dt * 6);
    const targetFov = 65 + this.fovKick;
    if (Math.abs(this.camera.fov - targetFov) > 0.05) {
      this.camera.fov = targetFov;
      this.camera.updateProjectionMatrix();
    }

    // 1. Position Camera Rig at Skier World Position (or tumble pose)
    const easeOut = (x: number): number => 1 - Math.pow(1 - Math.min(1, x), 3);
    const easeInOut = (x: number): number => x * x * (3 - 2 * x);
    if (isCrash) {
      const total = SKI_CONFIG.CRASH.SEQUENCE_SEC;
      const p = Math.min(1, this.crashElapsed / total);
      const amp = reduced ? 0.45 : 1;
      if (this.crashVariant === 0) {
        // Faceplant: nose-dive pitch, drop to the snow, slight roll.
        const e = easeOut(p * 1.6);
        this.cameraRig.position.set(
          this.crashBasePos.x + this.crashSlideX * e,
          this.crashBasePos.y - 1.15 * amp * e + Math.sin(p * Math.PI * 2) * 0.02,
          this.crashBasePos.z + 0.5 * e
        );
        this.cameraRig.rotation.order = "YXZ";
        this.cameraRig.rotation.set(
          this.crashBaseRot.x - 0.85 * amp * e,
          Math.PI + this.crashSide * 0.25 * e,
          this.crashBaseRot.z + this.crashSide * 0.5 * amp * e
        );
      } else if (this.crashVariant === 1) {
        // Side spin: full barrel roll sideways, lateral slide, ends on side.
        const e = easeInOut(p);
        this.cameraRig.position.set(
          this.crashBasePos.x + this.crashSlideX * 1.6 * e + this.crashSide * 0.4 * e,
          this.crashBasePos.y - 0.8 * amp * e,
          this.crashBasePos.z + 0.3 * e
        );
        this.cameraRig.rotation.order = "YXZ";
        this.cameraRig.rotation.set(
          this.crashBaseRot.x - 0.15 * e,
          Math.PI,
          this.crashBaseRot.z + this.crashSide * e * Math.PI * 2 * amp
        );
      } else {
        // Cartwheel / upside-down: pop up, flip over, land inverted.
        const e = easeInOut(p);
        const pop = Math.sin(Math.min(1, p * 1.4) * Math.PI);
        this.cameraRig.position.set(
          this.crashBasePos.x + this.crashSlideX * e,
          this.crashBasePos.y + 0.55 * amp * pop - 1.05 * amp * e,
          this.crashBasePos.z + 0.6 * e
        );
        this.cameraRig.rotation.order = "YXZ";
        this.cameraRig.rotation.set(
          this.crashBaseRot.x + 0.6 * amp * Math.sin(p * Math.PI * 2) - 0.5 * e,
          Math.PI + this.crashSide * 0.4 * e,
          this.crashBaseRot.z + this.crashSide * Math.PI * 0.95 * amp * e
        );
      }
      // Hands flail out of frame during the tumble.
      this.leftHand.position.set(-0.55, -0.25, -0.4);
      this.rightHand.position.set(0.55, -0.25, -0.3);
    } else {
      this.cameraRig.position.set(
        skierState.worldPos.x,
        skierState.worldPos.y + 1.55,
        skierState.worldPos.z
      );
      // Camera rotation: the course travels toward +Z, but a Three.js camera
      // looks down its local -Z, so the rig yaws PI to face downhill. Order
      // YXZ applies that yaw before pitch/banking so the signs stay intuitive:
      // negative X pitches the view down the slope.
      this.cameraRig.rotation.order = "YXZ";
      let shakeX = 0;
      let shakeY = 0;
      let shakeZ = 0;
      const shakeScale = reduced ? SKI_CONFIG.CRASH.SHAKE_REDUCED_AMPLITUDE : SKI_CONFIG.CRASH.SHAKE_AMPLITUDE;
      if (this.skier.cameraShakeIntensity > 0) {
        const intensity = this.skier.cameraShakeIntensity * shakeScale;
        shakeX = (Math.random() - 0.5) * intensity;
        shakeY = (Math.random() - 0.5) * intensity;
        shakeZ = (Math.random() - 0.5) * intensity;
      }
      this.cameraRig.rotation.set(
        -skierState.slopePitch - 0.04 + shakeX,
        Math.PI + shakeY,
        -skierState.steerAngle + shakeZ
      );
    }

    // 2. Update Pan Rig Transformation relative to camera
    // Pitch (forward/back) and Roll (left/right) from mouse input
    // Plus toss animation vertical pop
    const tossY = panOrientation.tossProgress * 0.14;
    const tossPitch = -panOrientation.tossProgress * 0.15; // slight nose up when tossed

    if (isCrash) {
      const t = this.crashElapsed;
      this.panRig.position.set(
        this.crashPanPosition.x + this.crashSide * 0.44 * t * (0.7 + this.crashSpeedNorm * 0.5),
        this.crashPanPosition.y + 1.05 * t - 0.8 * t * t,
        this.crashPanPosition.z - 0.36 * t,
      );
      this.panRig.rotation.set(this.crashPanRotation.x + 3 * t, this.crashPanRotation.y + 2.2 * t, this.crashPanRotation.z + this.crashSide * 2.5 * t);
      this.stoveRig.position.set(
        this.crashStovePosition.x - this.crashSide * 0.52 * t * (0.7 + this.crashSpeedNorm * 0.5),
        this.crashStovePosition.y + 0.8 * t - 0.9 * t * t,
        this.crashStovePosition.z - 0.22 * t,
      );
      this.stoveRig.rotation.set(this.crashStoveRotation.x - 2.4 * t, this.crashStoveRotation.y - 1.6 * t, this.crashStoveRotation.z - this.crashSide * 2 * t);
    } else if (!this.crashing) {
      this.panRig.position.set(0, -0.38 + tossY, -0.72);
      this.panRig.rotation.set(panOrientation.pitch + tossPitch, 0, panOrientation.roll);
    }

    // Mini ski flutter & hand follow (hands pinned during the tumble)
    if (!isCrash) {
      const recoil = phase === "crashing" ? Math.min(0.15, this.crashElapsed * 0.3) : 0;
      this.leftHand.position.x = -0.29 + panOrientation.roll * 0.15 - recoil;
      this.rightHand.position.x = 0.37 + panOrientation.roll * 0.15 + recoil;
      this.leftHand.position.y = -0.48 + tossY * 0.7 - recoil;
      this.rightHand.position.y = -0.315 + tossY * 0.7 - recoil;
    }

    // Burner flame flicker
    const flicker = 0.85 + Math.random() * 0.35;
    this.burnerFlame.scale.set(flicker, flicker, flicker);
    this.burnerLight.intensity = 0.55 * flicker;

    // Flying yard-sale gear: gravity, bounce and slide per piece.
    if (isCrash) this.stepFlyingGear(simDt);

    // 3. Step Rice Simulation only while a run is live. On the title,
    // countdown, pause, and results screens the pan must stay frozen:
    // rice that cooks or spills before the run starts breaks the brief's
    // tuning (and showed up as phantom doneness on the title screen).
    // Pass pan's world transform matrix so spilled grains inherit exact world velocity & origin!
    this.panRig.updateMatrixWorld(true);
    const panWorldMatrix = this.panRig.matrixWorld;

    const isLiveRun = phase === "skiing" || phase === "plating";
    const isPlating = phase === "plating";
    if (isLiveRun) {
      this.rice.step(
        dt,
        panOrientation.pitch,
        panOrientation.roll,
        this.skier.lateralInertia,
        this.skier.verticalBumpImpulse,
        panWorldMatrix,
        isPlating,
        this.plateWorldPos,
        // The pan travels with the skier: forward down the course (+Z)
        // plus lateral carving velocity. Spilled grains inherit it.
        {
          x: this.skier.state.lateralSpeed,
          y: 0,
          z: this.skier.state.speed,
        }
      );

      // 4. Update Particle Systems
      this.updateParticles(dt, phase);
    } else if (isCrash) {
      this.rice.stepCrash(simDt);
      this.updateParticles(simDt, phase);
    }

    // 5. Render Scene
    this.renderer.render(this.scene, this.camera);
  }

  /** Small snow puff for near-miss rewards and carve bursts. */
  private burstSmallSpray(count: number): void {
    const ox = this.skier.state.worldPos.x;
    const oy = this.skier.state.worldPos.y;
    const oz = this.skier.state.worldPos.z;
    for (let i = 0; i < count; i++) {
      this.snowParticles.push({
        x: ox + (Math.random() - 0.5) * 0.6,
        y: oy + 0.15,
        z: oz + (Math.random() - 0.5) * 0.6,
        vx: (Math.random() - 0.5) * 2.0,
        vy: 0.8 + Math.random() * 1.4,
        vz: -1 - Math.random() * 1.5,
        life: 0.35 + Math.random() * 0.3,
      });
    }
    this.trimParticles();
  }

  /**
   * Step each flying piece: gravity, ground bounce, friction slide, spin
   * decay. Delayed pieces pop in late for comedic timing. Resting pieces
   * stop updating; anything too far away is culled so the draw stays cheap.
   */
  private stepFlyingGear(dt: number): void {
    if (dt <= 0) return;
    const g = SKI_CONFIG.CRASH.GRAVITY;
    const camX = this.cameraRig.position.x;
    const camZ = this.cameraRig.position.z;
    for (const item of this.flyingItems) {
      if (this.crashElapsed < item.delay) {
        item.mesh.visible = false; // stray pops in only on its launch beat
        continue;
      }
      if (item.resting) continue;
      item.mesh.visible = true;
      item.vel.y -= g * dt;
      item.mesh.position.addScaledVector(item.vel, dt);
      item.mesh.rotation.x += item.ang.x * dt;
      item.mesh.rotation.y += item.ang.y * dt;
      item.mesh.rotation.z += item.ang.z * dt;
      const groundY = this.course.getGroundHeight(item.mesh.position.x, item.mesh.position.z) + item.radius;
      if (item.mesh.position.y <= groundY) {
        item.mesh.position.y = groundY;
        if (Math.abs(item.vel.y) > 0.9) {
          item.vel.y = -item.vel.y * item.bounce;
          item.vel.x *= 0.72;
          item.vel.z *= 0.72;
          item.ang.multiplyScalar(0.62);
          // Small dust puff on each bounce.
          this.snowParticles.push({
            x: item.mesh.position.x,
            y: groundY + 0.05,
            z: item.mesh.position.z,
            vx: (Math.random() - 0.5) * 1.2,
            vy: 0.5 + Math.random() * 0.6,
            vz: (Math.random() - 0.5) * 1.2,
            life: 0.3,
          });
          this.trimParticles();
        } else {
          item.vel.y = 0;
          const slide = Math.max(0, 1 - 4.2 * dt);
          item.vel.x *= slide;
          item.vel.z *= slide;
          item.ang.multiplyScalar(Math.max(0, 1 - 3.0 * dt));
          if (item.vel.length() < 0.25 && item.ang.length() < 0.6) {
            item.resting = true;
            item.vel.set(0, 0, 0);
            item.ang.set(0, 0, 0);
          }
        }
      }
      // Cull far-away debris (cosmetic only).
      const dx = item.mesh.position.x - camX;
      const dz = item.mesh.position.z - camZ;
      if (dx * dx + dz * dz > SKI_CONFIG.PARTICLES.CULL_DISTANCE * SKI_CONFIG.PARTICLES.CULL_DISTANCE) {
        item.resting = true;
        item.mesh.visible = false;
      }
    }
  }

  /**
   * Spawn and update snow spray, cooking steam, and burn smoke
   */
  private updateParticles(dt: number, phase: GamePhase): void {
    // 1. Snow Spray from skis — restrained while cruising, stronger while
    // carving hard (spray kicks to the outside of the turn).
    if (phase === "skiing" && this.skier.state.speed > 5) {
      const carving = Math.abs(this.skier.state.lateralSpeed) > 1.5;
      const prob = carving ? 0.95 : 0.5;
      if (Math.random() < prob) {
        const carveDir = this.skier.state.lateralSpeed > 0 ? 1 : -1;
        // Spray must land inside the view cone: spawned at the feet it sits
        // ~65 deg below the view axis (off-frame), so kick it ~1 m ahead and
        // downhill-fast to arc through the lower frame.
        this.snowParticles.push({
          x: this.skier.state.worldPos.x + carveDir * -0.5,
          y: this.skier.state.worldPos.y + 0.25,
          z: this.skier.state.worldPos.z + 0.9,
          vx: -carveDir * (1.5 + Math.random() * 1.8),
          vy: 1.6 + Math.random() * 1.0,
          vz: this.skier.state.speed * 0.55,
          life: 0.5,
        });
        if (carving && Math.random() < 0.55) {
          this.snowParticles.push({
            x: this.skier.state.worldPos.x + (Math.random() - 0.5) * 0.6,
            y: this.skier.state.worldPos.y + 0.2,
            z: this.skier.state.worldPos.z + 0.6,
            vx: -carveDir * (1.8 + Math.random() * 1.6),
            vy: 1.9 + Math.random() * 1.0,
            vz: this.skier.state.speed * 0.75,
            life: 0.4,
          });
        }
      }
    }
    this.trimParticles();

    // 2. Steam & Smoke from Cooking Pan
    if (this.rice.retainedCount > 0 && phase !== "ready") {
      this.panRig.getWorldPosition(this.dummyPos);

      // Steam when cooking
      if (this.rice.activeCookingCount > 10 && Math.random() < 0.35) {
        this.steamParticles.push({
          x: this.dummyPos.x + (Math.random() - 0.5) * 0.18,
          y: this.dummyPos.y + 0.08,
          z: this.dummyPos.z + (Math.random() - 0.5) * 0.18,
          vx: (Math.random() - 0.5) * 0.1,
          vy: 0.5 + Math.random() * 0.4,
          vz: (Math.random() - 0.5) * 0.1,
          life: 0.9,
          scale: 0.05,
        });
      }

      // Dark acrid smoke when burn risk is elevated
      if (this.rice.avgBurnRisk > 0.08 && Math.random() < this.rice.avgBurnRisk * 1.5) {
        this.smokeParticles.push({
          x: this.dummyPos.x + (Math.random() - 0.5) * 0.2,
          y: this.dummyPos.y + 0.08,
          z: this.dummyPos.z + (Math.random() - 0.5) * 0.2,
          vx: (Math.random() - 0.5) * 0.15,
          vy: 0.7 + Math.random() * 0.6,
          vz: (Math.random() - 0.5) * 0.15,
          life: 1.2,
          scale: 0.08,
        });
      }
    }
    this.trimParticles();

    // Update Snow Particles (+ cull offscreen / far debris)
    const cullSq = SKI_CONFIG.PARTICLES.CULL_DISTANCE * SKI_CONFIG.PARTICLES.CULL_DISTANCE;
    const camX = this.cameraRig.position.x;
    const camZ = this.cameraRig.position.z;
    for (let i = this.snowParticles.length - 1; i >= 0; i--) {
      const p = this.snowParticles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.snowParticles.splice(i, 1);
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.z += p.vz * dt;
      p.vy -= 4.0 * dt;
      const dx = p.x - camX;
      const dz = p.z - camZ;
      if (dx * dx + dz * dz > cullSq || p.z < camZ - 6) {
        this.snowParticles.splice(i, 1);
      }
    }

    // Update Steam Particles
    for (let i = this.steamParticles.length - 1; i >= 0; i--) {
      const p = this.steamParticles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.steamParticles.splice(i, 1);
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.z += p.vz * dt;
      p.scale += dt * 0.15;
      const dx = p.x - camX;
      const dz = p.z - camZ;
      if (dx * dx + dz * dz > cullSq) this.steamParticles.splice(i, 1);
    }

    // Update Smoke Particles
    for (let i = this.smokeParticles.length - 1; i >= 0; i--) {
      const p = this.smokeParticles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.smokeParticles.splice(i, 1);
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.z += p.vz * dt;
      p.scale += dt * 0.22;
      const dx = p.x - camX;
      const dz = p.z - camZ;
      if (dx * dx + dz * dz > cullSq) this.smokeParticles.splice(i, 1);
    }

    // Write instances into meshes
    for (let i = 0; i < 80; i++) {
      if (i < this.snowParticles.length) {
        const p = this.snowParticles[i];
        this.dummyPos.set(p.x, p.y, p.z);
        this.dummyScale.set(1, 1, 1).multiplyScalar(Math.max(0.15, p.life) * 1.9);
        this.dummyMatrix.compose(this.dummyPos, this.dummyQuat, this.dummyScale);
        this.snowSprayMesh.setMatrixAt(i, this.dummyMatrix);
      } else {
        this.dummyMatrix.makeScale(0, 0, 0);
        this.snowSprayMesh.setMatrixAt(i, this.dummyMatrix);
      }
    }
    this.snowSprayMesh.instanceMatrix.needsUpdate = true;

    for (let i = 0; i < 60; i++) {
      if (i < this.steamParticles.length) {
        const p = this.steamParticles[i];
        this.dummyPos.set(p.x, p.y, p.z);
        this.dummyScale.set(1, 1, 1).multiplyScalar(p.scale);
        this.dummyMatrix.compose(this.dummyPos, this.dummyQuat, this.dummyScale);
        this.steamMesh.setMatrixAt(i, this.dummyMatrix);
      } else {
        this.dummyMatrix.makeScale(0, 0, 0);
        this.steamMesh.setMatrixAt(i, this.dummyMatrix);
      }
    }
    this.steamMesh.instanceMatrix.needsUpdate = true;

    for (let i = 0; i < 60; i++) {
      if (i < this.smokeParticles.length) {
        const p = this.smokeParticles[i];
        this.dummyPos.set(p.x, p.y, p.z);
        this.dummyScale.set(1, 1, 1).multiplyScalar(p.scale);
        this.dummyMatrix.compose(this.dummyPos, this.dummyQuat, this.dummyScale);
        this.smokeMesh.setMatrixAt(i, this.dummyMatrix);
      } else {
        this.dummyMatrix.makeScale(0, 0, 0);
        this.smokeMesh.setMatrixAt(i, this.dummyMatrix);
      }
    }
    this.smokeMesh.instanceMatrix.needsUpdate = true;
  }

  public getCrashVariant(): 0 | 1 | 2 {
    return this.crashVariant;
  }

  public getNearMissFlash(): number {
    return this.nearMissFlash;
  }

  public isCrashing(): boolean {
    return this.crashing;
  }

  public resize(width: number, height: number): void {
    if (!this.renderer || !this.camera) return;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  /**
   * Complete GPU resource cleanup
   */
  public dispose(): void {
    this.restoreCrashedTree();
    this.rice.dispose();

    // Dispose all scene geometries and materials
    this.scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh || obj instanceof THREE.InstancedMesh) {
        if (obj.geometry) obj.geometry.dispose();
        if (Array.isArray(obj.material)) {
          obj.material.forEach((m) => m.dispose());
        } else if (obj.material) {
          obj.material.dispose();
        }
      }
    });

    if (this.renderer) {
      this.renderer.dispose();
      if (this.renderer.domElement && this.renderer.domElement.parentElement) {
        this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
      }
    }
  }
}
