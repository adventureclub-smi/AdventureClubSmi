"use client";

import { useEffect, useState } from "react";
import { Award, ExternalLink, RotateCcw, Send, Sparkles } from "lucide-react";

import PageHeader from "@/components/admin/shared/PageHeader";
import styles from "./CertificatesManager.module.scss";

type Candidate = { id: string; participant: string; trekTitle: string };

type Issued = {
  id: string;
  participant: string;
  trekTitle: string;
  certificateUrl: string | null;
  issuedAt: string | null;
};

export default function CertificatesManager() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [issued, setIssued] = useState<Issued[]>([]);
  const [loading, setLoading] = useState(true);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [issuing, setIssuing] = useState<string | null>(null);
  const [generating, setGenerating] = useState<string | null>(null);
  const [undoing, setUndoing] = useState<string | null>(null);
  const [status, setStatus] = useState("");

  async function load() {
    try {
      const res = await fetch("/api/admin/certificates");
      if (!res.ok) return;
      const data = await res.json();
      setCandidates(data.candidates);
      setIssued(data.issued);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;

    async function initialLoad() {
      try {
        const res = await fetch("/api/admin/certificates");
        if (!active || !res.ok) return;
        const data = await res.json();
        setCandidates(data.candidates);
        setIssued(data.issued);
      } finally {
        if (active) setLoading(false);
      }
    }

    initialLoad();

    return () => {
      active = false;
    };
  }, []);

  async function handleIssue(registrationId: string) {
    const certificateUrl = urls[registrationId];

    if (!certificateUrl) {
      setStatus("Paste a certificate URL first.");
      return;
    }

    setIssuing(registrationId);
    setStatus("");

    try {
      const res = await fetch("/api/admin/certificates/issue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registrationId, certificateUrl }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus(data.message || "Failed to issue certificate.");
        return;
      }

      setStatus("Certificate issued.");
      load();
    } finally {
      setIssuing(null);
    }
  }

  async function handleGenerate(registrationId: string) {
    setGenerating(registrationId);
    setStatus("");

    try {
      const res = await fetch("/api/admin/certificates/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registrationId }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus(data.message || "Failed to generate certificate.");
        return;
      }

      setStatus("Certificate generated and issued.");
      load();
    } finally {
      setGenerating(null);
    }
  }

  async function handleUndo(registrationId: string) {
    if (
      !confirm(
        "Undo this certificate? It will disappear from the student's dashboard, and you'll be able to generate a fresh one."
      )
    ) {
      return;
    }

    setUndoing(registrationId);
    setStatus("");

    try {
      const res = await fetch("/api/admin/certificates/undo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registrationId }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus(data.message || "Failed to undo certificate.");
        return;
      }

      setStatus("Certificate undone.");
      load();
    } finally {
      setUndoing(null);
    }
  }

  return (
    <div className={styles.container}>
      <PageHeader
        title="Certificates"
        breadcrumb={[{ label: "Admin", href: "/admin" }, { label: "Certificates" }]}
      />

      {status && <p className={styles.status}>{status}</p>}

      {loading ? (
        <p className={styles.hint}>Loading...</p>
      ) : (
        <>
          <section className={styles.section}>
            <h2>
              <Award size={18} /> Ready to Issue ({candidates.length})
            </h2>

            {candidates.length === 0 ? (
              <div className={styles.empty}>
                No completed treks awaiting certificates right now.
              </div>
            ) : (
              <div className={styles.list}>
                {candidates.map((c) => (
                  <div key={c.id} className={styles.row}>
                    <div>
                      <strong>{c.participant}</strong>
                      <p>{c.trekTitle}</p>
                    </div>

                    <button
                      className={styles.generateButton}
                      onClick={() => handleGenerate(c.id)}
                      disabled={generating === c.id || issuing === c.id}
                    >
                      <Sparkles size={14} />
                      {generating === c.id ? "Generating..." : "Generate Certificate"}
                    </button>

                    <input
                      placeholder="Or paste a certificate URL manually"
                      value={urls[c.id] || ""}
                      onChange={(e) => setUrls({ ...urls, [c.id]: e.target.value })}
                    />

                    <button
                      onClick={() => handleIssue(c.id)}
                      disabled={issuing === c.id || generating === c.id}
                    >
                      <Send size={14} />
                      {issuing === c.id ? "Issuing..." : "Issue"}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className={styles.section}>
            <h2>Issued Certificates ({issued.length})</h2>

            {issued.length === 0 ? (
              <div className={styles.empty}>No certificates issued yet.</div>
            ) : (
              <div className={styles.list}>
                {issued.map((c) => (
                  <div key={c.id} className={styles.row}>
                    <div>
                      <strong>{c.participant}</strong>
                      <p>{c.trekTitle}</p>
                    </div>

                    {c.certificateUrl && (
                      <a href={c.certificateUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink size={14} /> View
                      </a>
                    )}

                    <button
                      className={styles.undoButton}
                      onClick={() => handleUndo(c.id)}
                      disabled={undoing === c.id}
                    >
                      <RotateCcw size={14} />
                      {undoing === c.id ? "Undoing..." : "Undo"}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
