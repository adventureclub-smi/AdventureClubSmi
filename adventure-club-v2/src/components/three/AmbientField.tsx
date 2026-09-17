"use client";

import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Sparkles, Float } from "@react-three/drei";
import * as THREE from "three";

// Three low-poly wireframe shapes drifting/rotating in place — same visual
// language as HeroScene's wireframe terrain, just as small standalone
// ornaments rather than a full landscape. Kept out of the "embers" variant
// (shapes=false) since floating geometry in front of a photo/video reads as
// debris rather than atmosphere; only the Sparkles dust works as an overlay.
function DriftingShapes({ animate, color }: { animate: boolean; color: string }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (!animate || !groupRef.current) return;
    groupRef.current.rotation.y += delta * 0.03;
  });

  return (
    <group ref={groupRef}>
      <Float speed={1.1} rotationIntensity={0.6} floatIntensity={1.4}>
        <mesh position={[-3.4, 1.3, -3]}>
          <icosahedronGeometry args={[1.05, 0]} />
          <meshBasicMaterial color={color} wireframe transparent opacity={0.32} />
        </mesh>
      </Float>

      <Float speed={0.8} rotationIntensity={0.5} floatIntensity={1.1}>
        <mesh position={[3.6, -0.9, -4]}>
          <octahedronGeometry args={[0.8, 0]} />
          <meshBasicMaterial color="#9ca3af" wireframe transparent opacity={0.22} />
        </mesh>
      </Float>

      <Float speed={1.3} rotationIntensity={0.4} floatIntensity={1.6}>
        <mesh position={[0.5, 2.1, -5]}>
          <icosahedronGeometry args={[0.55, 0]} />
          <meshBasicMaterial color={color} wireframe transparent opacity={0.28} />
        </mesh>
      </Float>
    </group>
  );
}

// Shared ambient backdrop/overlay used across the homepage's plainer
// sections (TribeTeaser, UpcomingTreks) and, with shapes disabled, as a
// foreground dust layer over FinalCTA's video. Same "pause off-screen"
// discipline as the other three.js scenes on this page (frameloop demand
// when not in view) so idle sections don't keep burning GPU/CPU.
export default function AmbientField({
  animate,
  isMobile,
  color = "#00a073",
  density = 1,
  shapes = true,
  size = 2,
  opacity = 0.5,
}: {
  animate: boolean;
  isMobile: boolean;
  color?: string;
  density?: number;
  shapes?: boolean;
  size?: number;
  opacity?: number;
}) {
  return (
    <Canvas
      dpr={[1, isMobile ? 1.25 : 2]}
      camera={{ position: [0, 0, 6], fov: 45 }}
      gl={{ antialias: true, alpha: true }}
      frameloop={animate ? "always" : "demand"}
    >
      <Sparkles
        count={Math.round((isMobile ? 55 : 110) * density)}
        size={size}
        scale={[9, 5.5, 6]}
        speed={0.25}
        color={color}
        opacity={opacity}
      />

      {shapes && <DriftingShapes animate={animate} color={color} />}
    </Canvas>
  );
}
