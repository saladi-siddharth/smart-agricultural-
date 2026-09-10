import { useState, useEffect } from 'react';
import { expenseService } from '@/services/expenseService';
import { farmService } from '@/services/farmService';
import { cropService } from '@/services/cropService';
import type { Expense, ExpenseInsert, Farm, CropCycle } from '@/types/database';
import { EXPENSE_CATEGORY_LABELS } from '@/types/database';
import { formatCurrency } from '@/services/intelligenceService';
import { Plus, Wallet, Trash2, X, Loader2, Calendar } from 'lucide-react';

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
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const handleFarmChange = async (fId: string) => {
    setFarmId(fId);
    setCropCycleId('');
    if (fId) {
      const cycles = await cropService.getByFarm(fId);
      setCropCycles(cycles);
    }
  };

  const resetForm = () => {
    setCategory('OTHER'); setDescription(''); setAmount('');
    setExpenseDate(new Date().toISOString().split('T')[0]);
    setCropCycleId(''); setShowForm(false); setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!farmId || !amount) { setError('Farm and amount are required'); return; }
    setSaving(true); setError('');
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
      resetForm();
      await loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this expense?')) return;
    try { await expenseService.delete(id); await loadData(); }
    catch (err) { console.error(err); }
  };

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const categoryTotals = expenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount;
    return acc;
  }, {} as Record<string, number>);

  if (loading) {
    return <div className="space-y-4"><div className="skeleton h-8 w-48" />{[1,2,3].map(i => <div key={i} className="skeleton h-14 rounded-xl" />)}</div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Expenses</h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-0.5">Track farm spending by category</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl gradient-primary text-white text-sm font-medium shadow-sm hover:shadow-md transition-all">
          <Plus className="w-4 h-4" /> Add Expense
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="glass-card p-4 text-center">
          <p className="text-xs text-[var(--color-text-muted)] mb-1">Total Expenses</p>
          <p className="text-xl font-bold text-[var(--color-text-primary)]">{formatCurrency(totalExpenses)}</p>
        </div>
        {Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([cat, amt]) => (
          <div key={cat} className="glass-card p-4 text-center">
            <p className="text-xs text-[var(--color-text-muted)] mb-1">{EXPENSE_CATEGORY_LABELS[cat as keyof typeof EXPENSE_CATEGORY_LABELS] || cat}</p>
            <p className="text-lg font-bold text-[var(--color-text-primary)]">{formatCurrency(amt)}</p>
          </div>
        ))}
      </div>

      {/* Expense List */}
      {expenses.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Wallet className="w-12 h-12 mx-auto mb-3 text-[var(--color-text-muted)]" />
          <p className="text-sm text-[var(--color-text-secondary)]">No expenses recorded yet</p>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">Add your first expense to start tracking costs</p>
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border-light)] bg-[var(--color-surface-secondary)]">
                <th className="text-left py-3 px-4 font-medium text-[var(--color-text-secondary)]">Date</th>
                <th className="text-left py-3 px-4 font-medium text-[var(--color-text-secondary)]">Category</th>
                <th className="text-left py-3 px-4 font-medium text-[var(--color-text-secondary)]">Description</th>
                <th className="text-right py-3 px-4 font-medium text-[var(--color-text-secondary)]">Amount</th>
                <th className="py-3 px-4 w-12"></th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((expense, i) => (
                <tr key={expense.id}
                  className="border-b border-[var(--color-border-light)] last:border-0 hover:bg-[var(--color-surface-hover)] transition-colors animate-slide-up"
                  style={{ animationDelay: `${i * 0.02}s` }}>
                  <td className="py-3 px-4 text-[var(--color-text-muted)]">
                    {new Date(expense.expense_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--color-surface-tertiary)] font-medium">
                      {EXPENSE_CATEGORY_LABELS[expense.category] || expense.category}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-[var(--color-text-primary)]">{expense.description || '-'}</td>
                  <td className="py-3 px-4 text-right font-semibold text-[var(--color-text-primary)]">{formatCurrency(expense.amount)}</td>
                  <td className="py-3 px-4">
                    <button onClick={() => handleDelete(expense.id)}
                      className="p-1 rounded-lg hover:bg-red-50 text-[var(--color-text-muted)] hover:text-red-600 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={resetForm}>
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-[var(--color-border-light)]">
              <h2 className="text-lg font-semibold">Add Expense</h2>
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
                <div>
                  <label className="block text-sm font-medium mb-1.5">Category *</label>
                  <select value={category} onChange={e => setCategory(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-[var(--color-border-light)] bg-[var(--color-surface-secondary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)] focus:border-transparent">
                    {Object.entries(EXPENSE_CATEGORY_LABELS).map(([val, lbl]) => <option key={val} value={val}>{lbl}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Amount (₹) *</label>
                  <input type="number" value={amount} onChange={e => setAmount(e.target.value)} required min="0" step="0.01"
                    placeholder="5000"
                    className="w-full px-4 py-2.5 rounded-xl border border-[var(--color-border-light)] bg-[var(--color-surface-secondary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)] focus:border-transparent" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Description</label>
                <input type="text" value={description} onChange={e => setDescription(e.target.value)}
                  placeholder="e.g. DAP fertilizer 2 bags"
                  className="w-full px-4 py-2.5 rounded-xl border border-[var(--color-border-light)] bg-[var(--color-surface-secondary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)] focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Date</label>
                <input type="date" value={expenseDate} onChange={e => setExpenseDate(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[var(--color-border-light)] bg-[var(--color-surface-secondary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)] focus:border-transparent" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={resetForm}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-[var(--color-border-light)] text-sm font-medium hover:bg-[var(--color-surface-tertiary)] transition-colors">Cancel</button>
                <button type="submit" disabled={saving}
                  className="flex-1 px-4 py-2.5 rounded-xl gradient-primary text-white text-sm font-medium shadow-sm hover:shadow-md transition-all disabled:opacity-60">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Add Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
