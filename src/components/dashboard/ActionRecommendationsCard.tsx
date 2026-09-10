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
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#F1F5F9]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-100">
              <Lightbulb className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#0F172A] tracking-tight">
                FarmPilot Agronomic Decision Support
              </h3>
              <p className="text-xs text-[#64748B] mt-0.5">
                Explainable operational insights & prescriptive actions
              </p>
            </div>
          </div>

          <Link
            to="/intelligence"
            className="text-xs font-semibold text-[#143D30] hover:text-[#1A4D3E] flex items-center gap-1 transition-colors"
          >
            <span>All Insights</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* List of Recommendations */}
        {recommendations.length === 0 ? (
          <div className="py-8 text-center text-xs text-[#64748B]">
            No critical advisories at this time. Operations are tracking optimally.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recommendations.slice(0, 3).map((rec, idx) => {
              const isCritical = rec.severity === 'CRITICAL';
              const isWarning = rec.severity === 'WARNING';

              return (
                <div
                  key={idx}
                  className={`p-4 rounded-xl border flex flex-col justify-between transition-all duration-200 hover:shadow-xs ${
                    isCritical
                      ? 'border-red-200/80 bg-red-50/20'
                      : isWarning
                      ? 'border-amber-200/80 bg-amber-50/20'
                      : 'border-[#E5E8EB] bg-[#F8FAFC]/50 hover:bg-white'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className={`stitch-badge ${isCritical ? 'stitch-badge-danger' : isWarning ? 'stitch-badge-warning' : 'stitch-badge-info'}`}>
                        {rec.severity}
                      </span>
                      <button
                        onClick={() => setSelectedRec(rec)}
                        className="text-[11px] font-semibold text-[#143D30] hover:underline flex items-center gap-1 cursor-pointer"
                        title="Inspect agronomic reason"
                      >
                        <HelpCircle className="w-3.5 h-3.5 text-[#143D30]" />
                        <span>Why this?</span>
                      </button>
                    </div>

                    <h4 className="text-xs font-bold text-[#0F172A] line-clamp-1">
                      {rec.title}
                    </h4>

                    <p className="text-xs text-[#64748B] mt-1 line-clamp-2 leading-relaxed">
                      {rec.problem}
                    </p>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-200/60">
                    <p className="text-xs font-semibold text-[#143D30] flex items-start gap-1">
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
            <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E5E8EB]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] block mb-1">
                Detected Field Anomaly
              </span>
              <p className="text-xs font-semibold text-[#0F172A] leading-relaxed">
                {selectedRec.problem}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#F0FDF4] border border-[#DCFCE7]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#166534] block mb-1">
                Agronomic Rationale & Scientific Context
              </span>
              <p className="text-xs text-[#143D30] leading-relaxed">
                {selectedRec.reason || 'This activity is linked directly to current biological crop stage requirements. Delaying scheduled application risks vegetative stunt and lower yield quota.'}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#FFFBEB] border border-[#FDE68A]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#B45309] block mb-1">
                Telemetry & Source Data
              </span>
              <p className="text-xs text-[#92400E] leading-relaxed font-mono">
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
