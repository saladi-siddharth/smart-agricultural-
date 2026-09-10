import React from 'react';
import type { Recommendation } from '@/types/database';
import { Lightbulb, AlertTriangle, AlertCircle, Info, CheckCircle2, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ActionRecommendationsCardProps {
  recommendations: Recommendation[];
}

export function ActionRecommendationsCard({
  recommendations,
}: ActionRecommendationsCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-[var(--color-border-light)] p-6 shadow-xs hover:shadow-md transition-all">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Lightbulb className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[var(--color-text-primary)]">
              Operational Recommendations
            </h3>
            <p className="text-xs text-[var(--color-text-secondary)]">
              Explainable agricultural action advisory
            </p>
          </div>
        </div>
        <Link
          to="/intelligence"
          className="text-xs font-semibold text-[var(--color-primary-700)] hover:text-[var(--color-primary-800)] flex items-center gap-0.5"
        >
          <span>All Advisory</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {recommendations.length === 0 ? (
        <div className="p-6 text-center text-xs text-[var(--color-text-muted)]">
          No critical advisories at this time. Operations are progressing as scheduled.
        </div>
      ) : (
        <div className="space-y-3">
          {recommendations.slice(0, 3).map((rec, idx) => {
            const isCritical = rec.severity === 'CRITICAL';
            const isWarning = rec.severity === 'WARNING';

            return (
              <div
                key={idx}
                className={`p-4 rounded-xl border transition-all ${
                  isCritical
                    ? 'border-red-200 bg-red-50/40'
                    : isWarning
                    ? 'border-amber-200 bg-amber-50/40'
                    : 'border-blue-200 bg-blue-50/40'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      isCritical
                        ? 'bg-red-200 text-red-900'
                        : isWarning
                        ? 'bg-amber-200 text-amber-900'
                        : 'bg-blue-200 text-blue-900'
                    }`}
                  >
                    {rec.severity}
                  </span>
                  <span className="text-[10px] text-[var(--color-text-muted)] font-medium">
                    Priority Alert
                  </span>
                </div>

                <h4 className="text-sm font-bold text-[var(--color-text-primary)] mt-1">
                  {rec.title}
                </h4>

                <p className="text-xs text-[var(--color-text-secondary)] mt-1 leading-relaxed">
                  {rec.problem}
                </p>

                {rec.action && (
                  <p className="text-xs font-semibold text-[var(--color-primary-700)] mt-1">
                    💡 Action: {rec.action}
                  </p>
                )}

                {rec.reason && (
                  <div className="mt-2.5 pt-2 border-t border-black/5 text-[11px] text-[var(--color-text-muted)] flex items-start gap-1.5">
                    <span className="font-bold text-[var(--color-text-secondary)] flex-shrink-0">Why:</span>
                    <span>{rec.reason}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
