import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { cropService } from '@/services/cropService';
import { activityService } from '@/services/activityService';
import { expenseService } from '@/services/expenseService';
import { inputService } from '@/services/inputService';
import { irrigationService } from '@/services/irrigationService';
import { harvestService } from '@/services/harvestService';
import {
  calculateFarmHealthScore,
  calculateCropFinancials,
  calculateCropProgressScore,
  formatCurrency,
} from '@/services/intelligenceService';
import { showToast } from '@/components/common/ToastNotification';
import type {
  CropCycle, Activity, Expense, Input as FarmInput,
  IrrigationLog, Harvest, CropFinancials, ActivityInsert
} from '@/types/database';
import {
  ArrowLeft, CheckCircle2, Clock, AlertTriangle, Plus, Loader2,
  Calendar, Layers, TrendingUp, DollarSign, X
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { CropStageTimeline } from '@/components/crop/CropStageTimeline';
import { CropProfitabilityCard } from '@/components/crop/CropProfitabilityCard';

export default function CropDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [crop, setCrop] = useState<CropCycle | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [inputs, setInputs] = useState<FarmInput[]>([]);
  const [irrigationLogs, setIrrigationLogs] = useState<IrrigationLog[]>([]);
  const [harvests, setHarvests] = useState<Harvest[]>([]);
  const [financials, setFinancials] = useState<CropFinancials | null>(null);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'timeline' | 'finances' | 'inputs'>('timeline');

  // Quick activity modal
  const [actModalOpen, setActModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [actForm, setActForm] = useState<ActivityInsert>({
    farm_id: '',
    field_id: '',
    crop_cycle_id: id || '',
    title: '',
    description: '',
    activity_type: 'FERTILIZATION',
    planned_date: new Date().toISOString().split('T')[0],
    completed_date: null,
    status: 'PENDING',
    priority: 'HIGH',
    estimated_cost: 2500,
    actual_cost: 0,
    notes: '',
  });

  const loadData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const c = await cropService.getById(id);
      setCrop(c);

      const [acts, exps, inps, irrs, harvs] = await Promise.all([
        activityService.getByCropCycle(id),
        expenseService.getByCropCycle(id),
        inputService.getByCropCycle(id),
        irrigationService.getByCropCycle(id),
        harvestService.getByCropCycle(id),
      ]);

      setActivities(acts);
      setExpenses(exps);
      setInputs(inps);
      setIrrigationLogs(irrs);
      setHarvests(harvs);

      const prog = Math.round(calculateCropProgressScore(acts));
      setProgress(prog);

      const fin = calculateCropFinancials(exps, inps, irrs, acts, harvs, c);
      setFinancials(fin);

      setActForm(prev => ({
        ...prev,
        farm_id: c.farm_id,
        field_id: c.field_id,
        crop_cycle_id: c.id,
      }));
    } catch (err) {
      console.error('Failed loading crop cycle details', err);
      showToast.error('Failed to load crop cycle details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleCompleteActivity = async (activityId: string, title: string) => {
    try {
      await activityService.complete(activityId);
      showToast.success(`Operation "${title}" marked as complete!`);
      loadData();
    } catch (err) {
      console.error('Failed completing activity', err);
      showToast.error('Failed to complete activity');
    }
  };

  const handleCreateActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await activityService.create(actForm);
      showToast.success(`Operation "${actForm.title}" scheduled`);
      setActModalOpen(false);
      loadData();
    } catch (err) {
      console.error('Failed creating activity', err);
      showToast.error('Failed to schedule activity');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-16 flex flex-col items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-[#143D30] mb-2" />
        <p className="text-xs text-[#64748B]">Loading crop command center...</p>
      </div>
    );
  }

  if (!crop) {
    return (
      <div className="p-12 text-center bg-white rounded-xl border border-[#E5E8EB] shadow-xs">
        <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
        <h2 className="text-sm font-bold text-[#0F172A]">Crop cycle not found</h2>
        <Link to="/crops" className="mt-3 inline-flex items-center gap-1 text-xs text-[#143D30] font-semibold hover:underline">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Crop Cycles</span>
        </Link>
      </div>
    );
  }

  const overdueCount = activities.filter(a => a.status === 'OVERDUE').length;
  const completedCount = activities.filter(a => a.status === 'COMPLETED').length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Breadcrumb & Actions */}
      <div className="pb-2 border-b border-[#E5E8EB]">
        <Link
          to="/crops"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#64748B] hover:text-[#0F172A] transition-colors mb-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>All Crop Cycles</span>
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold text-[#0F172A] tracking-tight">
                {crop.crop_name}
              </h1>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                crop.status === 'ACTIVE'
                  ? 'bg-[#F0FDF4] text-[#143D30] border border-[#DCFCE7]'
                  : 'bg-blue-50 text-blue-700 border border-blue-200'
              }`}>
                {crop.status}
              </span>
            </div>
            <p className="text-xs text-[#64748B]">
              Variety: <span className="font-semibold text-[#334155]">{crop.variety || 'Standard'}</span> • Field: <span className="font-semibold text-[#334155]">{crop.field?.name || 'Assigned Plot'}</span> • Season: <span className="font-semibold text-[#334155]">{crop.season}</span>
            </p>
          </div>

          <button
            onClick={() => setActModalOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#143D30] hover:bg-[#1A4D3E] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Schedule Operation</span>
          </button>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-[#E5E8EB] shadow-xs">
          <p className="text-[11px] font-medium text-[#64748B] uppercase tracking-wider">Crop Progress</p>
          <div className="flex items-baseline gap-2 mt-1">
            <p className="text-2xl font-bold text-[#0F172A] tabular-nums">{progress}%</p>
            <span className="text-[11px] text-[#64748B] tabular-nums">
              ({completedCount}/{activities.length})
            </span>
          </div>
          <div className="w-full h-1.5 bg-[#E2E8F0] rounded-full mt-2.5 overflow-hidden">
            <div className="h-full bg-[#143D30] rounded-full" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#E5E8EB] shadow-xs">
          <p className="text-[11px] font-medium text-[#64748B] uppercase tracking-wider">Total Expenses</p>
          <p className="text-2xl font-bold text-[#0F172A] tabular-nums mt-1">
            {formatCurrency(financials?.totalCost || 0)}
          </p>
          <p className="text-[11px] text-[#64748B] mt-0.5 tabular-nums">
            Budget: {formatCurrency(crop.planned_budget)} ({financials?.budgetUtilization || 0}%)
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#E5E8EB] shadow-xs">
          <p className="text-[11px] font-medium text-[#64748B] uppercase tracking-wider">Projected Revenue</p>
          <p className="text-2xl font-bold text-emerald-700 tabular-nums mt-1">
            {formatCurrency(financials?.estimatedRevenue || 0)}
          </p>
          <p className="text-[11px] text-[#64748B] mt-0.5 tabular-nums">
            {crop.target_yield} {crop.yield_unit} @ ₹{crop.selling_price_per_unit}/T
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#E5E8EB] shadow-xs">
          <p className="text-[11px] font-medium text-[#64748B] uppercase tracking-wider">Estimated Profit</p>
          <p className="text-2xl font-bold text-[#143D30] tabular-nums mt-1">
            {formatCurrency(financials?.estimatedProfit || 0)}
          </p>
          <p className="text-[11px] text-emerald-600 font-semibold mt-0.5 tabular-nums">
            Margin: {financials?.profitMargin || 0}%
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1.5 border-b border-[#E5E8EB] pb-2">
        {[
          { id: 'timeline', label: 'Operations & Timeline' },
          { id: 'finances', label: 'Financials & P&L' },
          { id: 'inputs', label: `Inputs & Resources (${inputs.length})` },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              activeTab === tab.id
                ? 'bg-[#143D30] text-white font-semibold shadow-xs'
                : 'text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Activities & Timeline */}
      {activeTab === 'timeline' && (
        <div className="space-y-6">
          {/* Biological Crop Stages Timeline */}
          <CropStageTimeline activities={activities} />

          {overdueCount > 0 && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
                <div>
                  <p className="text-xs font-bold text-red-900">
                    {overdueCount} Overdue Operation Needs Immediate Attention!
                  </p>
                  <p className="text-[11px] text-red-700">
                    Delayed agronomic tasks reduce nutrient efficacy and lower harvest quality.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl border border-[#E5E8EB] p-5 shadow-xs">
            <h3 className="text-sm font-bold text-[#0F172A] uppercase tracking-wider mb-3">
              Operations Schedule
            </h3>

            <div className="space-y-2.5">
              {activities.map(act => (
                <div
                  key={act.id}
                  className={`p-3.5 rounded-lg border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    act.status === 'OVERDUE'
                      ? 'border-red-200 bg-red-50/40'
                      : act.status === 'COMPLETED'
                      ? 'border-[#E5E8EB] bg-white'
                      : 'border-amber-200 bg-amber-50/20'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 p-1 rounded-md ${
                      act.status === 'COMPLETED'
                        ? 'bg-emerald-100 text-emerald-700'
                        : act.status === 'OVERDUE'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}>
                      {act.status === 'COMPLETED' ? (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      ) : act.status === 'OVERDUE' ? (
                        <AlertTriangle className="w-3.5 h-3.5" />
                      ) : (
                        <Clock className="w-3.5 h-3.5" />
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">
                          {act.activity_type.replace('_', ' ')}
                        </span>
                        <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                          act.status === 'OVERDUE'
                            ? 'bg-red-100 text-red-800'
                            : act.status === 'COMPLETED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {act.status}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-[#0F172A] mt-0.5">
                        {act.title}
                      </h4>
                      <p className="text-[11px] text-[#64748B] mt-0.5">
                        {act.description}
                      </p>
                      <p className="text-[10px] text-[#94A3B8] mt-1 tabular-nums">
                        Planned: {new Date(act.planned_date).toLocaleDateString()}
                        {act.completed_date && ` • Completed: ${new Date(act.completed_date).toLocaleDateString()}`}
                        {` • Cost: ₹${act.actual_cost || act.estimated_cost}`}
                      </p>
                    </div>
                  </div>

                  {act.status !== 'COMPLETED' && (
                    <button
                      onClick={() => handleCompleteActivity(act.id, act.title)}
                      className="px-3 py-1.5 rounded-lg bg-[#143D30] hover:bg-[#1A4D3E] text-white text-xs font-semibold shadow-xs transition-all self-start sm:self-center cursor-pointer whitespace-nowrap"
                    >
                      Complete
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Finances */}
      {activeTab === 'finances' && (
        <div className="space-y-6">
          <CropProfitabilityCard financials={financials} cropName={crop.crop_name} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="bg-white rounded-xl border border-[#E5E8EB] p-5 shadow-xs">
              <h3 className="text-sm font-bold text-[#0F172A] uppercase tracking-wider mb-3">
                Cost Distribution by Category
              </h3>
              {financials?.costBreakdown && financials.costBreakdown.length > 0 ? (
                <div className="h-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={financials.costBreakdown}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="amount"
                        nameKey="category"
                      >
                        {financials.costBreakdown.map((entry, idx) => (
                          <Cell key={`cell-${idx}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(val: any) => [`₹${Number(val).toLocaleString()}`, 'Amount']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-xs text-[#94A3B8] text-center py-12">No expense entries recorded</p>
              )}

              <div className="space-y-2 mt-2">
                {financials?.costBreakdown.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs py-1 border-b border-[#F1F5F9]">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: item.color }} />
                      <span className="font-medium text-[#0F172A]">{item.category}</span>
                    </div>
                    <div className="flex items-center gap-3 tabular-nums">
                      <span className="font-bold text-[#0F172A]">{formatCurrency(item.amount)}</span>
                      <span className="text-[#64748B] w-10 text-right">{item.percentage}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-[#E5E8EB] p-5 shadow-xs flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#0F172A] uppercase tracking-wider mb-3">
                  P&L Projection
                </h3>

                <div className="space-y-3">
                  <div className="p-3.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
                    <span className="text-[11px] text-[#64748B]">Total Input & Operating Investment</span>
                    <p className="text-lg font-bold text-[#0F172A] tabular-nums mt-0.5">
                      {formatCurrency(financials?.totalCost || 0)}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-lg bg-[#F0FDF4] border border-[#DCFCE7]">
                    <span className="text-[11px] text-[#166534]">Gross Harvest Value (Target)</span>
                    <p className="text-lg font-bold text-[#143D30] tabular-nums mt-0.5">
                      {formatCurrency(financials?.estimatedRevenue || 0)}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-lg bg-[#143D30] text-white">
                    <span className="text-[11px] text-white/80">Projected Farm Net Profit</span>
                    <p className="text-xl font-bold tabular-nums mt-0.5">
                      {formatCurrency(financials?.estimatedProfit || 0)}
                    </p>
                    <p className="text-[11px] text-emerald-300 font-semibold mt-1 tabular-nums">
                      ROI / Profit Margin: {financials?.profitMargin || 0}%
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[#F1F5F9] text-[11px] text-[#94A3B8]">
                Derived from live expense ledgers and target harvest yield pricing.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Inputs */}
      {activeTab === 'inputs' && (
        <div className="bg-white rounded-xl border border-[#E5E8EB] p-5 shadow-xs">
          <h3 className="text-sm font-bold text-[#0F172A] uppercase tracking-wider mb-3">
            Input Consumption Ledger
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[#E5E8EB] text-[#64748B] uppercase">
                <tr>
                  <th className="pb-2.5 font-semibold">Input Name</th>
                  <th className="pb-2.5 font-semibold">Type</th>
                  <th className="pb-2.5 font-semibold">Quantity</th>
                  <th className="pb-2.5 font-semibold">Cost</th>
                  <th className="pb-2.5 font-semibold">Used Date</th>
                  <th className="pb-2.5 font-semibold">Supplier</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {inputs.map(inp => (
                  <tr key={inp.id} className="hover:bg-[#F8FAFC]">
                    <td className="py-2.5 font-semibold text-[#0F172A]">{inp.name}</td>
                    <td className="py-2.5 text-[#64748B]">{inp.input_type}</td>
                    <td className="py-2.5 font-bold tabular-nums">{inp.quantity} {inp.unit}</td>
                    <td className="py-2.5 font-bold text-[#143D30] tabular-nums">{formatCurrency(inp.cost)}</td>
                    <td className="py-2.5 text-[#94A3B8]">{inp.used_date}</td>
                    <td className="py-2.5 text-[#64748B]">{inp.supplier || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Activity Modal */}
      {actModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in" onClick={() => setActModalOpen(false)}>
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl border border-[#E5E8EB] animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E8EB] mb-4">
              <h2 className="text-sm font-bold text-[#0F172A]">
                Schedule Operation for {crop.crop_name}
              </h2>
              <button onClick={() => setActModalOpen(false)} className="p-1 rounded text-[#94A3B8] hover:bg-[#F1F5F9]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateActivity} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#334155] mb-1">
                  Activity Title *
                </label>
                <input
                  type="text"
                  required
                  value={actForm.title}
                  onChange={e => setActForm({ ...actForm, title: e.target.value })}
                  placeholder="e.g. Zinc Foliar Spray Application"
                  className="w-full px-3 py-2 rounded-lg border border-[#CBD5E1] bg-[#F8FAFC] text-xs text-[#0F172A] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#143D30]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#334155] mb-1">
                    Activity Type
                  </label>
                  <select
                    value={actForm.activity_type}
                    onChange={e => setActForm({ ...actForm, activity_type: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-lg border border-[#CBD5E1] bg-[#F8FAFC] text-xs text-[#0F172A] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#143D30]"
                  >
                    <option value="LAND_PREPARATION">Land Preparation</option>
                    <option value="SOWING">Sowing / Planting</option>
                    <option value="FERTILIZATION">Fertilization</option>
                    <option value="IRRIGATION">Irrigation</option>
                    <option value="WEEDING">Weeding</option>
                    <option value="PEST_INSPECTION">Pest Inspection</option>
                    <option value="SPRAYING">Spraying</option>
                    <option value="HARVEST">Harvest</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#334155] mb-1">
                    Priority
                  </label>
                  <select
                    value={actForm.priority}
                    onChange={e => setActForm({ ...actForm, priority: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-lg border border-[#CBD5E1] bg-[#F8FAFC] text-xs text-[#0F172A] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#143D30]"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#334155] mb-1">
                    Planned Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={actForm.planned_date}
                    onChange={e => setActForm({ ...actForm, planned_date: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-[#CBD5E1] bg-[#F8FAFC] text-xs text-[#0F172A] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#143D30]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#334155] mb-1">
                    Estimated Cost (₹)
                  </label>
                  <input
                    type="number"
                    value={actForm.estimated_cost}
                    onChange={e => setActForm({ ...actForm, estimated_cost: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg border border-[#CBD5E1] bg-[#F8FAFC] text-xs text-[#0F172A] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#143D30] tabular-nums"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#334155] mb-1">
                  Description / Method
                </label>
                <textarea
                  rows={2}
                  value={actForm.description}
                  onChange={e => setActForm({ ...actForm, description: e.target.value })}
                  placeholder="Dosage, labor requirement, implement details..."
                  className="w-full px-3 py-2 rounded-lg border border-[#CBD5E1] bg-[#F8FAFC] text-xs text-[#0F172A] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#143D30] resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#E5E8EB]">
                <button
                  type="button"
                  onClick={() => setActModalOpen(false)}
                  className="px-3 py-2 rounded-lg text-xs font-medium text-[#475569] hover:bg-[#F1F5F9]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-3.5 py-2 rounded-lg bg-[#143D30] hover:bg-[#1A4D3E] text-white text-xs font-semibold shadow-xs"
                >
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin mx-auto" /> : 'Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
