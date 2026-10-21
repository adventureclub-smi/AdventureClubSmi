"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { X, Mountain, Route, Sparkles, Award, Lock } from "lucide-react";

import StatCard from "./shared/StatCard";
import styles from "./MemberProfileModal.module.scss";

type MemberProfile = {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  clubRole: string;
  year: string;
  bio: string | null;
  statsPublic: boolean;
  stats: {
    totalTreks: number;
    totalKm: number;
    highestAltitude: number;
    portfolioPoints: number;
    badgesEarned: number;
  } | null;
};

function initialsOf(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}

export default function MemberProfileModal({
  memberId,
  onClose,
}: {
  memberId: string | null;
  onClose: () => void;
}) {
  const [profile, setProfile] = useState<MemberProfile | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!memberId) return;

    let active = true;
    setLoading(true);
    setProfile(null);

    fetch(`/api/members/${memberId}/profile`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (active) setProfile(data);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [memberId]);

  if (!memberId) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button type="button" className={styles.closeButton} onClick={onClose} aria-label="Close">
          <X size={18} />
        </button>

        {loading || !profile ? (
          <p className={styles.hint}>Loading...</p>
        ) : (
          <>
            <div className={styles.header}>
              <div className={styles.avatar}>
                {profile.avatarUrl ? (
                  <Image src={profile.avatarUrl} alt={profile.fullName} fill sizes="76px" />
                ) : (
                  <span>{initialsOf(profile.fullName) || "N"}</span>
                )}
              </div>

              <div>
                <h2>{profile.fullName}</h2>
                <div className={styles.chips}>
                  <span className={styles.chipAccent}>{profile.clubRole}</span>
                  {profile.year && <span className={styles.chip}>{profile.year}</span>}
                </div>
              </div>
            </div>

            {profile.bio && <p className={styles.bio}>{profile.bio}</p>}

            {profile.stats ? (
              <div className={styles.statsGrid}>
                <StatCard icon={Mountain} value={profile.stats.totalTreks} label="Completed Treks" />
                <StatCard icon={Route} value={profile.stats.totalKm} suffix=" km" label="Total Distance" />
                <StatCard icon={Sparkles} value={profile.stats.portfolioPoints} label="Portfolio Points" />
                <StatCard icon={Award} value={profile.stats.badgesEarned} label="Badges Earned" />
                <StatCard
                  icon={Mountain}
                  value={profile.stats.highestAltitude}
                  suffix=" m"
                  label="Highest Peak"
                />
              </div>
            ) : (
              <div className={styles.privateNotice}>
                <Lock size={16} />
                This member has kept their trek stats private.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
