"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

const SATELLITE_COUNT = 6;
const SATELLITE_RADIUS = 1.55;

// =====================================================================
// Traces the logo PNG's own alpha silhouette into real 2D shapes, which
// get extruded into genuine 3D geometry below — the mark IS the mesh,
// rather than a flat texture glued onto a box. That's what makes a full
// continuous spin work: an extruded silhouette reads correctly (right
// depth, right edges) from every angle, including edge-on and from
// behind, unlike a textured plane which goes blank edge-on and shows a
// mirrored image from behind.
// =====================================================================

type TracedShape = { shape: THREE.Shape; isMain: boolean };

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// 4-connected flood fill to find each separate silhouette piece (the
// logo's mountain strokes aren't all one connected blob).
function findComponents(mask: Uint8Array, w: number, h: number) {
  const visited = new Uint8Array(w * h);
  const comps: { startX: number; startY: number; area: number }[] = [];
  const stack = new Int32Array(w * h);

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = y * w + x;
      if (mask[idx] !== 1 || visited[idx]) continue;

      let sp = 0;
      stack[sp++] = idx;
      visited[idx] = 1;
      let area = 0;

      while (sp > 0) {
        const cur = stack[--sp];
        area++;
        const cx = cur % w;
        const cy = (cur - cx) / w;
        if (cx + 1 < w && mask[cur + 1] === 1 && !visited[cur + 1]) {
          visited[cur + 1] = 1;
          stack[sp++] = cur + 1;
        }
        if (cx - 1 >= 0 && mask[cur - 1] === 1 && !visited[cur - 1]) {
          visited[cur - 1] = 1;
          stack[sp++] = cur - 1;
        }
        if (cy + 1 < h && mask[cur + w] === 1 && !visited[cur + w]) {
          visited[cur + w] = 1;
          stack[sp++] = cur + w;
        }
        if (cy - 1 >= 0 && mask[cur - w] === 1 && !visited[cur - w]) {
          visited[cur - w] = 1;
          stack[sp++] = cur - w;
        }
      }

      comps.push({ startX: x, startY: y, area });
    }
  }

  return comps;
}

// Moore-neighbor boundary tracing — walks the outer edge of one
// silhouette piece and returns it as an ordered list of points.
function traceBoundary(mask: Uint8Array, w: number, h: number, startX: number, startY: number) {
  const dirs = [
    [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1],
  ];
  const isFg = (x: number, y: number) => x >= 0 && y >= 0 && x < w && y < h && mask[y * w + x] === 1;
  const boundary = [{ x: startX, y: startY }];
  let cx = startX;
  let cy = startY;
  let backtrack = 4;
  let guard = 0;
  const maxSteps = w * h * 2;

  while (guard++ < maxSteps) {
    let moved = false;
    for (let i = 1; i <= 8; i++) {
      const dIdx = (backtrack + i) % 8;
      const d = dirs[dIdx];
      const nx = cx + d[0];
      const ny = cy + d[1];
      if (isFg(nx, ny)) {
        backtrack = (dIdx + 4) % 8;
        cx = nx;
        cy = ny;
        boundary.push({ x: cx, y: cy });
        moved = true;
        break;
      }
    }
    if (!moved) break;
    if (cx === startX && cy === startY && boundary.length > 3) break;
  }

  return boundary;
}

function simplify(points: { x: number; y: number }[], epsilon: number): { x: number; y: number }[] {
  if (points.length < 3) return points;

  function perpDist(pt: { x: number; y: number }, a: { x: number; y: number }, b: { x: number; y: number }) {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.hypot(dx, dy);
    if (len === 0) return Math.hypot(pt.x - a.x, pt.y - a.y);
    const u = ((pt.x - a.x) * dx + (pt.y - a.y) * dy) / (len * len);
    const cx = a.x + u * dx;
    const cy = a.y + u * dy;
    return Math.hypot(pt.x - cx, pt.y - cy);
  }

  function dp(pts: { x: number; y: number }[]): { x: number; y: number }[] {
    if (pts.length < 3) return pts;
    let maxD = 0;
    let idx = 0;
    for (let i = 1; i < pts.length - 1; i++) {
      const d = perpDist(pts[i], pts[0], pts[pts.length - 1]);
      if (d > maxD) {
        maxD = d;
        idx = i;
      }
    }
    if (maxD > epsilon) {
      const left = dp(pts.slice(0, idx + 1));
      const right = dp(pts.slice(idx));
      return left.slice(0, -1).concat(right);
    }
    return [pts[0], pts[pts.length - 1]];
  }

  return dp(points);
}

async function traceLogoToShapes(src: string): Promise<TracedShape[]> {
  const img = await loadImage(src);
  const w = img.naturalWidth;
  const h = img.naturalHeight;

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2D canvas context unavailable");
  ctx.drawImage(img, 0, 0, w, h);
  const data = ctx.getImageData(0, 0, w, h).data;

  const mask = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) mask[i] = data[i * 4 + 3] > 120 ? 1 : 0;

  let comps = findComponents(mask, w, h).filter((c) => c.area > w * h * 0.002);
  if (!comps.length) throw new Error("No logo silhouette found");
  comps.sort((a, b) => b.area - a.area);
  comps = comps.slice(0, 6);

  const maxDim = Math.max(w, h);
  const targetSize = 2;

  // Raw (pre-shape) point arrays first, so the overall bounding box can be
  // computed across every piece before committing to THREE.Shape objects —
  // the traced silhouette isn't perfectly centered in the source canvas,
  // so this keeps the emblem centered on the rotation axis instead of
  // wobbling around some off-center point.
  const pieces = comps
    .map((comp, i) => {
      const raw = traceBoundary(mask, w, h, comp.startX, comp.startY);
      const pts = simplify(raw, 1.2).map((p) => ({
        x: ((p.x - w / 2) / maxDim) * targetSize,
        y: -((p.y - h / 2) / maxDim) * targetSize,
      }));
      return { pts, isMain: i === 0 };
    })
    .filter((p) => p.pts.length >= 8);

  if (!pieces.length) throw new Error("Logo tracing produced no usable geometry");

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const { pts } of pieces) {
    for (const p of pts) {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    }
  }
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const scale = targetSize / Math.max(maxX - minX, maxY - minY, 0.001);

  return pieces.map(({ pts, isMain }) => {
    const shape = new THREE.Shape();
    pts.forEach((p, i) => {
      const x = (p.x - cx) * scale;
      const y = (p.y - cy) * scale;
      if (i === 0) shape.moveTo(x, y);
      else shape.lineTo(x, y);
    });
    shape.closePath();
    return { shape, isMain };
  });
}

function LogoEmblem({ shapes }: { shapes: TracedShape[] }) {
  const groupRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const satellitesRef = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (groupRef.current) {
      // A traced silhouette (unlike a textured plane) reads correctly from
      // every angle, so this can spin all the way around continuously
      // instead of the swivel-in-place a flat texture would need.
      groupRef.current.rotation.y += delta * 0.35;
      groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.4) * 0.12;
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.8) * 0.06;
    }
    if (ringRef.current) {
      ringRef.current.rotation.z += delta * 0.15;
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
        {shapes.map(({ shape, isMain }, i) => (
          <mesh key={i}>
            <extrudeGeometry
              args={[
                shape,
                {
                  depth: isMain ? 0.34 : 0.24,
                  bevelEnabled: true,
                  bevelThickness: 0.03,
                  bevelSize: 0.03,
                  bevelSegments: 3,
                  curveSegments: 4,
                },
              ]}
            />
            <meshStandardMaterial
              color={isMain ? "#00a073" : "#00d68f"}
              emissive={isMain ? "#00382a" : "#001f17"}
              emissiveIntensity={0.6}
              metalness={0.45}
              roughness={0.32}
            />
          </mesh>
        ))}
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

// Procedural fallback if the source image can't be traced for any reason
// (decode failure, no usable silhouette, etc.) — keeps the splash's 3D
// slot filled with *something* on-brand rather than an empty canvas.
function FallbackEmblem() {
  const ref = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.rotation.y += delta * 0.4;
      ref.current.rotation.x += delta * 0.15;
    }
  });

  return (
    <mesh ref={ref}>
      <icosahedronGeometry args={[1, 1]} />
      <meshStandardMaterial color="#00a073" emissive="#00382a" emissiveIntensity={0.6} metalness={0.45} roughness={0.32} />
    </mesh>
  );
}

function TracedLogo() {
  const [shapes, setShapes] = useState<TracedShape[] | null | "error">(null);

  useEffect(() => {
    let active = true;

    traceLogoToShapes("/logo/logo-bluegreen.png")
      .then((result) => {
        if (active) setShapes(result);
      })
      .catch(() => {
        if (active) setShapes("error");
      });

    return () => {
      active = false;
    };
  }, []);

  if (shapes === null) return null;
  if (shapes === "error") return <FallbackEmblem />;
  return <LogoEmblem shapes={shapes} />;
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
        <TracedLogo />
      </Suspense>
    </Canvas>
  );
}
