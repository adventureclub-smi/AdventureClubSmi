"use client";

import { useEffect, useRef, useState } from "react";
import jsQR from "jsqr";
import { X, CheckCircle2, ScanLine } from "lucide-react";
import styles from "./QrScannerModal.module.scss";

type Registration = {
  id: string;
  shortCode: string;
  attendanceMarked: boolean;
  user: { fullName: string; clubId: string } | null;
  guestName: string | null;
  guestPhone: string | null;
};

type Props = {
  eventId: string;
  open: boolean;
  onClose: () => void;
  onMarked: () => void;
};

// Extracts the ?code= value from whatever a scanned QR decodes to — the
// code itself works too (in case a QR from somewhere else just encodes the
// bare value), so either form is accepted.
function extractCode(raw: string): string | null {
  try {
    const url = new URL(raw);
    const code = url.searchParams.get("code");
    if (code) return code;
  } catch {
    // Not a URL — fall through and treat the raw text as the code itself.
  }
  return raw.trim() || null;
}

export default function QrScannerModal({ eventId, open, onClose, onMarked }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef(0);
  const lastCodeRef = useRef<string | null>(null);

  const [cameraError, setCameraError] = useState("");
  const [found, setFound] = useState<Registration | null>(null);
  const [lookingUp, setLookingUp] = useState(false);
  const [marking, setMarking] = useState(false);
  const [justMarked, setJustMarked] = useState(false);

  async function lookup(code: string) {
    setLookingUp(true);
    setCameraError("");

    try {
      const res = await fetch(`/api/events/${eventId}/checkin?code=${encodeURIComponent(code)}`);
      if (!res.ok) {
        lastCodeRef.current = null; // let the same bad scan be retried
        return;
      }
      const json = await res.json();
      setFound(json.registration);
      setJustMarked(false);
    } finally {
      setLookingUp(false);
    }
  }

  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    async function start() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        tick();
      } catch {
        if (!cancelled) {
          setCameraError(
            "Couldn't access the camera. Check your browser's camera permission, or use the code/name search instead."
          );
        }
      }
    }

    function tick() {
      rafRef.current = requestAnimationFrame(tick);

      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const result = jsQR(imageData.data, imageData.width, imageData.height);

      if (result?.data && result.data !== lastCodeRef.current) {
        lastCodeRef.current = result.data;
        const code = extractCode(result.data);
        if (code) lookup(code);
      }
    }

    start();

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      lastCodeRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, eventId]);

  async function markPresent() {
    if (!found) return;
    setMarking(true);

    const res = await fetch(`/api/events/${eventId}/checkin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ registrationId: found.id, present: true }),
    });

    setMarking(false);

    if (res.ok) {
      setJustMarked(true);
      onMarked();
    }
  }

  function scanNext() {
    setFound(null);
    setJustMarked(false);
    lastCodeRef.current = null;
  }

  if (!open) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2>
            <ScanLine size={18} /> Scan QR
          </h2>
          <button onClick={onClose} aria-label="Close scanner">
            <X size={20} />
          </button>
        </div>

        {!found && (
          <div className={styles.cameraWrap}>
            <video ref={videoRef} className={styles.video} playsInline muted />
            <div className={styles.scanBox} />
            {lookingUp && <p className={styles.hint}>Looking up code...</p>}
          </div>
        )}

        <canvas ref={canvasRef} style={{ display: "none" }} />

        {cameraError && <p className={styles.error}>{cameraError}</p>}

        {found && (
          <div className={styles.result}>
            <span className={styles.resultCode}>{found.shortCode}</span>
            <h3>{found.user?.fullName ?? found.guestName ?? "Guest"}</h3>
            <p className={styles.resultClubId}>{found.user?.clubId ?? found.guestPhone ?? ""}</p>

            {found.attendanceMarked || justMarked ? (
              <p className={styles.markedTag}>
                <CheckCircle2 size={18} /> Marked present
              </p>
            ) : (
              <button className={styles.markButton} disabled={marking} onClick={markPresent}>
                {marking ? "Marking..." : "Mark Present"}
              </button>
            )}

            <button className={styles.scanNextButton} onClick={scanNext}>
              Scan Another
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
