import React from 'react';
import type { FarmHealthScore } from '@/types/database';
import { Heart, CheckCircle2, Clock, DollarSign, Sprout, ShieldCheck } from 'lucide-react';

interface FarmHealthGaugeProps {
  healthScore: FarmHealthScore | null;
}

export function FarmHealthGauge({ healthScore }: FarmHealthGaugeProps) {
  const score = healthScore?.overall ?? 82;
  const color = healthScore?.color ?? '#16a34a';

  // Circular gauge calculations
  const circumference = 2 * Math.PI * 40; // r=40
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const dimensions = [
    { label: 'Task Completion', value: healthScore?.taskCompletion ?? 75, weight: '35%', icon: CheckCircle2, color: '#16a34a' },
    { label: 'Schedule Adherence', value: healthScore?.scheduleAdherence ?? 80, weight: '25%', icon: Clock, color: '#0284c7' },
    { label: 'Cost Efficiency', value: healthScore?.costEfficiency ?? 95, weight: '20%', icon: DollarSign, color: '#eab308' },
    { label: 'Crop Progress', value: healthScore?.cropProgress ?? 78, weight: '20%', icon: Sprout, color: '#10b981' },
  ];

  return (
    <div className="bg-white rounded-2xl border border-[var(--color-border-light)] p-6 shadow-xs hover:shadow-md transition-all">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-[var(--color-text-primary)]">
            Farm Health Score
          </h3>
          <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
            Real-time composite operational index
          </p>
        </div>
        <span
          className="px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider"
          style={{ backgroundColor: `${color}15`, color: color }}
        >
          {healthScore?.label ?? 'Healthy'}
        </span>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-6 py-2">
        {/* SVG Circular Gauge */}
        <div className="relative w-32 h-32 flex-shrink-0 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            {/* Background track */}
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="transparent"
              stroke="#f1f5f9"
              strokeWidth="8"
            />
            {/* Progress track */}
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="transparent"
              stroke={color}
              strokeWidth="8"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-3xl font-black tracking-tight" style={{ color }}>
              {score}
            </span>
            <span className="text-[10px] uppercase font-bold text-[var(--color-text-muted)] tracking-wider">
              Index
            </span>
          </div>
        </div>

        {/* 4 Health Dimensions */}
        <div className="flex-1 w-full space-y-3">
          {dimensions.map((dim, idx) => (
            <div key={idx} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-[var(--color-text-secondary)] flex items-center gap-1.5">
                  <dim.icon className="w-3.5 h-3.5" style={{ color: dim.color }} />
                  {dim.label} <span className="text-[10px] text-[var(--color-text-muted)] font-normal">({dim.weight})</span>
                </span>
                <span className="font-bold text-[var(--color-text-primary)]">
                  {dim.value}%
                </span>
              </div>
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${dim.value}%`, backgroundColor: dim.color }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
