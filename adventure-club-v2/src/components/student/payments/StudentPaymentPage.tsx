"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { motion } from "framer-motion";
import { AlertTriangle, Check, Copy, Download, ShieldAlert } from "lucide-react";

import BackButton from "@/components/dashboard/shared/BackButton";
import PaymentTimeline from "./PaymentTimeline";
import styles from "./StudentPaymentPage.module.scss";

type PaymentSettings = {
  upiId: string;
  receiverName: string;
  customQrImageUrl?: string | null;
};

type PaymentRegistration = {
  id: string;
  registrationNumber: string;
  guestName?: string | null;
  user?: { fullName: string } | null;
  trek: { initialPayment: number; secondPayment: number; finalPayment: number; installments: number };
  initialPaymentPaid: boolean;
  offlinePaymentCreated: boolean;
  secondPaymentPaid: boolean;
  secondPaymentUnlocked: boolean;
  finalPaymentPaid: boolean;
  finalPaymentUnlocked: boolean;
  attendanceMarked: boolean;
};

type Props = {
  registrationId: string;
  paymentType: "INITIAL" | "SECOND" | "FINAL";
};

export default function StudentPaymentPage({ registrationId, paymentType }: Props) {
  const [registration, setRegistration] = useState<PaymentRegistration | null>(null);
  const [settings, setSettings] = useState<PaymentSettings | null>(null);
  const [qrCode, setQrCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<"upi" | "note" | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const [registrationRes, settingsRes] = await Promise.all([
          fetch(`/api/student/payment/${registrationId}`),
          fetch("/api/student/payment-settings"),
        ]);

        const registrationData = await registrationRes.json();
        const settingsData = await settingsRes.json();
        if (!active) return;

        if (!registrationRes.ok || !settingsRes.ok) {
          setError(registrationData?.message || "Unable to load payment details.");
          return;
        }

        setRegistration(registrationData);
        setSettings(settingsData);

        // An admin-uploaded QR always wins — it exists specifically because
        // the generated one didn't scan for someone, so there's no reason to
        // still build a upi:// link in that case.
        if (settingsData.customQrImageUrl) {
          if (active) setQrCode(settingsData.customQrImageUrl);
        } else {
          const amount =
            paymentType === "FINAL"
              ? registrationData.trek.finalPayment
              : paymentType === "SECOND"
              ? registrationData.trek.secondPayment
              : registrationData.trek.initialPayment;

          const paymentNote = `${registrationData.registrationNumber} - ${
            registrationData.user?.fullName ?? registrationData.guestName
          }`;

          // No `mc` (merchant category code) — the receiver is a personal
          // bank-linked VPA, not a registered merchant, and including it made
          // GPay and other apps reject the QR outright as an invalid/mismatched
          // payment type. `am` needs two decimal places — some UPI apps treat a
          // bare integer amount as malformed. This is exactly the shape of a
          // normal person-to-person GPay QR (pa + pn + am + cu + tn, no mc).
          const upiLink =
            `upi://pay?pa=${encodeURIComponent(settingsData.upiId)}` +
            `&pn=${encodeURIComponent(settingsData.receiverName)}` +
            `&am=${amount.toFixed(2)}` +
            `&cu=INR` +
            `&tn=${encodeURIComponent(paymentNote)}`;

          const qr = await QRCode.toDataURL(upiLink, {
            width: 380,
            margin: 2,
            errorCorrectionLevel: "H",
          });

          if (active) setQrCode(qr);
        }
      } catch (err) {
        console.error(err);
        if (active) setError("Unable to load payment details.");
      } finally {
        if (active) setLoading(false);
      }
    }

    load();

    return () => {
      active = false;
    };
  }, [registrationId, paymentType]);

  if (loading) {
    return <div className={styles.loading}>Loading Payment...</div>;
  }

  if (error || !registration || !settings) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <BackButton />
          <p className={styles.subtitle}>
            {error || "This payment link is no longer valid."}
          </p>
        </div>
      </div>
    );
  }

  const amount =
    paymentType === "FINAL"
      ? registration.trek.finalPayment
      : paymentType === "SECOND"
      ? registration.trek.secondPayment
      : registration.trek.initialPayment;

  const paymentNote = `${registration.registrationNumber} - ${
    registration.user?.fullName ?? registration.guestName
  }`;

  function copy(value: string, which: "upi" | "note") {
    navigator.clipboard.writeText(value);
    setCopied(which);
    setTimeout(() => setCopied(null), 2000);
  }

  function downloadQr() {
    if (!qrCode) return;

    const filename = `navira-payment-qr-${registrationId}.png`;
    const link = document.createElement("a");

    // A generated QR is already a data: URI (same-origin by definition), but
    // an admin-uploaded one is a real R2 URL — a plain <a download> is
    // silently ignored cross-origin, so that case routes through our own
    // download-proxy instead, which sets Content-Disposition itself.
    link.href = qrCode.startsWith("data:")
      ? qrCode
      : `/api/download-proxy?url=${encodeURIComponent(qrCode)}&filename=${encodeURIComponent(filename)}`;
    link.download = filename;
    link.click();
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <BackButton />

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <h1>
            {paymentType === "FINAL"
              ? "Final Payment"
              : paymentType === "SECOND"
              ? "Second Payment"
              : registration.trek.installments === 1
              ? "Full Payment"
              : "Initial Payment"}
          </h1>

          <p className={styles.subtitle}>
            Scan the QR code below with any UPI app to pay.
          </p>

          <div className={styles.reminderNote}>
            <AlertTriangle size={18} />
            <span>
              <strong>Don&apos;t forget:</strong> after paying, come back and
              tap &ldquo;I&apos;ve Completed Payment&rdquo; below to upload
              your screenshot. We can&apos;t confirm your payment until you
              do.
            </span>
          </div>

          <div className={styles.amount}>₹{amount}</div>

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrCode} alt="UPI QR" className={styles.qr} />

          <button className={styles.copy} onClick={downloadQr}>
            <Download size={16} /> Download QR Code
          </button>

          <div className={styles.instructions}>
            <p>
              <Check size={16} /> Scan using any UPI app
            </p>
            <p>
              Receiver: <strong>{settings.receiverName}</strong>
            </p>
            <p>
              Amount: <strong>₹{amount}</strong>
            </p>
            <p>
              Reference: <strong>{paymentNote}</strong>
            </p>

            <div className={styles.warning}>
              <ShieldAlert size={16} /> Please verify that your UPI app shows the
              receiver as <strong>{settings.receiverName}</strong>.
            </div>
          </div>

          <div className={styles.receiver}>
            <h3>Receiver</h3>
            <p>{settings.receiverName}</p>
          </div>

          <div className={styles.receiver}>
            <h3>UPI ID</h3>
            <p>{settings.upiId}</p>
          </div>

          <div className={styles.receiver}>
            <h3>Payment Note</h3>
            <p>{paymentNote}</p>
          </div>

          <button className={styles.copy} onClick={() => copy(settings.upiId, "upi")}>
            {copied === "upi" ? <Check size={16} /> : <Copy size={16} />}
            {copied === "upi" ? "Copied!" : "Copy UPI ID"}
          </button>

          <button className={styles.copy} onClick={() => copy(paymentNote, "note")}>
            {copied === "note" ? <Check size={16} /> : <Copy size={16} />}
            {copied === "note" ? "Copied!" : "Copy Payment Note"}
          </button>

          <a
            className={styles.done}
            href={`/student/payments/${registrationId}/proof?type=${paymentType}`}
          >
            I&apos;ve Completed Payment
          </a>

          <div className={styles.timelineWrap}>
            <PaymentTimeline registration={registration} installments={registration.trek.installments} />
          </div>
        </motion.div>
      </div>
    </div>
  );
}
