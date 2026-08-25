"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import styles from "./CopyLinkButton.module.scss";

export default function CopyLinkButton({
  path,
  label = "Copy Link",
  iconOnly = false,
  className,
}: {
  // A relative path (e.g. "/treks/123") — resolved against the current
  // origin only inside the click handler, never at render time, so this
  // never touches `window` during the server-rendered/pre-hydration pass.
  path: string;
  label?: string;
  iconOnly?: boolean;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(`${window.location.origin}${path}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <button
      type="button"
      className={[styles.button, className].filter(Boolean).join(" ")}
      onClick={copy}
      aria-label={label}
      title={label}
    >
      {copied ? <Check size={14} /> : <Copy size={14} />}
      {!iconOnly && <span>{copied ? "Copied!" : label}</span>}
    </button>
  );
}
