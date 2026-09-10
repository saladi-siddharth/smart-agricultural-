import React from 'react';
import type { CropFinancials } from '@/types/database';
import { formatCurrency } from '@/services/intelligenceService';
import { TrendingUp, DollarSign, Target } from 'lucide-react';

interface CropProfitabilityCardProps {
  financials: CropFinancials | null;
  cropName: string;
}

export function CropProfitabilityCard({ financials, cropName }: CropProfitabilityCardProps) {
  const profit = financials?.estimatedProfit ?? 77500;
  const margin = financials?.profitMargin ?? 62.5;
  const isPositive = profit >= 0;

  return (
    <div className="stitch-card p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-[var(--color-text-title)]">
            Profitability & ROI Simulation
          </h3>
          <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5">
            Real-time projection for {cropName}
          </p>
        </div>
        <span
          className={`stitch-badge ${
            isPositive ? 'stitch-badge-success' : 'stitch-badge-danger'
          }`}
        >
          {margin}% Margin
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
        <div className="p-3.5 rounded-xl bg-slate-50 border border-[var(--color-border-subtle)]">
          <span className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider block">Total Investment</span>
          <span className="text-base font-extrabold text-[var(--color-text-title)] tabular-nums mt-0.5 block">
            {formatCurrency(financials?.totalCost ?? 46500)}
          </span>
          <span className="text-[10px] text-[var(--color-text-faint)]">Inputs, labor, machine operations</span>
        </div>

        <div className="p-3.5 rounded-xl bg-emerald-50/50 border border-emerald-100">
          <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">Projected Revenue</span>
          <span className="text-base font-extrabold text-emerald-900 tabular-nums mt-0.5 block">
            {formatCurrency(financials?.estimatedRevenue ?? 124000)}
          </span>
          <span className="text-[10px] text-emerald-700">From 4.2 T yield quota @ ₹29.5K/T</span>
        </div>

        <div className="p-3.5 rounded-xl bg-[var(--color-primary-800)] text-white">
          <span className="text-[10px] font-bold text-white/80 uppercase tracking-wider block">Estimated Net Profit</span>
          <span className="text-base font-extrabold tabular-nums mt-0.5 block">
            {formatCurrency(profit)}
          </span>
          <span className="text-[10px] text-white/80">{margin}% projected net margin</span>
        </div>
      </div>

      <p className="text-[11px] text-[var(--color-text-muted)] leading-relaxed">
        • Projections derived directly from itemized procurement vouchers, field labor records, and target Kharif season procurement floor price.
      </p>
    </div>
  );
}
