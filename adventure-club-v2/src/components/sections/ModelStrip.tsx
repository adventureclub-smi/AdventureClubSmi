"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useInView } from "framer-motion";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  Environment,
  Float,
  OrbitControls,
  Center,
  useGLTF,
} from "@react-three/drei";
import * as THREE from "three";
import { ChevronLeft, ChevronRight } from "lucide-react";
import styles from "./ModelStrip.module.scss";

type CardProps = {
  path: string;
  scale: number;
  rotation?: [number, number, number];
  position?: [number, number, number];
};

// One live WebGL context per card was reliable on desktop but kept
// failing intermittently on real phones even after lazy-mounting,
// tightening the viewport margin, staggering mounts, and adding
// context-loss recovery — mobile GPUs/drivers are just inconsistent
// about how many contexts (plus HDRI environment maps) they'll hold, no
// matter how carefully the burst is managed. Below, mobile renders one
// model at a time in a carousel instead of a grid — by construction
// there is never more than a single context alive on mobile, which
// sidesteps the whole problem rather than continuing to mitigate it.
const MODELS: CardProps[] = [
  { path: "/models/frooti.glb", scale: 0.27, rotation: [0, 0, 0], position: [0, 0, 0] },
  { path: "/models/tent.glb", scale: 0.2, rotation: [0, 0, 0], position: [0, -0.8, 0] },
  { path: "/models/backpack.glb", scale: 1, rotation: [0, Math.PI / 4, 0], position: [0, -0.25, 0] },
  { path: "/models/flashlight.glb", scale: 5.5, rotation: [0, -Math.PI / 3, Math.PI / 5.5], position: [0, 0, 0] },
  { path: "/models/kayak.glb", scale: 1.4, rotation: [0, Math.PI / 2, -Math.PI / 7], position: [0, -0.15, 0] },
  { path: "/models/waterBottle.glb", scale: 4.2, rotation: [0, 0, Math.PI / 7], position: [0, 0, 0] },
  { path: "/models/cap.glb", scale: 4.2, rotation: [0, 0, 0], position: [0, 0, 0] },
  { path: "/models/banana.glb", scale: 0.035, rotation: [0, 0, 0], position: [0, 5, 0] },
  { path: "/models/firstAid.glb", scale: 1.4, rotation: [Math.PI / 3.5, Math.PI / 3.5, 0], position: [0, 0, 0] },
  { path: "/models/protein.glb", scale: 0.47, rotation: [Math.PI / 4, 0, 0], position: [0, 0, 0] },
  { path: "/models/shoes.glb", scale: 0.12, rotation: [0, 0, 0], position: [0, 0, 0] },
  { path: "/models/reload2.glb", scale: 0.5, rotation: [0, 0, 0], position: [0, 0, 0] },
  { path: "/models/noodles.glb", scale: 0.5, rotation: [0, 0, 0], position: [0, -1.5, 0] },
  { path: "/models/glasses.glb", scale: 3.7, rotation: [0, 0, 0], position: [0, 0, 0] },
];

function Model({
  path,
  scale,
  rotation = [0, 0, 0],
  position = [0, 0, 0],
}: {
  path: string;
  scale: number;
  rotation?: [number, number, number];
  position?: [number, number, number];
}) {
  const { scene } = useGLTF(path);

  // IMPORTANT:
  // Every canvas needs its own copy of the model.
  const model = useMemo(() => scene.clone(true), [scene]);

  const ref = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (!ref.current) return;

    ref.current.rotation.y += delta * 0.45;
  });

  return (
    <Float
      speed={2}
      rotationIntensity={0.15}
      floatIntensity={0.35}
    >
      <primitive
        ref={ref}
        object={model}
        scale={scale}
        rotation={rotation}
        position={position}
      />
    </Float>
  );
}

function ModelCard({
  path,
  scale,
  rotation,
  position,
  isMobile,
}: CardProps & { isMobile: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  // Every card used to mount its own <Canvas> up front — 14 simultaneous
  // WebGL contexts (plus an HDRI environment map each) is well past what
  // mobile GPUs can hold at once, so phones silently lost contexts and
  // rendered the browser's "sad face" placeholder instead of the model.
  // Mounting only the handful of cards actually near the viewport, and
  // unmounting (and disposing) the rest as they scroll away, keeps the
  // live context count low no matter how long this grid is.
  //
  // The mobile layout is 2 columns × 7 rows — a 150px margin above/below
  // the viewport was still generous enough to keep 3-4 rows (6-8
  // contexts) mounted at once on a short phone screen, which is still
  // past what a weak Android GPU can hold. A much tighter margin on
  // mobile keeps it down to roughly whatever's actually on screen.
  const inView = useInView(ref, { margin: isMobile ? "20px 0px" : "150px 0px" });

  const [shouldMount, setShouldMount] = useState(false);
  const [mountKey, setMountKey] = useState(0);

  // The very first row(s) to scroll into view all flip inView on the same
  // frame, so they'd otherwise all create a WebGL context in the exact
  // same tick — a burst several GPUs/drivers hiccup on right at cold
  // start, even when the sustained count afterward is fine (which is why
  // only the first card or two, not a random scattering, ever showed the
  // lost-context icon). A small random stagger spreads that first burst
  // out over a fraction of a second instead.
  useEffect(() => {
    // Rendering already gates on `inView && shouldMount` below, so a stale
    // `true` left over from a previous visit doesn't render anything while
    // out of view — no need to reset it back to false here too.
    if (!inView || shouldMount) return;

    const delay = Math.random() * 260;
    const timer = setTimeout(() => setShouldMount(true), delay);
    return () => clearTimeout(timer);
  }, [inView, shouldMount]);

  // Belt-and-suspenders: if a context is lost anyway (cold-start hiccup,
  // memory pressure, whatever), remount this one card's Canvas from
  // scratch a moment later instead of leaving the lost-context icon up
  // for the rest of the page's life.
  function handleContextLost(gl: { domElement: HTMLCanvasElement }) {
    gl.domElement.addEventListener(
      "webglcontextlost",
      (event) => {
        event.preventDefault();
        setTimeout(() => setMountKey((k) => k + 1), 300);
      },
      { once: true }
    );
  }

  return (
    <div className={styles.card} ref={ref}>
      {inView && shouldMount && (
        <Canvas
          key={mountKey}
          camera={{ position: [0, 0.6, 7], fov: 45 }}
          dpr={isMobile ? 1 : [1, 2]}
          onCreated={({ gl }) => handleContextLost(gl)}
        >
          <ambientLight intensity={1.3} />

          <directionalLight
            position={[3, 5, 5]}
            intensity={2}
          />

          <pointLight
            position={[-2, 2, 2]}
            intensity={1.5}
          />

          <Environment preset="sunset" resolution={isMobile ? 32 : 256} />

          <Center>
            <Suspense fallback={null}>
              <Model
                path={path}
                scale={scale}
                rotation={rotation}
                position={position}
              />
            </Suspense>
          </Center>

          <OrbitControls
            enableZoom={false}
            enablePan={false}
            autoRotate={false}
          />
        </Canvas>
      )}
    </div>
  );
}

export default function ModelStrip() {
  const [isMobile, setIsMobile] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const update = () => setIsMobile(window.innerWidth < 600);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  function prevModel() {
    setActiveIndex((i) => (i - 1 + MODELS.length) % MODELS.length);
  }

  function nextModel() {
    setActiveIndex((i) => (i + 1) % MODELS.length);
  }

  const active = MODELS[activeIndex];

  return (
    <section className={styles.section}>
      <div className={styles.heading}>
        <p>INTERACT WITH THE ADVENTURE ESSENTIALS</p>
      </div>

      {isMobile ? (
        <div className={styles.carousel}>
          <div className={styles.carouselCardWrap}>
            {/* A fresh `key` per model forces a full unmount of the old
                canvas before the new one mounts, so exactly one WebGL
                context is ever alive here — never two, even briefly. */}
            <ModelCard key={active.path} {...active} isMobile={isMobile} />
          </div>

          <div className={styles.carouselControls}>
            <button type="button" onClick={prevModel} aria-label="Previous model">
              <ChevronLeft size={20} />
            </button>

            <span className={styles.carouselCounter}>
              {activeIndex + 1} / {MODELS.length}
            </span>

            <button type="button" onClick={nextModel} aria-label="Next model">
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      ) : (
        <div className={styles.grid}>
          {MODELS.map((model) => (
            <ModelCard key={model.path} {...model} isMobile={isMobile} />
          ))}
        </div>
      )}
    </section>
  );
}

MODELS.forEach((model) => useGLTF.preload(model.path));