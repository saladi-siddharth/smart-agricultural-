import { useState, useEffect } from 'react';
import { inputService } from '@/services/inputService';
import { farmService } from '@/services/farmService';
import { cropService } from '@/services/cropService';
import type { Input as FarmInput, InputInsert, Farm, CropCycle } from '@/types/database';
import { INPUT_TYPE_LABELS } from '@/types/database';
import { formatCurrency } from '@/services/intelligenceService';
import { Plus, Package, Trash2, X, Loader2, Calendar } from 'lucide-react';
import { showToast } from '@/components/common/ToastNotification';

export default function InputsPage() {
  const [inputs, setInputs] = useState<FarmInput[]>([]);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [cropCycles, setCropCycles] = useState<CropCycle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [farmId, setFarmId] = useState('');
  const [cropCycleId, setCropCycleId] = useState('');
  const [name, setName] = useState('');
  const [inputType, setInputType] = useState('OTHER');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('kg');
  const [cost, setCost] = useState('');
  const [usedDate, setUsedDate] = useState(new Date().toISOString().split('T')[0]);
  const [supplier, setSupplier] = useState('');

  const loadData = async () => {
    try {
      const [inps, frms] = await Promise.all([inputService.getAll(), farmService.getAll()]);
      setInputs(inps);
      setFarms(frms);
      if (frms.length > 0 && !farmId) {
        setFarmId(frms[0].id);
        const cycles = await cropService.getByFarm(frms[0].id);
        setCropCycles(cycles);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const resetForm = () => {
    setName(''); setInputType('OTHER'); setQuantity(''); setUnit('kg');
    setCost(''); setUsedDate(new Date().toISOString().split('T')[0]);
    setSupplier(''); setCropCycleId(''); setShowForm(false); setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !farmId) {
      setError('Input name and farm are required');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload: InputInsert = {
        farm_id: farmId,
        field_id: null,
        crop_cycle_id: cropCycleId || null,
        name: name.trim(),
        input_type: inputType as InputInsert['input_type'],
        quantity: parseFloat(quantity) || 0,
        unit,
        cost: parseFloat(cost) || 0,
        used_date: usedDate,
        supplier: supplier.trim(),
        notes: '',
      };
      await inputService.create(payload);
      showToast.success('Input Recorded', `"${name.trim()}" added to inventory & expense ledger.`);
      resetForm();
      await loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, inpName: string) => {
    if (!confirm(`Delete input voucher for "${inpName}"?`)) return;
    try {
      await inputService.delete(id);
      showToast.info('Input Removed', 'Voucher deleted.');
      await loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const totalInputCost = inputs.reduce((sum, i) => sum + i.cost, 0);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-slate-200 animate-pulse rounded-lg" />
        {[1, 2, 3].map(i => <div key={i} className="h-14 rounded-xl bg-slate-100 animate-pulse" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[var(--color-text-title)]">Resource & Input Consumption</h1>
          <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
            Procurement records for seeds, fertilizers, pesticides, and bio-nutrients
          </p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="stitch-btn-primary px-4 py-2 text-xs gap-1.5 self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Record Input</span>
        </button>
      </div>

      {/* KPI Overview Pill */}
      <div className="stitch-card p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100">
            <Package className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-[var(--color-text-faint)] uppercase tracking-wider">Total Input Expenditure</p>
            <p className="text-lg font-extrabold text-[var(--color-text-title)] tabular-nums">{formatCurrency(totalInputCost)}</p>
          </div>
        </div>

        <span className="stitch-badge stitch-badge-success">
          {inputs.length} Batches Logged
        </span>
      </div>

      {/* Table */}
      <div className="stitch-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/70 border-b border-[var(--color-border-subtle)] text-[var(--color-text-muted)] uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4 font-bold">Input Item</th>
                <th className="py-3 px-4 font-bold">Category</th>
                <th className="py-3 px-4 font-bold">Quantity</th>
                <th className="py-3 px-4 font-bold">Total Cost</th>
                <th className="py-3 px-4 font-bold">Application Date</th>
                <th className="py-3 px-4 font-bold">Supplier</th>
                <th className="py-3 px-4 font-bold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border-subtle)]">
              {inputs.map(inp => (
                <tr key={inp.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3 px-4 font-bold text-[var(--color-text-title)]">{inp.name}</td>
                  <td className="py-3 px-4 text-[var(--color-text-muted)]">
                    <span className="stitch-badge stitch-badge-neutral">
                      {INPUT_TYPE_LABELS[inp.input_type] || inp.input_type}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-bold tabular-nums text-[var(--color-text-title)]">{inp.quantity} {inp.unit}</td>
                  <td className="py-3 px-4 font-extrabold text-emerald-800 tabular-nums">{formatCurrency(inp.cost)}</td>
                  <td className="py-3 px-4 text-[var(--color-text-muted)] font-mono">{inp.used_date}</td>
                  <td className="py-3 px-4 text-[var(--color-text-title)]">{inp.supplier || 'Regional Agro Depot'}</td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => handleDelete(inp.id, inp.name)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                      title="Delete record"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Creation Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-[var(--color-border-subtle)] animate-scale-in">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-[var(--color-border-subtle)]">
              <h2 className="text-sm font-bold text-[var(--color-text-title)]">Log Input Consumption</h2>
              <button onClick={resetForm} className="p-1 rounded text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            {error && (
              <div className="p-2.5 rounded-lg bg-red-50 text-red-700 text-xs mb-3">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-medium text-[var(--color-text-title)] mb-1">Input Item Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Zinc Sulfate Monohydrate (33% Zn)"
                  className="w-full px-3 py-2 border border-[var(--color-border-subtle)] rounded-lg outline-none focus:border-[var(--color-primary-600)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-[var(--color-text-title)] mb-1">Category</label>
                  <select
                    value={inputType}
                    onChange={e => setInputType(e.target.value)}
                    className="w-full px-3 py-2 border border-[var(--color-border-subtle)] rounded-lg outline-none bg-white"
                  >
                    <option value="SEED">Seed</option>
                    <option value="FERTILIZER">Fertilizer</option>
                    <option value="PESTICIDE">Pesticide</option>
                    <option value="HERBICIDE">Herbicide</option>
                    <option value="ORGANIC_MANURE">Organic Manure</option>
                    <option value="OTHER">Other Bio-Agent</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-[var(--color-text-title)] mb-1">Supplier / Vendor</label>
                  <input
                    type="text"
                    value={supplier}
                    onChange={e => setSupplier(e.target.value)}
                    placeholder="e.g. IFFCO Agro Center"
                    className="w-full px-3 py-2 border border-[var(--color-border-subtle)] rounded-lg outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="block font-medium text-[var(--color-text-title)] mb-1">Quantity *</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={quantity}
                    onChange={e => setQuantity(e.target.value)}
                    placeholder="25"
                    className="w-full px-3 py-2 border border-[var(--color-border-subtle)] rounded-lg outline-none font-mono"
                  />
                </div>

                <div className="col-span-1">
                  <label className="block font-medium text-[var(--color-text-title)] mb-1">Unit</label>
                  <select
                    value={unit}
                    onChange={e => setUnit(e.target.value)}
                    className="w-full px-3 py-2 border border-[var(--color-border-subtle)] rounded-lg outline-none bg-white font-mono"
                  >
                    <option value="kg">kg</option>
                    <option value="litres">litres</option>
                    <option value="bags">bags</option>
                    <option value="packets">packets</option>
                  </select>
                </div>

                <div className="col-span-1">
                  <label className="block font-medium text-[var(--color-text-title)] mb-1">Total Cost (₹) *</label>
                  <input
                    type="number"
                    required
                    value={cost}
                    onChange={e => setCost(e.target.value)}
                    placeholder="1800"
                    className="w-full px-3 py-2 border border-[var(--color-border-subtle)] rounded-lg outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-[var(--color-text-title)] mb-1">Used Date</label>
                <input
                  type="date"
                  value={usedDate}
                  onChange={e => setUsedDate(e.target.value)}
                  className="w-full px-3 py-2 border border-[var(--color-border-subtle)] rounded-lg outline-none bg-white font-mono"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={resetForm}
                  className="stitch-btn-secondary px-3 py-2 text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="stitch-btn-primary px-4 py-2 text-xs cursor-pointer disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Record Input'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
