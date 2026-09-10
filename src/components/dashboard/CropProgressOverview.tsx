import React from 'react';
import type { CropCycle } from '@/types/database';
import { formatCurrency } from '@/services/intelligenceService';
import { Sprout, Calendar, Target, TrendingUp, ChevronRight } from 'lucide-react';
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
      <div className="bg-white rounded-2xl border border-[var(--color-border-light)] p-6 shadow-xs">
        <h3 className="text-base font-bold text-[var(--color-text-primary)] mb-2">Crop Progress</h3>
        <p className="text-xs text-[var(--color-text-muted)]">No active crop cycle registered.</p>
        <Link to="/crops" className="mt-3 inline-flex text-xs font-semibold text-[var(--color-primary-700)]">
          Launch New Crop Cycle →
        </Link>
      </div>
    );
  }

  const projectedRevenue = (activeCrop.target_yield || 0) * (activeCrop.selling_price_per_unit || 0);

  return (
    <div className="bg-white rounded-2xl border border-[var(--color-border-light)] p-6 shadow-xs hover:shadow-md transition-all">
      <div className="flex items-center justify-between mb-3">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
            {activeCrop.season} Season • {activeCrop.status}
          </span>
          <h3 className="text-lg font-bold text-[var(--color-text-primary)] mt-1">
            {activeCrop.crop_name}
          </h3>
          <p className="text-xs text-[var(--color-text-secondary)]">
            Variety: <span className="font-semibold">{activeCrop.variety || 'Standard'}</span>
          </p>
        </div>

        <Link
          to={`/crops/${activeCrop.id}`}
          className="text-xs font-semibold text-[var(--color-primary-700)] hover:text-[var(--color-primary-800)] flex items-center gap-0.5"
        >
          <span>Timeline</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Progress Bar */}
      <div className="my-4 bg-[var(--color-surface-secondary)] p-3 rounded-xl border border-[var(--color-border-light)]">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="font-medium text-[var(--color-text-secondary)]">Cycle Progression</span>
          <span className="font-bold text-[var(--color-primary-700)]">{progressPercent}%</span>
        </div>
        <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full gradient-primary rounded-full transition-all duration-700"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Target Metrics */}
      <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[var(--color-border-light)] text-xs">
        <div>
          <span className="text-[11px] text-[var(--color-text-muted)] block">Target Yield</span>
          <span className="font-bold text-[var(--color-text-primary)] text-sm">
            {activeCrop.target_yield} {activeCrop.yield_unit}
          </span>
        </div>
        <div>
          <span className="text-[11px] text-[var(--color-text-muted)] block">Projected Revenue</span>
          <span className="font-bold text-emerald-700 text-sm">
            {formatCurrency(projectedRevenue)}
          </span>
        </div>
      </div>
    </div>
  );
}
