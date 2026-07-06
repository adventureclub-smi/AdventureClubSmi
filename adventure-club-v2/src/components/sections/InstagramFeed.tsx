"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Camera, ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";

import type { InstagramPostSummary } from "@/data/instagram";
import styles from "./InstagramFeed.module.scss";

export default function InstagramFeed({ posts }: { posts: InstagramPostSummary[] }) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (posts.length === 0) {
    return (
      <section className={styles.section} id="instagram">
        <div className={styles.container}>
          <div className={styles.heading}>
            <span className={styles.eyebrow}>ON INSTAGRAM</span>
            <h2>Follow the Adventure.</h2>
          </div>

          <div className={styles.empty}>
            <Camera size={30} />
            <h3>Posts Coming Soon</h3>
            <p>
              Follow{" "}
              <a
                href="https://www.instagram.com/adventure_smi"
                target="_blank"
                rel="noopener noreferrer"
              >
                @adventure_smi
              </a>{" "}
              — recent posts will show up here.
            </p>
          </div>
        </div>
      </section>
    );
  }

  const active = posts[activeIndex];

  function goTo(index: number) {
    setActiveIndex((index + posts.length) % posts.length);
  }

  return (
    <section className={styles.section} id="instagram">
      <div className={styles.container}>
        <motion.div
          className={styles.heading}
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <span className={styles.eyebrow}>ON INSTAGRAM</span>
          <h2>Follow the Adventure.</h2>
          <p className={styles.tagline}>
            The behind-the-scenes, the sunrise summits, the campfire chaos —
            it all lives on our feed.
          </p>
        </motion.div>

        <div className={styles.stage}>
          {posts.length > 1 && (
            <button
              type="button"
              className={`${styles.navButton} ${styles.navPrev}`}
              onClick={() => goTo(activeIndex - 1)}
              aria-label="Previous post"
            >
              <ChevronLeft size={22} />
            </button>
          )}

          <div className={styles.coverflow}>
            {posts.map((post, i) => {
              const offset = i - activeIndex;
              const abs = Math.abs(offset);
              const isActive = offset === 0;

              return (
                <motion.a
                  key={post.id}
                  href={isActive ? post.postUrl : undefined}
                  target={isActive ? "_blank" : undefined}
                  rel={isActive ? "noopener noreferrer" : undefined}
                  className={`${styles.slide} ${isActive ? styles.slideActive : ""}`}
                  style={{ zIndex: 100 - abs }}
                  animate={{
                    x: `${offset * 62}%`,
                    rotateY: Math.max(-55, Math.min(55, -offset * 38)),
                    scale: Math.max(0.55, 1 - abs * 0.12),
                    opacity: Math.max(0.35, 1 - abs * 0.18),
                  }}
                  transition={{ type: "spring", stiffness: 300, damping: 32 }}
                  onClick={(e) => {
                    if (!isActive) {
                      e.preventDefault();
                      goTo(i);
                    }
                  }}
                  aria-label={
                    isActive ? `View "${post.caption || "post"}" on Instagram` : "View this post"
                  }
                >
                  <Image
                    src={post.thumbnailUrl}
                    alt={post.caption || "Instagram post"}
                    fill
                    sizes="(max-width: 700px) 70vw, 340px"
                    className={`${styles.slideImage} ${
                      isActive ? styles.slideImageActive : ""
                    }`}
                  />

                  {isActive && (
                    <span className={styles.viewIcon}>
                      <ExternalLink size={16} />
                    </span>
                  )}
                </motion.a>
              );
            })}
          </div>

          {posts.length > 1 && (
            <button
              type="button"
              className={`${styles.navButton} ${styles.navNext}`}
              onClick={() => goTo(activeIndex + 1)}
              aria-label="Next post"
            >
              <ChevronRight size={22} />
            </button>
          )}
        </div>

        <motion.div
          key={active.id}
          className={styles.nowViewing}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          {active.caption && <p className={styles.caption}>{active.caption}</p>}

          <a
            href={active.postUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.followButton}
          >
            <Camera size={15} />
            View on Instagram
            <ExternalLink size={13} />
          </a>
        </motion.div>
      </div>
    </section>
  );
}
