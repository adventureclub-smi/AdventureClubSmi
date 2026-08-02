"use client";

import { Suspense, useMemo, useRef } from "react";
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
}: CardProps) {
  return (
    <div className={styles.card}>
      <Canvas
        camera={{ position: [0, 0.6, 7], fov: 45 }}
        dpr={[1, 2]}
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

        <Environment preset="sunset" />

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
    </div>
  );
}

export default function ModelStrip() {
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
  />

  <ModelCard
    path="/models/tent.glb"
    scale={0.2}
    rotation={[0, 0, 0]}
    position={[0, -0.8, 0]}
  />

  <ModelCard
    path="/models/backpack.glb"
    scale={1}
    rotation={[0, Math.PI / 4, 0]}
    position={[0, -0.25, 0]}
  />

  <ModelCard
    path="/models/flashlight.glb"
    scale={5.5}
    rotation={[0, -Math.PI / 3, Math.PI / 5.5]}
    position={[0, 0, 0]}
  />

  <ModelCard
    path="/models/kayak.glb"
    scale={1.4}
    rotation={[0, Math.PI / 2, -Math.PI / 7]}
    position={[0, -0.15, 0]}
  />

    <ModelCard
    path="/models/waterBottle.glb"
    scale={4.2}
    rotation={[0, 0, Math.PI / 7]}
    position={[0, 0, 0]}
  />  

  <ModelCard
    path="/models/cap.glb"
    scale={4.2}
    rotation={[0, 0, 0]}
    position={[0, 0, 0]}
  />

  {/* Row 2 */}

  <ModelCard
    path="/models/banana.glb"
    scale={0.035}
    rotation={[0, 0, 0]}
    position={[0, 5, 0]}
  />


  <ModelCard
    path="/models/firstAid.glb"
    scale={1.4}
    rotation={[Math.PI / 3.5, Math.PI / 3.5 , 0]}
    position={[0, 0, 0]}
  />

  <ModelCard
    path="/models/protein.glb"
    scale={0.47}
    rotation={[Math.PI / 4,0,0]}
    position={[0, 0, 0]}
  />

    <ModelCard
    path="/models/shoes.glb"
    scale={0.12}
    rotation={[0,0,0]}
    position={[0, 0, 0]}
  />

  <ModelCard
    path="/models/reload2.glb"
    scale={0.5}
    rotation={[0, 0, 0]}
    position={[0, 0, 0]}
  />


    <ModelCard
    path="/models/noodles.glb"
    scale={0.5}
    rotation={[0,0,0]}
    position={[0,-1.5, 0]}
  />


    <ModelCard
    path="/models/glasses.glb"
    scale={3.7}
    rotation={[0,0,0]}
    position={[0, 0, 0]}
  />

</div>
    </section>
  );
}

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
useGLTF.preload("/models/pole.glb");
useGLTF.preload("/models/noodles.glb");