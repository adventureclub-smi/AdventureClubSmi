"use client";

import { useEffect, useState } from "react";

// Non-standard Chrome/Edge event — no official DOM lib type exists for it.
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

// Wraps the browser's native "Add to Home Screen" / "Install App" prompt.
// Only fires on browsers that support it (Chrome/Edge on Android and
// desktop) — Safari has no equivalent event, so canInstall stays false
// there and callers should just hide the button.
export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    function onBeforeInstallPrompt(e: Event) {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    }

    function onInstalled() {
      setDeferredPrompt(null);
    }

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  async function promptInstall() {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
  }

  return { canInstall: !!deferredPrompt, promptInstall };
}
