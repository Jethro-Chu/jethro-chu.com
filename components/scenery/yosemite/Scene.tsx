"use client";

import * as THREE from "three";
import { Suspense, useLayoutEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import type { MotionValue } from "framer-motion";
import { goldenWeight } from "./cameraPath";

/**
 * Cinematic Half Dome flythrough. The optimized photogrammetry model is
 * auto-oriented (dome rotated to face -Z) and auto-grounded (base at y=0) from
 * its own geometry at load, then a forward-and-up camera path carries the viewer
 * from the valley floor up toward Half Dome's face, driven by the page scroll.
 * Atmospheric haze + a gradient sky hide the model's irregular edges and make it
 * read as a grounded landscape, not a floating object.
 */

const MODEL_URL = "/models/halfdome-opt.glb";
const FIT = 1000; // the model's largest dimension is normalized to this
useGLTF.preload(MODEL_URL);

type FrameLoop = "always" | "demand" | "never";
interface SceneProps {
  progress: MotionValue<number>;
  animate: boolean;
  staticP: number;
  frameloop: FrameLoop;
  dpr: [number, number];
}

/* shared metrics, filled once the model is measured (normalized space:
   dome at -Z, base at y=0, centred on X/Z) */
const M = { ready: false, halfW: FIT / 2, halfD: FIT / 2, topY: FIT / 2 };

/* camera path keyframes as FRACTIONS of the model metrics, so the path adapts to
   whatever the model measures: pos = (px*halfW, py*topY, pz*halfD), same for look.
   The camera starts low at the +Z (valley) end and climbs forward toward the dome
   at -Z, always gazing up the valley. Tuned by screenshot. */
interface Key { p: number; px: number; py: number; pz: number; lx: number; ly: number; lz: number; fov: number }
const KEYS: Key[] = [
  { p: 0.0, px: 0.0, py: 0.34, pz: 1.0, lx: 0.0, ly: 0.2, lz: -0.35, fov: 52 },
  { p: 0.15, px: 0.05, py: 0.37, pz: 0.74, lx: 0.0, ly: 0.28, lz: -0.55, fov: 51 },
  { p: 0.34, px: 0.04, py: 0.44, pz: 0.44, lx: 0.0, ly: 0.44, lz: -0.72, fov: 49 },
  { p: 0.55, px: -0.04, py: 0.54, pz: 0.14, lx: 0.0, ly: 0.64, lz: -0.86, fov: 47 },
  { p: 0.7, px: 0.0, py: 0.64, pz: -0.1, lx: 0.0, ly: 0.82, lz: -0.96, fov: 46 },
  { p: 0.85, px: 0.03, py: 0.7, pz: -0.22, lx: 0.0, ly: 0.88, lz: -1.02, fov: 45 },
  { p: 1.0, px: -0.02, py: 0.72, pz: -0.26, lx: 0.0, ly: 0.87, lz: -1.05, fov: 45 },
];

function samplePath(p: number, posOut: THREE.Vector3, lookOut: THREE.Vector3): number {
  const k = KEYS;
  const n = k.length;
  let i = 0;
  while (i < n - 1 && p >= k[i + 1].p) i++;
  const a = k[i];
  const b = k[Math.min(i + 1, n - 1)];
  const span = b.p - a.p || 1;
  let t = THREE.MathUtils.clamp((p - a.p) / span, 0, 1);
  t = t * t * (3 - 2 * t);
  const lp = (u: number, v: number) => u + (v - u) * t;
  posOut.set(lp(a.px, b.px) * M.halfW, lp(a.py, b.py) * M.topY, lp(a.pz, b.pz) * M.halfD);
  lookOut.set(lp(a.lx, b.lx) * M.halfW, lp(a.ly, b.ly) * M.topY, lp(a.lz, b.lz) * M.halfD);
  return lp(a.fov, b.fov);
}

/* valley-midday vs golden-hour atmosphere (lerped by goldenWeight) */
const FOG_V = new THREE.Color("#b9c5c5");
const FOG_G = new THREE.Color("#e6c8a0");
const SUN_V = new THREE.Color("#fff3da");
const SUN_G = new THREE.Color("#f4a85a");
const SUN_POS_V = new THREE.Vector3(0.75, 1.5, 0.95);
const SUN_POS_G = new THREE.Vector3(1.35, 0.5, 0.55);
const SKYTOP_V = new THREE.Color("#3e72a6");
const SKYTOP_G = new THREE.Color("#4d5080");
const SKYBOT_V = new THREE.Color("#d3dad6");
const SKYBOT_G = new THREE.Color("#edc189");

function Model() {
  const { scene } = useGLTF(MODEL_URL);
  const group = useRef<THREE.Group>(null);

  useLayoutEffect(() => {
    const g = group.current;
    if (!g) return;
    g.rotation.set(0, 0, 0);
    g.scale.setScalar(1);
    g.position.set(0, 0, 0);
    g.updateMatrixWorld(true);

    const box = new THREE.Box3().setFromObject(g);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());

    // find the dome: horizontal centroid of the highest-Y vertices
    const tmp = new THREE.Vector3();
    let hx = 0;
    let hz = 0;
    let hn = 0;
    const yHi = box.max.y - size.y * 0.1;
    g.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh) return;
      const pos = m.geometry.attributes.position as THREE.BufferAttribute;
      const step = Math.max(1, Math.floor(pos.count / 2000));
      for (let i = 0; i < pos.count; i += step) {
        tmp.fromBufferAttribute(pos, i).applyMatrix4(m.matrixWorld);
        if (tmp.y >= yHi) {
          hx += tmp.x;
          hz += tmp.z;
          hn++;
        }
      }
    });
    const domeX = hn ? hx / hn : center.x;
    const domeZ = hn ? hz / hn : center.z;

    // rotate so the dome direction points to -Z (ahead of the climbing camera)
    const rotY = Math.PI - Math.atan2(domeX - center.x, domeZ - center.z);
    const s = FIT / Math.max(size.x, size.y, size.z);
    g.rotation.y = rotY;
    g.scale.setScalar(s);
    g.updateMatrixWorld(true);

    // ground it: centre X/Z, drop the base to y=0
    const box2 = new THREE.Box3().setFromObject(g);
    const c2 = box2.getCenter(new THREE.Vector3());
    g.position.set(-c2.x, -box2.min.y, -c2.z);
    g.updateMatrixWorld(true);

    const box3 = new THREE.Box3().setFromObject(g);
    const sz3 = box3.getSize(new THREE.Vector3());
    M.halfW = sz3.x / 2;
    M.halfD = sz3.z / 2;
    M.topY = sz3.y;
    M.ready = true;
  }, [scene]);

  return (
    <group ref={group}>
      <primitive object={scene} />
    </group>
  );
}

function SkyDome({ matRef }: { matRef: React.MutableRefObject<THREE.ShaderMaterial | null> }) {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        uniforms: {
          uTop: { value: SKYTOP_V.clone() },
          uBottom: { value: SKYBOT_V.clone() },
        },
        vertexShader: `varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
        fragmentShader: `uniform vec3 uTop; uniform vec3 uBottom; varying vec3 vDir; void main(){ float t = smoothstep(-0.06, 0.6, vDir.y); gl_FragColor = vec4(mix(uBottom, uTop, t), 1.0); }`,
      }),
    []
  );
  useLayoutEffect(() => {
    matRef.current = mat;
  }, [mat, matRef]);
  return (
    <mesh scale={FIT * 6} frustumCulled={false}>
      <sphereGeometry args={[1, 32, 24]} />
      <primitive object={mat} attach="material" />
    </mesh>
  );
}

function Rig({
  progress,
  animate,
  staticP,
  sunRef,
  skyRef,
}: Pick<SceneProps, "progress" | "animate" | "staticP"> & {
  sunRef: React.MutableRefObject<THREE.DirectionalLight | null>;
  skyRef: React.MutableRefObject<THREE.ShaderMaterial | null>;
}) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const scene = useThree((s) => s.scene);
  const t = useRef({
    pos: new THREE.Vector3(),
    look: new THREE.Vector3(),
    dPos: new THREE.Vector3(),
    dLook: new THREE.Vector3(),
    dFov: NaN,
    sunPos: new THREE.Vector3(),
    init: false,
  }).current;

  useFrame((_s, delta) => {
    if (!M.ready) return;
    const p = animate ? progress.get() : staticP;
    const fov = samplePath(p, t.pos, t.look);

    if (!t.init) {
      t.dPos.copy(t.pos);
      t.dLook.copy(t.look);
      t.dFov = fov;
      t.init = true;
    } else {
      const k = 1 - Math.exp(-(animate ? 9 : 60) * Math.min(delta, 0.05));
      t.dPos.lerp(t.pos, k);
      t.dLook.lerp(t.look, k);
      t.dFov += (fov - t.dFov) * k;
    }
    camera.position.copy(t.dPos);
    camera.lookAt(t.dLook);
    if (Math.abs(camera.fov - t.dFov) > 1e-3) {
      camera.fov = t.dFov;
      camera.updateProjectionMatrix();
    }

    const w = goldenWeight(p);
    const fog = scene.fog as THREE.Fog | null;
    if (fog) {
      fog.color.copy(FOG_V).lerp(FOG_G, w);
      fog.near = M.halfD * 0.8;
      fog.far = M.halfD * 6.5;
    }
    if (sunRef.current) {
      sunRef.current.color.copy(SUN_V).lerp(SUN_G, w);
      sunRef.current.intensity = 2.1 + 0.7 * w;
      t.sunPos.copy(SUN_POS_V).lerp(SUN_POS_G, w).multiplyScalar(FIT);
      sunRef.current.position.copy(t.sunPos);
    }
    if (skyRef.current) {
      (skyRef.current.uniforms.uTop.value as THREE.Color).copy(SKYTOP_V).lerp(SKYTOP_G, w);
      (skyRef.current.uniforms.uBottom.value as THREE.Color).copy(SKYBOT_V).lerp(SKYBOT_G, w);
    }
  });
  return null;
}

export default function YosemiteScene({ progress, animate, staticP, frameloop, dpr }: SceneProps) {
  const sunRef = useRef<THREE.DirectionalLight | null>(null);
  const skyRef = useRef<THREE.ShaderMaterial | null>(null);

  return (
    <Canvas
      frameloop={frameloop}
      dpr={dpr}
      gl={{ antialias: true, powerPreference: "high-performance", alpha: false }}
      camera={{ fov: 53, near: 1, far: FIT * 12, position: [0, 140, 480] }}
    >
      <fog attach="fog" args={["#b9c5c5", 200, 1400]} />
      <SkyDome matRef={skyRef} />
      <hemisphereLight args={["#9fb6cc", "#caa97e", 0.7]} />
      <ambientLight intensity={0.35} />
      <directionalLight ref={sunRef} color={"#fff3da"} intensity={2.1} position={[750, 1500, 950]} />
      <Suspense fallback={null}>
        <Model />
      </Suspense>
      <Rig progress={progress} animate={animate} staticP={staticP} sunRef={sunRef} skyRef={skyRef} />
    </Canvas>
  );
}
