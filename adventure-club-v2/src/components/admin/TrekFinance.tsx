"use client";

import { useEffect, useMemo, useState } from "react";
import {
  IndianRupee,
  Wallet,
  TrendingDown,
  TrendingUp,
  Plus,
  Trash2,
  Filter,
  ArrowUpDown,
  Receipt,
  PiggyBank,
} from "lucide-react";

import StatusBadge from "@/components/dashboard/shared/StatusBadge";
import styles from "./TrekFinance.module.scss";

type FilterOption =
  | "all"
  | "initialPaid"
  | "initialPending"
  | "finalPaid"
  | "finalPending";

type SortOption = "nameAsc" | "nameDesc" | "year" | "department";

const FILTER_OPTIONS: { value: FilterOption; label: string }[] = [
  { value: "all", label: "All Participants" },
  { value: "initialPaid", label: "Paid Initial" },
  { value: "initialPending", label: "Didn't Pay Initial" },
  { value: "finalPaid", label: "Paid Final" },
  { value: "finalPending", label: "Didn't Pay Final" },
];

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "nameAsc", label: "Name (A–Z)" },
  { value: "nameDesc", label: "Name (Z–A)" },
  { value: "year", label: "Year" },
  { value: "department", label: "Department" },
];

type Participant = {
  id: string;
  fullName: string;
  year: string;
  department: string;
  initialPaymentPaid: boolean;
  initialAmount: number;
  finalPaymentPaid: boolean;
  finalAmount: number;
};

type LedgerEntry = {
  id: string;
  title: string;
  amount: number;
  remarks: string | null;
  createdAt: string;
};

type Totals = {
  revenueCollected: number;
  initialCollected: number;
  finalCollected: number;
  totalIncome: number;
  totalExpenses: number;
  totalRefund: number;
  net: number;
  studentProfitLoss: number;
  refundsGiven: number;
  collegeFundRemaining: number;
  participantCount: number;
};

const emptyTotals: Totals = {
  revenueCollected: 0,
  initialCollected: 0,
  finalCollected: 0,
  totalIncome: 0,
  totalExpenses: 0,
  totalRefund: 0,
  net: 0,
  studentProfitLoss: 0,
  refundsGiven: 0,
  collegeFundRemaining: 0,
  participantCount: 0,
};

export default function TrekFinance({ trekId }: { trekId: string }) {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [expenses, setExpenses] = useState<LedgerEntry[]>([]);
  const [incomes, setIncomes] = useState<LedgerEntry[]>([]);
  const [totals, setTotals] = useState<Totals>(emptyTotals);
  const [loading, setLoading] = useState(true);

  const [expenseTitle, setExpenseTitle] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseRemarks, setExpenseRemarks] = useState("");
  const [savingExpense, setSavingExpense] = useState(false);

  const [incomeTitle, setIncomeTitle] = useState("");
  const [incomeAmount, setIncomeAmount] = useState("");
  const [incomeRemarks, setIncomeRemarks] = useState("");
  const [savingIncome, setSavingIncome] = useState(false);

  const [filterBy, setFilterBy] = useState<FilterOption>("all");
  const [sortBy, setSortBy] = useState<SortOption>("nameAsc");

  async function load() {
    try {
      const res = await fetch(`/api/admin/finance/${trekId}`);
      if (!res.ok) return;
      const data = await res.json();
      setParticipants(data.participants);
      setExpenses(data.expenses);
      setIncomes(data.incomes);
      setTotals(data.totals);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;

    async function initialLoad() {
      try {
        const res = await fetch(`/api/admin/finance/${trekId}`);
        if (!res.ok || !active) return;
        const data = await res.json();
        setParticipants(data.participants);
        setExpenses(data.expenses);
        setIncomes(data.incomes);
        setTotals(data.totals);
      } finally {
        if (active) setLoading(false);
      }
    }

    initialLoad();

    return () => {
      active = false;
    };
  }, [trekId]);

  async function handleAddExpense(e: React.FormEvent) {
    e.preventDefault();
    if (!expenseTitle || !expenseAmount) return;

    setSavingExpense(true);

    try {
      const res = await fetch(`/api/admin/expenses/${trekId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: expenseTitle,
          amount: Number(expenseAmount),
          remarks: expenseRemarks,
        }),
      });

      if (res.ok) {
        setExpenseTitle("");
        setExpenseAmount("");
        setExpenseRemarks("");
        load();
      }
    } finally {
      setSavingExpense(false);
    }
  }

  async function handleDeleteExpense(expenseId: string) {
    if (!confirm("Remove this expense entry?")) return;

    const res = await fetch(`/api/admin/expenses/${trekId}/${expenseId}`, {
      method: "DELETE",
    });

    if (res.ok) load();
  }

  async function handleAddIncome(e: React.FormEvent) {
    e.preventDefault();
    if (!incomeTitle || !incomeAmount) return;

    setSavingIncome(true);

    try {
      const res = await fetch(`/api/admin/income/${trekId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: incomeTitle,
          amount: Number(incomeAmount),
          remarks: incomeRemarks,
        }),
      });

      if (res.ok) {
        setIncomeTitle("");
        setIncomeAmount("");
        setIncomeRemarks("");
        load();
      }
    } finally {
      setSavingIncome(false);
    }
  }

  async function handleDeleteIncome(incomeId: string) {
    if (!confirm("Remove this income entry?")) return;

    const res = await fetch(`/api/admin/income/${trekId}/${incomeId}`, {
      method: "DELETE",
    });

    if (res.ok) load();
  }

  const initialPaidCount = useMemo(
    () => participants.filter((p) => p.initialPaymentPaid).length,
    [participants]
  );

  const finalPaidCount = useMemo(
    () => participants.filter((p) => p.finalPaymentPaid).length,
    [participants]
  );

  const visibleParticipants = useMemo(() => {
    let list = [...participants];

    switch (filterBy) {
      case "initialPaid":
        list = list.filter((p) => p.initialPaymentPaid);
        break;
      case "initialPending":
        list = list.filter((p) => !p.initialPaymentPaid);
        break;
      case "finalPaid":
        list = list.filter((p) => p.finalPaymentPaid);
        break;
      case "finalPending":
        list = list.filter((p) => !p.finalPaymentPaid);
        break;
    }

    switch (sortBy) {
      case "nameAsc":
        list.sort((a, b) => a.fullName.localeCompare(b.fullName));
        break;
      case "nameDesc":
        list.sort((a, b) => b.fullName.localeCompare(a.fullName));
        break;
      case "year":
        list.sort((a, b) => a.year.localeCompare(b.year));
        break;
      case "department":
        list.sort((a, b) => a.department.localeCompare(b.department));
        break;
    }

    return list;
  }, [participants, filterBy, sortBy]);

  if (loading) return <p className={styles.hint}>Loading finance...</p>;

  return (
    <div className={styles.container}>
      <div className={styles.summary}>
        <div className={styles.summaryCard}>
          <Wallet size={18} />
          <div>
            <strong>₹{totals.revenueCollected}</strong>
            <span>Revenue Collected</span>
          </div>
        </div>

        <div className={styles.summaryCard}>
          <IndianRupee size={18} />
          <div>
            <strong>₹{totals.initialCollected}</strong>
            <span>Initial Collected · {initialPaidCount} paid</span>
          </div>
        </div>

        <div className={styles.summaryCard}>
          <IndianRupee size={18} />
          <div>
            <strong>₹{totals.finalCollected}</strong>
            <span>Final Collected · {finalPaidCount} paid</span>
          </div>
        </div>

        <div className={styles.summaryCard}>
          <TrendingUp size={18} />
          <div>
            <strong>₹{totals.totalIncome}</strong>
            <span>Other Income</span>
          </div>
        </div>

        <div className={styles.summaryCard}>
          <TrendingDown size={18} />
          <div>
            <strong>₹{totals.totalExpenses}</strong>
            <span>Total Expenses</span>
          </div>
        </div>

        <div className={`${styles.summaryCard} ${totals.studentProfitLoss < 0 ? styles.loss : ""}`}>
          {totals.studentProfitLoss < 0 ? <TrendingDown size={18} /> : <TrendingUp size={18} />}
          <div>
            <strong>₹{totals.studentProfitLoss}</strong>
            <span>Student Profit/Loss (collected − expenses)</span>
          </div>
        </div>

        <div className={styles.summaryCard}>
          <Receipt size={18} />
          <div>
            <strong>₹{totals.totalRefund}</strong>
            <span>Total Refund</span>
          </div>
        </div>

        <div className={styles.summaryCard}>
          <IndianRupee size={18} />
          <div>
            <strong>₹{totals.net}</strong>
            <span>Net</span>
          </div>
        </div>

        <div className={styles.summaryCard}>
          <PiggyBank size={18} />
          <div>
            <strong>₹{totals.collegeFundRemaining}</strong>
            <span>College Fund Remaining ({totals.totalIncome} received − {totals.refundsGiven} refunded)</span>
          </div>
        </div>
      </div>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h3>Participant Payments</h3>

          <div className={styles.tableControls}>
            <div className={styles.controlWrap}>
              <Filter size={14} />
              <select value={filterBy} onChange={(e) => setFilterBy(e.target.value as FilterOption)}>
                {FILTER_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.controlWrap}>
              <ArrowUpDown size={14} />
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortOption)}>
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {visibleParticipants.length === 0 ? (
          <div className={styles.empty}>
            {participants.length === 0
              ? "No participants on this trek yet."
              : "No participants match this filter."}
          </div>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Year</th>
                  <th>Department</th>
                  <th>Initial Payment</th>
                  <th>Final Payment</th>
                </tr>
              </thead>

              <tbody>
                {visibleParticipants.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <strong>{p.fullName}</strong>
                    </td>
                    <td>{p.year}</td>
                    <td>{p.department}</td>
                    <td>
                      {p.initialPaymentPaid ? (
                        <StatusBadge text={`Paid ₹${p.initialAmount}`} tone="success" />
                      ) : (
                        <StatusBadge text="Pending" tone="waiting" />
                      )}
                    </td>
                    <td>
                      {p.finalPaymentPaid ? (
                        <StatusBadge text={`Paid ₹${p.finalAmount}`} tone="success" />
                      ) : (
                        <StatusBadge text="Pending" tone="waiting" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div className={styles.ledgerGrid}>
        <section className={styles.section}>
          <h3>Expenses</h3>

          <form className={styles.addForm} onSubmit={handleAddExpense}>
            <input
              placeholder="Expense title"
              value={expenseTitle}
              onChange={(e) => setExpenseTitle(e.target.value)}
              required
            />
            <input
              type="number"
              placeholder="Amount"
              value={expenseAmount}
              onChange={(e) => setExpenseAmount(e.target.value)}
              required
            />
            <input
              placeholder="Remarks (optional)"
              value={expenseRemarks}
              onChange={(e) => setExpenseRemarks(e.target.value)}
            />
            <button type="submit" disabled={savingExpense}>
              <Plus size={15} /> {savingExpense ? "Adding..." : "Add Expense"}
            </button>
          </form>

          {expenses.length === 0 ? (
            <div className={styles.empty}>No expenses recorded yet.</div>
          ) : (
            <div className={styles.list}>
              {expenses.map((expense) => (
                <div key={expense.id} className={styles.row}>
                  <div>
                    <strong>{expense.title}</strong>
                    {expense.remarks && <p>{expense.remarks}</p>}
                  </div>

                  <div className={styles.rowRight}>
                    <span className={styles.expenseAmount}>-₹{expense.amount}</span>
                    <button
                      className={styles.deleteButton}
                      onClick={() => handleDeleteExpense(expense.id)}
                      aria-label="Delete expense"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className={styles.section}>
          <h3>Other Income</h3>

          <form className={styles.addForm} onSubmit={handleAddIncome}>
            <input
              placeholder="Income title"
              value={incomeTitle}
              onChange={(e) => setIncomeTitle(e.target.value)}
              required
            />
            <input
              type="number"
              placeholder="Amount"
              value={incomeAmount}
              onChange={(e) => setIncomeAmount(e.target.value)}
              required
            />
            <input
              placeholder="Remarks (optional)"
              value={incomeRemarks}
              onChange={(e) => setIncomeRemarks(e.target.value)}
            />
            <button type="submit" disabled={savingIncome}>
              <Plus size={15} /> {savingIncome ? "Adding..." : "Add Income"}
            </button>
          </form>

          {incomes.length === 0 ? (
            <div className={styles.empty}>No additional income recorded yet.</div>
          ) : (
            <div className={styles.list}>
              {incomes.map((income) => (
                <div key={income.id} className={styles.row}>
                  <div>
                    <strong>{income.title}</strong>
                    {income.remarks && <p>{income.remarks}</p>}
                  </div>

                  <div className={styles.rowRight}>
                    <span className={styles.incomeAmount}>+₹{income.amount}</span>
                    <button
                      className={styles.deleteButton}
                      onClick={() => handleDeleteIncome(income.id)}
                      aria-label="Delete income"
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
    </div>
  );
}
