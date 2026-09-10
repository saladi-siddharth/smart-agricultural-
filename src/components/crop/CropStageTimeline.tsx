import React from 'react';
import type { Activity } from '@/types/database';
import { CheckCircle2, Clock, AlertTriangle, Sprout, ChevronRight } from 'lucide-react';

interface StageInfo {
  id: string;
  name: string;
  category: string;
  isComplete: boolean;
  isCurrent: boolean;
  hasOverdue: boolean;
  durationDays: number;
}

interface CropStageTimelineProps {
  activities: Activity[];
}

export function CropStageTimeline({ activities }: CropStageTimelineProps) {
  // Define canonical Paddy stages per Indian agricultural agronomy
  const stages: StageInfo[] = [
    {
      id: 'stage-1',
      name: 'Land Preparation',
      category: 'LAND_PREPARATION',
      isComplete: activities.some(a => a.activity_type === 'LAND_PREPARATION' && a.status === 'COMPLETED'),
      isCurrent: false,
      hasOverdue: false,
      durationDays: 15,
    },
    {
      id: 'stage-2',
      name: 'Sowing & Nursery',
      category: 'SOWING',
      isComplete: activities.some(a => a.activity_type === 'SOWING' && a.status === 'COMPLETED'),
      isCurrent: false,
      hasOverdue: false,
      durationDays: 25,
    },
    {
      id: 'stage-3',
      name: 'Tillering & Nutrition',
      category: 'FERTILIZATION',
      isComplete: false,
      isCurrent: true,
      hasOverdue: activities.some(a => (a.status === 'OVERDUE' || (new Date(a.planned_date) < new Date() && a.status !== 'COMPLETED'))),
      durationDays: 35,
    },
    {
      id: 'stage-4',
      name: 'Weeding & Water',
      category: 'WEEDING',
      isComplete: activities.some(a => a.activity_type === 'WEEDING' && a.status === 'COMPLETED'),
      isCurrent: false,
      hasOverdue: false,
      durationDays: 20,
    },
    {
      id: 'stage-5',
      name: 'Panicle / Flowering',
      category: 'PEST_INSPECTION',
      isComplete: false,
      isCurrent: false,
      hasOverdue: false,
      durationDays: 25,
    },
    {
      id: 'stage-6',
      name: 'Maturity & Harvest',
      category: 'HARVEST',
      isComplete: false,
      isCurrent: false,
      hasOverdue: false,
      durationDays: 30,
    },
  ];

  return (
    <div className="stitch-card p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
        <div>
          <h3 className="text-sm font-bold text-[var(--color-text-title)]">
            Biological Crop Cycle Lifecycle
          </h3>
          <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5">
            Stage-by-stage agronomic progression from land preparation to harvest
          </p>
        </div>
        <span className="stitch-badge stitch-badge-warning self-start sm:self-auto">
          Stage 3 of 6: Tillering & Nutrition
        </span>
      </div>

      <div className="relative">
        {/* Track Line */}
        <div className="absolute top-5 left-6 right-6 h-0.5 bg-slate-200 hidden sm:block -z-0" />

        <div className="grid grid-cols-2 sm:grid-cols-6 gap-4 relative z-10">
          {stages.map((stage, idx) => {
            return (
              <div key={stage.id} className="flex flex-col items-center text-center">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs mb-2 transition-all ${
                    stage.isComplete
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : stage.hasOverdue
                      ? 'bg-red-600 text-white ring-4 ring-red-100'
                      : stage.isCurrent
                      ? 'bg-[var(--color-primary-800)] text-white ring-4 ring-[var(--color-primary-100)]'
                      : 'bg-white border-2 border-slate-300 text-slate-400'
                  }`}
                >
                  {stage.isComplete ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : stage.hasOverdue ? (
                    <AlertTriangle className="w-4 h-4" />
                  ) : (
                    <span>{idx + 1}</span>
                  )}
                </div>

                <p className={`text-xs font-bold leading-tight ${
                  stage.isCurrent ? 'text-[var(--color-primary-800)]' : 'text-[var(--color-text-title)]'
                }`}>
                  {stage.name}
                </p>

                <span className="text-[10px] text-[var(--color-text-faint)] mt-1 font-mono">
                  {stage.durationDays} Days
                </span>

                <span className={`mt-1.5 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded ${
                  stage.isComplete
                    ? 'bg-emerald-50 text-emerald-700'
                    : stage.hasOverdue
                    ? 'bg-red-50 text-red-700'
                    : stage.isCurrent
                    ? 'bg-amber-50 text-amber-800'
                    : 'bg-slate-100 text-slate-500'
                }`}>
                  {stage.isComplete ? 'Completed' : stage.hasOverdue ? 'Overdue Action' : stage.isCurrent ? 'Active Stage' : 'Upcoming'}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
