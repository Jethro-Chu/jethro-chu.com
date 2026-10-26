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

  // Skier Rig
  private cameraRig: THREE.Group;
  private panRig: THREE.Group;
  private panMesh: THREE.Mesh;
  private burnerFlame: THREE.Mesh;
  private burnerLight: THREE.PointLight;
  private leftHand: THREE.Group;
  private rightHand: THREE.Group;
  private leftSkiTip: THREE.Mesh;
  private rightSkiTip: THREE.Mesh;

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
    this.burnerFlame = rigData.burnerFlame;
    this.burnerLight = rigData.burnerLight;
    this.leftHand = rigData.leftHand;
    this.rightHand = rigData.rightHand;
    this.leftSkiTip = rigData.leftSkiTip;
    this.rightSkiTip = rigData.rightSkiTip;

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
        this.scene.add(tree);
      } else if (obs.type === "rock") {
        const groundY = this.course.getGroundHeight(obs.lateralOffset, obs.distance);
        const rock = new THREE.Mesh(rockGeom, rockMat);
        rock.position.set(obs.lateralOffset, groundY + 0.4, obs.distance);
        rock.scale.set(obs.scale * 1.2, obs.scale * 0.7, obs.scale * 1.1);
        rock.rotation.set(obs.rotation, obs.rotation * 0.5, 0);
        rock.castShadow = true;
        this.scene.add(rock);
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
    burnerFlame: THREE.Mesh;
    burnerLight: THREE.PointLight;
    leftHand: THREE.Group;
    rightHand: THREE.Group;
    leftSkiTip: THREE.Mesh;
    rightSkiTip: THREE.Mesh;
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
    const handleGeom = new THREE.CylinderGeometry(0.016, 0.018, 0.35, 12);
    handleGeom.rotateX(Math.PI / 2);
    const handleMat = new THREE.MeshStandardMaterial({ color: 0x1c1e22, roughness: 0.6 });
    const handleMesh = new THREE.Mesh(handleGeom, handleMat);
    handleMesh.position.set(0, SKI_CONFIG.PAN.DEPTH * 0.85, SKI_CONFIG.PAN.RADIUS + 0.16);
    panRig.add(handleMesh);

    // TWO MINI SKIS MOUNTED UNDERNEATH THE PAN! (The comedic premise)
    const miniSkiGeom = new THREE.BoxGeometry(0.04, 0.015, 0.45);
    const miniSkiMat = new THREE.MeshStandardMaterial({ color: 0x8a3324, roughness: 0.6 }); // Red ski wax

    const leftMiniSki = new THREE.Mesh(miniSkiGeom, miniSkiMat);
    leftMiniSki.position.set(-0.14, -0.04, 0);
    panRig.add(leftMiniSki);

    const rightMiniSki = new THREE.Mesh(miniSkiGeom, miniSkiMat);
    rightMiniSki.position.set(0.14, -0.04, 0);
    panRig.add(rightMiniSki);

    // Camping Gas Burner mounted under pan center
    const burnerCanisterGeom = new THREE.CylinderGeometry(0.065, 0.065, 0.05, 16);
    const burnerCanisterMat = new THREE.MeshStandardMaterial({ color: 0x2563eb, metalness: 0.6, roughness: 0.4 }); // Blue gas can
    const burnerCanister = new THREE.Mesh(burnerCanisterGeom, burnerCanisterMat);
    burnerCanister.position.set(0, -0.035, 0);
    panRig.add(burnerCanister);

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
    panRig.add(burnerFlame);

    const burnerLight = new THREE.PointLight(0xf97316, 0.55, 0.6);
    burnerLight.position.set(0, 0.06, 0);
    panRig.add(burnerLight);

    // Gloved Hands holding the handle
    const gloveMat = new THREE.MeshStandardMaterial({ color: 0x1e3a5f, roughness: 0.85 }); // Dark alpine navy mittens
    const palmMat = new THREE.MeshStandardMaterial({ color: 0x855436, roughness: 0.9 });  // Leather palm

    const makeMitten = (isLeft: boolean) => {
      const g = new THREE.Group();
      // Forearm sleeve
      const sleeveGeom = new THREE.CylinderGeometry(0.045, 0.055, 0.32, 10);
      sleeveGeom.rotateX(Math.PI / 3);
      const sleeve = new THREE.Mesh(sleeveGeom, gloveMat);
      g.add(sleeve);

      // Mitten hand
      const handGeom = new THREE.SphereGeometry(0.055, 10, 8);
      handGeom.scale(1, 0.8, 1.3);
      const hand = new THREE.Mesh(handGeom, gloveMat);
      hand.position.set(0, 0.04, -0.15);
      g.add(hand);

      return g;
    };

    const leftHand = makeMitten(true);
    leftHand.position.set(-0.16, -0.44, -0.45);
    leftHand.rotation.set(0.2, 0.3, -0.2);
    cameraRig.add(leftHand);

    const rightHand = makeMitten(false);
    rightHand.position.set(0.16, -0.44, -0.45);
    rightHand.rotation.set(0.2, -0.3, 0.2);
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

    return {
      cameraRig,
      panRig,
      panMesh,
      burnerFlame,
      burnerLight,
      leftHand,
      rightHand,
      leftSkiTip,
      rightSkiTip,
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
    const snowMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8 });
    const snow = new THREE.InstancedMesh(sphereGeom, snowMat, 80);

    // Steam particles (wispy white/cream)
    const steamMat = new THREE.MeshBasicMaterial({ color: 0xf0fdf4, transparent: true, opacity: 0.4 });
    const steam = new THREE.InstancedMesh(sphereGeom, steamMat, 60);

    // Smoke particles (dark grey / charred)
    const smokeMat = new THREE.MeshBasicMaterial({ color: 0x27272a, transparent: true, opacity: 0.65 });
    const smoke = new THREE.InstancedMesh(sphereGeom, smokeMat, 60);

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

  /**
   * Main render tick
   */
  public render(dt: number, phase: GamePhase): void {
    const skierState = this.skier.state;
    const panOrientation = this.skier.panOrientation;

    // 1. Position Camera Rig at Skier World Position
    // Eye height ~ 1.55m above snow surface
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
    if (!this.skier.reducedCameraShake && this.skier.cameraShakeIntensity > 0) {
      const intensity = this.skier.cameraShakeIntensity * 0.08;
      shakeX = (Math.random() - 0.5) * intensity;
      shakeY = (Math.random() - 0.5) * intensity;
      shakeZ = (Math.random() - 0.5) * intensity;
    }

    this.cameraRig.rotation.set(
      -skierState.slopePitch - 0.04 + shakeX,
      Math.PI + shakeY,
      -skierState.steerAngle + shakeZ
    );

    // 2. Update Pan Rig Transformation relative to camera
    // Pitch (forward/back) and Roll (left/right) from mouse input
    // Plus toss animation vertical pop
    const tossY = panOrientation.tossProgress * 0.14;
    const tossPitch = -panOrientation.tossProgress * 0.15; // slight nose up when tossed

    this.panRig.position.set(0, -0.38 + tossY, -0.72);
    this.panRig.rotation.set(
      panOrientation.pitch + tossPitch,
      0,
      panOrientation.roll
    );

    // Mini ski flutter & hand follow
    this.leftHand.position.x = -0.16 + panOrientation.roll * 0.15;
    this.rightHand.position.x = 0.16 + panOrientation.roll * 0.15;
    this.leftHand.position.y = -0.44 + tossY * 0.7;
    this.rightHand.position.y = -0.44 + tossY * 0.7;

    // Burner flame flicker
    const flicker = 0.85 + Math.random() * 0.35;
    this.burnerFlame.scale.set(flicker, flicker, flicker);
    this.burnerLight.intensity = 0.55 * flicker;

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
    }

    // 5. Render Scene
    this.renderer.render(this.scene, this.camera);
  }

  /**
   * Spawn and update snow spray, cooking steam, and burn smoke
   */
  private updateParticles(dt: number, phase: GamePhase): void {
    // 1. Snow Spray from skis
    if (phase === "skiing" && this.skier.state.speed > 5) {
      if (Math.random() < 0.6) {
        this.snowParticles.push({
          x: this.skier.state.worldPos.x + (Math.random() > 0.5 ? 0.35 : -0.35),
          y: this.skier.state.worldPos.y + 0.1,
          z: this.skier.state.worldPos.z - 0.2,
          vx: (Math.random() - 0.5) * 1.5,
          vy: 0.6 + Math.random() * 0.8,
          vz: -this.skier.state.speed * 0.3,
          life: 0.6,
        });
      }
    }

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

    // Update Snow Particles
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
    }

    // Write instances into meshes
    for (let i = 0; i < 80; i++) {
      if (i < this.snowParticles.length) {
        const p = this.snowParticles[i];
        this.dummyPos.set(p.x, p.y, p.z);
        this.dummyScale.set(1, 1, 1).multiplyScalar(p.life);
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
