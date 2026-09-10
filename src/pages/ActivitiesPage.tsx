import { useState, useEffect } from 'react';
import { activityService } from '@/services/activityService';
import { farmService } from '@/services/farmService';
import { cropService } from '@/services/cropService';
import { fieldService } from '@/services/fieldService';
import type { Activity, ActivityInsert, Farm, CropCycle, Field } from '@/types/database';
import { ACTIVITY_TYPE_LABELS, STATUS_LABELS, PRIORITY_LABELS } from '@/types/database';
import {
  Plus, ClipboardList, Filter, CheckCircle2, Clock, AlertTriangle,
  X, Loader2, Calendar, Trash2, ChevronDown
} from 'lucide-react';

type FilterStatus = 'ALL' | 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE';

export default function ActivitiesPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [cropCycles, setCropCycles] = useState<CropCycle[]>([]);
  const [fields, setFields] = useState<Field[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterStatus>('ALL');
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Form
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [activityType, setActivityType] = useState('OTHER');
  const [farmId, setFarmId] = useState('');
  const [fieldId, setFieldId] = useState('');
  const [cropCycleId, setCropCycleId] = useState('');
  const [plannedDate, setPlannedDate] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [estimatedCost, setEstimatedCost] = useState('');

  const loadData = async () => {
    try {
      const [acts, frms] = await Promise.all([
        activityService.getAll(),
        farmService.getAll(),
      ]);
      setActivities(acts);
      setFarms(frms);

      if (frms.length > 0) {
        const fId = frms[0].id;
        setFarmId(fId);
        const [cycles, flds] = await Promise.all([
          cropService.getByFarm(fId),
          fieldService.getByFarm(fId),
        ]);
        setCropCycles(cycles);
        setFields(flds);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleFarmChange = async (fId: string) => {
    setFarmId(fId);
    setFieldId('');
    setCropCycleId('');
    if (fId) {
      const [cycles, flds] = await Promise.all([
        cropService.getByFarm(fId),
        fieldService.getByFarm(fId),
      ]);
      setCropCycles(cycles);
      setFields(flds);
    }
  };

  const resetForm = () => {
    setTitle(''); setDescription(''); setActivityType('OTHER');
    setFieldId(''); setCropCycleId(''); setPlannedDate('');
    setPriority('MEDIUM'); setEstimatedCost('');
    setShowForm(false); setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !farmId || !plannedDate) {
      setError('Title, farm, and planned date are required'); return;
    }
    setSaving(true); setError('');
    try {
      const payload: ActivityInsert = {
        farm_id: farmId,
        field_id: fieldId || null,
        crop_cycle_id: cropCycleId || null,
        title: title.trim(),
        description: description.trim(),
        activity_type: activityType as ActivityInsert['activity_type'],
        planned_date: plannedDate,
        completed_date: null,
        status: 'PENDING',
        priority: priority as ActivityInsert['priority'],
        estimated_cost: parseFloat(estimatedCost) || 0,
        actual_cost: 0,
        notes: '',
      };
      await activityService.create(payload);
      resetForm();
      await loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleComplete = async (id: string) => {
    try {
      await activityService.complete(id);
      await loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this activity?')) return;
    try {
      await activityService.delete(id);
      await loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const enrichedActivities = activities.map(a => {
    const planned = new Date(a.planned_date);
    planned.setHours(0, 0, 0, 0);
    const isOverdue = planned < today && a.status !== 'COMPLETED';
    return { ...a, isOverdue, computedStatus: isOverdue ? 'OVERDUE' as const : a.status };
  });

  const filtered = filter === 'ALL'
    ? enrichedActivities
    : filter === 'OVERDUE'
    ? enrichedActivities.filter(a => a.isOverdue)
    : enrichedActivities.filter(a => a.status === filter && !a.isOverdue);

  const counts = {
    all: enrichedActivities.length,
    completed: enrichedActivities.filter(a => a.status === 'COMPLETED').length,
    pending: enrichedActivities.filter(a => (a.status === 'PENDING' || a.status === 'IN_PROGRESS') && !a.isOverdue).length,
    overdue: enrichedActivities.filter(a => a.isOverdue).length,
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-8 w-48" />
        {[1, 2, 3, 4].map(i => <div key={i} className="skeleton h-16 rounded-xl" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Activities</h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-0.5">Manage farm operations and tasks</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl gradient-primary text-white text-sm font-medium shadow-sm hover:shadow-md transition-all">
          <Plus className="w-4 h-4" /> New Activity
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        {([
          ['ALL', `All (${counts.all})`],
          ['OVERDUE', `⚠ Overdue (${counts.overdue})`],
          ['PENDING', `⏳ Pending (${counts.pending})`],
          ['COMPLETED', `✅ Completed (${counts.completed})`],
        ] as [FilterStatus, string][]).map(([key, label]) => (
          <button key={key} onClick={() => setFilter(key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filter === key
                ? 'bg-[var(--color-primary-600)] text-white'
                : 'bg-[var(--color-surface-tertiary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)]'
            }`}>
            {label}
          </button>
        ))}
      </div>

      {/* Activity List */}
      {filtered.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <ClipboardList className="w-12 h-12 mx-auto mb-3 text-[var(--color-text-muted)]" />
          <p className="text-sm text-[var(--color-text-secondary)]">No activities found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((activity, i) => (
            <div key={activity.id}
              className="glass-card p-4 flex items-center gap-4 animate-slide-up"
              style={{ animationDelay: `${i * 0.03}s` }}>
              {/* Status indicator */}
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                activity.computedStatus === 'COMPLETED' ? 'bg-green-50' :
                activity.isOverdue ? 'bg-red-50' :
                activity.status === 'IN_PROGRESS' ? 'bg-blue-50' :
                'bg-amber-50'
              }`}>
                {activity.computedStatus === 'COMPLETED' ? <CheckCircle2 className="w-5 h-5 text-green-600" /> :
                 activity.isOverdue ? <AlertTriangle className="w-5 h-5 text-red-600" /> :
                 <Clock className="w-5 h-5 text-amber-600" />}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className={`text-sm font-medium ${
                    activity.computedStatus === 'COMPLETED' ? 'line-through text-[var(--color-text-muted)]' : 'text-[var(--color-text-primary)]'
                  }`}>{activity.title}</p>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                    activity.isOverdue ? 'status-overdue' :
                    activity.status === 'COMPLETED' ? 'status-completed' :
                    activity.status === 'IN_PROGRESS' ? 'status-in-progress' :
                    'status-pending'
                  }`}>
                    {activity.isOverdue ? 'OVERDUE' : activity.status}
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium priority-${activity.priority.toLowerCase()}`}>
                    {activity.priority}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-[var(--color-text-muted)]">
                  <span>{ACTIVITY_TYPE_LABELS[activity.activity_type]}</span>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(activity.planned_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </span>
                  {activity.crop_cycle && (
                    <>
                      <span>·</span>
                      <span>{(activity.crop_cycle as any).crop_name}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {activity.status !== 'COMPLETED' && (
                  <button onClick={() => handleComplete(activity.id)}
                    className="px-3 py-1.5 rounded-lg bg-[var(--color-primary-50)] text-[var(--color-primary-700)]
                      text-xs font-medium hover:bg-[var(--color-primary-100)] transition-colors">
                    Complete
                  </button>
                )}
                <button onClick={() => handleDelete(activity.id)}
                  className="p-1.5 rounded-lg hover:bg-red-50 text-[var(--color-text-muted)] hover:text-red-600 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={resetForm}>
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl animate-scale-in"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-[var(--color-border-light)]">
              <h2 className="text-lg font-semibold">New Activity</h2>
              <button onClick={resetForm} className="p-2 rounded-lg hover:bg-[var(--color-surface-tertiary)]"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">{error}</div>}

              <div>
                <label className="block text-sm font-medium mb-1.5">Title *</label>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)} required
                  placeholder="e.g. Fertilizer Application"
                  className="w-full px-4 py-2.5 rounded-xl border border-[var(--color-border-light)] bg-[var(--color-surface-secondary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)] focus:border-transparent" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Type</label>
                  <select value={activityType} onChange={e => setActivityType(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-[var(--color-border-light)] bg-[var(--color-surface-secondary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)] focus:border-transparent">
                    {Object.entries(ACTIVITY_TYPE_LABELS).map(([val, lbl]) => (
                      <option key={val} value={val}>{lbl}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Priority</label>
                  <select value={priority} onChange={e => setPriority(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-[var(--color-border-light)] bg-[var(--color-surface-secondary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)] focus:border-transparent">
                    {Object.entries(PRIORITY_LABELS).map(([val, lbl]) => (
                      <option key={val} value={val}>{lbl}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">Farm *</label>
                <select value={farmId} onChange={e => handleFarmChange(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[var(--color-border-light)] bg-[var(--color-surface-secondary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)] focus:border-transparent">
                  <option value="">Select farm</option>
                  {farms.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Field</label>
                  <select value={fieldId} onChange={e => setFieldId(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-[var(--color-border-light)] bg-[var(--color-surface-secondary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)] focus:border-transparent">
                    <option value="">Select field</option>
                    {fields.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Crop Cycle</label>
                  <select value={cropCycleId} onChange={e => setCropCycleId(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-[var(--color-border-light)] bg-[var(--color-surface-secondary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)] focus:border-transparent">
                    <option value="">Select crop</option>
                    {cropCycles.map(c => <option key={c.id} value={c.id}>{c.crop_name} ({c.season})</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Planned Date *</label>
                  <input type="date" value={plannedDate} onChange={e => setPlannedDate(e.target.value)} required
                    className="w-full px-4 py-2.5 rounded-xl border border-[var(--color-border-light)] bg-[var(--color-surface-secondary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)] focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Est. Cost (₹)</label>
                  <input type="number" value={estimatedCost} onChange={e => setEstimatedCost(e.target.value)}
                    placeholder="0" min="0"
                    className="w-full px-4 py-2.5 rounded-xl border border-[var(--color-border-light)] bg-[var(--color-surface-secondary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)] focus:border-transparent" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">Description</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)}
                  placeholder="Details about this activity..." rows={2}
                  className="w-full px-4 py-2.5 rounded-xl border border-[var(--color-border-light)] bg-[var(--color-surface-secondary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)] focus:border-transparent resize-none" />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={resetForm}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-[var(--color-border-light)] text-sm font-medium hover:bg-[var(--color-surface-tertiary)] transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 px-4 py-2.5 rounded-xl gradient-primary text-white text-sm font-medium shadow-sm hover:shadow-md transition-all disabled:opacity-60">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Create Activity'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
