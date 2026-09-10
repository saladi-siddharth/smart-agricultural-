import { useState, useEffect } from 'react';
import { expenseService } from '@/services/expenseService';
import { farmService } from '@/services/farmService';
import { cropService } from '@/services/cropService';
import type { Expense, ExpenseInsert, Farm, CropCycle } from '@/types/database';
import { EXPENSE_CATEGORY_LABELS } from '@/types/database';
import { formatCurrency } from '@/services/intelligenceService';
import { Plus, Wallet, Trash2, X, Loader2, Calendar } from 'lucide-react';
import { showToast } from '@/components/common/ToastNotification';

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [cropCycles, setCropCycles] = useState<CropCycle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [farmId, setFarmId] = useState('');
  const [cropCycleId, setCropCycleId] = useState('');
  const [category, setCategory] = useState('OTHER');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);

  const loadData = async () => {
    try {
      const [exps, frms] = await Promise.all([expenseService.getAll(), farmService.getAll()]);
      setExpenses(exps);
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
    setCategory('OTHER'); setDescription(''); setAmount('');
    setExpenseDate(new Date().toISOString().split('T')[0]);
    setCropCycleId(''); setShowForm(false); setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!farmId || !amount) {
      setError('Farm and amount are required');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload: ExpenseInsert = {
        farm_id: farmId,
        field_id: null,
        crop_cycle_id: cropCycleId || null,
        category: category as ExpenseInsert['category'],
        description: description.trim(),
        amount: parseFloat(amount),
        expense_date: expenseDate,
        notes: '',
      };
      await expenseService.create(payload);
      showToast.success('Expense Logged', `₹${amount} recorded under ${category}.`);
      resetForm();
      await loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, expDesc: string) => {
    if (!confirm(`Delete expense "${expDesc}"?`)) return;
    try {
      await expenseService.delete(id);
      showToast.info('Expense Deleted', 'Record removed.');
      await loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

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
          <h1 className="text-xl font-bold text-[var(--color-text-title)]">Financial Ledger & Expenses</h1>
          <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
            Detailed tracking of input costs, field labor, equipment, and fuel expenditures
          </p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="stitch-btn-primary px-4 py-2 text-xs gap-1.5 self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Record Expense</span>
        </button>
      </div>

      {/* KPI Overview Pill */}
      <div className="stitch-card p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-100">
            <Wallet className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-[var(--color-text-faint)] uppercase tracking-wider">Total Recorded Outlay</p>
            <p className="text-lg font-extrabold text-[var(--color-text-title)] tabular-nums">{formatCurrency(totalExpenses)}</p>
          </div>
        </div>

        <div className="text-right">
          <span className="stitch-badge stitch-badge-success">72% Budget Utilization</span>
          <p className="text-[10px] text-[var(--color-text-faint)] mt-1 tabular-nums">Planned: ₹65,000</p>
        </div>
      </div>

      {/* Table */}
      <div className="stitch-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/70 border-b border-[var(--color-border-subtle)] text-[var(--color-text-muted)] uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4 font-bold">Expense Description</th>
                <th className="py-3 px-4 font-bold">Category</th>
                <th className="py-3 px-4 font-bold">Amount</th>
                <th className="py-3 px-4 font-bold">Date</th>
                <th className="py-3 px-4 font-bold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border-subtle)]">
              {expenses.map(exp => (
                <tr key={exp.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3 px-4 font-bold text-[var(--color-text-title)]">{exp.description || 'General Operation Outlay'}</td>
                  <td className="py-3 px-4">
                    <span className="stitch-badge stitch-badge-neutral">
                      {EXPENSE_CATEGORY_LABELS[exp.category] || exp.category}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-extrabold text-[var(--color-text-title)] tabular-nums">{formatCurrency(exp.amount)}</td>
                  <td className="py-3 px-4 text-[var(--color-text-muted)] font-mono">{exp.expense_date}</td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => handleDelete(exp.id, exp.description)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                      title="Delete expense"
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
              <h2 className="text-sm font-bold text-[var(--color-text-title)]">Record Operational Expense</h2>
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
                <label className="block font-medium text-[var(--color-text-title)] mb-1">Expense Description *</label>
                <input
                  type="text"
                  required
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="e.g. Labor charges for Zinc foliar spraying"
                  className="w-full px-3 py-2 border border-[var(--color-border-subtle)] rounded-lg outline-none focus:border-[var(--color-primary-600)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-[var(--color-text-title)] mb-1">Expense Category</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-[var(--color-border-subtle)] rounded-lg outline-none bg-white"
                  >
                    <option value="FERTILIZER">Fertilizer</option>
                    <option value="SEEDS">Seeds</option>
                    <option value="LABOR">Labor</option>
                    <option value="MACHINERY">Machinery & Fuel</option>
                    <option value="PEST_CONTROL">Pest Control</option>
                    <option value="TRANSPORT">Transport</option>
                    <option value="OTHER">Other Operational</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-[var(--color-text-title)] mb-1">Amount (₹) *</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    placeholder="2500"
                    className="w-full px-3 py-2 border border-[var(--color-border-subtle)] rounded-lg outline-none font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-[var(--color-text-title)] mb-1">Expense Date</label>
                <input
                  type="date"
                  value={expenseDate}
                  onChange={e => setExpenseDate(e.target.value)}
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
                  {saving ? 'Recording...' : 'Record Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
