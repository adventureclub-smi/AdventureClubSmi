"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { MapPin, Mountain, CalendarDays, Wallet, Users, Pencil, Trash2, Plus } from "lucide-react";

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
};

export default function TreksTable() {
  const [treks, setTreks] = useState<Trek[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");

  async function fetchTreks() {
    try {
      const res = await fetch("/api/treks");
      const data = await res.json();

      if (Array.isArray(data)) {
        setTreks(data);
      } else {
        setTreks([]);
      }
    } catch (error) {
      console.error("Failed to fetch treks:", error);
      setTreks([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const res = await fetch("/api/treks");
        const data = await res.json();
        if (!active) return;
        setTreks(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Failed to fetch treks:", error);
        if (active) setTreks([]);
      } finally {
        if (active) setLoading(false);
      }
    }

    load();

    return () => {
      active = false;
    };
  }, []);

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
      fetchTreks();
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
          <Link href="/admin/create-trek" className={styles.createButton}>
            <Plus size={16} /> Create Trek
          </Link>
        }
      />

      {status && <p className={styles.status}>{status}</p>}

      {loading ? (
        <p className={styles.hint}>Loading treks...</p>
      ) : treks.length === 0 ? (
        <div className={styles.empty}>No treks available yet.</div>
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
