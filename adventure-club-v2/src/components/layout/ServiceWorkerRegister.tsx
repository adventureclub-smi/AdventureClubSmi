"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Non-critical — the site works fine without it, it just won't
        // be installable as an app.
      });
    }
  }, []);

  return null;
}
