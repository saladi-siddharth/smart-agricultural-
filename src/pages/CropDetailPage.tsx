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
import type {
  CropCycle, Activity, Expense, Input as FarmInput,
  IrrigationLog, Harvest, CropFinancials, ActivityInsert
} from '@/types/database';
import {
  ArrowLeft, CheckCircle2, Clock, AlertTriangle, Plus, Loader2
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
  const [activeTab, setActiveTab] = useState<'timeline' | 'finances' | 'inputs' | 'irrigation'>('timeline');

  // Quick activity modal
  const [actModalOpen, setActModalOpen] = useState(false);
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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleCompleteActivity = async (activityId: string) => {
    try {
      await activityService.complete(activityId);
      loadData();
    } catch (err) {
      console.error('Failed completing activity', err);
    }
  };

  const handleCreateActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await activityService.create(actForm);
      setActModalOpen(false);
      loadData();
    } catch (err) {
      console.error('Failed creating activity', err);
    }
  };

  if (loading) {
    return (
      <div className="p-16 flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--color-primary-600)] mb-3" />
        <p className="text-sm text-[var(--color-text-secondary)]">Loading crop command center...</p>
      </div>
    );
  }

  if (!crop) {
    return (
      <div className="p-12 text-center bg-white rounded-2xl border border-[var(--color-border-light)]">
        <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-2" />
        <h2 className="text-lg font-bold text-[var(--color-text-primary)]">Crop cycle not found</h2>
        <Link to="/crops" className="mt-4 inline-flex items-center gap-2 text-sm text-[var(--color-primary-600)] font-medium">
          <ArrowLeft className="w-4 h-4" />
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            to="/crops"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--color-text-muted)] hover:text-[var(--color-primary-700)] transition-colors mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>All Crop Cycles</span>
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl lg:text-3xl font-bold text-[var(--color-text-primary)]">
              {crop.crop_name}
            </h1>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase ${
              crop.status === 'ACTIVE'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-blue-50 text-blue-700 border border-blue-200'
            }`}>
              {crop.status}
            </span>
          </div>
          <p className="text-sm text-[var(--color-text-secondary)] mt-0.5">
            Variety: <span className="font-semibold">{crop.variety || 'Standard'}</span> • Field: <span className="font-semibold">{crop.field?.name || 'Assigned Plot'}</span> • Season: <span className="font-semibold">{crop.season}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setActModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl gradient-primary text-white text-sm font-medium shadow-sm hover:shadow-md transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Log Crop Activity</span>
          </button>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-[var(--color-border-light)] shadow-xs">
          <p className="text-xs font-medium text-[var(--color-text-secondary)]">Crop Cycle Progress</p>
          <div className="flex items-baseline gap-2 mt-2">
            <p className="text-2xl font-bold text-[var(--color-text-primary)]">{progress}%</p>
            <span className="text-xs text-[var(--color-text-muted)]">
              ({completedCount}/{activities.length} tasks)
            </span>
          </div>
          <div className="w-full h-1.5 bg-gray-100 rounded-full mt-3 overflow-hidden">
            <div className="h-full gradient-primary rounded-full" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[var(--color-border-light)] shadow-xs">
          <p className="text-xs font-medium text-[var(--color-text-secondary)]">Total Expenses Spent</p>
          <div className="flex items-baseline gap-2 mt-2">
            <p className="text-2xl font-bold text-[var(--color-text-primary)]">
              {formatCurrency(financials?.totalCost || 0)}
            </p>
          </div>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">
            Budget: {formatCurrency(crop.planned_budget)} ({financials?.budgetUtilization || 0}%)
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[var(--color-border-light)] shadow-xs">
          <p className="text-xs font-medium text-[var(--color-text-secondary)]">Projected Revenue</p>
          <p className="text-2xl font-bold text-emerald-700 mt-2">
            {formatCurrency(financials?.estimatedRevenue || 0)}
          </p>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">
            Target yield: {crop.target_yield} {crop.yield_unit} @ ₹{crop.selling_price_per_unit}/T
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[var(--color-border-light)] shadow-xs">
          <p className="text-xs font-medium text-[var(--color-text-secondary)]">Estimated Net Profit</p>
          <p className="text-2xl font-bold text-[var(--color-primary-700)] mt-2">
            {formatCurrency(financials?.estimatedProfit || 0)}
          </p>
          <p className="text-xs text-emerald-600 font-medium mt-1">
            Profit Margin: {financials?.profitMargin || 0}%
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[var(--color-border-light)] pb-2">
        {[
          { id: 'timeline', label: 'Operations & Timeline' },
          { id: 'finances', label: 'Financials & P&L' },
          { id: 'inputs', label: `Inputs & Resources (${inputs.length})` },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
              activeTab === tab.id
                ? 'bg-[var(--color-primary-50)] text-[var(--color-primary-700)] font-semibold'
                : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-tertiary)]'
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
            <div className="p-4 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
                <div>
                  <p className="text-sm font-bold text-red-900">
                    {overdueCount} Overdue Operation Needs Immediate Attention!
                  </p>
                  <p className="text-xs text-red-700">
                    Pending critical operations negatively impact your Farm Health Score and crop yield potential.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-[var(--color-border-light)] p-6 shadow-xs">
            <h3 className="text-base font-bold text-[var(--color-text-primary)] mb-4">
              Crop Cycle Operations Timeline
            </h3>

            <div className="space-y-3">
              {activities.map(act => (
                <div
                  key={act.id}
                  className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    act.status === 'OVERDUE'
                      ? 'border-red-300 bg-red-50/50'
                      : act.status === 'COMPLETED'
                      ? 'border-[var(--color-border-light)] bg-white'
                      : 'border-amber-200 bg-amber-50/30'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 p-1.5 rounded-lg ${
                      act.status === 'COMPLETED'
                        ? 'bg-emerald-100 text-emerald-700'
                        : act.status === 'OVERDUE'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}>
                      {act.status === 'COMPLETED' ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : act.status === 'OVERDUE' ? (
                        <AlertTriangle className="w-4 h-4" />
                      ) : (
                        <Clock className="w-4 h-4" />
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">
                          {act.activity_type.replace('_', ' ')}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          act.status === 'OVERDUE'
                            ? 'bg-red-100 text-red-800'
                            : act.status === 'COMPLETED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {act.status}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-[var(--color-text-primary)] mt-0.5">
                        {act.title}
                      </h4>
                      <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                        {act.description}
                      </p>
                      <p className="text-[11px] text-[var(--color-text-muted)] mt-1">
                        Planned: {new Date(act.planned_date).toLocaleDateString()}
                        {act.completed_date && ` • Completed: ${new Date(act.completed_date).toLocaleDateString()}`}
                        {` • Cost: ₹${act.actual_cost || act.estimated_cost}`}
                      </p>
                    </div>
                  </div>

                  {act.status !== 'COMPLETED' && (
                    <button
                      onClick={() => handleCompleteActivity(act.id)}
                      className="px-3.5 py-1.5 rounded-xl gradient-primary text-white text-xs font-semibold shadow-xs hover:shadow-md transition-all self-start sm:self-center cursor-pointer whitespace-nowrap"
                    >
                      Mark Complete
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-[var(--color-border-light)] p-6 shadow-xs">
              <h3 className="text-base font-bold text-[var(--color-text-primary)] mb-4">
                Cost Distribution by Category
              </h3>
              {financials?.costBreakdown && financials.costBreakdown.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={financials.costBreakdown}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={4}
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
                <p className="text-xs text-[var(--color-text-muted)] text-center py-12">No expense entries recorded</p>
              )}

              <div className="space-y-2 mt-4">
                {financials?.costBreakdown.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs py-1 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: item.color }} />
                      <span className="font-medium text-[var(--color-text-primary)]">{item.category}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-[var(--color-text-primary)]">{formatCurrency(item.amount)}</span>
                      <span className="text-[var(--color-text-muted)] w-10 text-right">{item.percentage}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-[var(--color-border-light)] p-6 shadow-xs flex flex-col justify-between">
              <div>
                <h3 className="text-base font-bold text-[var(--color-text-primary)] mb-4">
                  Profit & Loss Simulation
                </h3>

                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-[var(--color-surface-secondary)] border border-[var(--color-border-light)]">
                    <span className="text-xs text-[var(--color-text-secondary)]">Total Input & Operating Investment</span>
                    <p className="text-xl font-bold text-[var(--color-text-primary)] mt-1">
                      {formatCurrency(financials?.totalCost || 0)}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100">
                    <span className="text-xs text-emerald-800">Gross Harvest Value (Target)</span>
                    <p className="text-xl font-bold text-emerald-800 mt-1">
                      {formatCurrency(financials?.estimatedRevenue || 0)}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl gradient-primary text-white">
                    <span className="text-xs text-white/80">Projected Farm Net Profit</span>
                    <p className="text-2xl font-bold mt-1">
                      {formatCurrency(financials?.estimatedProfit || 0)}
                    </p>
                    <p className="text-xs text-white/80 mt-1">
                      ROI / Profit Margin: {financials?.profitMargin || 0}%
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-[var(--color-border-light)] text-xs text-[var(--color-text-muted)]">
                Calculations derived from live expense ledgers, input procurement receipts, and target harvest yield pricing.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Inputs */}
      {activeTab === 'inputs' && (
        <div className="bg-white rounded-2xl border border-[var(--color-border-light)] p-6 shadow-xs">
          <h3 className="text-base font-bold text-[var(--color-text-primary)] mb-4">
            Input Consumption Ledger
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[var(--color-border-light)] text-[var(--color-text-secondary)] uppercase">
                <tr>
                  <th className="pb-3 font-semibold">Input Name</th>
                  <th className="pb-3 font-semibold">Type</th>
                  <th className="pb-3 font-semibold">Quantity</th>
                  <th className="pb-3 font-semibold">Cost</th>
                  <th className="pb-3 font-semibold">Used Date</th>
                  <th className="pb-3 font-semibold">Supplier</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border-light)]">
                {inputs.map(inp => (
                  <tr key={inp.id} className="hover:bg-[var(--color-surface-secondary)]">
                    <td className="py-3 font-semibold text-[var(--color-text-primary)]">{inp.name}</td>
                    <td className="py-3">{inp.input_type}</td>
                    <td className="py-3 font-bold">{inp.quantity} {inp.unit}</td>
                    <td className="py-3 font-bold text-[var(--color-primary-700)]">{formatCurrency(inp.cost)}</td>
                    <td className="py-3 text-[var(--color-text-muted)]">{inp.used_date}</td>
                    <td className="py-3 text-[var(--color-text-secondary)]">{inp.supplier || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Activity Modal */}
      {actModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-[var(--color-border-light)] animate-scale-in">
            <h2 className="text-lg font-bold text-[var(--color-text-primary)] mb-4">
              Schedule Operation for {crop.crop_name}
            </h2>

            <form onSubmit={handleCreateActivity} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
                  Activity Title *
                </label>
                <input
                  type="text"
                  required
                  value={actForm.title}
                  onChange={e => setActForm({ ...actForm, title: e.target.value })}
                  placeholder="e.g. Zinc Foliar Spray Application"
                  className="w-full px-3 py-2 rounded-xl border border-[var(--color-border-light)] text-sm focus:ring-2 focus:ring-[var(--color-primary-500)] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
                    Activity Type
                  </label>
                  <select
                    value={actForm.activity_type}
                    onChange={e => setActForm({ ...actForm, activity_type: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-[var(--color-border-light)] text-sm focus:ring-2 focus:ring-[var(--color-primary-500)] outline-none"
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
                  <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
                    Priority
                  </label>
                  <select
                    value={actForm.priority}
                    onChange={e => setActForm({ ...actForm, priority: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-[var(--color-border-light)] text-sm focus:ring-2 focus:ring-[var(--color-primary-500)] outline-none"
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
                  <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
                    Planned Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={actForm.planned_date}
                    onChange={e => setActForm({ ...actForm, planned_date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-[var(--color-border-light)] text-sm focus:ring-2 focus:ring-[var(--color-primary-500)] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
                    Estimated Cost (₹)
                  </label>
                  <input
                    type="number"
                    value={actForm.estimated_cost}
                    onChange={e => setActForm({ ...actForm, estimated_cost: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-[var(--color-border-light)] text-sm focus:ring-2 focus:ring-[var(--color-primary-500)] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
                  Description / Method
                </label>
                <textarea
                  rows={2}
                  value={actForm.description}
                  onChange={e => setActForm({ ...actForm, description: e.target.value })}
                  placeholder="Dosage, labor requirement, implement details..."
                  className="w-full px-3 py-2 rounded-xl border border-[var(--color-border-light)] text-sm focus:ring-2 focus:ring-[var(--color-primary-500)] outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--color-border-light)]">
                <button
                  type="button"
                  onClick={() => setActModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-tertiary)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl gradient-primary text-white text-sm font-medium shadow-sm hover:shadow-md cursor-pointer"
                >
                  Schedule Operation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
