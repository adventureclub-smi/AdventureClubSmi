"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import styles from "./Timeline.module.scss";

gsap.registerPlugin(ScrollTrigger);

const steps = ["Registration", "Meetup", "Journey", "Summit", "Camp", "Return"];

export default function Timeline() {
  const containerRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      gsap.fromTo(
        lineRef.current,
        { scaleY: 0 },
        {
          scaleY: 1,
          ease: "none",
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top 70%",
            end: "bottom 60%",
            scrub: 0.6,
          },
        }
      );

      gsap.utils.toArray<HTMLElement>(`.${styles.node}`).forEach((node) => {
        gsap.fromTo(
          node,
          { opacity: 0, x: -30 },
          {
            opacity: 1,
            x: 0,
            duration: 0.6,
            scrollTrigger: {
              trigger: node,
              start: "top 82%",
              toggleActions: "play none none reverse",
            },
          }
        );
      });
    },
    { scope: containerRef }
  );

  return (
    <section className={styles.timeline} ref={containerRef}>
      <div className={styles.container}>
        <div className={styles.heading}>
          <span className={styles.eyebrow}>CHAPTER 06</span>
          <h2>The Timeline.</h2>
        </div>

        <div className={styles.track}>
          <div className={styles.lineTrack}>
            <div className={styles.line} ref={lineRef} />
          </div>

          <div className={styles.nodes}>
            {steps.map((step, i) => (
              <div key={step} className={styles.node}>
                <span className={styles.index}>{`0${i + 1}`}</span>
                <h3>{step}</h3>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
