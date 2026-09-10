import React from 'react';
import type { Activity } from '@/types/database';
import { CheckCircle2, Clock, AlertTriangle, Sprout } from 'lucide-react';

interface StageInfo {
  id: string;
  name: string;
  category: string;
  isComplete: boolean;
  isCurrent: boolean;
  hasOverdue: boolean;
}

interface CropStageTimelineProps {
  activities: Activity[];
}

export function CropStageTimeline({ activities }: CropStageTimelineProps) {
  // Define the canonical paddy stages
  const stages: StageInfo[] = [
    {
      id: 'stage-1',
      name: 'Land Preparation',
      category: 'LAND_PREPARATION',
      isComplete: activities.some(a => a.activity_type === 'LAND_PREPARATION' && a.status === 'COMPLETED'),
      isCurrent: false,
      hasOverdue: activities.some(a => a.activity_type === 'LAND_PREPARATION' && a.status === 'OVERDUE'),
    },
    {
      id: 'stage-2',
      name: 'Sowing & Nursery',
      category: 'SOWING',
      isComplete: activities.some(a => a.activity_type === 'SOWING' && a.status === 'COMPLETED'),
      isCurrent: false,
      hasOverdue: activities.some(a => a.activity_type === 'SOWING' && a.status === 'OVERDUE'),
    },
    {
      id: 'stage-3',
      name: 'Tillering & Nutrition',
      category: 'FERTILIZATION',
      isComplete: false,
      isCurrent: true,
      hasOverdue: activities.some(a => a.activity_type === 'FERTILIZATION' && a.status === 'OVERDUE'),
    },
    {
      id: 'stage-4',
      name: 'Weeding & Water',
      category: 'WEEDING',
      isComplete: activities.some(a => a.activity_type === 'WEEDING' && a.status === 'COMPLETED'),
      isCurrent: false,
      hasOverdue: activities.some(a => a.activity_type === 'WEEDING' && a.status === 'OVERDUE'),
    },
    {
      id: 'stage-5',
      name: 'Panicle / Flowering',
      category: 'PEST_INSPECTION',
      isComplete: false,
      isCurrent: false,
      hasOverdue: false,
    },
    {
      id: 'stage-6',
      name: 'Maturity & Harvest',
      category: 'HARVEST',
      isComplete: false,
      isCurrent: false,
      hasOverdue: false,
    },
  ];

  return (
    <div className="bg-white rounded-2xl border border-[var(--color-border-light)] p-6 shadow-xs">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-base font-bold text-[var(--color-text-primary)]">
            Biological Crop Cycle Stages
          </h3>
          <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
            Stage-by-stage progression from field puddling to grain maturity
          </p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
          Stage 3: Tillering Phase
        </span>
      </div>

      <div className="relative">
        {/* Connecting line */}
        <div className="absolute top-5 left-4 right-4 h-0.5 bg-slate-200 hidden sm:block -z-0" />

        <div className="grid grid-cols-2 sm:grid-cols-6 gap-4 relative z-10">
          {stages.map((stage, idx) => {
            return (
              <div key={stage.id} className="flex flex-col items-center text-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs shadow-xs mb-2 transition-transform duration-200 ${
                    stage.isComplete
                      ? 'bg-emerald-600 text-white'
                      : stage.hasOverdue
                      ? 'bg-red-500 text-white ring-4 ring-red-100 animate-pulse'
                      : stage.isCurrent
                      ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                      : 'bg-slate-100 text-slate-500 border border-slate-300'
                  }`}
                >
                  {stage.isComplete ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : stage.hasOverdue ? (
                    <AlertTriangle className="w-5 h-5" />
                  ) : (
                    <span>{idx + 1}</span>
                  )}
                </div>

                <span className="text-xs font-bold text-[var(--color-text-primary)] leading-tight">
                  {stage.name}
                </span>

                <span
                  className={`text-[10px] font-semibold mt-1 ${
                    stage.isComplete
                      ? 'text-emerald-700'
                      : stage.hasOverdue
                      ? 'text-red-600'
                      : stage.isCurrent
                      ? 'text-blue-700'
                      : 'text-slate-400'
                  }`}
                >
                  {stage.isComplete
                    ? 'Completed'
                    : stage.hasOverdue
                    ? 'Overdue'
                    : stage.isCurrent
                    ? 'In Progress'
                    : 'Upcoming'}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
