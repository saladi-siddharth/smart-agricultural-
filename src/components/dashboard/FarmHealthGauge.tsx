import React from 'react';
import type { FarmHealthScore } from '@/types/database';
import { CheckCircle2, Clock, DollarSign, Sprout, Info } from 'lucide-react';
import { motion } from 'framer-motion';

interface FarmHealthGaugeProps {
  healthScore: FarmHealthScore | null;
}

export function FarmHealthGauge({ healthScore }: FarmHealthGaugeProps) {
  const score = healthScore?.overall ?? 82;
  const color = score >= 80 ? '#143D30' : score >= 60 ? '#D97706' : '#DC2626';

  // Circular gauge calculations (r=40, circumference ≈ 251.32)
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const pillars = [
    { label: 'Task Execution', value: healthScore?.taskCompletion ?? 92, weight: '35%', icon: CheckCircle2, color: '#143D30' },
    { label: 'Schedule Adherence', value: healthScore?.scheduleAdherence ?? 84, weight: '25%', icon: Clock, color: '#059669' },
    { label: 'Cost Efficiency', value: healthScore?.costEfficiency ?? 76, weight: '20%', icon: DollarSign, color: '#10B981' },
    { label: 'Crop Stage Progress', value: healthScore?.cropProgress ?? 71, weight: '20%', icon: Sprout, color: '#34D399' },
  ];

  return (
    <div className="stitch-card p-6 flex flex-col justify-between h-full">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#F1F5F9]">
          <div>
            <h3 className="text-sm font-bold text-[#0F172A] tracking-tight">
              Farm Health Index
            </h3>
            <p className="text-xs text-[#64748B] mt-0.5">
              Unified 4-pillar algorithmic evaluation
            </p>
          </div>

          <div className="relative group cursor-help">
            <Info className="w-4 h-4 text-[#94A3B8] hover:text-[#0F172A] transition-colors" />
            <div className="absolute right-0 top-full mt-1 hidden group-hover:block z-50 w-60 p-3 bg-slate-900 text-white text-xs rounded-xl shadow-xl leading-relaxed">
              Composite index computed from task completion (35%), schedule adherence (25%), budget utilization (20%), and crop growth (20%).
            </div>
          </div>
        </div>

        {/* Radial Gauge & Status */}
        <div className="flex items-center gap-5 py-2">
          <div className="relative w-28 h-28 flex-shrink-0 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r={radius}
                fill="transparent"
                stroke="#F1F5F9"
                strokeWidth="8"
              />
              <motion.circle
                cx="50"
                cy="50"
                r={radius}
                fill="transparent"
                stroke={color}
                strokeWidth="8"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset }}
                transition={{ duration: 1.2, ease: 'easeOut' }}
                strokeLinecap="round"
              />
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-3xl font-black tracking-tight text-[#0F172A] tabular-nums font-sans">
                {score}
              </span>
              <span className="text-[10px] font-bold text-[#94A3B8] uppercase">
                / 100
              </span>
            </div>
          </div>

          <div>
            <span className="stitch-badge stitch-badge-success mb-1.5 inline-block">
              {healthScore?.label ?? 'Operationally Healthy'}
            </span>
            <p className="text-xs text-[#64748B] leading-relaxed">
              {score >= 80
                ? 'Field operations, fertilizer schedule, and budget variance are in optimal balance.'
                : 'Attention needed on delayed operations to prevent biological crop stress.'}
            </p>
          </div>
        </div>
      </div>

      {/* 4 Pillars Breakdown */}
      <div className="space-y-3 pt-4 border-t border-[#F1F5F9]">
        {pillars.map(pillar => {
          const Icon = pillar.icon;
          return (
            <div key={pillar.label} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <Icon className="w-3.5 h-3.5 text-[#64748B]" />
                  <span className="font-semibold text-[#0F172A]">{pillar.label}</span>
                  <span className="text-[10px] text-[#94A3B8]">({pillar.weight})</span>
                </div>
                <span className="font-bold tabular-nums text-[#0F172A]">
                  {pillar.value}%
                </span>
              </div>

              <div className="w-full h-2 bg-[#F1F5F9] rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${pillar.value}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  style={{ backgroundColor: pillar.color }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
