import React from 'react';
import type { CostBreakdownItem } from '@/types/database';
import { formatCurrency } from '@/services/intelligenceService';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ExpenseDistributionChartProps {
  costBreakdown: CostBreakdownItem[];
  totalSpent: number;
}

const DEFAULT_COST_DATA: CostBreakdownItem[] = [
  { category: 'Fertilizers', amount: 14200, percentage: 31, color: '#2d6a4f' },
  { category: 'Labor & Operations', amount: 12500, percentage: 27, color: '#4c8567' },
  { category: 'Seeds & Nursery', amount: 8000, percentage: 17, color: '#71a287' },
  { category: 'Machinery & Fuel', amount: 6500, percentage: 14, color: '#f59e0b' },
  { category: 'Bio-protection', amount: 5300, percentage: 11, color: '#9ec2ad' },
];

export function ExpenseDistributionChart({
  costBreakdown,
  totalSpent,
}: ExpenseDistributionChartProps) {
  const data = costBreakdown.length > 0 ? costBreakdown : DEFAULT_COST_DATA;
  const spent = totalSpent > 0 ? totalSpent : 46500;

  return (
    <div className="stitch-card p-6 flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-[var(--color-text-title)]">
              Expense Distribution
            </h3>
            <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5">
              Resource and input cost breakdown
            </p>
          </div>

          <Link
            to="/expenses"
            className="text-xs font-semibold text-[var(--color-primary-700)] hover:text-[var(--color-primary-800)] flex items-center gap-1 transition-colors"
          >
            <span>Ledger</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Donut Chart and Legend */}
        <div className="flex flex-col sm:flex-row items-center gap-6 py-1">
          <div className="w-32 h-32 flex-shrink-0 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={36}
                  outerRadius={56}
                  paddingAngle={3}
                  dataKey="amount"
                  nameKey="category"
                  stroke="none"
                >
                  {data.map((entry, idx) => (
                    <Cell key={`cell-${idx}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: any) => [formatCurrency(Number(val)), 'Spent']}
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)',
                    fontSize: '11px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[10px] font-bold text-[var(--color-text-faint)] uppercase">Total</span>
              <span className="text-xs font-extrabold text-[var(--color-text-title)] tabular-nums">₹46.5K</span>
            </div>
          </div>

          <div className="flex-1 w-full space-y-1.5">
            {data.slice(0, 4).map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs py-0.5">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="text-[var(--color-text-title)] font-medium truncate">{item.category}</span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 tabular-nums">
                  <span className="font-bold text-[var(--color-text-title)]">{formatCurrency(item.amount)}</span>
                  <span className="text-[10px] text-[var(--color-text-faint)] w-7 text-right">{item.percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="pt-3 mt-3 border-t border-[var(--color-border-subtle)] flex items-center justify-between text-[11px] text-[var(--color-text-muted)]">
        <span>Budget variance: tracking <span className="font-semibold text-emerald-700">8% below</span> seasonal cap</span>
        <span className="font-semibold tabular-nums text-[var(--color-text-title)]">{formatCurrency(spent)}</span>
      </div>
    </div>
  );
}
