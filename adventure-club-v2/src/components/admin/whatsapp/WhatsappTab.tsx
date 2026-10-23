"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, CheckCircle2, XCircle, MessageCircle, Copy, Check } from "lucide-react";
import styles from "./WhatsappTab.module.scss";

type WhatsappRegistration = {
  id: string;
  isGuest: boolean;
  guestName: string | null;
  guestPhoneNumber: string | null;
  whatsappInviteSentAt: string | null;
  whatsappGroupJoined: boolean;
  user: {
    fullName: string;
    clubId: string;
    phoneNumber?: string;
  } | null;
};

type FilterOption = "all" | "notSent" | "sent" | "joined" | "notJoined";

const FILTER_OPTIONS: { value: FilterOption; label: string }[] = [
  { value: "all", label: "All Approved" },
  { value: "notSent", label: "Invite Not Sent" },
  { value: "sent", label: "Invite Sent" },
  { value: "joined", label: "In Group" },
  { value: "notJoined", label: "Not in Group Yet" },
];

export default function WhatsappTab({ trekId }: { trekId: string }) {
  const [registrations, setRegistrations] = useState<WhatsappRegistration[]>([]);
  const [groupLink, setGroupLink] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterBy, setFilterBy] = useState<FilterOption>("all");
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  async function fetchRegistrations() {
    try {
      const res = await fetch(`/api/admin/treks/${trekId}/whatsapp`);
      const data = await res.json();
      setRegistrations(Array.isArray(data.registrations) ? data.registrations : []);
      setGroupLink(data.whatsappGroupLink ?? null);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchRegistrations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trekId]);

  async function sendInvite(registrationId: string) {
    setSendingId(registrationId);

    try {
      const res = await fetch(
        `/api/admin/registrations/${registrationId}/resend-whatsapp-invite`,
        { method: "POST" }
      );

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Failed to send WhatsApp invite.");
        return;
      }

      await fetchRegistrations();
    } catch (err) {
      console.error(err);
      alert("Something went wrong.");
    } finally {
      setSendingId(null);
    }
  }

  async function copyPhone(registrationId: string, phone: string) {
    try {
      await navigator.clipboard.writeText(phone);
      setCopiedId(registrationId);
      setTimeout(() => setCopiedId((current) => (current === registrationId ? null : current)), 1500);
    } catch (err) {
      console.error(err);
    }
  }

  async function toggleJoined(registrationId: string, current: boolean) {
    setTogglingId(registrationId);

    try {
      await fetch(`/api/admin/registrations/${registrationId}/whatsapp-group-joined`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ joined: !current }),
      });

      await fetchRegistrations();
    } catch (err) {
      console.error(err);
    } finally {
      setTogglingId(null);
    }
  }

  const stats = useMemo(() => {
    const total = registrations.length;
    const sent = registrations.filter((r) => r.whatsappInviteSentAt).length;
    const joined = registrations.filter((r) => r.whatsappGroupJoined).length;
    return { total, sent, joined };
  }, [registrations]);

  const filtered = useMemo(() => {
    return registrations.filter((registration) => {
      const name = registration.user?.fullName ?? registration.guestName ?? "";
      const clubId = registration.user?.clubId ?? "";
      const phone = registration.user?.phoneNumber ?? registration.guestPhoneNumber ?? "";

      const matchesSearch =
        name.toLowerCase().includes(search.toLowerCase()) ||
        clubId.toLowerCase().includes(search.toLowerCase()) ||
        phone.includes(search);

      if (!matchesSearch) return false;

      switch (filterBy) {
        case "notSent":
          return !registration.whatsappInviteSentAt;
        case "sent":
          return !!registration.whatsappInviteSentAt;
        case "joined":
          return registration.whatsappGroupJoined;
        case "notJoined":
          return !registration.whatsappGroupJoined;
        default:
          return true;
      }
    });
  }, [registrations, search, filterBy]);

  if (loading) {
    return <div className={styles.loading}>Loading WhatsApp list...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <p>
          Everyone approved for this free entry — send the WhatsApp group
          invite and track who's actually joined.
        </p>

        <div className={styles.searchWrap}>
          <Search size={15} />
          <input
            type="text"
            placeholder="Search by name / club ID / phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={styles.search}
          />
        </div>
      </div>

      {!groupLink && (
        <div className={styles.noLinkNotice}>
          No WhatsApp group link set for this trek yet — add one in Trip
          Centre before sending invites.
        </div>
      )}

      <div className={styles.filterBar}>
        <select value={filterBy} onChange={(e) => setFilterBy(e.target.value as FilterOption)}>
          {FILTER_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <span className={styles.resultCount}>{filtered.length} shown</span>
      </div>

      <div className={styles.stats}>
        <div className={styles.statCard}>
          <h2>{stats.total}</h2>
          <span>Approved</span>
        </div>

        <div className={styles.statCard}>
          <h2>{stats.sent}</h2>
          <span>Invite Sent</span>
        </div>

        <div className={styles.statCard}>
          <h2>{stats.joined}</h2>
          <span>In Group</span>
        </div>
      </div>

      <div className={styles.cards}>
        {filtered.length === 0 ? (
          <div className={styles.empty}>No approved participants found.</div>
        ) : (
          filtered.map((registration) => {
            const participant =
              registration.user?.fullName ?? registration.guestName ?? "Unknown Participant";
            const clubId = registration.user?.clubId ?? "Guest";
            const phone = registration.user?.phoneNumber ?? registration.guestPhoneNumber;

            return (
              <div
                key={registration.id}
                className={registration.isGuest ? `${styles.card} ${styles.guestCard}` : styles.card}
              >
                <div>
                  <div className={styles.nameRow}>
                    <h3>{participant}</h3>
                    {registration.isGuest && <span className={styles.guestBadge}>Guest</span>}
                  </div>
                  <p>{clubId}</p>
                  {phone && (
                    <div className={styles.phoneRow}>
                      <p className={styles.phoneHint}>{phone}</p>
                      <button
                        type="button"
                        className={styles.copyButton}
                        onClick={() => copyPhone(registration.id, phone)}
                        aria-label="Copy phone number"
                      >
                        {copiedId === registration.id ? (
                          <>
                            <Check size={12} /> Copied
                          </>
                        ) : (
                          <>
                            <Copy size={12} /> Copy
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>

                <div className={styles.status}>
                  <div className={styles.statusRow}>
                    {registration.whatsappInviteSentAt ? (
                      <strong className={styles.success}>
                        <CheckCircle2 size={15} /> Invite Sent
                      </strong>
                    ) : (
                      <strong className={styles.warning}>
                        <MessageCircle size={15} /> Not Sent
                      </strong>
                    )}

                    <button
                      className={styles.sendButton}
                      disabled={sendingId === registration.id || !groupLink}
                      onClick={() => sendInvite(registration.id)}
                    >
                      {sendingId === registration.id
                        ? "Sending..."
                        : registration.whatsappInviteSentAt
                        ? "Resend"
                        : "Send Invite"}
                    </button>
                  </div>

                  <div className={styles.statusRow}>
                    {registration.whatsappGroupJoined ? (
                      <strong className={styles.success}>
                        <CheckCircle2 size={15} /> In Group
                      </strong>
                    ) : (
                      <strong className={styles.warning}>
                        <XCircle size={15} /> Not Joined Yet
                      </strong>
                    )}

                    <button
                      className={registration.whatsappGroupJoined ? styles.undoButton : styles.sendButton}
                      disabled={togglingId === registration.id}
                      onClick={() => toggleJoined(registration.id, registration.whatsappGroupJoined)}
                    >
                      {togglingId === registration.id
                        ? "Updating..."
                        : registration.whatsappGroupJoined
                        ? "Undo"
                        : "Mark Joined"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
