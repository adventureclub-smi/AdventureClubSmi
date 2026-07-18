"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Bell,
  Search,
  Zap,
  Mountain,
  Wallet,
  CheckSquare,
  Megaphone,
  Tent,
  X,
} from "lucide-react";

import styles from "./AdminTopbar.module.scss";

type NotificationItem = {
  id: string;
  title: string;
  message: string;
  href: string;
};

type SearchResult = { id: string; label: string; sublabel: string; href: string };

type SearchResults = {
  students: SearchResult[];
  treks: SearchResult[];
  registrations: SearchResult[];
  announcements: SearchResult[];
};

const quickActions = [
  { href: "/admin/create-trek", label: "Create Trek", icon: Mountain },
  { href: "/admin/create-workshop", label: "Create Workshop", icon: Tent },
  { href: "/admin/payments", label: "Verify Payments", icon: Wallet },
  { href: "/admin/attendance", label: "Mark Attendance", icon: CheckSquare },
  { href: "/admin/announcements", label: "Create Announcement", icon: Megaphone },
];

export default function AdminTopbar({
  adminName,
}: {
  adminName: string;
}) {
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [searching, setSearching] = useState(false);

  const [quickOpen, setQuickOpen] = useState(false);

  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;

    async function loadNotifications() {
      try {
        const res = await fetch("/api/admin/notifications");
        if (!active || !res.ok) return;
        const data = await res.json();
        setNotifications(data.items || []);
      } catch {
        // ignore - notifications are non-critical
      }
    }

    loadNotifications();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!searchOpen) return;

    let active = true;

    const timer = setTimeout(async () => {
      if (!active) return;

      if (query.trim().length < 2) {
        setResults(null);
        return;
      }

      setSearching(true);

      try {
        const res = await fetch(
          `/api/admin/search?q=${encodeURIComponent(query.trim())}`
        );
        if (!active || !res.ok) return;
        setResults(await res.json());
      } finally {
        if (active) setSearching(false);
      }
    }, 300);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [query, searchOpen]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
        setSearchOpen(false);
        setQuickOpen(false);
      }
    }

    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const initials = adminName
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const hasResults =
    results &&
    (results.students.length ||
      results.treks.length ||
      results.registrations.length ||
      results.announcements.length);

  return (
    <header className={styles.topbar} ref={rootRef}>
      <div className={styles.searchWrap}>
        <button
          className={styles.searchTrigger}
          onClick={() => setSearchOpen((v) => !v)}
        >
          <Search size={16} />
          <span>Search students, treks, registrations...</span>
        </button>

        {searchOpen && (
          <div className={styles.searchPanel}>
            <div className={styles.searchInputRow}>
              <Search size={16} />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search anything..."
              />
              <button onClick={() => setSearchOpen(false)} aria-label="Close search">
                <X size={16} />
              </button>
            </div>

            <div className={styles.searchResults}>
              {searching && <p className={styles.hint}>Searching...</p>}

              {!searching && query.trim().length >= 2 && !hasResults && (
                <p className={styles.hint}>No results for &quot;{query}&quot;.</p>
              )}

              {!searching && query.trim().length < 2 && (
                <p className={styles.hint}>Type at least 2 characters.</p>
              )}

              {results && (
                <>
                  {results.students.length > 0 && (
                    <div className={styles.resultGroup}>
                      <small>Students</small>
                      {results.students.map((r) => (
                        <Link key={r.id} href={r.href} onClick={() => setSearchOpen(false)}>
                          <strong>{r.label}</strong>
                          <span>{r.sublabel}</span>
                        </Link>
                      ))}
                    </div>
                  )}

                  {results.treks.length > 0 && (
                    <div className={styles.resultGroup}>
                      <small>Treks</small>
                      {results.treks.map((r) => (
                        <Link key={r.id} href={r.href} onClick={() => setSearchOpen(false)}>
                          <strong>{r.label}</strong>
                          <span>{r.sublabel}</span>
                        </Link>
                      ))}
                    </div>
                  )}

                  {results.registrations.length > 0 && (
                    <div className={styles.resultGroup}>
                      <small>Registrations</small>
                      {results.registrations.map((r) => (
                        <Link key={r.id} href={r.href} onClick={() => setSearchOpen(false)}>
                          <strong>{r.label}</strong>
                          <span>{r.sublabel}</span>
                        </Link>
                      ))}
                    </div>
                  )}

                  {results.announcements.length > 0 && (
                    <div className={styles.resultGroup}>
                      <small>Announcements</small>
                      {results.announcements.map((r) => (
                        <Link key={r.id} href={r.href} onClick={() => setSearchOpen(false)}>
                          <strong>{r.label}</strong>
                          <span>{r.sublabel}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>

      <div className={styles.right}>
        <div className={styles.dropdownWrap}>
          <button
            className={styles.iconButton}
            onClick={() => setQuickOpen((v) => !v)}
            aria-label="Quick actions"
          >
            <Zap size={18} />
          </button>

          {quickOpen && (
            <div className={styles.panel}>
              <small>Quick Actions</small>
              {quickActions.map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  onClick={() => setQuickOpen(false)}
                >
                  <action.icon size={16} />
                  {action.label}
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className={styles.dropdownWrap}>
          <button
            className={styles.iconButton}
            onClick={() => setNotifOpen((v) => !v)}
            aria-label="Notifications"
          >
            <Bell size={18} />
            {notifications.length > 0 && (
              <span className={styles.badge}>{notifications.length}</span>
            )}
          </button>

          {notifOpen && (
            <div className={styles.panel}>
              <small>Notifications</small>

              {notifications.length === 0 ? (
                <p className={styles.hint}>Everything is running smoothly.</p>
              ) : (
                notifications.slice(0, 8).map((n) => (
                  <Link key={n.id} href={n.href} onClick={() => setNotifOpen(false)}>
                    <strong>{n.title}</strong>
                    <span>{n.message}</span>
                  </Link>
                ))
              )}
            </div>
          )}
        </div>

        <div className={styles.admin}>
          <span className={styles.avatar}>{initials || "A"}</span>
          <span className={styles.name}>{adminName}</span>
        </div>
      </div>
    </header>
  );
}
