import React from 'react';
import type { CropCycle } from '@/types/database';
import { formatCurrency } from '@/services/intelligenceService';
import { Sprout, Calendar, Target, ChevronRight, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

interface CropProgressOverviewProps {
  activeCrop: CropCycle | null;
  progressPercent: number;
}

export function CropProgressOverview({
  activeCrop,
  progressPercent,
}: CropProgressOverviewProps) {
  if (!activeCrop) {
    return (
      <div className="stitch-card p-6 flex flex-col justify-center text-center">
        <Sprout className="w-10 h-10 text-[#94A3B8] mx-auto mb-2" />
        <h3 className="text-sm font-bold text-[#0F172A] mb-1">Crop Progress</h3>
        <p className="text-xs text-[#64748B]">No active crop cycle registered.</p>
        <Link to="/crops" className="mt-3 inline-flex text-xs font-semibold text-[#143D30] hover:underline mx-auto">
          Launch Crop Cycle →
        </Link>
      </div>
    );
  }

  const projectedRevenue = (activeCrop.target_yield || 4.2) * (activeCrop.selling_price_per_unit || 29500);

  return (
    <div className="stitch-card p-6 flex flex-col justify-between h-full">
      <div>
        <div className="flex items-start justify-between pb-3 mb-4 border-b border-[#F1F5F9]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="stitch-badge stitch-badge-success">
                {activeCrop.season} Season
              </span>
              <span className="text-xs text-[#64748B]">• Field: <strong className="text-[#0F172A]">{activeCrop.field?.name || 'Field Block A'}</strong></span>
            </div>
            <h3 className="text-base font-bold text-[#0F172A] tracking-tight">
              {activeCrop.crop_name}
            </h3>
            <p className="text-xs text-[#64748B] mt-0.5">
              Variety: <span className="font-semibold text-[#334155]">{activeCrop.variety || 'BPT-5204 (Samba Mahsuri)'}</span>
            </p>
          </div>

          <Link
            to={`/crops/${activeCrop.id}`}
            className="text-xs font-semibold text-[#143D30] hover:text-[#1A4D3E] flex items-center gap-1 transition-colors"
          >
            <span>Timeline</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Progress Bar with biological stages */}
        <div className="my-3 p-4 rounded-xl bg-[#F8FAFC] border border-[#E5E8EB]">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-bold text-[#0F172A]">Biological Stage Progress</span>
            <span className="font-bold text-[#143D30] tabular-nums">{progressPercent}%</span>
          </div>

          <div className="w-full h-2.5 bg-[#E2E8F0] rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-[#143D30] rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>

          <div className="grid grid-cols-3 text-[11px] mt-3 pt-2 border-t border-[#E2E8F0]/70 text-[#64748B]">
            <div>
              <span className="block text-[10px] text-[#94A3B8] uppercase font-bold">Stage 1</span>
              <span>Land Prep & Sowing</span>
            </div>
            <div className="text-center">
              <span className="block text-[10px] text-emerald-700 uppercase font-bold">Current Active</span>
              <span className="font-bold text-[#143D30]">Tillering & Nutrition</span>
            </div>
            <div className="text-right">
              <span className="block text-[10px] text-[#94A3B8] uppercase font-bold">Target</span>
              <span>Harvest Maturity</span>
            </div>
          </div>
        </div>
      </div>

      {/* Target & Revenue Stats */}
      <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[#F1F5F9]">
        <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E5E8EB]">
          <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block">Target Yield</span>
          <span className="text-base font-extrabold text-[#0F172A] tabular-nums mt-0.5 block">
            {activeCrop.target_yield || 4.2} {activeCrop.yield_unit || 'tonnes'}
          </span>
          <span className="text-[11px] text-[#94A3B8]">Est. ₹29.5K/T floor</span>
        </div>

        <div className="p-3 rounded-xl bg-[#F0FDF4] border border-[#DCFCE7]">
          <span className="text-[10px] font-bold text-[#166534] uppercase tracking-wider block">Gross Harvest Revenue</span>
          <span className="text-base font-extrabold text-[#143D30] tabular-nums mt-0.5 block">
            {formatCurrency(projectedRevenue)}
          </span>
          <span className="text-[11px] text-[#166534]">Quota based projection</span>
        </div>
      </div>
    </div>
  );
}
