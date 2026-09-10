import { useState, useEffect } from 'react';
import { irrigationService } from '@/services/irrigationService';
import { farmService } from '@/services/farmService';
import { fieldService } from '@/services/fieldService';
import { cropService } from '@/services/cropService';
import { formatCurrency } from '@/services/intelligenceService';
import type { IrrigationLog, Farm, Field, CropCycle, IrrigationLogInsert } from '@/types/database';
import {
  Droplets, Plus, Clock, DollarSign, Calendar, Waves,
  BarChart2, Filter, Loader2, CheckCircle2
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export default function IrrigationPage() {
  const [logs, setLogs] = useState<IrrigationLog[]>([]);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [fields, setFields] = useState<Field[]>([]);
  const [crops, setCrops] = useState<CropCycle[]>([]);
  const [loading, setLoading] = useState(true);
  const [sourceFilter, setSourceFilter] = useState<string>('ALL');
  const [modalOpen, setModalOpen] = useState(false);

  const [formData, setFormData] = useState<IrrigationLogInsert>({
    farm_id: '',
    field_id: '',
    crop_cycle_id: '',
    irrigation_date: new Date().toISOString().split('T')[0],
    water_source: 'CANAL',
    duration_minutes: 240,
    water_quantity: 80000,
    water_unit: 'liters',
    cost: 800,
    method: 'Controlled Canal Flood',
    notes: '',
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [allLogs, allFarms, allFields, allCrops] = await Promise.all([
        irrigationService.getAll(),
        farmService.getAll(),
        fieldService.getAll(),
        cropService.getAll(),
      ]);
      setLogs(allLogs);
      setFarms(allFarms);
      setFields(allFields);
      setCrops(allCrops);

      if (allFarms.length > 0 && !formData.farm_id) {
        setFormData(prev => ({
          ...prev,
          farm_id: allFarms[0].id,
          field_id: allFields[0]?.id || '',
          crop_cycle_id: allCrops[0]?.id || '',
        }));
      }
    } catch (err) {
      console.error('Failed loading irrigation logs', err);
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
      crop_cycle_id: crops[0]?.id || '',
      irrigation_date: new Date().toISOString().split('T')[0],
      water_source: 'CANAL',
      duration_minutes: 300,
      water_quantity: 95000,
      water_unit: 'liters',
      cost: 950,
      method: 'Controlled Canal Sluice',
      notes: '',
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await irrigationService.create(formData);
      setModalOpen(false);
      loadData();
    } catch (err) {
      console.error('Failed logging irrigation', err);
    }
  };

  const totalWater = logs.reduce((sum, l) => sum + Number(l.water_quantity || 0), 0);
  const totalCost = logs.reduce((sum, l) => sum + Number(l.cost || 0), 0);
  const totalMinutes = logs.reduce((sum, l) => sum + Number(l.duration_minutes || 0), 0);
  const avgHours = logs.length > 0 ? (totalMinutes / (logs.length * 60)).toFixed(1) : '0';

  const filteredLogs = logs.filter(l => {
    if (sourceFilter === 'ALL') return true;
    return l.water_source === sourceFilter;
  });

  // Chart data: volume by date
  const chartData = logs.slice().reverse().map(l => ({
    date: l.irrigation_date.slice(5),
    volume: Math.round(l.water_quantity / 1000), // in kL
    cost: l.cost,
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[var(--color-primary-700)] uppercase tracking-wider mb-1">
            <Droplets className="w-3.5 h-3.5" />
            <span>Water Resource Management</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold text-[var(--color-text-primary)]">
            Irrigation & Water Logs
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-0.5">
            Track water volume consumption, pumping hours, canal cess costs, and moisture schedules.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl gradient-primary text-white text-sm font-medium shadow-sm hover:shadow-md transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Log Irrigation Round</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-[var(--color-border-light)] shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-[var(--color-text-secondary)]">Total Water Supplied</p>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Waves className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-[var(--color-text-primary)] mt-2">
            {(totalWater / 1000).toLocaleString()} <span className="text-sm font-normal text-[var(--color-text-muted)]">kL</span>
          </p>
          <p className="text-xs text-[var(--color-text-secondary)] mt-1">Across {logs.length} scheduled sessions</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[var(--color-border-light)] shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-[var(--color-text-secondary)]">Total Irrigation Cost</p>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-[var(--color-text-primary)] mt-2">
            {formatCurrency(totalCost)}
          </p>
          <p className="text-xs text-[var(--color-text-secondary)] mt-1">Pumping & canal access fees</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[var(--color-border-light)] shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-[var(--color-text-secondary)]">Avg Session Duration</p>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-[var(--color-text-primary)] mt-2">
            {avgHours} <span className="text-sm font-normal text-[var(--color-text-muted)]">hours</span>
          </p>
          <p className="text-xs text-[var(--color-text-secondary)] mt-1">Optimized for soil root depth</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[var(--color-border-light)] shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-[var(--color-text-secondary)]">Active Sources</p>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <BarChart2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-[var(--color-text-primary)] mt-2">Canal + Solar</p>
          <p className="text-xs text-[var(--color-text-secondary)] mt-1">Krishna delta lift network</p>
        </div>
      </div>

      {/* Chart Section */}
      <div className="bg-white rounded-2xl border border-[var(--color-border-light)] p-6 shadow-xs">
        <h3 className="text-base font-bold text-[var(--color-text-primary)] mb-2">
          Water Discharge History (kL per Round)
        </h3>
        <p className="text-xs text-[var(--color-text-secondary)] mb-4">
          Visual record of moisture replenishment across crop development milestones.
        </p>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
              <YAxis stroke="#94a3b8" fontSize={11} unit=" kL" />
              <Tooltip formatter={(val: any) => [`${val} kL (${Number(val) * 1000} L)`, 'Discharged']} />
              <Bar dataKey="volume" fill="#0284c7" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-[var(--color-text-muted)] flex items-center gap-1 mr-1">
          <Filter className="w-3.5 h-3.5" /> Source:
        </span>
        {['ALL', 'CANAL', 'BOREWELL', 'RAINWATER'].map(src => (
          <button
            key={src}
            onClick={() => setSourceFilter(src)}
            className={`px-3 py-1 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
              sourceFilter === src
                ? 'bg-[var(--color-primary-50)] text-[var(--color-primary-700)] font-semibold'
                : 'bg-white border border-[var(--color-border-light)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-tertiary)]'
            }`}
          >
            {src === 'ALL' ? 'All Sources' : src}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-[var(--color-border-light)] shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-[var(--color-primary-600)] mx-auto mb-2" />
            <p className="text-xs text-[var(--color-text-secondary)]">Loading irrigation logs...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-12 text-center">
            <Droplets className="w-10 h-10 text-[var(--color-text-muted)] mx-auto mb-2" />
            <p className="text-sm font-semibold text-[var(--color-text-primary)]">No irrigation rounds found</p>
            <p className="text-xs text-[var(--color-text-secondary)] mt-1">Log an irrigation event to track water volume and costs.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[var(--color-surface-secondary)] border-b border-[var(--color-border-light)] text-[var(--color-text-secondary)] uppercase">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">Date</th>
                  <th className="py-3.5 px-4 font-semibold">Water Source</th>
                  <th className="py-3.5 px-4 font-semibold">Method</th>
                  <th className="py-3.5 px-4 font-semibold">Duration</th>
                  <th className="py-3.5 px-4 font-semibold">Discharge Volume</th>
                  <th className="py-3.5 px-4 font-semibold">Cost</th>
                  <th className="py-3.5 px-4 font-semibold">Field / Crop</th>
                  <th className="py-3.5 px-4 font-semibold">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border-light)]">
                {filteredLogs.map(log => {
                  const field = fields.find(f => f.id === log.field_id);
                  const crop = crops.find(c => c.id === log.crop_cycle_id);

                  return (
                    <tr key={log.id} className="hover:bg-[var(--color-surface-secondary)] transition-colors">
                      <td className="py-3.5 px-4 font-medium text-[var(--color-text-primary)]">
                        {new Date(log.irrigation_date).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700">
                          <Droplets className="w-3 h-3" />
                          {log.water_source}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-[var(--color-text-secondary)]">
                        {log.method || 'Flood'}
                      </td>
                      <td className="py-3.5 px-4 text-[var(--color-text-primary)] font-medium">
                        {(log.duration_minutes / 60).toFixed(1)} hrs ({log.duration_minutes}m)
                      </td>
                      <td className="py-3.5 px-4 font-bold text-blue-700">
                        {log.water_quantity.toLocaleString()} {log.water_unit}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-[var(--color-primary-700)]">
                        {formatCurrency(log.cost)}
                      </td>
                      <td className="py-3.5 px-4 text-[var(--color-text-secondary)]">
                        {crop?.crop_name || field?.name || 'Parcel A'}
                      </td>
                      <td className="py-3.5 px-4 text-[var(--color-text-muted)] max-w-xs truncate">
                        {log.notes || 'Routine moisture replenishment'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Log Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-[var(--color-border-light)] animate-scale-in">
            <h2 className="text-lg font-bold text-[var(--color-text-primary)] mb-4">
              Log Irrigation Operation
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
                    Plot / Field *
                  </label>
                  <select
                    value={formData.field_id || ''}
                    onChange={e => setFormData({ ...formData, field_id: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-[var(--color-border-light)] text-sm focus:ring-2 focus:ring-[var(--color-primary-500)] outline-none"
                  >
                    {fields.map(f => (
                      <option key={f.id} value={f.id}>{f.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
                    Crop Cycle
                  </label>
                  <select
                    value={formData.crop_cycle_id || ''}
                    onChange={e => setFormData({ ...formData, crop_cycle_id: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-[var(--color-border-light)] text-sm focus:ring-2 focus:ring-[var(--color-primary-500)] outline-none"
                  >
                    {crops.map(c => (
                      <option key={c.id} value={c.id}>{c.crop_name} ({c.season})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
                    Irrigation Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.irrigation_date}
                    onChange={e => setFormData({ ...formData, irrigation_date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-[var(--color-border-light)] text-sm focus:ring-2 focus:ring-[var(--color-primary-500)] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
                    Water Source
                  </label>
                  <select
                    value={formData.water_source}
                    onChange={e => setFormData({ ...formData, water_source: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-[var(--color-border-light)] text-sm focus:ring-2 focus:ring-[var(--color-primary-500)] outline-none"
                  >
                    <option value="CANAL">Canal Lift / Gravity</option>
                    <option value="BOREWELL">Solar Borewell</option>
                    <option value="RAINWATER">Rainwater Harvesting Pond</option>
                    <option value="RIVER">River Pumping</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
                    Duration (mins)
                  </label>
                  <input
                    type="number"
                    value={formData.duration_minutes}
                    onChange={e => setFormData({ ...formData, duration_minutes: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-[var(--color-border-light)] text-sm focus:ring-2 focus:ring-[var(--color-primary-500)] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
                    Quantity (Liters)
                  </label>
                  <input
                    type="number"
                    step="1000"
                    value={formData.water_quantity}
                    onChange={e => setFormData({ ...formData, water_quantity: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-[var(--color-border-light)] text-sm focus:ring-2 focus:ring-[var(--color-primary-500)] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
                    Cost (₹)
                  </label>
                  <input
                    type="number"
                    value={formData.cost}
                    onChange={e => setFormData({ ...formData, cost: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-[var(--color-border-light)] text-sm focus:ring-2 focus:ring-[var(--color-primary-500)] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
                  Method & Notes
                </label>
                <input
                  type="text"
                  value={formData.method}
                  onChange={e => setFormData({ ...formData, method: e.target.value })}
                  placeholder="e.g. Sluice Gate Flood 4cm standing water"
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
                  Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
