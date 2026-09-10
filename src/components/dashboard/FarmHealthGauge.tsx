import React from 'react';
import type { FarmHealthScore } from '@/types/database';
import { CheckCircle2, Clock, DollarSign, Sprout, Info } from 'lucide-react';

interface FarmHealthGaugeProps {
  healthScore: FarmHealthScore | null;
}

export function FarmHealthGauge({ healthScore }: FarmHealthGaugeProps) {
  const score = healthScore?.overall ?? 82;
  const color = score >= 80 ? '#15803d' : score >= 60 ? '#d97706' : '#dc2626';

  // Circular gauge calculations (r=38, circumference ≈ 238.76)
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const pillars = [
    { label: 'Task Execution', value: healthScore?.taskCompletion ?? 92, weight: '35%', icon: CheckCircle2, color: '#16a34a' },
    { label: 'Schedule Adherence', value: healthScore?.scheduleAdherence ?? 84, weight: '25%', icon: Clock, color: '#0284c7' },
    { label: 'Cost Efficiency', value: healthScore?.costEfficiency ?? 76, weight: '20%', icon: DollarSign, color: '#d97706' },
    { label: 'Crop Progress', value: healthScore?.cropProgress ?? 71, weight: '20%', icon: Sprout, color: '#2d6a4f' },
  ];

  return (
    <div className="stitch-card p-6 flex flex-col justify-between h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-[var(--color-text-title)]">
            Farm Health Index
          </h3>
          <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5">
            Live composite operational score
          </p>
        </div>

        <div className="relative group cursor-help">
          <Info className="w-3.5 h-3.5 text-[var(--color-text-faint)] hover:text-[var(--color-text-title)] transition-colors" />
          <div className="absolute right-0 top-full mt-1 hidden group-hover:block z-50 w-56 p-2.5 bg-slate-900 text-white text-[11px] rounded-lg shadow-xl leading-snug">
            Composite operational metric computed from execution (35%), schedule (25%), budget (20%), and crop progress (20%).
          </div>
        </div>
      </div>

      {/* Radial Gauge */}
      <div className="flex items-center gap-6 py-2">
        <div className="relative w-28 h-28 flex-shrink-0 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="transparent"
              stroke="#f1f5f9"
              strokeWidth="7"
            />
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="transparent"
              stroke={color}
              strokeWidth="7"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
            />
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-2xl font-black tracking-tight text-[var(--color-text-title)] tabular-nums">
              {score}
            </span>
            <span className="text-[10px] font-semibold text-[var(--color-text-muted)]">
              / 100
            </span>
          </div>
        </div>

        <div>
          <span className="stitch-badge stitch-badge-success mb-1">
            {healthScore?.label ?? 'Operationally Healthy'}
          </span>
          <p className="text-xs text-[var(--color-text-muted)] mt-1 leading-relaxed">
            {score >= 80
              ? 'Farm operations and budget tracking smoothly with minimal risk.'
              : 'Attention required on pending field activities and schedule delays.'}
          </p>
        </div>
      </div>

      {/* 4 Pillars Breakdown */}
      <div className="space-y-2.5 pt-4 mt-2 border-t border-[var(--color-border-subtle)]">
        {pillars.map(pillar => {
          const Icon = pillar.icon;
          return (
            <div key={pillar.label} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <Icon className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
                  <span className="font-medium text-[var(--color-text-title)]">{pillar.label}</span>
                  <span className="text-[10px] text-[var(--color-text-faint)]">({pillar.weight})</span>
                </div>
                <span className="font-bold tabular-nums text-[var(--color-text-title)]">
                  {pillar.value}%
                </span>
              </div>

              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{
                    width: `${pillar.value}%`,
                    backgroundColor: pillar.color,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
