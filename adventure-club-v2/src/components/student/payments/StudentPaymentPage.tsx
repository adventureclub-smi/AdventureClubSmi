"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { motion } from "framer-motion";
import { Check, Copy, ShieldAlert, Smartphone } from "lucide-react";

import BackButton from "@/components/dashboard/shared/BackButton";
import PaymentTimeline from "./PaymentTimeline";
import styles from "./StudentPaymentPage.module.scss";

type PaymentSettings = {
  upiId: string;
  receiverName: string;
};

type PaymentRegistration = {
  id: string;
  registrationNumber: string;
  guestName?: string | null;
  user?: { fullName: string } | null;
  trek: { initialPayment: number; finalPayment: number; installments: number };
  initialPaymentPaid: boolean;
  offlinePaymentCreated: boolean;
  finalPaymentPaid: boolean;
  finalPaymentUnlocked: boolean;
  attendanceMarked: boolean;
};

type Props = {
  registrationId: string;
  paymentType: "INITIAL" | "FINAL";
};

export default function StudentPaymentPage({ registrationId, paymentType }: Props) {
  const [registration, setRegistration] = useState<PaymentRegistration | null>(null);
  const [settings, setSettings] = useState<PaymentSettings | null>(null);
  const [qrCode, setQrCode] = useState("");
  const [loading, setLoading] = useState(true);
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

        setRegistration(registrationData);
        setSettings(settingsData);

        const amount =
          paymentType === "FINAL"
            ? registrationData.trek.finalPayment
            : registrationData.trek.initialPayment;

        const paymentNote = `${registrationData.registrationNumber} - ${
          registrationData.user?.fullName ?? registrationData.guestName
        }`;

        const upiLink =
          `upi://pay?pa=${settingsData.upiId}` +
          `&pn=${encodeURIComponent(settingsData.receiverName)}` +
          `&mc=8299` +
          `&am=${amount}` +
          `&cu=INR` +
          `&tn=${encodeURIComponent(paymentNote)}`;

        const qr = await QRCode.toDataURL(upiLink, {
          width: 380,
          margin: 2,
          errorCorrectionLevel: "H",
        });

        if (active) setQrCode(qr);
      } catch (err) {
        console.error(err);
      } finally {
        if (active) setLoading(false);
      }
    }

    load();

    return () => {
      active = false;
    };
  }, [registrationId, paymentType]);

  if (loading || !registration || !settings) {
    return <div className={styles.loading}>Loading Payment...</div>;
  }

  const amount =
    paymentType === "FINAL" ? registration.trek.finalPayment : registration.trek.initialPayment;

  const paymentNote = `${registration.registrationNumber} - ${
    registration.user?.fullName ?? registration.guestName
  }`;

  const upiLink =
    `upi://pay?pa=${settings.upiId}` +
    `&pn=${encodeURIComponent(settings.receiverName)}` +
    `&mc=8299` +
    `&am=${amount}` +
    `&cu=INR` +
    `&tn=${encodeURIComponent(paymentNote)}`;

  function copy(value: string, which: "upi" | "note") {
    navigator.clipboard.writeText(value);
    setCopied(which);
    setTimeout(() => setCopied(null), 2000);
  }

  function fallbackUPI() {
    window.location.href = upiLink;
  }

  function openApp(scheme: string) {
    window.location.href = `${scheme}?${upiLink.replace("upi://pay?", "")}`;
    setTimeout(fallbackUPI, 1200);
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <BackButton />

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <h1>
            {paymentType === "FINAL"
              ? "Final Payment"
              : registration.trek.installments === 1
              ? "Full Payment"
              : "Initial Payment"}
          </h1>

          <p className={styles.subtitle}>
            Scan the QR or pay using your favourite UPI app.
          </p>

          <div className={styles.amount}>₹{amount}</div>

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrCode} alt="UPI QR" className={styles.qr} />

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

          <div className={styles.buttons}>
            <button className={styles.gpay} onClick={() => openApp("gpay://upi/pay")}>
              <Smartphone size={18} /> Google Pay
            </button>

            <button className={styles.phonepe} onClick={() => openApp("phonepe://pay")}>
              <Smartphone size={18} /> PhonePe
            </button>

            <button className={styles.paytm} onClick={() => openApp("paytmmp://pay")}>
              <Smartphone size={18} /> Paytm
            </button>
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
