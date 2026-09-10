import { useState, useEffect } from 'react';
import { inputService } from '@/services/inputService';
import { farmService } from '@/services/farmService';
import { cropService } from '@/services/cropService';
import type { Input as FarmInput, InputInsert, Farm, CropCycle } from '@/types/database';
import { INPUT_TYPE_LABELS } from '@/types/database';
import { formatCurrency } from '@/services/intelligenceService';
import { Plus, Package, Trash2, X, Loader2 } from 'lucide-react';

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
      setInputs(inps); setFarms(frms);
      if (frms.length > 0 && !farmId) {
        setFarmId(frms[0].id);
        const cycles = await cropService.getByFarm(frms[0].id);
        setCropCycles(cycles);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const handleFarmChange = async (fId: string) => {
    setFarmId(fId); setCropCycleId('');
    if (fId) { const cycles = await cropService.getByFarm(fId); setCropCycles(cycles); }
  };

  const resetForm = () => {
    setName(''); setInputType('OTHER'); setQuantity(''); setUnit('kg');
    setCost(''); setUsedDate(new Date().toISOString().split('T')[0]);
    setSupplier(''); setCropCycleId(''); setShowForm(false); setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !farmId) { setError('Name and farm are required'); return; }
    setSaving(true); setError('');
    try {
      const payload: InputInsert = {
        farm_id: farmId, field_id: null, crop_cycle_id: cropCycleId || null,
        name: name.trim(), input_type: inputType as InputInsert['input_type'],
        quantity: parseFloat(quantity) || 0, unit, cost: parseFloat(cost) || 0,
        used_date: usedDate, supplier: supplier.trim(), notes: '',
      };
      await inputService.create(payload);
      resetForm(); await loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this input record?')) return;
    try { await inputService.delete(id); await loadData(); }
    catch (err) { console.error(err); }
  };

  const totalInputCost = inputs.reduce((sum, i) => sum + i.cost, 0);

  if (loading) return <div className="space-y-4"><div className="skeleton h-8 w-48" />{[1,2,3].map(i => <div key={i} className="skeleton h-14 rounded-xl" />)}</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Inputs</h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-0.5">Track agricultural inputs — seeds, fertilizers, pesticides</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl gradient-primary text-white text-sm font-medium shadow-sm hover:shadow-md transition-all">
          <Plus className="w-4 h-4" /> Add Input
        </button>
      </div>

      <div className="glass-card p-4 inline-flex items-center gap-3">
        <Package className="w-5 h-5 text-[var(--color-primary-600)]" />
        <div>
          <p className="text-xs text-[var(--color-text-muted)]">Total Input Cost</p>
          <p className="text-lg font-bold">{formatCurrency(totalInputCost)}</p>
        </div>
      </div>

      {inputs.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Package className="w-12 h-12 mx-auto mb-3 text-[var(--color-text-muted)]" />
          <p className="text-sm text-[var(--color-text-secondary)]">No inputs recorded yet</p>
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border-light)] bg-[var(--color-surface-secondary)]">
                <th className="text-left py-3 px-4 font-medium text-[var(--color-text-secondary)]">Date</th>
                <th className="text-left py-3 px-4 font-medium text-[var(--color-text-secondary)]">Name</th>
                <th className="text-left py-3 px-4 font-medium text-[var(--color-text-secondary)]">Type</th>
                <th className="text-left py-3 px-4 font-medium text-[var(--color-text-secondary)]">Qty</th>
                <th className="text-right py-3 px-4 font-medium text-[var(--color-text-secondary)]">Cost</th>
                <th className="text-left py-3 px-4 font-medium text-[var(--color-text-secondary)]">Supplier</th>
                <th className="py-3 px-4 w-12"></th>
              </tr>
            </thead>
            <tbody>
              {inputs.map((input, i) => (
                <tr key={input.id} className="border-b border-[var(--color-border-light)] last:border-0 hover:bg-[var(--color-surface-hover)] transition-colors animate-slide-up" style={{ animationDelay: `${i * 0.02}s` }}>
                  <td className="py-3 px-4 text-[var(--color-text-muted)]">{new Date(input.used_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</td>
                  <td className="py-3 px-4 font-medium">{input.name}</td>
                  <td className="py-3 px-4"><span className="text-xs px-2 py-0.5 rounded-full bg-[var(--color-surface-tertiary)]">{INPUT_TYPE_LABELS[input.input_type]}</span></td>
                  <td className="py-3 px-4">{input.quantity} {input.unit}</td>
                  <td className="py-3 px-4 text-right font-semibold">{formatCurrency(input.cost)}</td>
                  <td className="py-3 px-4 text-[var(--color-text-muted)]">{input.supplier || '-'}</td>
                  <td className="py-3 px-4">
                    <button onClick={() => handleDelete(input.id)} className="p-1 rounded-lg hover:bg-red-50 text-[var(--color-text-muted)] hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={resetForm}>
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-[var(--color-border-light)]">
              <h2 className="text-lg font-semibold">Add Input</h2>
              <button onClick={resetForm} className="p-2 rounded-lg hover:bg-[var(--color-surface-tertiary)]"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">{error}</div>}
              <div>
                <label className="block text-sm font-medium mb-1.5">Farm *</label>
                <select value={farmId} onChange={e => handleFarmChange(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[var(--color-border-light)] bg-[var(--color-surface-secondary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)] focus:border-transparent">
                  {farms.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Crop Cycle</label>
                <select value={cropCycleId} onChange={e => setCropCycleId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[var(--color-border-light)] bg-[var(--color-surface-secondary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)] focus:border-transparent">
                  <option value="">-- None --</option>
                  {cropCycles.map(c => <option key={c.id} value={c.id}>{c.crop_name} ({c.season})</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm font-medium mb-1.5">Input Name *</label>
                  <input type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. Urea"
                    className="w-full px-4 py-2.5 rounded-xl border border-[var(--color-border-light)] bg-[var(--color-surface-secondary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)] focus:border-transparent" />
                </div>
                <div><label className="block text-sm font-medium mb-1.5">Type</label>
                  <select value={inputType} onChange={e => setInputType(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-[var(--color-border-light)] bg-[var(--color-surface-secondary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)] focus:border-transparent">
                    {Object.entries(INPUT_TYPE_LABELS).map(([val, lbl]) => <option key={val} value={val}>{lbl}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div><label className="block text-sm font-medium mb-1.5">Quantity</label>
                  <input type="number" value={quantity} onChange={e => setQuantity(e.target.value)} placeholder="50" min="0"
                    className="w-full px-4 py-2.5 rounded-xl border border-[var(--color-border-light)] bg-[var(--color-surface-secondary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)] focus:border-transparent" />
                </div>
                <div><label className="block text-sm font-medium mb-1.5">Unit</label>
                  <select value={unit} onChange={e => setUnit(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-[var(--color-border-light)] bg-[var(--color-surface-secondary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)] focus:border-transparent">
                    <option value="kg">kg</option><option value="liters">liters</option><option value="bags">bags</option><option value="packets">packets</option>
                  </select>
                </div>
                <div><label className="block text-sm font-medium mb-1.5">Cost (₹)</label>
                  <input type="number" value={cost} onChange={e => setCost(e.target.value)} placeholder="5000" min="0"
                    className="w-full px-4 py-2.5 rounded-xl border border-[var(--color-border-light)] bg-[var(--color-surface-secondary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)] focus:border-transparent" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm font-medium mb-1.5">Used Date</label>
                  <input type="date" value={usedDate} onChange={e => setUsedDate(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-[var(--color-border-light)] bg-[var(--color-surface-secondary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)] focus:border-transparent" />
                </div>
                <div><label className="block text-sm font-medium mb-1.5">Supplier</label>
                  <input type="text" value={supplier} onChange={e => setSupplier(e.target.value)} placeholder="Supplier name"
                    className="w-full px-4 py-2.5 rounded-xl border border-[var(--color-border-light)] bg-[var(--color-surface-secondary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)] focus:border-transparent" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={resetForm} className="flex-1 px-4 py-2.5 rounded-xl border border-[var(--color-border-light)] text-sm font-medium hover:bg-[var(--color-surface-tertiary)]">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 px-4 py-2.5 rounded-xl gradient-primary text-white text-sm font-medium shadow-sm hover:shadow-md disabled:opacity-60">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Add Input'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
