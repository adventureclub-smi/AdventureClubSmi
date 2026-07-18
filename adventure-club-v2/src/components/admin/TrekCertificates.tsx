"use client";

import { useEffect, useState } from "react";
import { ExternalLink, RotateCcw, Send, Sparkles } from "lucide-react";

import styles from "./CertificatesManager.module.scss";

type Candidate = { id: string; participant: string };

type Issued = {
  id: string;
  participant: string;
  certificateUrl: string | null;
  issuedAt: string | null;
};

export default function TrekCertificates({ trekId }: { trekId: string }) {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [issued, setIssued] = useState<Issued[]>([]);
  const [loading, setLoading] = useState(true);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [issuing, setIssuing] = useState<string | null>(null);
  const [generating, setGenerating] = useState<string | null>(null);
  const [undoing, setUndoing] = useState<string | null>(null);
  const [bulkGenerating, setBulkGenerating] = useState(false);
  const [bulkProgress, setBulkProgress] = useState<{ done: number; total: number } | null>(null);
  const [status, setStatus] = useState("");

  async function load() {
    try {
      const res = await fetch(`/api/admin/certificates?trekId=${trekId}`);
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
        const res = await fetch(`/api/admin/certificates?trekId=${trekId}`);
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
  }, [trekId]);

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

  async function handleGenerateAll() {
    setBulkGenerating(true);
    setStatus("");

    const registrationIds = candidates.map((c) => c.id);
    let succeeded = 0;
    const failedNames: string[] = [];

    for (let i = 0; i < registrationIds.length; i++) {
      setBulkProgress({ done: i, total: registrationIds.length });

      try {
        const res = await fetch("/api/admin/certificates/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ registrationId: registrationIds[i] }),
        });

        if (res.ok) {
          succeeded++;
        } else {
          failedNames.push(registrationIds[i]);
        }
      } catch {
        failedNames.push(registrationIds[i]);
      }
    }

    setBulkProgress(null);
    setBulkGenerating(false);

    setStatus(
      failedNames.length === 0
        ? `Generated all ${succeeded} certificates.`
        : `Generated ${succeeded} of ${registrationIds.length} — ${failedNames.length} failed, try those individually.`
    );

    load();
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

  if (loading) {
    return <p className={styles.hint}>Loading...</p>;
  }

  if (candidates.length === 0 && issued.length === 0) {
    return (
      <div className={styles.empty}>
        No one on this trek is ready for a certificate yet — attendance has to be
        marked first.
      </div>
    );
  }

  return (
    <div>
      {status && <p className={styles.status}>{status}</p>}

      {candidates.length > 0 && (
        <>
          <div className={styles.trekHeader}>
            <p className={styles.subheading}>Ready to Issue ({candidates.length})</p>

            <button
              className={styles.generateAllButton}
              onClick={handleGenerateAll}
              disabled={bulkGenerating}
            >
              <Sparkles size={14} />
              {bulkGenerating
                ? `Generating ${(bulkProgress?.done ?? 0) + 1}/${candidates.length}...`
                : `Generate All (${candidates.length})`}
            </button>
          </div>

          <div className={styles.list}>
            {candidates.map((c) => (
              <div key={c.id} className={styles.row}>
                <div>
                  <strong>{c.participant}</strong>
                </div>

                <button
                  className={styles.generateButton}
                  onClick={() => handleGenerate(c.id)}
                  disabled={generating === c.id || issuing === c.id || bulkGenerating}
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
        </>
      )}

      {issued.length > 0 && (
        <>
          <p className={styles.subheading}>Issued ({issued.length})</p>

          <div className={styles.list}>
            {issued.map((c) => (
              <div key={c.id} className={styles.row}>
                <div>
                  <strong>{c.participant}</strong>
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
        </>
      )}
    </div>
  );
}
