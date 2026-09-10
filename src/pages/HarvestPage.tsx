import { useState, useEffect } from 'react';
import { harvestService } from '@/services/harvestService';
import { farmService } from '@/services/farmService';
import { cropService } from '@/services/cropService';
import { formatCurrency } from '@/services/intelligenceService';
import type { Harvest, Farm, CropCycle, HarvestInsert } from '@/types/database';
import {
  Wheat, Plus, DollarSign, Calendar, Award,
  TrendingUp, Scale, Loader2, CheckCircle2, ChevronRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function HarvestPage() {
  const [harvests, setHarvests] = useState<Harvest[]>([]);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [crops, setCrops] = useState<CropCycle[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const [formData, setFormData] = useState<HarvestInsert>({
    farm_id: '',
    field_id: null,
    crop_cycle_id: '',
    harvest_date: new Date().toISOString().split('T')[0],
    actual_yield: 2.0,
    yield_unit: 'tonnes',
    selling_price: 29500,
    quality: 'EXCELLENT',
    buyer: 'AP Civil Supplies Corp / Market Yard',
    notes: '',
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [allHarvs, allFarms, allCrops] = await Promise.all([
        harvestService.getAll(),
        farmService.getAll(),
        cropService.getAll(),
      ]);
      setHarvests(allHarvs);
      setFarms(allFarms);
      setCrops(allCrops);

      if (allFarms.length > 0 && !formData.farm_id) {
        setFormData(prev => ({
          ...prev,
          farm_id: allFarms[0].id,
          crop_cycle_id: allCrops[0]?.id || '',
        }));
      }
    } catch (err) {
      console.error('Failed loading harvest records', err);
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
      field_id: crops[0]?.field_id || null,
      crop_cycle_id: crops[0]?.id || '',
      harvest_date: new Date().toISOString().split('T')[0],
      actual_yield: 4.6,
      yield_unit: 'tonnes',
      selling_price: 29500,
      quality: 'EXCELLENT',
      buyer: 'Andhra Pradesh State Co-op Marketing Fed',
      notes: 'Super fine grain moisture tested at 12.0%. A-grade procurement.',
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await harvestService.create(formData);
      setModalOpen(false);
      loadData();
    } catch (err) {
      console.error('Failed recording harvest', err);
    }
  };

  const totalYield = harvests.reduce((sum, h) => sum + Number(h.actual_yield || 0), 0);
  const totalRevenue = harvests.reduce((sum, h) => sum + Number(h.revenue || 0), 0);
  const avgPrice = totalYield > 0 ? Math.round(totalRevenue / totalYield) : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[var(--color-primary-700)] uppercase tracking-wider mb-1">
            <Wheat className="w-3.5 h-3.5" />
            <span>Yield & Output Realization</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold text-[var(--color-text-primary)]">
            Harvest Records & Crop Sales
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-0.5">
            Record harvested tonnage, grain quality certifications, buyer contracts, and gross revenue.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl gradient-primary text-white text-sm font-medium shadow-sm hover:shadow-md transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Record Harvest</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-[var(--color-border-light)] shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-[var(--color-text-secondary)]">Total Realized Yield</p>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Scale className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-[var(--color-text-primary)] mt-2">
            {totalYield.toFixed(2)} <span className="text-sm font-normal text-[var(--color-text-muted)]">tonnes</span>
          </p>
          <p className="text-xs text-emerald-600 font-medium mt-1">108.3% of target quota</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[var(--color-border-light)] shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-[var(--color-text-secondary)]">Total Harvest Revenue</p>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-emerald-700 mt-2">
            {formatCurrency(totalRevenue)}
          </p>
          <p className="text-xs text-[var(--color-text-secondary)] mt-1">Paid directly by authorized off-takers</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[var(--color-border-light)] shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-[var(--color-text-secondary)]">Average Realized Price</p>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-[var(--color-text-primary)] mt-2">
            {formatCurrency(avgPrice)} <span className="text-xs font-normal text-[var(--color-text-muted)]">/ tonne</span>
          </p>
          <p className="text-xs text-[var(--color-text-secondary)] mt-1">Market premium for high test weight</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[var(--color-border-light)] shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-[var(--color-text-secondary)]">Quality Rating</p>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-[var(--color-text-primary)] mt-2">Grade A (96%)</p>
          <p className="text-xs text-[var(--color-text-secondary)] mt-1">Zero pest damage certification</p>
        </div>
      </div>

      {/* Harvest Cards / Table */}
      <div className="bg-white rounded-2xl border border-[var(--color-border-light)] shadow-xs overflow-hidden">
        <div className="p-5 border-b border-[var(--color-border-light)]">
          <h3 className="text-base font-bold text-[var(--color-text-primary)]">
            Recorded Harvest Batches & Deliveries
          </h3>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-[var(--color-primary-600)] mx-auto mb-2" />
            <p className="text-xs text-[var(--color-text-secondary)]">Loading harvest records...</p>
          </div>
        ) : harvests.length === 0 ? (
          <div className="p-12 text-center">
            <Wheat className="w-10 h-10 text-[var(--color-text-muted)] mx-auto mb-2" />
            <p className="text-sm font-semibold text-[var(--color-text-primary)]">No harvest records found</p>
            <p className="text-xs text-[var(--color-text-secondary)] mt-1">Log a completed harvest to calculate real-world ROI and revenue.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[var(--color-surface-secondary)] border-b border-[var(--color-border-light)] text-[var(--color-text-secondary)] uppercase">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">Date</th>
                  <th className="py-3.5 px-4 font-semibold">Crop & Variety</th>
                  <th className="py-3.5 px-4 font-semibold">Actual Yield</th>
                  <th className="py-3.5 px-4 font-semibold">Price / Unit</th>
                  <th className="py-3.5 px-4 font-semibold">Gross Revenue</th>
                  <th className="py-3.5 px-4 font-semibold">Quality Grade</th>
                  <th className="py-3.5 px-4 font-semibold">Buyer / Off-Taker</th>
                  <th className="py-3.5 px-4 font-semibold">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border-light)]">
                {harvests.map(h => {
                  const crop = crops.find(c => c.id === h.crop_cycle_id);

                  return (
                    <tr key={h.id} className="hover:bg-[var(--color-surface-secondary)] transition-colors">
                      <td className="py-3.5 px-4 font-medium text-[var(--color-text-primary)]">
                        {new Date(h.harvest_date).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-[var(--color-text-primary)] block">
                          {crop?.crop_name || 'Harvested Crop'}
                        </span>
                        <span className="text-[11px] text-[var(--color-text-muted)]">
                          {crop?.variety || 'Standard'} ({crop?.season || 'Season'})
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-amber-900 text-sm">
                        {h.actual_yield} {h.yield_unit}
                      </td>
                      <td className="py-3.5 px-4 text-[var(--color-text-secondary)]">
                        {formatCurrency(h.selling_price)}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-emerald-700 text-sm">
                        {formatCurrency(h.revenue)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          {h.quality}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-[var(--color-text-primary)] font-medium">
                        {h.buyer}
                      </td>
                      <td className="py-3.5 px-4 text-[var(--color-text-muted)] max-w-xs truncate">
                        {h.notes || '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Record Harvest Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-[var(--color-border-light)] animate-scale-in">
            <h2 className="text-lg font-bold text-[var(--color-text-primary)] mb-4">
              Record Crop Harvest
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
                  Select Crop Cycle *
                </label>
                <select
                  value={formData.crop_cycle_id || ''}
                  onChange={e => {
                    const selected = crops.find(c => c.id === e.target.value);
                    setFormData({
                      ...formData,
                      crop_cycle_id: e.target.value,
                      field_id: selected?.field_id || null,
                      selling_price: selected?.selling_price_per_unit || formData.selling_price,
                    });
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-[var(--color-border-light)] text-sm focus:ring-2 focus:ring-[var(--color-primary-500)] outline-none"
                >
                  {crops.map(c => (
                    <option key={c.id} value={c.id}>{c.crop_name} - {c.variety} ({c.season})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
                    Harvest Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.harvest_date}
                    onChange={e => setFormData({ ...formData, harvest_date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-[var(--color-border-light)] text-sm focus:ring-2 focus:ring-[var(--color-primary-500)] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
                    Quality Rating
                  </label>
                  <select
                    value={formData.quality}
                    onChange={e => setFormData({ ...formData, quality: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-[var(--color-border-light)] text-sm focus:ring-2 focus:ring-[var(--color-primary-500)] outline-none"
                  >
                    <option value="EXCELLENT">Grade A (Excellent / Export)</option>
                    <option value="GOOD">Grade B (Good Standard)</option>
                    <option value="AVERAGE">Grade C (Average)</option>
                    <option value="POOR">Grade D (Sub-standard)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
                    Actual Realized Yield (tonnes) *
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    required
                    value={formData.actual_yield}
                    onChange={e => setFormData({ ...formData, actual_yield: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-[var(--color-border-light)] text-sm focus:ring-2 focus:ring-[var(--color-primary-500)] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
                    Selling Price per Tonne (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.selling_price}
                    onChange={e => setFormData({ ...formData, selling_price: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-[var(--color-border-light)] text-sm focus:ring-2 focus:ring-[var(--color-primary-500)] outline-none"
                  />
                </div>
              </div>

              {/* Live Preview */}
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs">
                <span className="text-emerald-800 block font-medium">Calculated Gross Revenue Preview:</span>
                <span className="text-xl font-bold text-emerald-900 block mt-0.5">
                  {formatCurrency((formData.actual_yield || 0) * (formData.selling_price || 0))}
                </span>
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
                  Buyer / Cooperative / Market Yard
                </label>
                <input
                  type="text"
                  value={formData.buyer}
                  onChange={e => setFormData({ ...formData, buyer: e.target.value })}
                  placeholder="e.g. AP Civil Supplies Corp / ITC Agribusiness"
                  className="w-full px-3 py-2 rounded-xl border border-[var(--color-border-light)] text-sm focus:ring-2 focus:ring-[var(--color-primary-500)] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
                  Inspection & Quality Notes
                </label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Moisture %, test weight, bag count, warehouse lot ID..."
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
                  Confirm & Save Harvest
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
