import React from 'react';
import type { Activity } from '@/types/database';
import { CheckCircle2, Clock, AlertTriangle, Sprout, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

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
  // Define canonical biological stages per Indian agricultural agronomy
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-6 border-b border-[#F1F5F9]">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-[#0F172A] tracking-tight">
              Biological Lifecycle Progression
            </h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#F0FDF4] text-[#143D30] border border-[#DCFCE7]">
              Agronomic Stages
            </span>
          </div>
          <p className="text-xs text-[#64748B] mt-0.5">
            Stage-by-stage crop development from seed preparation to final harvest maturity
          </p>
        </div>
        <span className="stitch-badge stitch-badge-warning self-start sm:self-auto">
          Active Stage 3: Tillering & Nutrition
        </span>
      </div>

      <div className="relative pt-2 pb-1">
        {/* Track Line */}
        <div className="absolute top-7 left-8 right-8 h-0.5 bg-[#E2E8F0] hidden sm:block z-0" />

        <div className="grid grid-cols-2 sm:grid-cols-6 gap-4 relative z-10">
          {stages.map((stage, idx) => {
            return (
              <div key={stage.id} className="flex flex-col items-center text-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs mb-2.5 transition-all relative ${
                    stage.isComplete
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : stage.hasOverdue
                      ? 'bg-red-600 text-white ring-4 ring-red-100'
                      : stage.isCurrent
                      ? 'bg-[#143D30] text-white ring-4 ring-emerald-100'
                      : 'bg-white border-2 border-slate-300 text-[#94A3B8]'
                  }`}
                >
                  {stage.isComplete ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : stage.hasOverdue ? (
                    <AlertTriangle className="w-5 h-5" />
                  ) : stage.isCurrent ? (
                    <span className="relative flex items-center justify-center">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-50" />
                      <span>{idx + 1}</span>
                    </span>
                  ) : (
                    <span>{idx + 1}</span>
                  )}
                </div>

                <p className={`text-xs font-bold leading-tight ${
                  stage.isCurrent ? 'text-[#143D30]' : 'text-[#0F172A]'
                }`}>
                  {stage.name}
                </p>

                <span className="text-[11px] text-[#64748B] mt-1 font-mono">
                  {stage.durationDays} Days
                </span>

                <span className={`mt-1.5 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                  stage.isComplete
                    ? 'bg-[#F0FDF4] text-[#143D30] border border-[#DCFCE7]'
                    : stage.hasOverdue
                    ? 'bg-red-50 text-red-700 border border-red-200'
                    : stage.isCurrent
                    ? 'bg-amber-50 text-amber-800 border border-amber-200'
                    : 'bg-[#F8FAFC] text-[#94A3B8] border border-[#E2E8F0]'
                }`}>
                  {stage.isComplete ? 'Completed' : stage.hasOverdue ? 'Action Needed' : stage.isCurrent ? 'Current Stage' : 'Scheduled'}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
