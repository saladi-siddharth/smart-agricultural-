import React from 'react';
import type { Expense } from '@/types/database';
import { formatCurrency } from '@/services/intelligenceService';
import { Wallet, Plus } from 'lucide-react';

interface ExpenseLedgerTableProps {
  expenses: Expense[];
  onOpenAddModal: () => void;
}

export function ExpenseLedgerTable({
  expenses,
  onOpenAddModal,
}: ExpenseLedgerTableProps) {
  const totalAmount = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);

  return (
    <div className="bg-white rounded-2xl border border-[var(--color-border-light)] p-6 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div>
          <h3 className="text-base font-bold text-[var(--color-text-primary)]">
            Farm Expense Ledger
          </h3>
          <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
            Operational cash flow and resource expenditures
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-[var(--color-text-muted)]">
            Total Outlay: <strong className="text-amber-700">{formatCurrency(totalAmount)}</strong>
          </span>
          <button
            onClick={onOpenAddModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl gradient-primary text-white text-xs font-semibold shadow-xs hover:shadow-md cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Record Expense</span>
          </button>
        </div>
      </div>

      {expenses.length === 0 ? (
        <div className="py-12 text-center text-xs text-[var(--color-text-muted)]">
          No expenses recorded yet.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[var(--color-surface-secondary)] border-b border-[var(--color-border-light)] text-[var(--color-text-secondary)] uppercase">
              <tr>
                <th className="py-3 px-4 font-semibold">Date</th>
                <th className="py-3 px-4 font-semibold">Category</th>
                <th className="py-3 px-4 font-semibold">Description</th>
                <th className="py-3 px-4 font-semibold">Amount</th>
                <th className="py-3 px-4 font-semibold">Receipt / Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border-light)]">
              {expenses.map(exp => (
                <tr key={exp.id} className="hover:bg-[var(--color-surface-secondary)] transition-colors">
                  <td className="py-3.5 px-4 font-medium text-[var(--color-text-primary)]">
                    {new Date(exp.expense_date).toLocaleDateString()}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-50 text-amber-800 border border-amber-200">
                      {exp.category}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-bold text-[var(--color-text-primary)]">
                    {exp.description}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-amber-700 text-sm">
                    {formatCurrency(exp.amount)}
                  </td>
                  <td className="py-3.5 px-4 text-[var(--color-text-muted)] max-w-xs truncate">
                    {exp.notes || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
