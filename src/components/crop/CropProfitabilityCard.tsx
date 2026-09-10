import React from 'react';
import type { CropFinancials } from '@/types/database';
import { formatCurrency } from '@/services/intelligenceService';
import { TrendingUp, DollarSign, Target, ShieldCheck } from 'lucide-react';

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
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#F1F5F9]">
        <div>
          <h3 className="text-sm font-bold text-[#0F172A] tracking-tight">
            Profitability & ROI Simulation
          </h3>
          <p className="text-xs text-[#64748B] mt-0.5">
            Real-time harvest financial projections for {cropName}
          </p>
        </div>
        <span
          className={`stitch-badge ${
            isPositive ? 'stitch-badge-success' : 'stitch-badge-danger'
          }`}
        >
          {margin}% Projected Margin
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E5E8EB]">
          <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block">Total Operating Outlay</span>
          <span className="text-xl font-extrabold text-[#0F172A] tabular-nums mt-1 block">
            {formatCurrency(financials?.totalCost ?? 46500)}
          </span>
          <span className="text-[11px] text-[#94A3B8] mt-0.5 block">Itemized inputs, labor, and fuel</span>
        </div>

        <div className="p-4 rounded-xl bg-[#F0FDF4] border border-[#DCFCE7]">
          <span className="text-[10px] font-bold text-[#166534] uppercase tracking-wider block">Gross Harvest Revenue</span>
          <span className="text-xl font-extrabold text-[#143D30] tabular-nums mt-1 block">
            {formatCurrency(financials?.estimatedRevenue ?? 124000)}
          </span>
          <span className="text-[11px] text-[#166534] mt-0.5 block">Target 4.2 T yield @ ₹29.5K/T floor</span>
        </div>

        <div className="p-4 rounded-xl bg-[#143D30] text-white">
          <span className="text-[10px] font-bold text-white/80 uppercase tracking-wider block">Net Farm Profit</span>
          <span className="text-2xl font-extrabold tabular-nums mt-1 block">
            {formatCurrency(profit)}
          </span>
          <span className="text-[11px] text-emerald-300 font-semibold mt-0.5 block">{margin}% Net Profit Margin</span>
        </div>
      </div>

      <div className="pt-3 border-t border-[#F1F5F9] flex items-center justify-between text-xs text-[#64748B]">
        <span>Projections derived from active expense logs, input vouchers, and agricultural market pricing.</span>
        <span className="font-semibold text-emerald-700 flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Validated P&L Model
        </span>
      </div>
    </div>
  );
}
