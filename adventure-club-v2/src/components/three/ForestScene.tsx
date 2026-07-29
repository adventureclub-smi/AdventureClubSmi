"use client";

import { useEffect, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Sparkles, useGLTF } from "@react-three/drei";
import * as THREE from "three";

function Forest() {
  const { scene } = useGLTF("/models/woods.glb");
  const group = useRef<THREE.Group>(null);

  useEffect(() => {
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = false;
        mesh.receiveShadow = false;
      }
    });
  }, [scene]);

  useFrame((state) => {
    if (!group.current) return;

    const t = state.clock.elapsedTime;

    // Continuous rotation
    group.current.rotation.y = t * 0.12;

    // Gentle breathing
    group.current.rotation.z = THREE.MathUtils.lerp(
      group.current.rotation.z,
      Math.sin(t * 0.18) * 0.01,
      0.03
    );

    group.current.position.y = THREE.MathUtils.lerp(
      group.current.position.y,
      -1.15 + Math.sin(t * 0.25) * 0.03,
      0.03
    );
  });

  return (
    <group ref={group} position={[-0.9, -1.15, -2]} scale={6.8}>
      <primitive object={scene} />
    </group>
  );
}

export default function ForestScene({
  animate,
  isMobile,
}: {
  animate: boolean;
  isMobile: boolean;
}) {
  return (
    <Canvas
      dpr={[1, isMobile ? 1.25 : 2]}
      camera={{
        position: [1, -1, 5],
        fov: 38,
      }}
      gl={{
        antialias: true,
        alpha: true,
      }}
      frameloop={animate ? "always" : "demand"}
      shadows={false}
    >
      <color attach="background" args={["#04070a"]} />

      <fog attach="fog" args={["#06080a", 7, 26]} />

      {/* Ambient fill */}
      <ambientLight intensity={0.6} />

      {/* Cool moonlight */}
      <directionalLight position={[6, 10, 5]} intensity={1.1} color="#dce8ff" />

      {/* Warm sunrise */}
      <directionalLight position={[-8, 6, 4]} intensity={1.15} color="#ffd39b" />

      {/* Warm front fill */}
      <pointLight position={[1, 3, 5]} intensity={1.4} color="#ffd59a" />

      {/* Orange side glow */}
      <pointLight position={[-3, 2, 2]} intensity={0.55} color="#ffb56b" />

      {/* Natural bounce light */}
      {/* skyColor/groundColor are constructor-only args on
          THREE.HemisphereLight, not later-settable properties — R3F's JSX
          only exposes settable properties directly, so these have to go
          through `args` instead. */}
      <hemisphereLight args={["#fff6de", "#23331f", 0.45]} />

      {/* Floating dust */}
      <Sparkles count={140} size={2.5} scale={[18, 10, 18]} speed={0.15} />

      <Forest />
    </Canvas>
  );
}

useGLTF.preload("/models/woods.glb");
