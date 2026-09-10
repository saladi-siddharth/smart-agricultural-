import React from 'react';
import type { CostBreakdownItem } from '@/types/database';
import { formatCurrency } from '@/services/intelligenceService';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { ChevronRight, Wallet } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ExpenseDistributionChartProps {
  costBreakdown: CostBreakdownItem[];
  totalSpent: number;
}

const DEFAULT_COST_DATA: CostBreakdownItem[] = [
  { category: 'Fertilizers', amount: 14200, percentage: 31, color: '#143D30' },
  { category: 'Labor & Operations', amount: 12500, percentage: 27, color: '#059669' },
  { category: 'Seeds & Nursery', amount: 8000, percentage: 17, color: '#10B981' },
  { category: 'Machinery & Fuel', amount: 6500, percentage: 14, color: '#F59E0B' },
  { category: 'Bio-protection', amount: 5300, percentage: 11, color: '#34D399' },
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
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#F1F5F9]">
          <div>
            <h3 className="text-sm font-bold text-[#0F172A] tracking-tight">
              Expense Distribution
            </h3>
            <p className="text-xs text-[#64748B] mt-0.5">
              Cost allocation by operational category
            </p>
          </div>

          <Link
            to="/expenses"
            className="text-xs font-semibold text-[#143D30] hover:text-[#1A4D3E] flex items-center gap-1 transition-colors"
          >
            <span>Ledger</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Donut Chart and Legend */}
        <div className="flex flex-col sm:flex-row items-center gap-6 py-2">
          <div className="w-36 h-36 flex-shrink-0 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={42}
                  outerRadius={64}
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
                    border: '1px solid #E5E8EB',
                    boxShadow: '0 4px 12px -2px rgba(15, 23, 42, 0.08)',
                    fontSize: '11px',
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
              <span className="text-[10px] font-bold text-[#94A3B8] uppercase">Outlay</span>
              <span className="text-xs font-black text-[#0F172A] tabular-nums font-sans">₹46.5K</span>
            </div>
          </div>

          <div className="flex-1 w-full space-y-2">
            {data.slice(0, 4).map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs py-1 border-b border-[#F8FAFC]">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="text-[#334155] font-medium truncate">{item.category}</span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 tabular-nums">
                  <span className="font-bold text-[#0F172A]">{formatCurrency(item.amount)}</span>
                  <span className="text-[11px] text-[#94A3B8] w-8 text-right">{item.percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="pt-3 mt-3 border-t border-[#F1F5F9] flex items-center justify-between text-xs text-[#64748B]">
        <span>Budget tracking <strong className="text-emerald-700 font-semibold">8% below</strong> seasonal cap</span>
        <span className="font-bold tabular-nums text-[#0F172A]">{formatCurrency(spent)} spent</span>
      </div>
    </div>
  );
}
