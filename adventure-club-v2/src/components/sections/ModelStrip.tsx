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
import styles from "./ModelStrip.module.scss";

type CardProps = {
  path: string;
  scale: number;
  rotation?: [number, number, number];
  position?: [number, number, number];
};

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

  return (
    <div className={styles.card} ref={ref}>
      {inView && (
        <Canvas
          camera={{ position: [0, 0.6, 7], fov: 45 }}
          dpr={isMobile ? 1 : [1, 2]}
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

  useEffect(() => {
    const update = () => setIsMobile(window.innerWidth < 600);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return (
    <section className={styles.section}>

      <div className={styles.heading}>
        <p>INTERACT WITH THE ADVENTURE ESSENTIALS</p>
      </div>

<div className={styles.grid}>
  {/* Row 1 */}
  <ModelCard
    path="/models/frooti.glb"
    scale={0.27}
    rotation={[0, 0, 0]}
    position={[0, 0, 0]}
    isMobile={isMobile}
  />

  <ModelCard
    path="/models/tent.glb"
    scale={0.2}
    rotation={[0, 0, 0]}
    position={[0, -0.8, 0]}
    isMobile={isMobile}
  />

  <ModelCard
    path="/models/backpack.glb"
    scale={1}
    rotation={[0, Math.PI / 4, 0]}
    position={[0, -0.25, 0]}
    isMobile={isMobile}
  />

  <ModelCard
    path="/models/flashlight.glb"
    scale={5.5}
    rotation={[0, -Math.PI / 3, Math.PI / 5.5]}
    position={[0, 0, 0]}
    isMobile={isMobile}
  />

  <ModelCard
    path="/models/kayak.glb"
    scale={1.4}
    rotation={[0, Math.PI / 2, -Math.PI / 7]}
    position={[0, -0.15, 0]}
    isMobile={isMobile}
  />

    <ModelCard
    path="/models/waterBottle.glb"
    scale={4.2}
    rotation={[0, 0, Math.PI / 7]}
    position={[0, 0, 0]}
    isMobile={isMobile}
  />

  <ModelCard
    path="/models/cap.glb"
    scale={4.2}
    rotation={[0, 0, 0]}
    position={[0, 0, 0]}
    isMobile={isMobile}
  />

  {/* Row 2 */}

  <ModelCard
    path="/models/banana.glb"
    scale={0.035}
    rotation={[0, 0, 0]}
    position={[0, 5, 0]}
    isMobile={isMobile}
  />


  <ModelCard
    path="/models/firstAid.glb"
    scale={1.4}
    rotation={[Math.PI / 3.5, Math.PI / 3.5 , 0]}
    position={[0, 0, 0]}
    isMobile={isMobile}
  />

  <ModelCard
    path="/models/protein.glb"
    scale={0.47}
    rotation={[Math.PI / 4,0,0]}
    position={[0, 0, 0]}
    isMobile={isMobile}
  />

    <ModelCard
    path="/models/shoes.glb"
    scale={0.12}
    rotation={[0,0,0]}
    position={[0, 0, 0]}
    isMobile={isMobile}
  />

  <ModelCard
    path="/models/reload2.glb"
    scale={0.5}
    rotation={[0, 0, 0]}
    position={[0, 0, 0]}
    isMobile={isMobile}
  />


    <ModelCard
    path="/models/noodles.glb"
    scale={0.5}
    rotation={[0,0,0]}
    position={[0,-1.5, 0]}
    isMobile={isMobile}
  />


    <ModelCard
    path="/models/glasses.glb"
    scale={3.7}
    rotation={[0,0,0]}
    position={[0, 0, 0]}
    isMobile={isMobile}
  />

</div>
    </section>
  );
}

useGLTF.preload("/models/frooti.glb");
useGLTF.preload("/models/reload2.glb");
useGLTF.preload("/models/tent.glb");
useGLTF.preload("/models/backpack.glb");
useGLTF.preload("/models/flashlight.glb");
useGLTF.preload("/models/kayak.glb");
useGLTF.preload("/models/waterBottle.glb");
useGLTF.preload("/models/cap.glb");
useGLTF.preload("/models/firstAid.glb");
useGLTF.preload("/models/protein.glb");
useGLTF.preload("/models/banana.glb");
useGLTF.preload("/models/shoes.glb");
useGLTF.preload("/models/noodles.glb");
useGLTF.preload("/models/glasses.glb");