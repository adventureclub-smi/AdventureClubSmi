"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Billboard, Html, Line, OrbitControls, useTexture } from "@react-three/drei";
import * as THREE from "three";

import type { GalleryPhoto } from "@/types/homepage";

const SPHERE_RADIUS = 4.4;
const NODE_SIZE = 1.35;
const CORE_COLOR = "#00d9a3";
const LINE_COLOR = "#00a073";

// WebGL texture upload needs the response to actually carry CORS headers —
// the gallery's media host doesn't send any (a plain <img>, used everywhere
// else, never needed them), so external CDN photos are routed through our
// own origin instead of loading the CDN URL directly. A few gallery entries
// point at local /public assets instead, which are already same-origin and
// would just 400 against the proxy's host allowlist.
function textureUrl(src: string) {
  if (src.startsWith("/")) return src;
  return `/api/gallery-texture-proxy?url=${encodeURIComponent(src)}`;
}

// Evenly spreads N points across a sphere's surface — the same construction
// as a sunflower seed head, which is what keeps neighboring photos from
// ever bunching up regardless of how many there are.
function fibonacciSphere(count: number, radius: number): [number, number, number][] {
  const points: [number, number, number][] = [];
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));

  for (let i = 0; i < count; i++) {
    const y = count > 1 ? 1 - (i / (count - 1)) * 2 : 0;
    const ringRadius = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = goldenAngle * i;

    points.push([Math.cos(theta) * ringRadius * radius, y * radius, Math.sin(theta) * ringRadius * radius]);
  }

  return points;
}

// A plain textured plane, not drei's <Image> — its custom shader material
// crashed the WebGL context outright under this three/drei version pair
// (confirmed by swapping it for a flat-color mesh, which rendered fine). A
// small dark plane sat just behind the photo stands in for a frame/mat
// border instead of a shader-based rounded corner.
function ImageNode({
  photo,
  position,
  onSelect,
}: {
  photo: GalleryPhoto;
  position: [number, number, number];
  onSelect: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const groupRef = useRef<THREE.Group>(null);
  const texture = useTexture(textureUrl(photo.src));

  useEffect(() => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;
  }, [texture]);

  useFrame(() => {
    if (!groupRef.current) return;
    const target = hovered ? 1.3 : 1;
    groupRef.current.scale.setScalar(THREE.MathUtils.lerp(groupRef.current.scale.x, target, 0.15));
  });

  const aspect = photo.width / photo.height;
  const width = aspect >= 1 ? NODE_SIZE : NODE_SIZE * aspect;
  const height = aspect >= 1 ? NODE_SIZE / aspect : NODE_SIZE;

  return (
    <Billboard position={position}>
      <group
        ref={groupRef}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          setHovered(false);
          document.body.style.cursor = "auto";
        }}
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
      >
        <mesh position={[0, 0, -0.02]}>
          <planeGeometry args={[width + 0.14, height + 0.14]} />
          <meshBasicMaterial color={hovered ? CORE_COLOR : "#111512"} transparent opacity={hovered ? 0.9 : 1} />
        </mesh>

        <mesh>
          <planeGeometry args={[width, height]} />
          <meshBasicMaterial map={texture} toneMapped={false} />
        </mesh>

        {hovered && (photo.caption || photo.category) && (
          <Html center distanceFactor={8} position={[0, -height / 2 - 0.35, 0]} zIndexRange={[10, 0]}>
            <div className="gallery-orbit-tooltip">{photo.caption || photo.category}</div>
          </Html>
        )}
      </group>
    </Billboard>
  );
}

function Core() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (meshRef.current) meshRef.current.rotation.y += delta * 0.25;
  });

  return (
    <group>
      <mesh ref={meshRef}>
        <icosahedronGeometry args={[0.55, 1]} />
        <meshBasicMaterial color={CORE_COLOR} wireframe transparent opacity={0.55} />
      </mesh>
      <pointLight color={CORE_COLOR} intensity={3} distance={9} />
    </group>
  );
}

function SphereGallery({
  photos,
  onSelect,
  autoRotate,
}: {
  photos: GalleryPhoto[];
  onSelect: (index: number) => void;
  autoRotate: boolean;
}) {
  const positions = useMemo(() => fibonacciSphere(photos.length, SPHERE_RADIUS), [photos.length]);

  return (
    <>
      <ambientLight intensity={0.7} />
      <Core />

      <Suspense fallback={null}>
        {photos.map((photo, i) => (
          <group key={photo.id}>
            <Line points={[[0, 0, 0], positions[i]]} color={LINE_COLOR} transparent opacity={0.22} lineWidth={1} />
            <ImageNode photo={photo} position={positions[i]} onSelect={() => onSelect(i)} />
          </group>
        ))}
      </Suspense>

      <OrbitControls
        enablePan={false}
        enableZoom={false}
        autoRotate={autoRotate}
        autoRotateSpeed={0.6}
        minPolarAngle={Math.PI * 0.18}
        maxPolarAngle={Math.PI * 0.82}
        rotateSpeed={0.5}
      />
    </>
  );
}

export default function GalleryOrbitScene({
  photos,
  onSelect,
  autoRotate,
}: {
  photos: GalleryPhoto[];
  onSelect: (index: number) => void;
  autoRotate: boolean;
}) {
  return (
    <Canvas
      dpr={[1, 1.5]}
      camera={{ position: [0, 0, 9.5], fov: 48 }}
      gl={{ antialias: true, alpha: true }}
    >
      <fog attach="fog" args={["#0a0a0a", 8, 15]} />
      <SphereGallery photos={photos} onSelect={onSelect} autoRotate={autoRotate} />
    </Canvas>
  );
}
