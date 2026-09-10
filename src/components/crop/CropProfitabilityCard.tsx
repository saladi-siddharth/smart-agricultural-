import React from 'react';
import type { CropFinancials } from '@/types/database';
import { formatCurrency } from '@/services/intelligenceService';
import { TrendingUp, DollarSign, Target, PieChart, Sparkles } from 'lucide-react';

interface CropProfitabilityCardProps {
  financials: CropFinancials | null;
  cropName: string;
}

export function CropProfitabilityCard({ financials, cropName }: CropProfitabilityCardProps) {
  const profit = financials?.estimatedProfit ?? 0;
  const margin = financials?.profitMargin ?? 0;
  const isPositive = profit >= 0;

  return (
    <div className="bg-white rounded-2xl border border-[var(--color-border-light)] p-6 shadow-xs hover:shadow-md transition-all">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-[var(--color-text-primary)]">
            Profitability & ROI Simulation
          </h3>
          <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
            Real-time projection for {cropName}
          </p>
        </div>
        <span
          className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
            isPositive ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {margin}% Margin
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        <div className="p-3.5 rounded-xl bg-[var(--color-surface-secondary)] border border-[var(--color-border-light)]">
          <span className="text-[11px] text-[var(--color-text-muted)] block">Total Investment</span>
          <span className="text-base font-bold text-[var(--color-text-primary)] mt-0.5 block">
            {formatCurrency(financials?.totalCost ?? 0)}
          </span>
          <span className="text-[10px] text-[var(--color-text-muted)]">Inputs, labor, machine</span>
        </div>

        <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-100">
          <span className="text-[11px] text-emerald-800 block">Projected Revenue</span>
          <span className="text-base font-bold text-emerald-900 mt-0.5 block">
            {formatCurrency(financials?.estimatedRevenue ?? 0)}
          </span>
          <span className="text-[10px] text-emerald-700">From target yield quota</span>
        </div>

        <div className="p-3.5 rounded-xl gradient-primary text-white">
          <span className="text-[11px] text-white/80 block">Estimated Net Profit</span>
          <span className="text-lg font-bold mt-0.5 block">
            {formatCurrency(profit)}
          </span>
          <span className="text-[10px] text-white/80">{margin}% profit margin</span>
        </div>
      </div>

      <p className="text-[11px] text-[var(--color-text-muted)] leading-relaxed">
        • Calculations account for live expense ledgers, verified input receipts, and current local market price per tonne.
      </p>
    </div>
  );
}
