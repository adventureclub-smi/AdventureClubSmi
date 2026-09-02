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
  Pencil,
  UserRound,
} from "lucide-react";

import PageHeader from "@/components/admin/shared/PageHeader";
import styles from "./BookingManager.module.scss";

type Person = {
  registrationId: string;
  registrationNumber: string;
  baseName: string;
  nameOverride: string | null;
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
  onEditName,
  onEditGovtId,
}: {
  person: Person;
  coreMembers: string[];
  onAssign: (registrationId: string, value: string) => void;
  onEditName: (registrationId: string, value: string) => void;
  onEditGovtId: (registrationId: string, value: string) => void;
}) {
  const waHref = whatsappHref(person.phoneNumber);
  const [editingName, setEditingName] = useState(false);
  const [editingId, setEditingId] = useState(false);
  const displayName = person.nameOverride || person.baseName;

  return (
    <div className={styles.row}>
      <div className={styles.identity}>
        <div className={styles.nameLine}>
          {editingName ? (
            <input
              autoFocus
              className={styles.inlineInput}
              defaultValue={displayName}
              placeholder={person.baseName}
              onClick={(e) => e.stopPropagation()}
              onBlur={(e) => {
                onEditName(person.registrationId, e.target.value);
                setEditingName(false);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") e.currentTarget.blur();
                if (e.key === "Escape") setEditingName(false);
              }}
            />
          ) : (
            <>
              <strong>{displayName}</strong>
              <CopyButton value={displayName} label="name" />
              <button
                type="button"
                className={styles.editButton}
                onClick={() => setEditingName(true)}
                aria-label="Edit name for booking"
                title={
                  person.nameOverride
                    ? `Booking-only correction (account name: ${person.baseName})`
                    : "Edit name for booking (doesn't change their account)"
                }
              >
                <Pencil size={12} />
              </button>
            </>
          )}
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
        {editingId ? (
          <input
            autoFocus
            className={styles.inlineInput}
            defaultValue={person.govtIdNumber ?? ""}
            placeholder="PAN / Govt ID number"
            onClick={(e) => e.stopPropagation()}
            onBlur={(e) => {
              onEditGovtId(person.registrationId, e.target.value);
              setEditingId(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") e.currentTarget.blur();
              if (e.key === "Escape") setEditingId(false);
            }}
          />
        ) : (
          <div className={styles.idNumberLine}>
            {person.govtIdNumber ? (
              <>
                <span>
                  {person.govtIdType ? `${person.govtIdType}: ` : ""}
                  {person.govtIdNumber}
                </span>
                <CopyButton value={person.govtIdNumber} label="Govt ID number" />
              </>
            ) : (
              <span className={styles.muted}>Not submitted</span>
            )}
            {!person.isGuest && (
              <button
                type="button"
                className={styles.editButton}
                onClick={() => setEditingId(true)}
                aria-label={person.govtIdNumber ? "Edit govt ID number" : "Add govt ID number"}
                title={person.govtIdNumber ? "Edit govt ID number" : "Add govt ID number"}
              >
                <Pencil size={12} />
              </button>
            )}
          </div>
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
              alt={`${displayName} Govt ID`}
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

  async function handleEditName(registrationId: string, value: string) {
    const trimmed = value.trim() || null;

    setPeople((prev) =>
      prev.map((p) =>
        p.registrationId === registrationId ? { ...p, nameOverride: trimmed } : p
      )
    );

    await fetch(`/api/admin/booking/${trekId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ registrationId, name: trimmed }),
    });
  }

  async function handleEditGovtId(registrationId: string, value: string) {
    const trimmed = value.trim() || null;

    setPeople((prev) =>
      prev.map((p) =>
        p.registrationId === registrationId ? { ...p, govtIdNumber: trimmed } : p
      )
    );

    await fetch(`/api/admin/booking/${trekId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ registrationId, govtIdNumber: trimmed }),
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
    const sorted = [...people].sort((a, b) => {
      const nameA = a.nameOverride || a.baseName;
      const nameB = b.nameOverride || b.baseName;
      return sortAsc ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
    });

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
                    onEditName={handleEditName}
                    onEditGovtId={handleEditGovtId}
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
                  onEditName={handleEditName}
                  onEditGovtId={handleEditGovtId}
                />
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
