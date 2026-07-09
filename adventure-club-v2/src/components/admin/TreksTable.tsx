"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { MapPin, Mountain, CalendarDays, Wallet, Users, Pencil, Trash2, Plus, Archive, TrendingUp, PiggyBank, Landmark } from "lucide-react";

import PageHeader from "@/components/admin/shared/PageHeader";
import styles from "./TreksTable.module.scss";

type Trek = {
  id: string;
  title: string;
  destination: string;
  difficulty: string;
  date: string;
  price: number;
  seats: number;
  description: string;
  coverImage?: string | null;
  isHistorical?: boolean;
  season?: string | null;
};

type FinanceSummary = {
  totalStudentProfitLoss: number;
  totalCollegeFundRemaining: number;
  grandTotal: number;
};

const emptyFinanceSummary: FinanceSummary = {
  totalStudentProfitLoss: 0,
  totalCollegeFundRemaining: 0,
  grandTotal: 0,
};

// Archived seasons that have historical data imported. Add the next
// season here once its treks are backfilled.
const HISTORICAL_SEASONS = ["2025-26"];

export default function TreksTable() {
  const [treks, setTreks] = useState<Trek[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [activeTab, setActiveTab] = useState<string>("current");
  const [financeSummary, setFinanceSummary] = useState<FinanceSummary>(emptyFinanceSummary);
  const [financeSummaryLoading, setFinanceSummaryLoading] = useState(false);

  async function fetchTreks(tab: string) {
    setLoading(true);

    try {
      const url = tab === "current" ? "/api/treks" : `/api/treks?season=${encodeURIComponent(tab)}`;
      const res = await fetch(url);
      const data = await res.json();
      setTreks(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch treks:", error);
      setTreks([]);
    }

    setLoading(false);
  }

  async function fetchFinanceSummary(season: string) {
    setFinanceSummaryLoading(true);

    try {
      const res = await fetch(`/api/admin/historical-treks/finance-summary?season=${encodeURIComponent(season)}`);
      const data = await res.json();
      setFinanceSummary(data.totals ?? emptyFinanceSummary);
    } catch (error) {
      console.error("Failed to fetch finance summary:", error);
      setFinanceSummary(emptyFinanceSummary);
    }

    setFinanceSummaryLoading(false);
  }

  useEffect(() => {
    fetchTreks("current");
  }, []);

  function switchTab(tab: string) {
    setActiveTab(tab);
    fetchTreks(tab);

    if (tab !== "current") {
      fetchFinanceSummary(tab);
    }
  }

  async function deleteTrek(id: string) {
    const confirmDelete = confirm("Are you sure you want to delete this trek?");
    if (!confirmDelete) return;

    try {
      const res = await fetch(`/api/treks/${id}`, { method: "DELETE" });
      const data = await res.json();

      if (!res.ok) {
        setStatus(data.message || "Failed to delete trek.");
        return;
      }

      setStatus("Trek deleted.");
      fetchTreks(activeTab);
    } catch (error) {
      console.error(error);
      setStatus("Something went wrong.");
    }
  }

  return (
    <div className={styles.container}>
      <PageHeader
        title="Treks"
        breadcrumb={[{ label: "Admin", href: "/admin" }, { label: "Treks" }]}
        quickActions={
          activeTab === "current" ? (
            <Link href="/admin/create-trek" className={styles.createButton}>
              <Plus size={16} /> Create Trek
            </Link>
          ) : (
            <Link href="/admin/create-historical-trek" className={styles.createButton}>
              <Plus size={16} /> Add Historical Trek
            </Link>
          )
        }
      />

      <div className={styles.tabs}>
        <button
          className={activeTab === "current" ? styles.tabActive : styles.tab}
          onClick={() => switchTab("current")}
        >
          Current
        </button>

        {HISTORICAL_SEASONS.map((season) => (
          <button
            key={season}
            className={activeTab === season ? styles.tabActive : styles.tab}
            onClick={() => switchTab(season)}
          >
            <Archive size={13} /> {season} Archive
          </button>
        ))}
      </div>

      {activeTab !== "current" && (
        <div className={styles.financeSummary}>
          {financeSummaryLoading ? (
            <p className={styles.hint}>Loading finance summary...</p>
          ) : (
            <>
              <div className={styles.financeSummaryCard}>
                <TrendingUp size={18} />
                <div>
                  <strong>₹{financeSummary.totalStudentProfitLoss}</strong>
                  <span>Total Student Profit/Loss</span>
                </div>
              </div>

              <div className={styles.financeSummaryCard}>
                <PiggyBank size={18} />
                <div>
                  <strong>₹{financeSummary.totalCollegeFundRemaining}</strong>
                  <span>Total College Fund Remaining</span>
                </div>
              </div>

              <div className={`${styles.financeSummaryCard} ${styles.grandTotal}`}>
                <Landmark size={18} />
                <div>
                  <strong>₹{financeSummary.grandTotal}</strong>
                  <span>Grand Total ({activeTab})</span>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {status && <p className={styles.status}>{status}</p>}

      {loading ? (
        <p className={styles.hint}>Loading treks...</p>
      ) : treks.length === 0 ? (
        <div className={styles.empty}>
          {activeTab === "current"
            ? "No treks available yet."
            : `No treks archived for ${activeTab} yet.`}
        </div>
      ) : (
        <div className={styles.grid}>
          {treks.map((trek) => (
            <div key={trek.id} className={styles.card}>
              <div className={styles.imageWrap}>
                <Image
                  src={trek.coverImage || "/images/default-trek.jpg"}
                  alt={trek.title}
                  fill
                  sizes="(max-width: 700px) 100vw, 340px"
                  className={styles.image}
                />

                {trek.isHistorical && (
                  <span className={styles.archivedBadge}>
                    <Archive size={12} /> Archived
                  </span>
                )}
              </div>

              <div className={styles.content}>
                <h2>{trek.title}</h2>

                <div className={styles.info}>
                  <span>
                    <MapPin size={13} /> {trek.destination}
                  </span>
                  <span>
                    <Mountain size={13} /> {trek.difficulty}
                  </span>
                  <span>
                    <CalendarDays size={13} /> {new Date(trek.date).toLocaleDateString()}
                  </span>
                  <span>
                    <Wallet size={13} /> ₹{trek.price}
                  </span>
                  <span>
                    <Users size={13} /> {trek.seats} Seats
                  </span>
                </div>

                <p className={styles.description}>{trek.description}</p>

                <div className={styles.buttons}>
                  <Link href={`/admin/treks/${trek.id}`} className={styles.manage}>
                    Manage Trek
                  </Link>

                  <Link href={`/admin/edit-trek/${trek.id}`} className={styles.edit}>
                    <Pencil size={14} />
                  </Link>

                  <button className={styles.delete} onClick={() => deleteTrek(trek.id)}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
