"use client";

import * as THREE from "three";
import { Suspense, useLayoutEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import type { MotionValue } from "framer-motion";
import { goldenWeight } from "./cameraPath";

/**
 * Cinematic Half Dome flyover. The optimized photogrammetry model is
 * auto-oriented (dome rotated to face -Z) and grounded (base at y=0) from its own
 * geometry. The camera glides on explicit keyframes that stay well ABOVE the
 * terrain (height is a fraction of the dome's height, with a hard floor), flying
 * forward from the valley up toward Half Dome. Driven by the page scroll; the
 * wrapper fades the canvas out after the hero so the cards are never inside the
 * mountain.
 */

const MODEL_URL = "/models/halfdome-opt.glb";
const FIT = 1000;
useGLTF.preload(MODEL_URL);

type FrameLoop = "always" | "demand" | "never";
interface SceneProps {
  progress: MotionValue<number>;
  animate: boolean;
  staticP: number;
  frameloop: FrameLoop;
  dpr: [number, number];
}

const M = { ready: false, halfW: FIT / 2, halfD: FIT / 2, topY: FIT / 2 };

/* camera path keyframes. camZ/py/lookY/lookZ are FRACTIONS of the metrics:
   pos = (driftX*halfW, py*topY, camZ*halfD); look = (0, lookY*topY, lookZ*halfD).
   py stays high (camera above the terrain); the path flies forward (+Z -> 0) and
   rises, always looking down-valley at the dome (-Z). Tuned by screenshot. */
interface Key { p: number; camZ: number; py: number; driftX: number; lookY: number; lookZ: number; fov: number }
const KEYS: Key[] = [
  { p: 0.0, camZ: 2.2, py: 0.62, driftX: 0.28, lookY: 0.5, lookZ: -0.25, fov: 52 },
  { p: 0.3, camZ: 1.78, py: 0.62, driftX: 0.12, lookY: 0.56, lookZ: -0.38, fov: 46 },
  { p: 0.6, camZ: 1.44, py: 0.66, driftX: -0.05, lookY: 0.66, lookZ: -0.5, fov: 41 },
  { p: 0.85, camZ: 1.18, py: 0.7, driftX: -0.1, lookY: 0.78, lookZ: -0.6, fov: 36 },
  { p: 1.0, camZ: 1.06, py: 0.72, driftX: -0.06, lookY: 0.83, lookZ: -0.68, fov: 33 },
];

function sampleKey(p: number, out: Key): Key {
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
  out.p = p;
  out.camZ = lp(a.camZ, b.camZ);
  out.py = lp(a.py, b.py);
  out.driftX = lp(a.driftX, b.driftX);
  out.lookY = lp(a.lookY, b.lookY);
  out.lookZ = lp(a.lookZ, b.lookZ);
  out.fov = lp(a.fov, b.fov);
  return out;
}

/* valley-midday vs golden-hour atmosphere */
const FOG_V = new THREE.Color("#aab6bd");
const FOG_G = new THREE.Color("#e6c6a0");
const SUN_V = new THREE.Color("#fff3da");
const SUN_G = new THREE.Color("#f4a85a");
const SUN_POS_V = new THREE.Vector3(0.75, 1.5, 0.95);
const SUN_POS_G = new THREE.Vector3(1.35, 0.55, 0.55);
const SKYTOP_V = new THREE.Color("#3e72a6");
const SKYTOP_G = new THREE.Color("#4d5080");
const SKYBOT_V = new THREE.Color("#cdd8d8");
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

    const rotY = Math.PI - Math.atan2(domeX - center.x, domeZ - center.z);
    const s = FIT / Math.max(size.x, size.y, size.z);
    g.rotation.y = rotY;
    g.scale.setScalar(s);
    g.updateMatrixWorld(true);
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
        uniforms: { uTop: { value: SKYTOP_V.clone() }, uBottom: { value: SKYBOT_V.clone() } },
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
    key: { p: 0, camZ: 0, py: 0, driftX: 0, lookY: 0, lookZ: 0, fov: 50 } as Key,
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
    const k = sampleKey(p, t.key);

    // camera height stays a high fraction of the dome height with a hard floor,
    // so it always glides above the terrain (never clips / passes under)
    const py = Math.max(k.py * M.topY, 0.42 * M.topY);
    t.pos.set(k.driftX * M.halfW, py, k.camZ * M.halfD);
    t.look.set(0, k.lookY * M.topY, k.lookZ * M.halfD);

    if (!t.init) {
      t.dPos.copy(t.pos);
      t.dLook.copy(t.look);
      t.dFov = k.fov;
      t.init = true;
    } else {
      const lerpK = 1 - Math.exp(-(animate ? 9 : 60) * Math.min(delta, 0.05));
      t.dPos.lerp(t.pos, lerpK);
      t.dLook.lerp(t.look, lerpK);
      t.dFov += (k.fov - t.dFov) * lerpK;
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
      fog.near = M.halfD * 0.7;
      fog.far = M.halfD * 5.5;
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
      camera={{ fov: 52, near: 1, far: FIT * 12, position: [0, 380, 380] }}
    >
      <fog attach="fog" args={["#aab6bd", 250, 1600]} />
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
