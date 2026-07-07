"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

// Cheap layered-sine displacement rather than a noise library dependency —
// good enough for a stylized wireframe backdrop, not photoreal terrain.
function terrainHeight(x: number, y: number) {
  return (
    Math.sin(x * 0.5) * Math.cos(y * 0.5) * 0.6 +
    Math.sin(x * 1.3 + 1.5) * Math.cos(y * 0.9) * 0.3 +
    Math.sin(x * 2.7 + 3) * Math.sin(y * 2.1) * 0.12
  );
}

function Terrain({
  interactive,
  animate,
  scrollProgress,
  segments,
}: {
  interactive: boolean;
  animate: boolean;
  scrollProgress: React.RefObject<number>;
  segments: number;
}) {
  const groupRef = useRef<THREE.Group>(null);

  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(
      14,
      9,
      segments,
      Math.round(segments * 0.6)
    );
    const pos = geo.attributes.position;

    for (let i = 0; i < pos.count; i++) {
      pos.setZ(i, terrainHeight(pos.getX(i), pos.getY(i)));
    }

    geo.computeVertexNormals();
    return geo;
  }, [segments]);

  useFrame((state, delta) => {
    const group = groupRef.current;
    if (!group) return;

    if (animate) {
      group.rotation.z += delta * 0.03;
    }

    const tiltX = interactive ? state.pointer.y * 0.15 : 0;
    const tiltY = interactive ? state.pointer.x * 0.2 : 0;
    const scrollRecede = scrollProgress.current * 3;

    // Damped toward the target each frame — the "spring physics" feel comes
    // from this lerp rather than a literal spring, which is plenty smooth
    // for a slow ambient element and cheaper per-frame.
    group.rotation.x = THREE.MathUtils.lerp(group.rotation.x, -0.55 + tiltX, 0.05);
    group.rotation.y = THREE.MathUtils.lerp(group.rotation.y, tiltY, 0.05);
    group.position.z = THREE.MathUtils.lerp(group.position.z, -scrollRecede, 0.05);
  });

  return (
    <group ref={groupRef} rotation={[-0.55, 0, 0]} position={[0, -1.2, 0]}>
      <mesh geometry={geometry}>
        <meshBasicMaterial color="#22c55e" wireframe transparent opacity={0.32} />
      </mesh>
    </group>
  );
}

export default function HeroScene({
  interactive,
  animate,
  scrollProgress,
  isMobile,
}: {
  interactive: boolean;
  animate: boolean;
  scrollProgress: React.RefObject<number>;
  isMobile: boolean;
}) {
  return (
    <Canvas
      dpr={[1, isMobile ? 1.25 : 1.75]}
      gl={{ alpha: true, antialias: true }}
      camera={{ position: [0, 0.6, 5.2], fov: 45 }}
      frameloop={animate || interactive ? "always" : "demand"}
    >
      <Terrain
        interactive={interactive}
        animate={animate}
        scrollProgress={scrollProgress}
        segments={isMobile ? 22 : 36}
      />
    </Canvas>
  );
}
