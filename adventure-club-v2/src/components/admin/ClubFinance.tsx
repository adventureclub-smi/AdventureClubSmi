"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Wallet,
  TrendingDown,
  TrendingUp,
  Plus,
  Trash2,
  Users,
  Filter,
} from "lucide-react";

import PageHeader from "@/components/admin/shared/PageHeader";
import styles from "./ClubFinance.module.scss";

type EntryType = "INCOME" | "EXPENSE";

type Entry = {
  id: string;
  type: EntryType;
  title: string;
  amount: number;
  accountName: string;
  notes: string | null;
  recordedBy: string | null;
  date: string;
};

type Account = {
  accountName: string;
  income: number;
  expenses: number;
  net: number;
};

type Totals = {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
};

const emptyTotals: Totals = { totalIncome: 0, totalExpenses: 0, balance: 0 };

export default function ClubFinance() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [totals, setTotals] = useState<Totals>(emptyTotals);
  const [loading, setLoading] = useState(true);

  const [type, setType] = useState<EntryType>("EXPENSE");
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [accountName, setAccountName] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const [accountFilter, setAccountFilter] = useState("all");

  async function load() {
    try {
      const res = await fetch("/api/admin/club-finance");
      if (!res.ok) return;
      const data = await res.json();
      setEntries(data.entries);
      setAccounts(data.accounts);
      setTotals(data.totals);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;

    async function initialLoad() {
      try {
        const res = await fetch("/api/admin/club-finance");
        if (!res.ok || !active) return;
        const data = await res.json();
        setEntries(data.entries);
        setAccounts(data.accounts);
        setTotals(data.totals);
      } finally {
        if (active) setLoading(false);
      }
    }

    initialLoad();

    return () => {
      active = false;
    };
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!title || !amount || !accountName) return;

    setSaving(true);

    try {
      const res = await fetch("/api/admin/club-finance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          title,
          amount: Number(amount),
          accountName,
          notes,
        }),
      });

      if (res.ok) {
        setTitle("");
        setAmount("");
        setNotes("");
        load();
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Remove this entry?")) return;

    const res = await fetch(`/api/admin/club-finance/${id}`, {
      method: "DELETE",
    });

    if (res.ok) load();
  }

  const visibleEntries = useMemo(() => {
    if (accountFilter === "all") return entries;
    return entries.filter((entry) => entry.accountName === accountFilter);
  }, [entries, accountFilter]);

  if (loading) return <p className={styles.hint}>Loading finance...</p>;

  return (
    <div className={styles.container}>
      <PageHeader
        title="Finance"
        breadcrumb={[{ label: "Admin", href: "/admin" }, { label: "Finance" }]}
      />

      <p className={styles.subtitle}>
        Club-wide income and expenses, tracked per personal account so club money and
        personal money never get mixed up.
      </p>

      <div className={styles.summary}>
        <div className={styles.summaryCard}>
          <Wallet size={18} />
          <div>
            <strong>₹{totals.balance}</strong>
            <span>Club Balance Remaining</span>
          </div>
        </div>

        <div className={styles.summaryCard}>
          <TrendingUp size={18} />
          <div>
            <strong>₹{totals.totalIncome}</strong>
            <span>Total Income</span>
          </div>
        </div>

        <div className={styles.summaryCard}>
          <TrendingDown size={18} />
          <div>
            <strong>₹{totals.totalExpenses}</strong>
            <span>Total Expenses</span>
          </div>
        </div>
      </div>

      <section className={styles.section}>
        <h3>
          <Users size={16} /> By Account
        </h3>

        {accounts.length === 0 ? (
          <div className={styles.empty}>No accounts recorded yet.</div>
        ) : (
          <div className={styles.accountGrid}>
            {accounts.map((account) => (
              <div key={account.accountName} className={styles.accountCard}>
                <strong>{account.accountName}</strong>
                <div className={styles.accountRow}>
                  <span>In</span>
                  <span className={styles.incomeAmount}>+₹{account.income}</span>
                </div>
                <div className={styles.accountRow}>
                  <span>Out</span>
                  <span className={styles.expenseAmount}>-₹{account.expenses}</span>
                </div>
                <div className={styles.accountNet}>
                  Club money currently with this account:{" "}
                  <strong className={account.net < 0 ? styles.loss : ""}>
                    ₹{account.net}
                  </strong>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className={styles.section}>
        <h3>Record a Transaction</h3>

        <form className={styles.addForm} onSubmit={handleAdd}>
          <div className={styles.typeToggle}>
            <button
              type="button"
              className={type === "EXPENSE" ? styles.active : ""}
              onClick={() => setType("EXPENSE")}
            >
              Expense
            </button>
            <button
              type="button"
              className={type === "INCOME" ? styles.active : ""}
              onClick={() => setType("INCOME")}
            >
              Income
            </button>
          </div>

          <input
            placeholder="Title (e.g. Bus advance, Sponsorship)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <input
            type="number"
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />

          <input
            list="club-accounts"
            placeholder="Account (e.g. Supraj's account)"
            value={accountName}
            onChange={(e) => setAccountName(e.target.value)}
            required
          />

          <datalist id="club-accounts">
            {accounts.map((account) => (
              <option key={account.accountName} value={account.accountName} />
            ))}
          </datalist>

          <input
            placeholder="Notes (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          <button type="submit" disabled={saving} className={styles.submitButton}>
            <Plus size={15} /> {saving ? "Adding..." : "Add Entry"}
          </button>
        </form>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h3>All Transactions</h3>

          <div className={styles.controlWrap}>
            <Filter size={14} />
            <select value={accountFilter} onChange={(e) => setAccountFilter(e.target.value)}>
              <option value="all">All Accounts</option>
              {accounts.map((account) => (
                <option key={account.accountName} value={account.accountName}>
                  {account.accountName}
                </option>
              ))}
            </select>
          </div>
        </div>

        {visibleEntries.length === 0 ? (
          <div className={styles.empty}>No transactions recorded yet.</div>
        ) : (
          <div className={styles.list}>
            {visibleEntries.map((entry) => (
              <div key={entry.id} className={styles.row}>
                <div>
                  <strong>{entry.title}</strong>
                  <p>
                    {entry.accountName} · {new Date(entry.date).toLocaleDateString()}
                    {entry.recordedBy ? ` · by ${entry.recordedBy}` : ""}
                  </p>
                  {entry.notes && <p className={styles.notes}>{entry.notes}</p>}
                </div>

                <div className={styles.rowRight}>
                  <span
                    className={
                      entry.type === "INCOME" ? styles.incomeAmount : styles.expenseAmount
                    }
                  >
                    {entry.type === "INCOME" ? "+" : "-"}₹{entry.amount}
                  </span>
                  <button
                    className={styles.deleteButton}
                    onClick={() => handleDelete(entry.id)}
                    aria-label="Delete entry"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
