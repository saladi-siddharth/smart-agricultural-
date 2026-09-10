import { useState, useEffect } from 'react';
import { inputService } from '@/services/inputService';
import { farmService } from '@/services/farmService';
import { cropService } from '@/services/cropService';
import type { Input as FarmInput, InputInsert, Farm, CropCycle } from '@/types/database';
import { INPUT_TYPE_LABELS } from '@/types/database';
import { formatCurrency } from '@/services/intelligenceService';
import { Plus, Package, Trash2, X, Loader2, Calendar, Sparkles, Building2 } from 'lucide-react';
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
      showToast.error('Failed to load inputs');
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
      showToast.success('Input Recorded', `"${name.trim()}" added to inventory ledger.`);
      resetForm();
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save';
      setError(msg);
      showToast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, inpName: string) => {
    if (!confirm(`Delete input record for "${inpName}"?`)) return;
    try {
      await inputService.delete(id);
      showToast.info('Input Removed', 'Voucher deleted.');
      await loadData();
    } catch (err) {
      console.error(err);
      showToast.error('Failed to delete input');
    }
  };

  const totalInputCost = inputs.reduce((sum, i) => sum + i.cost, 0);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-[#E2E8F0] animate-pulse rounded-lg" />
        {[1, 2, 3].map(i => <div key={i} className="h-14 rounded-xl bg-white border border-[#E5E8EB] animate-pulse" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E5E8EB]">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#143D30] uppercase tracking-wider mb-1">
            <Package className="w-3.5 h-3.5" />
            <span>Resource Procurement</span>
          </div>
          <h1 className="text-2xl font-bold text-[#0F172A] tracking-tight">Resource & Input Consumption</h1>
          <p className="text-xs text-[#64748B] mt-0.5">
            Procurement records for seeds, fertilizers, pesticides, and bio-nutrients
          </p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#143D30] hover:bg-[#1A4D3E] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Record Input</span>
        </button>
      </div>

      {/* KPI Overview Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="stitch-card p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#F0FDF4] text-[#143D30] flex items-center justify-center border border-[#DCFCE7]">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Total Input Expenditure</p>
              <p className="text-xl font-extrabold text-[#0F172A] tabular-nums mt-0.5">{formatCurrency(totalInputCost)}</p>
            </div>
          </div>
        </div>

        <div className="stitch-card p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center border border-sky-100">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Batches Consumed</p>
              <p className="text-xl font-extrabold text-[#0F172A] tabular-nums mt-0.5">{inputs.length} Lots</p>
            </div>
          </div>
        </div>

        <div className="stitch-card p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-100">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Procurement Status</p>
              <p className="text-xs font-bold text-emerald-700 mt-1">100% Quality Certified</p>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="stitch-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8FAFC] border-b border-[#E5E8EB] text-[#64748B] uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3.5 px-4 font-bold">Input Item</th>
                <th className="py-3.5 px-4 font-bold">Category</th>
                <th className="py-3.5 px-4 font-bold">Quantity</th>
                <th className="py-3.5 px-4 font-bold">Total Cost</th>
                <th className="py-3.5 px-4 font-bold">Application Date</th>
                <th className="py-3.5 px-4 font-bold">Supplier</th>
                <th className="py-3.5 px-4 font-bold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9]">
              {inputs.map(inp => (
                <tr key={inp.id} className="hover:bg-[#F8FAFC] transition-colors">
                  <td className="py-3.5 px-4 font-bold text-[#0F172A]">{inp.name}</td>
                  <td className="py-3.5 px-4 text-[#64748B]">
                    <span className="stitch-badge stitch-badge-neutral">
                      {INPUT_TYPE_LABELS[inp.input_type] || inp.input_type}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-bold tabular-nums text-[#0F172A]">{inp.quantity} {inp.unit}</td>
                  <td className="py-3.5 px-4 font-extrabold text-[#143D30] tabular-nums">{formatCurrency(inp.cost)}</td>
                  <td className="py-3.5 px-4 text-[#64748B] font-mono text-[11px]">{inp.used_date}</td>
                  <td className="py-3.5 px-4 text-[#334155]">{inp.supplier || 'Regional Agro Depot'}</td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => handleDelete(inp.id, inp.name)}
                      className="p-1.5 rounded-lg text-[#94A3B8] hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl border border-[#E5E8EB] animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#E5E8EB]">
              <h2 className="text-sm font-bold text-[#0F172A]">Log Input Consumption</h2>
              <button onClick={resetForm} className="p-1 rounded text-[#94A3B8] hover:text-[#0F172A]">
                <X className="w-4 h-4" />
              </button>
            </div>

            {error && (
              <div className="p-2.5 rounded-lg bg-red-50 text-red-700 text-xs mb-3 font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-[#334155] mb-1">Input Item Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Zinc Sulfate Monohydrate (33% Zn)"
                  className="w-full px-3 py-2 border border-[#CBD5E1] bg-[#F8FAFC] rounded-lg outline-none focus:bg-white focus:ring-1 focus:ring-[#143D30]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#334155] mb-1">Category</label>
                  <select
                    value={inputType}
                    onChange={e => setInputType(e.target.value)}
                    className="w-full px-3 py-2 border border-[#CBD5E1] bg-[#F8FAFC] rounded-lg outline-none focus:bg-white focus:ring-1 focus:ring-[#143D30]"
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
                  <label className="block font-semibold text-[#334155] mb-1">Supplier / Vendor</label>
                  <input
                    type="text"
                    value={supplier}
                    onChange={e => setSupplier(e.target.value)}
                    placeholder="e.g. IFFCO Agro Center"
                    className="w-full px-3 py-2 border border-[#CBD5E1] bg-[#F8FAFC] rounded-lg outline-none focus:bg-white focus:ring-1 focus:ring-[#143D30]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="block font-semibold text-[#334155] mb-1">Quantity *</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={quantity}
                    onChange={e => setQuantity(e.target.value)}
                    placeholder="25"
                    className="w-full px-3 py-2 border border-[#CBD5E1] bg-[#F8FAFC] rounded-lg outline-none focus:bg-white font-mono"
                  />
                </div>

                <div className="col-span-1">
                  <label className="block font-semibold text-[#334155] mb-1">Unit</label>
                  <select
                    value={unit}
                    onChange={e => setUnit(e.target.value)}
                    className="w-full px-3 py-2 border border-[#CBD5E1] bg-[#F8FAFC] rounded-lg outline-none focus:bg-white font-mono"
                  >
                    <option value="kg">kg</option>
                    <option value="litres">litres</option>
                    <option value="bags">bags</option>
                    <option value="packets">packets</option>
                  </select>
                </div>

                <div className="col-span-1">
                  <label className="block font-semibold text-[#334155] mb-1">Total Cost (₹) *</label>
                  <input
                    type="number"
                    required
                    value={cost}
                    onChange={e => setCost(e.target.value)}
                    placeholder="1800"
                    className="w-full px-3 py-2 border border-[#CBD5E1] bg-[#F8FAFC] rounded-lg outline-none focus:bg-white font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#334155] mb-1">Application Date</label>
                <input
                  type="date"
                  value={usedDate}
                  onChange={e => setUsedDate(e.target.value)}
                  className="w-full px-3 py-2 border border-[#CBD5E1] bg-[#F8FAFC] rounded-lg outline-none focus:bg-white font-mono"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2.5 border-t border-[#E5E8EB]">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-3 py-2 border border-[#CBD5E1] rounded-lg text-xs font-medium text-[#475569] hover:bg-[#F1F5F9]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="stitch-btn-primary px-4 py-2 text-xs"
                >
                  {saving ? 'Recording...' : 'Record Input'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
