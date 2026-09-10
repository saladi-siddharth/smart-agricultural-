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
import type { Farm, Activity, CropCycle, Recommendation, TodayPriority, FarmHealthScore, CropFinancials } from '@/types/database';
import { Brain, Heart, Lightbulb, Target, TrendingUp, AlertTriangle, CheckCircle2, Info } from 'lucide-react';

export default function IntelligencePage() {
  const [loading, setLoading] = useState(true);
  const [healthScore, setHealthScore] = useState<FarmHealthScore | null>(null);
  const [financials, setFinancials] = useState<CropFinancials | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [priorities, setPriorities] = useState<TodayPriority[]>([]);
  const [cropProgress, setCropProgress] = useState(0);
  const [activeCrop, setActiveCrop] = useState<CropCycle | null>(null);

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
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    })();
  }, []);

  if (loading) return <div className="space-y-4"><div className="skeleton h-8 w-64" />{[1,2,3].map(i => <div key={i} className="skeleton h-32 rounded-2xl" />)}</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
          <Brain className="w-5 h-5 text-amber-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">FarmPilot Intelligence</h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-0.5">
            {activeCrop ? `Analyzing ${activeCrop.crop_name} — ${activeCrop.season}` : 'Operational intelligence & recommendations'}
          </p>
        </div>
      </div>

      {/* Health Score + Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {healthScore && (
          <div className="glass-card p-6 text-center">
            <div className="relative inline-flex items-center justify-center mb-3">
              <svg className="w-32 h-32 -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="50" fill="none" stroke="#e2e8f0" strokeWidth="8" />
                <circle cx="60" cy="60" r="50" fill="none" stroke={healthScore.color} strokeWidth="8" strokeLinecap="round"
                  strokeDasharray={`${healthScore.overall * 3.14} 314`} className="transition-all duration-1000" />
              </svg>
              <div className="absolute text-center">
                <span className="text-3xl font-bold" style={{ color: healthScore.color }}>{healthScore.overall}</span>
                <p className="text-xs text-[var(--color-text-muted)]">/ 100</p>
              </div>
            </div>
            <p className="font-semibold" style={{ color: healthScore.color }}>{healthScore.label}</p>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">Farm Health Score</p>
          </div>
        )}

        {/* Score Breakdown */}
        {healthScore && (
          <div className="glass-card p-6">
            <h3 className="text-sm font-semibold mb-4 text-[var(--color-text-primary)]">Score Breakdown</h3>
            <div className="space-y-3">
              {[
                { label: 'Task Completion', value: healthScore.taskCompletion, weight: '35%', icon: '✅' },
                { label: 'Schedule Adherence', value: healthScore.scheduleAdherence, weight: '25%', icon: '📅' },
                { label: 'Cost Efficiency', value: healthScore.costEfficiency, weight: '20%', icon: '💰' },
                { label: 'Crop Progress', value: healthScore.cropProgress, weight: '20%', icon: '🌱' },
              ].map(item => (
                <div key={item.label}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-[var(--color-text-secondary)]">{item.icon} {item.label} <span className="text-[var(--color-text-muted)]">({item.weight})</span></span>
                    <span className="text-xs font-bold">{item.value}%</span>
                  </div>
                  <div className="h-2 bg-[var(--color-surface-tertiary)] rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700" style={{
                      width: `${item.value}%`,
                      backgroundColor: item.value >= 75 ? '#22c55e' : item.value >= 50 ? '#f59e0b' : '#ef4444',
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Financial Intelligence */}
        {financials && (
          <div className="glass-card p-6">
            <h3 className="text-sm font-semibold mb-4 text-[var(--color-text-primary)]">Financial Intelligence</h3>
            <div className="space-y-2.5">
              {[
                { label: 'Total Cost', value: financials.totalCost, color: '#ef4444' },
                { label: 'Planned Budget', value: financials.plannedBudget, color: '#94a3b8' },
                { label: 'Est. Revenue', value: financials.estimatedRevenue, color: '#3b82f6' },
                { label: 'Est. Profit', value: financials.estimatedProfit, color: '#22c55e' },
              ].map(item => (
                <div key={item.label} className="flex justify-between py-1.5 border-b border-[var(--color-border-light)] last:border-0">
                  <span className="text-xs text-[var(--color-text-secondary)]">{item.label}</span>
                  <span className="text-sm font-semibold" style={{ color: item.color }}>{formatCurrency(item.value)}</span>
                </div>
              ))}
              <div className="p-2.5 rounded-xl bg-[var(--color-primary-50)] text-center mt-2">
                <span className="text-xs text-[var(--color-primary-700)]">Profit Margin</span>
                <p className="text-xl font-bold text-[var(--color-primary-700)]">{Math.round(financials.profitMargin)}%</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Today's Priorities */}
      {priorities.length > 0 && (
        <div className="glass-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-[var(--color-primary-600)]" />
            <h3 className="text-base font-semibold">Today's Priorities</h3>
          </div>
          <div className="space-y-2">
            {priorities.map((p, i) => (
              <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl bg-[var(--color-surface-secondary)] animate-slide-up"
                style={{ animationDelay: `${i * 0.05}s` }}>
                <span className="text-lg">{p.icon}</span>
                <div className="flex-1"><p className="text-sm font-medium">{p.title}</p><p className="text-xs text-[var(--color-text-muted)]">{p.subtitle}</p></div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${p.severity === 'CRITICAL' ? 'status-overdue' : p.severity === 'WARNING' ? 'status-overdue' : 'status-pending'}`}>
                  {p.severity === 'CRITICAL' ? 'Critical' : p.severity === 'WARNING' ? 'Overdue' : 'Due'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Recommendations */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb className="w-5 h-5 text-amber-500" />
          <h3 className="text-base font-semibold">Recommendations & Insights</h3>
        </div>
        {recommendations.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-[var(--color-success)]" />
            <p className="text-sm font-medium text-[var(--color-text-primary)]">Everything looks great!</p>
            <p className="text-xs text-[var(--color-text-muted)]">No recommendations at this time</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recommendations.map((rec, i) => (
              <div key={rec.id} className={`p-4 rounded-xl border animate-slide-up ${
                rec.severity === 'CRITICAL' ? 'bg-red-50/50 border-red-200' :
                rec.severity === 'WARNING' ? 'bg-amber-50/50 border-amber-200' :
                rec.severity === 'SUCCESS' ? 'bg-green-50/50 border-green-200' :
                'bg-blue-50/50 border-blue-200'
              }`} style={{ animationDelay: `${i * 0.08}s` }}>
                <div className="flex items-start gap-3">
                  <span className="text-xl mt-0.5">{rec.icon}</span>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-[var(--color-text-primary)]">{rec.title}</p>
                    <p className="text-sm text-[var(--color-text-secondary)] mt-1">{rec.problem}</p>
                    <div className="mt-2 p-2.5 rounded-lg bg-white/60">
                      <p className="text-xs font-medium text-[var(--color-text-primary)] mb-0.5">Why this recommendation?</p>
                      <p className="text-xs text-[var(--color-text-secondary)]">{rec.reason}</p>
                    </div>
                    <p className="text-xs text-[var(--color-primary-700)] font-medium mt-2">💡 {rec.action}</p>
                    <p className="text-[10px] text-[var(--color-text-muted)] mt-1">Source: {rec.sourceData}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
