import { useState, useEffect } from 'react';
import { cropService } from '@/services/cropService';
import { farmService } from '@/services/farmService';
import { fieldService } from '@/services/fieldService';
import { activityService } from '@/services/activityService';
import { expenseService } from '@/services/expenseService';
import { calculateCropProgressScore, formatCurrency } from '@/services/intelligenceService';
import { showToast } from '@/components/common/ToastNotification';
import type { CropCycle, Farm, Field, CropCycleInsert } from '@/types/database';
import {
  Leaf, Plus, Calendar, DollarSign, Target, ChevronRight,
  TrendingUp, Clock, CheckCircle2, AlertCircle, Loader2, X
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function CropsPage() {
  const [crops, setCrops] = useState<CropCycle[]>([]);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [fields, setFields] = useState<Field[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'PLANNED' | 'COMPLETED'>('ALL');
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

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
      showToast.error('Failed to load crop cycles');
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
    setSaving(true);
    try {
      await cropService.create(formData);
      showToast.success(`Crop cycle "${formData.crop_name}" launched`);
      setModalOpen(false);
      loadData();
    } catch (err) {
      console.error('Failed creating crop cycle', err);
      showToast.error('Failed to create crop cycle');
    } finally {
      setSaving(false);
    }
  };

  const filteredCrops = crops.filter(c => {
    if (filter === 'ALL') return true;
    return c.status === filter;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E5E8EB]">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#143D30] uppercase tracking-wider mb-1">
            <Leaf className="w-3.5 h-3.5" />
            <span>Crop Lifecycle Management</span>
          </div>
          <h1 className="text-2xl font-bold text-[#0F172A] tracking-tight">
            Crop Cycles & Seasons
          </h1>
          <p className="text-xs text-[#64748B] mt-0.5">
            Monitor planting schedules, biological stage progression, budget vs spend, and harvest projections.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#143D30] hover:bg-[#1A4D3E] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Crop Cycle</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 border-b border-[#E5E8EB] pb-2">
        {(['ALL', 'ACTIVE', 'PLANNED', 'COMPLETED'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              filter === tab
                ? 'bg-[#143D30] text-white font-semibold shadow-xs'
                : 'text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9]'
            }`}
          >
            {tab === 'ALL' ? 'All Seasons' : tab.charAt(0) + tab.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {/* Crop Cards */}
      {loading ? (
        <div className="p-12 flex flex-col items-center justify-center bg-white rounded-xl border border-[#E5E8EB]">
          <Loader2 className="w-6 h-6 animate-spin text-[#143D30] mb-2" />
          <p className="text-xs text-[#64748B]">Loading crop cycles...</p>
        </div>
      ) : filteredCrops.length === 0 ? (
        <div className="text-center p-12 bg-white rounded-xl border border-[#E5E8EB] shadow-xs">
          <Leaf className="w-10 h-10 text-[#94A3B8] mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-[#0F172A]">No crop cycles found</h3>
          <p className="text-xs text-[#64748B] mt-1 max-w-sm mx-auto">
            Create a crop cycle to plan operations from seed bed to harvest, track financial ROI, and measure crop health.
          </p>
          <button
            onClick={openCreateModal}
            className="mt-4 inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#143D30] text-white text-xs font-semibold shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Launch New Crop</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
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
                className="bg-white rounded-xl border border-[#E5E8EB] p-5 shadow-xs hover:border-[#CBD5E1] transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          crop.status === 'ACTIVE'
                            ? 'bg-[#F0FDF4] text-[#143D30] border border-[#DCFCE7]'
                            : crop.status === 'COMPLETED'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {crop.status}
                        </span>
                        <span className="text-xs text-[#64748B]">• {crop.season} Season</span>
                      </div>
                      <h3 className="text-lg font-bold text-[#0F172A]">
                        {crop.crop_name}
                      </h3>
                      <p className="text-xs text-[#64748B]">
                        Variety: <span className="font-semibold text-[#334155]">{crop.variety || 'Standard'}</span> • Field: <span className="font-semibold text-[#334155]">{field?.name || 'Assigned Plot'}</span>
                      </p>
                    </div>

                    <Link
                      to={`/crops/${crop.id}`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-[#E2E8F0] text-xs font-semibold text-[#143D30] transition-colors"
                    >
                      <span>Command View</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>

                  <p className="text-xs text-[#64748B] mb-4 line-clamp-2">
                    {crop.notes || 'Target yield planned with integrated pest and irrigation protocols.'}
                  </p>

                  {/* Stage Progress Bar */}
                  <div className="mb-4 bg-[#F8FAFC] p-3 rounded-lg border border-[#F1F5F9]">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-medium text-[#64748B]">Crop Cycle Completion</span>
                      <span className="font-bold text-[#143D30] tabular-nums">{stats.progress}%</span>
                    </div>
                    <div className="w-full h-2 bg-[#E2E8F0] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#143D30] rounded-full transition-all duration-500"
                        style={{ width: `${stats.progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Financial & Yield Grid */}
                  <div className="grid grid-cols-3 gap-3 text-xs py-3 border-y border-[#F1F5F9] mb-3">
                    <div>
                      <span className="text-[11px] text-[#94A3B8] block">Target Yield</span>
                      <span className="font-bold text-[#0F172A] text-sm tabular-nums">
                        {crop.target_yield} {crop.yield_unit}
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] text-[#94A3B8] block">Budget Spent</span>
                      <span className="font-bold text-[#0F172A] text-sm tabular-nums">
                        {formatCurrency(stats.spent)}
                      </span>
                      <span className="text-[10px] text-[#94A3B8] block tabular-nums">of {formatCurrency(crop.planned_budget)} ({budgetPercent}%)</span>
                    </div>
                    <div>
                      <span className="text-[11px] text-[#94A3B8] block">Projected Rev</span>
                      <span className="font-bold text-emerald-700 text-sm tabular-nums">
                        {formatCurrency(estRevenue)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-[#94A3B8] pt-1">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in" onClick={() => setModalOpen(false)}>
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl border border-[#E5E8EB] animate-scale-in max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E8EB] mb-4">
              <h2 className="text-sm font-bold text-[#0F172A]">Launch New Crop Cycle</h2>
              <button onClick={() => setModalOpen(false)} className="p-1 rounded text-[#94A3B8] hover:bg-[#F1F5F9]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#334155] mb-1">
                    Crop Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.crop_name}
                    onChange={e => setFormData({ ...formData, crop_name: e.target.value })}
                    placeholder="e.g. Paddy (Rice)"
                    className="w-full px-3 py-2 rounded-lg border border-[#CBD5E1] bg-[#F8FAFC] text-xs text-[#0F172A] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#143D30]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#334155] mb-1">
                    Variety / Hybrid
                  </label>
                  <input
                    type="text"
                    value={formData.variety}
                    onChange={e => setFormData({ ...formData, variety: e.target.value })}
                    placeholder="e.g. BPT 5204"
                    className="w-full px-3 py-2 rounded-lg border border-[#CBD5E1] bg-[#F8FAFC] text-xs text-[#0F172A] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#143D30]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#334155] mb-1">
                    Assigned Plot / Field *
                  </label>
                  <select
                    value={formData.field_id}
                    onChange={e => setFormData({ ...formData, field_id: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-[#CBD5E1] bg-[#F8FAFC] text-xs text-[#0F172A] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#143D30]"
                  >
                    {fields.map(f => (
                      <option key={f.id} value={f.id}>{f.name} ({f.area} {f.area_unit})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#334155] mb-1">
                    Season
                  </label>
                  <select
                    value={formData.season}
                    onChange={e => setFormData({ ...formData, season: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-lg border border-[#CBD5E1] bg-[#F8FAFC] text-xs text-[#0F172A] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#143D30]"
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
                  <label className="block text-xs font-semibold text-[#334155] mb-1">
                    Sowing Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.start_date}
                    onChange={e => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-[#CBD5E1] bg-[#F8FAFC] text-xs text-[#0F172A] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#143D30]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#334155] mb-1">
                    Expected Harvest Date
                  </label>
                  <input
                    type="date"
                    value={formData.expected_harvest_date || ''}
                    onChange={e => setFormData({ ...formData, expected_harvest_date: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-[#CBD5E1] bg-[#F8FAFC] text-xs text-[#0F172A] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#143D30]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#334155] mb-1">
                    Target Yield (tonnes)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.target_yield}
                    onChange={e => setFormData({ ...formData, target_yield: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg border border-[#CBD5E1] bg-[#F8FAFC] text-xs text-[#0F172A] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#143D30] tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#334155] mb-1">
                    Expected Price/T (₹)
                  </label>
                  <input
                    type="number"
                    value={formData.selling_price_per_unit}
                    onChange={e => setFormData({ ...formData, selling_price_per_unit: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg border border-[#CBD5E1] bg-[#F8FAFC] text-xs text-[#0F172A] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#143D30] tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#334155] mb-1">
                    Planned Budget (₹)
                  </label>
                  <input
                    type="number"
                    value={formData.planned_budget}
                    onChange={e => setFormData({ ...formData, planned_budget: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg border border-[#CBD5E1] bg-[#F8FAFC] text-xs text-[#0F172A] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#143D30] tabular-nums"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#334155] mb-1">
                  Crop Strategy / Field Notes
                </label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Notes on nutrient management, seed vendor, nursery techniques..."
                  className="w-full px-3 py-2 rounded-lg border border-[#CBD5E1] bg-[#F8FAFC] text-xs text-[#0F172A] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#143D30] resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#E5E8EB]">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-3 py-2 rounded-lg text-xs font-medium text-[#475569] hover:bg-[#F1F5F9]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-3.5 py-2 rounded-lg bg-[#143D30] hover:bg-[#1A4D3E] text-white text-xs font-semibold shadow-xs cursor-pointer"
                >
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin mx-auto" /> : 'Launch Season'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
