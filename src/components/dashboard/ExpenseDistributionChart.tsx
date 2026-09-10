import React from 'react';
import type { CostBreakdownItem } from '@/types/database';
import { formatCurrency } from '@/services/intelligenceService';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { Wallet, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ExpenseDistributionChartProps {
  costBreakdown: CostBreakdownItem[];
  totalSpent: number;
}

export function ExpenseDistributionChart({
  costBreakdown,
  totalSpent,
}: ExpenseDistributionChartProps) {
  return (
    <div className="bg-white rounded-2xl border border-[var(--color-border-light)] p-6 shadow-xs hover:shadow-md transition-all">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-[var(--color-text-primary)]">
            Expense Breakdown
          </h3>
          <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
            Resource and operational cost distribution
          </p>
        </div>
        <Link
          to="/expenses"
          className="text-xs font-semibold text-[var(--color-primary-700)] hover:text-[var(--color-primary-800)] flex items-center gap-0.5"
        >
          <span>Ledger</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {costBreakdown.length === 0 ? (
        <div className="py-12 text-center text-xs text-[var(--color-text-muted)]">
          No expenses recorded for this cycle yet.
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="w-40 h-40 flex-shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={costBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={36}
                  outerRadius={58}
                  paddingAngle={3}
                  dataKey="amount"
                  nameKey="category"
                >
                  {costBreakdown.map((entry, idx) => (
                    <Cell key={`cell-${idx}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(val: any) => [formatCurrency(Number(val)), 'Spent']} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="flex-1 w-full space-y-1.5">
            {costBreakdown.slice(0, 4).map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs py-1 border-b border-slate-100 last:border-0">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-xs flex-shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="text-[var(--color-text-primary)] font-medium truncate max-w-[120px]">
                    {item.category}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[var(--color-text-primary)]">
                    {formatCurrency(item.amount)}
                  </span>
                  <span className="text-[10px] text-[var(--color-text-muted)] w-8 text-right">
                    {item.percentage}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
