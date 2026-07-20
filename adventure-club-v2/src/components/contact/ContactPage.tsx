"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { AlertCircle, HelpCircle, UserPlus, CreditCard, MessageCircle, Send } from "lucide-react";
import styles from "./ContactPage.module.scss";

type Category = "ISSUE" | "INFORMATION" | "SIGNUP_PROBLEM" | "PAYMENT_ISSUE";

const CATEGORIES: { value: Category; label: string; icon: typeof AlertCircle }[] = [
  { value: "ISSUE", label: "Report an Issue", icon: AlertCircle },
  { value: "INFORMATION", label: "Any Information", icon: HelpCircle },
  { value: "SIGNUP_PROBLEM", label: "Sign Up Problem", icon: UserPlus },
  { value: "PAYMENT_ISSUE", label: "Payment Issue", icon: CreditCard },
];

const CATEGORY_PHRASE: Record<Category, string> = {
  ISSUE: "an issue",
  INFORMATION: "some information",
  SIGNUP_PROBLEM: "a sign up problem",
  PAYMENT_ISSUE: "a payment issue",
};

const CATEGORY_LABELS: Record<Category, string> = {
  ISSUE: "Issue",
  INFORMATION: "Information Request",
  SIGNUP_PROBLEM: "Sign Up Problem",
  PAYMENT_ISSUE: "Payment Issue",
};

type MySubmission = {
  id: string;
  category: Category;
  message: string;
  status: string;
  reply: string | null;
  repliedAt: string | null;
  createdAt: string;
};

export default function ContactPage({ whatsappNumber }: { whatsappNumber?: string }) {
  const [category, setCategory] = useState<Category | null>(null);
  const [message, setMessage] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [mySubmissions, setMySubmissions] = useState<MySubmission[]>([]);

  async function loadMySubmissions() {
    try {
      const res = await fetch("/api/contact/my-submissions");
      if (res.ok) setMySubmissions(await res.json());
    } catch {
      // Non-critical — the page works fine without this section.
    }
  }

  useEffect(() => {
    function run() {
      loadMySubmissions();
    }

    run();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!category || !message.trim()) return;

    setSubmitting(true);
    setStatus("idle");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, message, name, email, phoneNumber }),
      });

      if (res.ok) {
        setStatus("success");
        setMessage("");
        setName("");
        setEmail("");
        setPhoneNumber("");
        setCategory(null);
        loadMySubmissions();
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    } finally {
      setSubmitting(false);
    }
  }

  const whatsappHref = whatsappNumber
    ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
        category && message.trim()
          ? `Hi, I have ${CATEGORY_PHRASE[category]} regarding Adventure Club: ${message.trim()}`
          : "Hi, I'd like to get in touch with Adventure Club SMI."
      )}`
    : null;

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <motion.div
          className={styles.heading}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <span className={styles.eyebrow}>GET IN TOUCH</span>
          <h1>Contact Us</h1>
          <p>Have a question, an issue, or something to report? Let us know.</p>
        </motion.div>

        {mySubmissions.length > 0 && (
          <div className={styles.myMessages}>
            <h2>Your Messages</h2>

            {mySubmissions.map((s) => (
              <div key={s.id} className={styles.messageCard}>
                <div className={styles.messageCardHeader}>
                  <span className={styles.categoryTag}>{CATEGORY_LABELS[s.category]}</span>
                  <span
                    className={
                      s.status === "RESOLVED" ? styles.statusResolved : styles.statusPending
                    }
                  >
                    {s.status === "RESOLVED" ? "Resolved" : "Pending"}
                  </span>
                </div>

                <p className={styles.messageText}>{s.message}</p>

                {s.reply ? (
                  <div className={styles.replyBlock}>
                    <strong>Adventure Club replied:</strong>
                    <p>{s.reply}</p>
                  </div>
                ) : (
                  <p className={styles.awaitingReply}>Awaiting a reply...</p>
                )}
              </div>
            ))}
          </div>
        )}

        {whatsappHref && (
          <a href={whatsappHref} target="_blank" rel="noreferrer" className={styles.whatsappButton}>
            <MessageCircle size={20} />
            Chat with us on WhatsApp
          </a>
        )}

        <div className={styles.card}>
          <h2>What&apos;s this about?</h2>

          <div className={styles.categoryGrid}>
            {CATEGORIES.map((c) => (
              <button
                key={c.value}
                type="button"
                className={category === c.value ? styles.categoryActive : styles.category}
                onClick={() => {
                  setCategory(c.value);
                  setStatus("idle");
                }}
              >
                <c.icon size={20} />
                {c.label}
              </button>
            ))}
          </div>

          {category && (
            <form className={styles.form} onSubmit={handleSubmit}>
              <label>Describe your concern</label>
              <textarea
                rows={5}
                placeholder="Tell us what's going on..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
              />

              <div className={styles.row}>
                <div>
                  <label>Name (optional)</label>
                  <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
                </div>

                <div>
                  <label>Email (optional)</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                  />
                </div>

                <div>
                  <label>Phone (optional)</label>
                  <input
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="Phone number"
                  />
                </div>
              </div>

              <p className={styles.hint}>
                Already logged in? We&apos;ll automatically attach your account details.
              </p>

              <button type="submit" className={styles.submitButton} disabled={submitting}>
                <Send size={16} />
                {submitting ? "Sending..." : "Send Message"}
              </button>
            </form>
          )}

          {status === "success" && (
            <p className={styles.success}>
              Thanks — your message has been sent. We&apos;ll get back to you soon.
            </p>
          )}

          {status === "error" && (
            <p className={styles.error}>Something went wrong. Please try again.</p>
          )}
        </div>
      </div>
    </section>
  );
}
