"use client";

import { useRef } from "react";
import dynamic from "next/dynamic";
import { motion, useInView } from "framer-motion";

import { useScrollReveal } from "@/hooks/useScrollReveal";
import styles from "./GearShowcase.module.scss";

// Three.js touches the GPU/canvas — never render it on the server, and only
// pull the bundle in once the browser actually needs it, same isolation
// pattern as the Hero's 3D scene and the trek route map.
const GearScene = dynamic(() => import("@/components/three/GearScene"), {
  ssr: false,
});

const GEAR_ITEMS = [
  { id: "backpack", label: "Backpack", model: "/models/backpack.glb" },
  { id: "boots", label: "Trekking Boots", model: "/models/boots.glb" },
  { id: "cap", label: "Cap", model: "/models/cap.glb" },
  { id: "compass", label: "Compass", model: "/models/compass.glb" },
  { id: "firstAid", label: "First Aid Kit", model: "/models/firstAid.glb" },
  { id: "flashlight", label: "Flashlight", model: "/models/flashlight.glb" },
  { id: "kayak", label: "Kayak", model: "/models/kayak.glb" },
  { id: "snackBar", label: "Trail Snacks", model: "/models/snackBar.glb" },
  { id: "tent", label: "Tent", model: "/models/tent.glb" },
  { id: "waterBottle", label: "Water Bottle", model: "/models/waterBottle.glb" },
];

export default function GearShowcase() {
  const revealRef = useRef<HTMLDivElement>(null);
  const revealStyle = useScrollReveal(revealRef);
  const rowRef = useRef<HTMLDivElement>(null);
  // Ten simultaneous WebGL canvases, each with its own continuous
  // requestAnimationFrame loop, were rendering non-stop for as long as the
  // homepage stayed mounted — including while scrolled way past this
  // section — which is what made scrolling the rest of the page janky.
  // Pausing them outside the viewport (generous margin so they're already
  // spinning by the time this row scrolls into view) fixes that.
  const rowInView = useInView(rowRef, { margin: "300px" });

  return (
    <section className={styles.section} id="gear">
      <motion.div ref={revealRef} style={revealStyle}>
        <div className={styles.headingWrap}>
          <span className={styles.eyebrow}>PACK SMART</span>
          <h2>Everything You&apos;ll Need.</h2>
        </div>

        <div className={styles.row} ref={rowRef}>
          {GEAR_ITEMS.map((item) => (
            <div key={item.id} className={styles.item}>
              <div className={styles.itemStage}>
                <GearScene modelUrl={item.model} active={rowInView} />
              </div>
              <span className={styles.itemLabel}>{item.label}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
