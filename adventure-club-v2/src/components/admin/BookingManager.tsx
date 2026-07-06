"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
  ArrowDownAZ,
  ArrowUpAZ,
  Check,
  Copy,
  IdCard,
  MessageCircle,
  UserRound,
} from "lucide-react";

import PageHeader from "@/components/admin/shared/PageHeader";
import styles from "./BookingManager.module.scss";

type Person = {
  registrationId: string;
  registrationNumber: string;
  name: string;
  phoneNumber: string | null;
  isGuest: boolean;
  govtIdType: string | null;
  govtIdNumber: string | null;
  govtIdImageUrl: string | null;
  govtIdStatus: string;
  bookingAssignedTo: string | null;
};

function whatsappHref(phoneNumber: string | null) {
  if (!phoneNumber) return null;

  const digits = phoneNumber.replace(/\D/g, "");
  const withCountryCode = digits.length === 10 ? `91${digits}` : digits;

  return `https://wa.me/${withCountryCode}`;
}

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <button
      type="button"
      className={styles.copyButton}
      onClick={copy}
      aria-label={`Copy ${label}`}
      title={`Copy ${label}`}
    >
      {copied ? <Check size={13} /> : <Copy size={13} />}
    </button>
  );
}

function PersonRow({
  person,
  coreMembers,
  onAssign,
}: {
  person: Person;
  coreMembers: string[];
  onAssign: (registrationId: string, value: string) => void;
}) {
  const waHref = whatsappHref(person.phoneNumber);

  return (
    <div className={styles.row}>
      <div className={styles.identity}>
        <div className={styles.nameLine}>
          <strong>{person.name}</strong>
          <CopyButton value={person.name} label="name" />
          {person.isGuest && <span className={styles.guestTag}>Guest</span>}
        </div>

        <span className={styles.regNumber}>{person.registrationNumber}</span>
      </div>

      <div className={styles.phoneCell}>
        {person.phoneNumber ? (
          waHref ? (
            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.whatsappLink}
            >
              <MessageCircle size={14} /> {person.phoneNumber}
            </a>
          ) : (
            <span>{person.phoneNumber}</span>
          )
        ) : (
          <span className={styles.muted}>No phone on file</span>
        )}
      </div>

      <div className={styles.idCell}>
        {person.govtIdNumber ? (
          <div className={styles.idNumberLine}>
            <span>
              {person.govtIdType ? `${person.govtIdType}: ` : ""}
              {person.govtIdNumber}
            </span>
            <CopyButton value={person.govtIdNumber} label="Govt ID number" />
          </div>
        ) : (
          <span className={styles.muted}>Not submitted</span>
        )}
      </div>

      <div className={styles.idImageCell}>
        {person.govtIdImageUrl ? (
          <a
            href={person.govtIdImageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.idImageWrap}
          >
            <Image
              src={person.govtIdImageUrl}
              alt={`${person.name} Govt ID`}
              fill
              sizes="60px"
              className={styles.idImage}
            />
          </a>
        ) : (
          <div className={styles.idImagePlaceholder}>
            <IdCard size={18} />
          </div>
        )}
      </div>

      <div className={styles.assignCell}>
        <input
          list="core-members"
          placeholder="Assign core member..."
          defaultValue={person.bookingAssignedTo || ""}
          onBlur={(e) => onAssign(person.registrationId, e.target.value)}
        />
      </div>

      <datalist id="core-members">
        {coreMembers.map((m) => (
          <option key={m} value={m} />
        ))}
      </datalist>
    </div>
  );
}

export default function BookingManager({ trekId }: { trekId: string }) {
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortAsc, setSortAsc] = useState(true);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const res = await fetch(`/api/admin/booking/${trekId}`);
        const data = await res.json();
        if (active && res.ok) setPeople(data);
      } finally {
        if (active) setLoading(false);
      }
    }

    load();

    return () => {
      active = false;
    };
  }, [trekId]);

  async function handleAssign(registrationId: string, value: string) {
    const trimmed = value.trim() || null;

    setPeople((prev) =>
      prev.map((p) =>
        p.registrationId === registrationId
          ? { ...p, bookingAssignedTo: trimmed }
          : p
      )
    );

    await fetch(`/api/admin/booking/${trekId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ registrationId, bookingAssignedTo: trimmed }),
    });
  }

  const coreMembers = useMemo(
    () =>
      Array.from(
        new Set(
          people
            .map((p) => p.bookingAssignedTo)
            .filter((v): v is string => !!v)
        )
      ).sort(),
    [people]
  );

  const groups = useMemo(() => {
    const sorted = [...people].sort((a, b) =>
      sortAsc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)
    );

    const byMember = new Map<string, Person[]>();
    const unassigned: Person[] = [];

    for (const person of sorted) {
      if (!person.bookingAssignedTo) {
        unassigned.push(person);
        continue;
      }

      const list = byMember.get(person.bookingAssignedTo) || [];
      list.push(person);
      byMember.set(person.bookingAssignedTo, list);
    }

    return {
      assigned: Array.from(byMember.entries()).sort(([a], [b]) =>
        a.localeCompare(b)
      ),
      unassigned,
    };
  }, [people, sortAsc]);

  return (
    <div className={styles.container}>
      <PageHeader
        title="Booking"
        breadcrumb={[{ label: "Admin", href: "/admin" }, { label: "Booking" }]}
      />

      <p className={styles.hint}>
        Everyone who has paid the initial amount for this trek — for booking
        government permits. Assign each person to the core member who will
        book their permit.
      </p>

      <div className={styles.toolbar}>
        <button
          type="button"
          className={styles.sortButton}
          onClick={() => setSortAsc((v) => !v)}
        >
          {sortAsc ? <ArrowDownAZ size={15} /> : <ArrowUpAZ size={15} />}
          Name {sortAsc ? "A → Z" : "Z → A"}
        </button>

        <span className={styles.count}>
          <UserRound size={14} /> {people.length} paid
        </span>
      </div>

      {loading ? (
        <p className={styles.hint}>Loading...</p>
      ) : people.length === 0 ? (
        <div className={styles.empty}>
          No one has completed the initial payment for this trek yet.
        </div>
      ) : (
        <div className={styles.groups}>
          {groups.assigned.map(([member, list]) => (
            <section key={member} className={styles.group}>
              <h3>
                {member} <span>({list.length})</span>
              </h3>

              <div className={styles.list}>
                {list.map((person) => (
                  <PersonRow
                    key={person.registrationId}
                    person={person}
                    coreMembers={coreMembers}
                    onAssign={handleAssign}
                  />
                ))}
              </div>
            </section>
          ))}

          <section className={styles.group}>
            <h3>
              Unassigned <span>({groups.unassigned.length})</span>
            </h3>

            <div className={styles.list}>
              {groups.unassigned.map((person) => (
                <PersonRow
                  key={person.registrationId}
                  person={person}
                  coreMembers={coreMembers}
                  onAssign={handleAssign}
                />
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
