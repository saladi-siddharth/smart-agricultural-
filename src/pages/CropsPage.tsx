import { useState, useEffect } from 'react';
import { cropService } from '@/services/cropService';
import { farmService } from '@/services/farmService';
import { fieldService } from '@/services/fieldService';
import { activityService } from '@/services/activityService';
import { expenseService } from '@/services/expenseService';
import { calculateCropProgressScore, formatCurrency } from '@/services/intelligenceService';
import type { CropCycle, Farm, Field, CropCycleInsert } from '@/types/database';
import {
  Leaf, Plus, Calendar, DollarSign, Target, ChevronRight,
  TrendingUp, Clock, CheckCircle2, AlertCircle, Loader2
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function CropsPage() {
  const [crops, setCrops] = useState<CropCycle[]>([]);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [fields, setFields] = useState<Field[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'PLANNED' | 'COMPLETED'>('ALL');
  const [modalOpen, setModalOpen] = useState(false);

  // Stats
  const [cropStats, setCropStats] = useState<Record<string, { progress: number; spent: number }>>({});

  const [formData, setFormData] = useState<CropCycleInsert>({
    farm_id: '',
    field_id: '',
    crop_name: '',
    variety: '',
    season: 'Kharif',
    start_date: new Date().toISOString().split('T')[0],
    expected_harvest_date: '',
    status: 'ACTIVE',
    target_yield: 4.0,
    yield_unit: 'tonnes',
    selling_price_per_unit: 28000,
    planned_budget: 50000,
    notes: '',
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [allCrops, allFarms, allFields, allActs, allExps] = await Promise.all([
        cropService.getAll(),
        farmService.getAll(),
        fieldService.getAll(),
        activityService.getAll(),
        expenseService.getAll(),
      ]);

      setCrops(allCrops);
      setFarms(allFarms);
      setFields(allFields);

      // Compute per-crop progress and expenses
      const stats: Record<string, { progress: number; spent: number }> = {};
      for (const c of allCrops) {
        const cActs = allActs.filter(a => a.crop_cycle_id === c.id);
        const cExps = allExps.filter(e => e.crop_cycle_id === c.id);
        const progress = Math.round(calculateCropProgressScore(cActs));
        const spent = cExps.reduce((sum, e) => sum + Number(e.amount || 0), 0);
        stats[c.id] = { progress, spent };
      }
      setCropStats(stats);

      if (allFarms.length > 0 && allFields.length > 0 && !formData.farm_id) {
        setFormData(prev => ({
          ...prev,
          farm_id: allFarms[0].id,
          field_id: allFields[0].id,
        }));
      }
    } catch (err) {
      console.error('Failed loading crop cycles', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreateModal = () => {
    setFormData({
      farm_id: farms[0]?.id || '',
      field_id: fields[0]?.id || '',
      crop_name: '',
      variety: '',
      season: 'Kharif',
      start_date: new Date().toISOString().split('T')[0],
      expected_harvest_date: '',
      status: 'ACTIVE',
      target_yield: 4.5,
      yield_unit: 'tonnes',
      selling_price_per_unit: 29000,
      planned_budget: 55000,
      notes: '',
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await cropService.create(formData);
      setModalOpen(false);
      loadData();
    } catch (err) {
      console.error('Failed creating crop cycle', err);
    }
  };

  const filteredCrops = crops.filter(c => {
    if (filter === 'ALL') return true;
    return c.status === filter;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[var(--color-primary-700)] uppercase tracking-wider mb-1">
            <Leaf className="w-3.5 h-3.5" />
            <span>Crop Lifecycle Management</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold text-[var(--color-text-primary)]">
            Crop Cycles & Seasons
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-0.5">
            Monitor planting schedules, stage progression, budget vs spend, and harvest projections.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl gradient-primary text-white text-sm font-medium shadow-sm hover:shadow-md transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Crop Cycle</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-[var(--color-border-light)] pb-2">
        {(['ALL', 'ACTIVE', 'PLANNED', 'COMPLETED'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
              filter === tab
                ? 'bg-[var(--color-primary-50)] text-[var(--color-primary-700)] font-semibold'
                : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-tertiary)]'
            }`}
          >
            {tab === 'ALL' ? 'All Seasons' : tab.charAt(0) + tab.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {/* Crop Cards */}
      {loading ? (
        <div className="p-12 flex flex-col items-center justify-center bg-white rounded-2xl border border-[var(--color-border-light)]">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--color-primary-600)] mb-3" />
          <p className="text-sm text-[var(--color-text-secondary)]">Loading crop cycles...</p>
        </div>
      ) : filteredCrops.length === 0 ? (
        <div className="text-center p-12 bg-white rounded-2xl border border-[var(--color-border-light)] shadow-xs">
          <Leaf className="w-12 h-12 text-[var(--color-text-muted)] mx-auto mb-3" />
          <h3 className="text-base font-semibold text-[var(--color-text-primary)]">No crop cycles found</h3>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1 max-w-md mx-auto">
            Create a crop cycle to plan operations from seed bed to harvest, track financial ROI, and measure crop health.
          </p>
          <button
            onClick={openCreateModal}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl gradient-primary text-white text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            <span>Launch New Crop</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredCrops.map(crop => {
            const stats = cropStats[crop.id] || { progress: 0, spent: 0 };
            const budgetPercent = crop.planned_budget > 0
              ? Math.min(100, Math.round((stats.spent / crop.planned_budget) * 100))
              : 0;
            const field = fields.find(f => f.id === crop.field_id);
            const estRevenue = (crop.target_yield || 0) * (crop.selling_price_per_unit || 0);

            return (
              <div
                key={crop.id}
                className="bg-white rounded-2xl border border-[var(--color-border-light)] p-6 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider ${
                          crop.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : crop.status === 'COMPLETED'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {crop.status}
                        </span>
                        <span className="text-xs text-[var(--color-text-muted)]">• {crop.season} Season</span>
                      </div>
                      <h3 className="text-xl font-bold text-[var(--color-text-primary)]">
                        {crop.crop_name}
                      </h3>
                      <p className="text-xs text-[var(--color-text-secondary)]">
                        Variety: <span className="font-semibold">{crop.variety || 'Standard'}</span> • Field: <span className="font-semibold">{field?.name || 'Assigned Plot'}</span>
                      </p>
                    </div>

                    <Link
                      to={`/crops/${crop.id}`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[var(--color-surface-tertiary)] hover:bg-[var(--color-primary-50)] text-xs font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-primary-700)] transition-colors"
                    >
                      <span>Command View</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>

                  <p className="text-xs text-[var(--color-text-secondary)] mb-5 line-clamp-2">
                    {crop.notes || 'Target yield planned with integrated pest and irrigation protocols.'}
                  </p>

                  {/* Stage Progress Bar */}
                  <div className="mb-5 bg-[var(--color-surface-secondary)] p-3 rounded-xl border border-[var(--color-border-light)]">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-medium text-[var(--color-text-secondary)]">Crop Cycle Completion</span>
                      <span className="font-bold text-[var(--color-primary-700)]">{stats.progress}%</span>
                    </div>
                    <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full gradient-primary rounded-full transition-all duration-500"
                        style={{ width: `${stats.progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Financial & Yield Grid */}
                  <div className="grid grid-cols-3 gap-3 text-xs py-3 border-y border-[var(--color-border-light)] mb-4">
                    <div>
                      <span className="text-[var(--color-text-muted)] block text-[11px]">Target Yield</span>
                      <span className="font-bold text-[var(--color-text-primary)] text-sm">
                        {crop.target_yield} {crop.yield_unit}
                      </span>
                    </div>
                    <div>
                      <span className="text-[var(--color-text-muted)] block text-[11px]">Budget Spent</span>
                      <span className="font-bold text-[var(--color-text-primary)] text-sm">
                        {formatCurrency(stats.spent)}
                      </span>
                      <span className="text-[10px] text-[var(--color-text-muted)] block">of {formatCurrency(crop.planned_budget)} ({budgetPercent}%)</span>
                    </div>
                    <div>
                      <span className="text-[var(--color-text-muted)] block text-[11px]">Projected Rev</span>
                      <span className="font-bold text-emerald-700 text-sm">
                        {formatCurrency(estRevenue)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-[var(--color-text-muted)] pt-2">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Sown: {new Date(crop.start_date).toLocaleDateString()}</span>
                  </div>
                  {crop.expected_harvest_date && (
                    <div className="flex items-center gap-1.5 text-amber-700 font-medium">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Target Harvest: {new Date(crop.expected_harvest_date).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* New Crop Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-[var(--color-border-light)] animate-scale-in max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-[var(--color-text-primary)] mb-4">
              Launch New Crop Cycle
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
                    Crop Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.crop_name}
                    onChange={e => setFormData({ ...formData, crop_name: e.target.value })}
                    placeholder="e.g. Paddy (Rice)"
                    className="w-full px-3 py-2 rounded-xl border border-[var(--color-border-light)] text-sm focus:ring-2 focus:ring-[var(--color-primary-500)] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
                    Variety / Hybrid
                  </label>
                  <input
                    type="text"
                    value={formData.variety}
                    onChange={e => setFormData({ ...formData, variety: e.target.value })}
                    placeholder="e.g. BPT 5204"
                    className="w-full px-3 py-2 rounded-xl border border-[var(--color-border-light)] text-sm focus:ring-2 focus:ring-[var(--color-primary-500)] outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
                    Assigned Plot / Field *
                  </label>
                  <select
                    value={formData.field_id}
                    onChange={e => setFormData({ ...formData, field_id: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-[var(--color-border-light)] text-sm focus:ring-2 focus:ring-[var(--color-primary-500)] outline-none"
                  >
                    {fields.map(f => (
                      <option key={f.id} value={f.id}>{f.name} ({f.area} {f.area_unit})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
                    Season
                  </label>
                  <select
                    value={formData.season}
                    onChange={e => setFormData({ ...formData, season: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-[var(--color-border-light)] text-sm focus:ring-2 focus:ring-[var(--color-primary-500)] outline-none"
                  >
                    <option value="Kharif">Kharif (Monsoon)</option>
                    <option value="Rabi">Rabi (Winter)</option>
                    <option value="Zaid">Zaid (Summer)</option>
                    <option value="Annual">Annual / Perennial</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
                    Sowing / Planting Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.start_date}
                    onChange={e => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-[var(--color-border-light)] text-sm focus:ring-2 focus:ring-[var(--color-primary-500)] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
                    Expected Harvest Date
                  </label>
                  <input
                    type="date"
                    value={formData.expected_harvest_date || ''}
                    onChange={e => setFormData({ ...formData, expected_harvest_date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-[var(--color-border-light)] text-sm focus:ring-2 focus:ring-[var(--color-primary-500)] outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
                    Target Yield (tonnes)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.target_yield}
                    onChange={e => setFormData({ ...formData, target_yield: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-[var(--color-border-light)] text-sm focus:ring-2 focus:ring-[var(--color-primary-500)] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
                    Expected Price/T (₹)
                  </label>
                  <input
                    type="number"
                    value={formData.selling_price_per_unit}
                    onChange={e => setFormData({ ...formData, selling_price_per_unit: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-[var(--color-border-light)] text-sm focus:ring-2 focus:ring-[var(--color-primary-500)] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
                    Planned Budget (₹)
                  </label>
                  <input
                    type="number"
                    value={formData.planned_budget}
                    onChange={e => setFormData({ ...formData, planned_budget: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-[var(--color-border-light)] text-sm focus:ring-2 focus:ring-[var(--color-primary-500)] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
                  Crop Strategy / Field Notes
                </label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Notes on nutrient management, seed vendor, nursery techniques..."
                  className="w-full px-3 py-2 rounded-xl border border-[var(--color-border-light)] text-sm focus:ring-2 focus:ring-[var(--color-primary-500)] outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--color-border-light)]">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-tertiary)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl gradient-primary text-white text-sm font-medium shadow-sm hover:shadow-md cursor-pointer"
                >
                  Create Crop Cycle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
