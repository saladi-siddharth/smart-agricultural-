import React, { useState } from 'react';
import type { Recommendation } from '@/types/database';
import { Lightbulb, AlertTriangle, AlertCircle, Info, ChevronRight, HelpCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SlideOverDrawer } from '@/components/common/SlideOverDrawer';

interface ActionRecommendationsCardProps {
  recommendations: Recommendation[];
}

export function ActionRecommendationsCard({
  recommendations,
}: ActionRecommendationsCardProps) {
  const [selectedRec, setSelectedRec] = useState<Recommendation | null>(null);

  return (
    <>
      <div className="stitch-card p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-100">
              <Lightbulb className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[var(--color-text-title)]">
                FarmPilot Intelligence & Action Advisory
              </h3>
              <p className="text-[11px] text-[var(--color-text-muted)]">
                Explainable agricultural decision support
              </p>
            </div>
          </div>

          <Link
            to="/intelligence"
            className="text-xs font-semibold text-[var(--color-primary-700)] hover:text-[var(--color-primary-800)] flex items-center gap-1 transition-colors"
          >
            <span>All Insights</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* List of Recommendations */}
        {recommendations.length === 0 ? (
          <div className="py-8 text-center text-xs text-[var(--color-text-muted)]">
            No critical advisories at this time. Operations are tracking optimally.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {recommendations.slice(0, 3).map((rec, idx) => {
              const isCritical = rec.severity === 'CRITICAL';
              const isWarning = rec.severity === 'WARNING';

              return (
                <div
                  key={idx}
                  className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                    isCritical
                      ? 'border-red-200/80 bg-red-50/20'
                      : isWarning
                      ? 'border-amber-200/80 bg-amber-50/20'
                      : 'border-slate-200 bg-slate-50/40'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className={`stitch-badge ${isCritical ? 'stitch-badge-danger' : isWarning ? 'stitch-badge-warning' : 'stitch-badge-info'}`}>
                        {rec.severity}
                      </span>
                      <button
                        onClick={() => setSelectedRec(rec)}
                        className="text-[11px] font-semibold text-[var(--color-primary-700)] hover:underline flex items-center gap-1 cursor-pointer"
                        title="Inspect agronomic reason"
                      >
                        <HelpCircle className="w-3 h-3" />
                        <span>Why this?</span>
                      </button>
                    </div>

                    <h4 className="text-xs font-bold text-[var(--color-text-title)] line-clamp-1">
                      {rec.title}
                    </h4>

                    <p className="text-[11px] text-[var(--color-text-muted)] mt-1 line-clamp-2 leading-normal">
                      {rec.problem}
                    </p>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-200/60">
                    <p className="text-[11px] font-semibold text-[var(--color-primary-800)] flex items-start gap-1">
                      <span className="flex-shrink-0">💡</span>
                      <span className="line-clamp-1">{rec.action}</span>
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* "Why am I seeing this?" Slide-Over Inspection Drawer */}
      <SlideOverDrawer
        isOpen={Boolean(selectedRec)}
        onClose={() => setSelectedRec(null)}
        title={selectedRec?.title || 'Operational Advisory'}
        subtitle="Explainable Agricultural Intelligence Rationale"
      >
        {selectedRec && (
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-[var(--color-border-subtle)]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] block mb-1">
                Detected Problem
              </span>
              <p className="text-xs text-[var(--color-text-title)] leading-relaxed">
                {selectedRec.problem}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-emerald-50/50 border border-emerald-100">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block mb-1">
                Why this recommendation? (Agronomic Rationale)
              </span>
              <p className="text-xs text-emerald-900 leading-relaxed">
                {selectedRec.reason || 'This activity is linked directly to current biological crop stage requirements. Delaying scheduled application risks vegetative stunt and lower yield quota.'}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-50/50 border border-amber-100">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block mb-1">
                Data Used for Decision Support
              </span>
              <p className="text-xs text-amber-900 leading-relaxed font-mono">
                {selectedRec.sourceData || 'Source: Activity planned_date vs today timestamp, CropCycle biological calendar, and Expense ledger variance.'}
              </p>
            </div>

            <div className="pt-2">
              <Link
                to="/activities"
                onClick={() => setSelectedRec(null)}
                className="stitch-btn-primary w-full py-2.5 text-xs text-center block"
              >
                Go to Field Operations Ledger →
              </Link>
            </div>
          </div>
        )}
      </SlideOverDrawer>
    </>
  );
}
