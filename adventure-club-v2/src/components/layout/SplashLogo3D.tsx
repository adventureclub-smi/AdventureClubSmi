"use client";

import { Suspense, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";

const SATELLITE_COUNT = 6;
const SATELLITE_RADIUS = 1.55;

function LogoPlaque() {
  const texture = useTexture("/logo/logo-bluegreen.png") as THREE.Texture;

  const groupRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const satellitesRef = useRef<THREE.Group>(null);

  // The source PNG is a wide mark (roughly 1.8:1) — deriving the plaque's
  // height from its real aspect ratio keeps the logo from looking
  // squeezed or letterboxed on its two textured faces.
  const image = texture.image as HTMLImageElement | undefined;
  const aspect = image?.width && image?.height ? image.width / image.height : 1.78;
  const width = 2;
  const height = width / aspect;
  const depth = 0.16;

  useFrame((state, delta) => {
    if (groupRef.current) {
      // A full spin would carry the plaque edge-on and then into a
      // mirrored, backwards view of the logo partway through — this
      // splash is only ever on screen for ~3s, so instead it swivels
      // gently back and forth, keeping the face toward the camera the
      // whole time while still reading as a living 3D object.
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.9) * 0.55;
      groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.6) * 0.1;
    }
    if (ringRef.current) {
      ringRef.current.rotation.z -= delta * 0.3;
    }
    if (satellitesRef.current) {
      satellitesRef.current.rotation.y -= delta * 0.5;
    }
  });

  const satellites = useMemo(
    () =>
      Array.from({ length: SATELLITE_COUNT }, (_, i) => {
        const angle = (i / SATELLITE_COUNT) * Math.PI * 2;
        return [Math.cos(angle) * SATELLITE_RADIUS, 0, Math.sin(angle) * SATELLITE_RADIUS] as [
          number,
          number,
          number
        ];
      }),
    []
  );

  return (
    <>
      <group ref={groupRef}>
        <mesh>
          <boxGeometry args={[width, height, depth]} />
          <meshStandardMaterial attach="material-0" color="#00a073" metalness={0.6} roughness={0.3} />
          <meshStandardMaterial attach="material-1" color="#00a073" metalness={0.6} roughness={0.3} />
          <meshStandardMaterial attach="material-2" color="#00a073" metalness={0.6} roughness={0.3} />
          <meshStandardMaterial attach="material-3" color="#00a073" metalness={0.6} roughness={0.3} />
          <meshStandardMaterial attach="material-4" map={texture} transparent metalness={0.1} roughness={0.5} />
          <meshStandardMaterial attach="material-5" map={texture} transparent metalness={0.1} roughness={0.5} />
        </mesh>
      </group>

      <mesh ref={ringRef} rotation={[Math.PI / 2.3, 0, 0]}>
        <torusGeometry args={[1.3, 0.013, 16, 96]} />
        <meshStandardMaterial
          color="#00d68f"
          emissive="#00a073"
          emissiveIntensity={1.5}
          metalness={0.3}
          roughness={0.4}
        />
      </mesh>

      <group ref={satellitesRef}>
        {satellites.map((position, i) => (
          <mesh key={i} position={position}>
            <sphereGeometry args={[0.035, 12, 12]} />
            <meshStandardMaterial color="#00d68f" emissive="#00a073" emissiveIntensity={2.2} />
          </mesh>
        ))}
      </group>
    </>
  );
}

export default function SplashLogo3D({ dpr }: { dpr: number | [number, number] }) {
  return (
    <Canvas
      camera={{ position: [0, 0.15, 4.6], fov: 34 }}
      dpr={dpr}
      gl={{ alpha: true, antialias: true }}
      style={{ width: "100%", height: "100%" }}
    >
      <ambientLight intensity={1.2} />
      <directionalLight position={[2.5, 3, 4]} intensity={1.6} />
      <pointLight position={[-2, -1.5, 2]} intensity={1} color="#00a073" />

      <Suspense fallback={null}>
        <LogoPlaque />
      </Suspense>
    </Canvas>
  );
}
