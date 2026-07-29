"use client";

import { Suspense, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Center, OrbitControls, useGLTF } from "@react-three/drei";
import * as THREE from "three";

// Every model comes from a different source with its own scale/pivot — a
// backpack and a compass otherwise render at wildly different sizes side by
// side in the gear row. <Center> re-centers on each one's actual bounding
// box, and this scale normalizes the box's largest dimension to a fixed
// size so every item reads as roughly the same visual size in the row.
function Model({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  const ref = useRef<THREE.Group>(null);

  const scale = useMemo(() => {
    const box = new THREE.Box3().setFromObject(scene);
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    return 1.6 / maxDim;
  }, [scene]);

  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.4;
  });

  return (
    <Center>
      <group ref={ref} scale={scale}>
        <primitive object={scene} />
      </group>
    </Center>
  );
}

export default function GearScene({
  modelUrl,
  active = true,
}: {
  modelUrl: string;
  active?: boolean;
}) {
  return (
    <Canvas
      camera={{ position: [2.6, 1.8, 2.6], fov: 40 }}
      gl={{ antialias: true, alpha: true }}
      dpr={[1, 2]}
      frameloop={active ? "always" : "demand"}
    >
      <ambientLight intensity={0.7} />
      <directionalLight position={[4, 6, 4]} intensity={1.3} color="#ffe8c2" />
      <directionalLight position={[-4, 3, -3]} intensity={0.6} color="#9ec9ff" />
      <hemisphereLight args={["#fff6de", "#23331f", 0.4]} />

      <Suspense fallback={null}>
        <Model url={modelUrl} key={modelUrl} />
      </Suspense>

      <OrbitControls enableZoom={false} enablePan={false} makeDefault />
    </Canvas>
  );
}
