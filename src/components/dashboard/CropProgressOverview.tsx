import React from 'react';
import type { CropCycle } from '@/types/database';
import { formatCurrency } from '@/services/intelligenceService';
import { Sprout, Calendar, Target, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

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
      <div className="stitch-card p-6">
        <h3 className="text-sm font-bold text-[var(--color-text-title)] mb-2">Crop Progress</h3>
        <p className="text-xs text-[var(--color-text-muted)]">No active crop cycle registered.</p>
        <Link to="/crops" className="mt-3 inline-flex text-xs font-semibold text-[var(--color-primary-700)]">
          Launch Crop Cycle →
        </Link>
      </div>
    );
  }

  const projectedRevenue = (activeCrop.target_yield || 4.2) * (activeCrop.selling_price_per_unit || 29500);

  return (
    <div className="stitch-card p-6 flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="stitch-badge stitch-badge-success">
                {activeCrop.season} • {activeCrop.status}
              </span>
              <span className="text-[11px] text-[var(--color-text-muted)] font-mono">Plot: {activeCrop.field?.name || 'Field A'}</span>
            </div>
            <h3 className="text-base font-bold text-[var(--color-text-title)] mt-1">
              {activeCrop.crop_name}
            </h3>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
              Variety: <span className="font-semibold text-[var(--color-text-title)]">{activeCrop.variety || 'BPT-5204 (Samba Mahsuri)'}</span>
            </p>
          </div>

          <Link
            to={`/crops/${activeCrop.id}`}
            className="text-xs font-semibold text-[var(--color-primary-700)] hover:text-[var(--color-primary-800)] flex items-center gap-1 transition-colors"
          >
            <span>Timeline</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Progress Bar */}
        <div className="my-4 p-3.5 rounded-xl bg-[var(--color-surface-muted)] border border-[var(--color-border-subtle)]">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-semibold text-[var(--color-text-title)]">Cycle Biological Progression</span>
            <span className="font-bold text-[var(--color-primary-800)] tabular-nums">{progressPercent}%</span>
          </div>

          <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--color-primary-700)] rounded-full transition-all duration-700 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="flex justify-between text-[10px] text-[var(--color-text-faint)] mt-1.5">
            <span>Land Prep</span>
            <span className="font-bold text-[var(--color-primary-800)]">Current: Tillering & Nutrition</span>
            <span>Harvest (Oct)</span>
          </div>
        </div>
      </div>

      {/* Target & Revenue Stats */}
      <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[var(--color-border-subtle)]">
        <div className="p-2.5 rounded-lg bg-slate-50 border border-[var(--color-border-subtle)]">
          <span className="text-[10px] font-bold text-[var(--color-text-faint)] uppercase tracking-wider block">Target Yield</span>
          <span className="text-sm font-bold text-[var(--color-text-title)] tabular-nums mt-0.5 block">
            {activeCrop.target_yield || 4.2} {activeCrop.yield_unit || 'tonnes'}
          </span>
        </div>

        <div className="p-2.5 rounded-lg bg-emerald-50/50 border border-emerald-100">
          <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">Est. Gross Revenue</span>
          <span className="text-sm font-bold text-emerald-900 tabular-nums mt-0.5 block">
            {formatCurrency(projectedRevenue)}
          </span>
        </div>
      </div>
    </div>
  );
}
