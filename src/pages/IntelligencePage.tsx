import { useState, useEffect } from 'react';
import { farmService } from '@/services/farmService';
import { cropService } from '@/services/cropService';
import { activityService } from '@/services/activityService';
import { expenseService } from '@/services/expenseService';
import { inputService } from '@/services/inputService';
import { irrigationService } from '@/services/irrigationService';
import { harvestService } from '@/services/harvestService';
import {
  calculateFarmHealthScore, calculateCropFinancials, calculateCropProgressScore,
  generateRecommendations, generateTodayPriorities, formatCurrency,
} from '@/services/intelligenceService';
import { SlideOverDrawer } from '@/components/common/SlideOverDrawer';
import { showToast } from '@/components/common/ToastNotification';
import type { Farm, Activity, CropCycle, Recommendation, TodayPriority, FarmHealthScore, CropFinancials } from '@/types/database';
import {
  Brain, Heart, Lightbulb, Target, TrendingUp, AlertTriangle,
  CheckCircle2, Info, ArrowUpRight, ChevronRight, ShieldCheck, Sparkles
} from 'lucide-react';

export default function IntelligencePage() {
  const [loading, setLoading] = useState(true);
  const [healthScore, setHealthScore] = useState<FarmHealthScore | null>(null);
  const [financials, setFinancials] = useState<CropFinancials | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [priorities, setPriorities] = useState<TodayPriority[]>([]);
  const [cropProgress, setCropProgress] = useState(0);
  const [activeCrop, setActiveCrop] = useState<CropCycle | null>(null);

  // SlideOver drawer state for agronomic explanation
  const [selectedRec, setSelectedRec] = useState<Recommendation | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const farms = await farmService.getAll();
        if (farms.length === 0) { setLoading(false); return; }
        const farm = farms[0];
        const [cycles, acts, exps, inps, irrs, harvs] = await Promise.all([
          cropService.getByFarm(farm.id), activityService.getByFarm(farm.id),
          expenseService.getByFarm(farm.id), inputService.getByFarm(farm.id),
          irrigationService.getByFarm(farm.id), harvestService.getByFarm(farm.id),
        ]);

        const cycle = cycles.find(c => c.status === 'ACTIVE') || cycles[0] || null;
        setActiveCrop(cycle);
        const cActs = cycle ? acts.filter(a => a.crop_cycle_id === cycle.id) : acts;
        const cExps = cycle ? exps.filter(e => e.crop_cycle_id === cycle.id) : exps;
        const cInps = cycle ? inps.filter(i => i.crop_cycle_id === cycle.id) : inps;
        const cIrrs = cycle ? irrs.filter(i => i.crop_cycle_id === cycle.id) : irrs;
        const cHarvs = cycle ? harvs.filter(h => h.crop_cycle_id === cycle.id) : harvs;

        setHealthScore(calculateFarmHealthScore(cActs, cExps, cInps, cIrrs, cycle));
        setFinancials(calculateCropFinancials(cExps, cInps, cIrrs, cActs, cHarvs, cycle));
        setCropProgress(Math.round(calculateCropProgressScore(cActs)));
        setRecommendations(generateRecommendations(cActs, cExps, cInps, cIrrs, cycle));
        setPriorities(generateTodayPriorities(acts));
      } catch (err) {
        console.error(err);
        showToast.error('Failed to load intelligence models');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 bg-[#E2E8F0] animate-pulse rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <div key={i} className="h-44 bg-white border border-[#E5E8EB] rounded-xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E5E8EB]">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#143D30] uppercase tracking-wider mb-1">
            <Brain className="w-3.5 h-3.5" />
            <span>FarmPilot Agronomic Engine</span>
          </div>
          <h1 className="text-2xl font-bold text-[#0F172A] tracking-tight">Farm Intelligence & Insights</h1>
          <p className="text-xs text-[#64748B] mt-0.5">
            {activeCrop
              ? `Operational synthesis for ${activeCrop.crop_name} (${activeCrop.season} Season)`
              : 'Holistic operational health and explainable agronomic guidance'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#F0FDF4] border border-[#DCFCE7] text-[11px] font-semibold text-[#143D30]">
            <ShieldCheck className="w-3.5 h-3.5" />
            Decision Engine Active
          </span>
        </div>
      </div>

      {/* Health Score + Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Radial Health Gauge */}
        {healthScore && (
          <div className="bg-white rounded-xl border border-[#E5E8EB] p-5 shadow-xs flex flex-col items-center justify-center text-center">
            <div className="relative inline-flex items-center justify-center mb-3">
              <svg className="w-28 h-28 -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="50" fill="none" stroke="#F1F5F9" strokeWidth="8" />
                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  fill="none"
                  stroke={healthScore.overall >= 80 ? '#143D30' : healthScore.overall >= 60 ? '#059669' : '#DC2626'}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${healthScore.overall * 3.14} 314`}
                  className="transition-all duration-1000"
                />
              </svg>
              <div className="absolute text-center">
                <span className="text-3xl font-bold text-[#0F172A] tabular-nums tracking-tight">
                  {healthScore.overall}
                </span>
                <p className="text-[10px] text-[#94A3B8] font-medium">/ 100</p>
              </div>
            </div>
            <p className="text-xs font-bold text-[#143D30] uppercase tracking-wider">{healthScore.label}</p>
            <p className="text-[11px] text-[#64748B] mt-0.5">Unified Farm Health Index</p>
          </div>
        )}

        {/* Score Breakdown (4 Pillars) */}
        {healthScore && (
          <div className="bg-white rounded-xl border border-[#E5E8EB] p-5 shadow-xs">
            <h3 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-3">
              Health Metric Breakdown
            </h3>
            <div className="space-y-2.5">
              {[
                { label: 'Task Completion', value: healthScore.taskCompletion, weight: '35%', barColor: '#143D30' },
                { label: 'Schedule Adherence', value: healthScore.scheduleAdherence, weight: '25%', barColor: '#059669' },
                { label: 'Cost Efficiency', value: healthScore.costEfficiency, weight: '20%', barColor: '#10B981' },
                { label: 'Crop Stage Progress', value: healthScore.cropProgress, weight: '20%', barColor: '#34D399' },
              ].map(item => (
                <div key={item.label}>
                  <div className="flex items-center justify-between mb-1 text-xs">
                    <span className="text-[#64748B] text-[11px]">
                      {item.label} <span className="text-[#94A3B8]">({item.weight})</span>
                    </span>
                    <span className="font-bold text-[#0F172A] tabular-nums">{item.value}%</span>
                  </div>
                  <div className="h-1.5 bg-[#F1F5F9] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${item.value}%`,
                        backgroundColor: item.barColor,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Financial Intelligence */}
        {financials && (
          <div className="bg-white rounded-xl border border-[#E5E8EB] p-5 shadow-xs">
            <h3 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-3">
              Financial Synthesis
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between py-1 border-b border-[#F1F5F9] text-xs">
                <span className="text-[#64748B]">Total Outlay</span>
                <span className="font-bold text-[#0F172A] tabular-nums">{formatCurrency(financials.totalCost)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#F1F5F9] text-xs">
                <span className="text-[#64748B]">Planned Budget</span>
                <span className="font-semibold text-[#64748B] tabular-nums">{formatCurrency(financials.plannedBudget)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#F1F5F9] text-xs">
                <span className="text-[#64748B]">Projected Revenue</span>
                <span className="font-bold text-emerald-700 tabular-nums">{formatCurrency(financials.estimatedRevenue)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#F1F5F9] text-xs">
                <span className="text-[#64748B]">Estimated Profit</span>
                <span className="font-bold text-[#143D30] tabular-nums">{formatCurrency(financials.estimatedProfit)}</span>
              </div>
            </div>
            <div className="mt-3 p-2.5 rounded-lg bg-[#F0FDF4] border border-[#DCFCE7] flex items-center justify-between">
              <span className="text-xs font-semibold text-[#143D30]">Profit Margin</span>
              <span className="text-base font-bold text-[#143D30] tabular-nums">{Math.round(financials.profitMargin)}%</span>
            </div>
          </div>
        )}
      </div>

      {/* Today's Priorities */}
      {priorities.length > 0 && (
        <div className="bg-white rounded-xl border border-[#E5E8EB] p-5 shadow-xs">
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-4 h-4 text-[#143D30]" />
            <h3 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider">
              Priority Action Items
            </h3>
          </div>
          <div className="space-y-2">
            {priorities.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-3 p-3 rounded-lg bg-[#F8FAFC] border border-[#F1F5F9]"
              >
                <span className="text-base">{p.icon}</span>
                <div className="flex-1">
                  <p className="text-xs font-bold text-[#0F172A]">{p.title}</p>
                  <p className="text-[11px] text-[#64748B]">{p.subtitle}</p>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                  p.severity === 'CRITICAL' ? 'bg-red-50 text-red-700 border border-red-200' :
                  p.severity === 'WARNING' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                  'bg-blue-50 text-blue-700 border border-blue-200'
                }`}>
                  {p.severity === 'CRITICAL' ? 'Critical' : p.severity === 'WARNING' ? 'Overdue' : 'Due Today'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Recommendations */}
      <div className="bg-white rounded-xl border border-[#E5E8EB] p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-amber-500" />
            <h3 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider">
              Explainable Agronomic Advisories ({recommendations.length})
            </h3>
          </div>
          <span className="text-[11px] text-[#94A3B8]">Click card to inspect reasoning logic</span>
        </div>

        {recommendations.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-600" />
            <p className="text-xs font-semibold text-[#0F172A]">All parameters within optimal range</p>
            <p className="text-[11px] text-[#64748B]">No active alerts or agronomic warnings</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recommendations.map((rec) => (
              <div
                key={rec.id}
                onClick={() => setSelectedRec(rec)}
                className={`p-4 rounded-xl border transition-all cursor-pointer group hover:border-[#CBD5E1] ${
                  rec.severity === 'CRITICAL' ? 'bg-red-50/30 border-red-200' :
                  rec.severity === 'WARNING' ? 'bg-amber-50/30 border-amber-200' :
                  rec.severity === 'SUCCESS' ? 'bg-[#F0FDF4]/40 border-[#DCFCE7]' :
                  'bg-blue-50/30 border-blue-200'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span className="text-xl mt-0.5">{rec.icon}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-[#0F172A] group-hover:text-[#143D30] transition-colors">
                          {rec.title}
                        </h4>
                        <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded uppercase ${
                          rec.severity === 'CRITICAL' ? 'bg-red-100 text-red-800' :
                          rec.severity === 'WARNING' ? 'bg-amber-100 text-amber-800' :
                          'bg-emerald-100 text-emerald-800'
                        }`}>
                          {rec.severity}
                        </span>
                      </div>
                      <p className="text-xs text-[#475569] mt-1">{rec.problem}</p>

                      <div className="mt-2 p-2 rounded-lg bg-white border border-[#E5E8EB]">
                        <p className="text-[11px] text-[#64748B]">
                          <strong className="text-[#0F172A]">Recommended Action:</strong> {rec.action}
                        </p>
                      </div>
                    </div>
                  </div>

                  <button
                    className="text-xs font-semibold text-[#143D30] group-hover:underline flex items-center gap-0.5 whitespace-nowrap self-start"
                  >
                    <span>Explain</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SlideOver Drawer for Agronomic Explanation */}
      <SlideOverDrawer
        isOpen={!!selectedRec}
        onClose={() => setSelectedRec(null)}
        title={selectedRec?.title || 'Agronomic Analysis'}
        subtitle="Explainable Agricultural Intelligence Engine"
      >
        {selectedRec && (
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">Observed Field Problem</span>
              <p className="text-xs font-semibold text-[#0F172A] mt-1">{selectedRec.problem}</p>
            </div>

            <div className="p-3.5 rounded-xl bg-white border border-[#E5E8EB]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#143D30]">Agronomic Reasoning</span>
              <p className="text-xs text-[#334155] mt-1 leading-relaxed">{selectedRec.reason}</p>
            </div>

            <div className="p-3.5 rounded-xl bg-[#F0FDF4] border border-[#DCFCE7]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#166534]">Prescribed Intervention</span>
              <p className="text-xs font-bold text-[#143D30] mt-1">{selectedRec.action}</p>
            </div>

            <div className="p-3.5 rounded-xl bg-white border border-[#E5E8EB]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">Telemetry & Source Data</span>
              <p className="text-xs text-[#64748B] mt-1 font-mono text-[11px]">{selectedRec.sourceData}</p>
            </div>

            <div className="pt-2">
              <button
                onClick={() => {
                  showToast.success(`Action queued: ${selectedRec.action}`);
                  setSelectedRec(null);
                }}
                className="w-full py-2 rounded-lg bg-[#143D30] hover:bg-[#1A4D3E] text-white text-xs font-semibold shadow-xs cursor-pointer"
              >
                Acknowledge & Queue Task
              </button>
            </div>
          </div>
        )}
      </SlideOverDrawer>
    </div>
  );
}
