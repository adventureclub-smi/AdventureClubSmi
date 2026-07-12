"use client";

import type { RefObject } from "react";
import { useEffect } from "react";
import { useInView } from "framer-motion";

// Ambient background videos only start downloading/playing once their
// section actually scrolls into view, and pause again once it's scrolled
// away — avoids burning bandwidth (and CPU) on videos nobody's looking at.
// Pair with preload="none" and no `autoPlay` attribute on the <video>.
//
// Takes the target ref rather than creating one itself, matching
// useScrollReveal's convention — an internally-owned ref would make the
// react-hooks/refs lint rule flag the whole returned value.
export function useLazyVideo(ref: RefObject<HTMLVideoElement | null>) {
  const inView = useInView(ref, { margin: "200px" });

  useEffect(() => {
    const video = ref.current;
    if (!video) return;

    if (inView) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, [inView, ref]);

  return inView;
}
