import { useState, useEffect } from 'react';
import { activityService } from '@/services/activityService';
import { farmService } from '@/services/farmService';
import { cropService } from '@/services/cropService';
import { fieldService } from '@/services/fieldService';
import type { Activity, ActivityInsert, Farm, CropCycle, Field } from '@/types/database';
import { ACTIVITY_TYPE_LABELS } from '@/types/database';
import {
  Plus, ClipboardList, CheckCircle2, Clock, AlertTriangle,
  X, Loader2, Calendar, Trash2, Check, Search, Filter
} from 'lucide-react';
import { showToast, triggerConfetti } from '@/components/common/ToastNotification';
import { SlideOverDrawer } from '@/components/common/SlideOverDrawer';
import { motion, AnimatePresence } from 'framer-motion';

type FilterStatus = 'ALL' | 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE';

export default function ActivitiesPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [cropCycles, setCropCycles] = useState<CropCycle[]>([]);
  const [fields, setFields] = useState<Field[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterStatus>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [saving, setSaving] = useState(false);
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  // Form State
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
      showToast.error('Failed to load activities');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const resetForm = () => {
    setTitle(''); setDescription(''); setActivityType('OTHER');
    setFieldId(''); setCropCycleId(''); setPlannedDate('');
    setPriority('MEDIUM'); setEstimatedCost('');
    setShowForm(false); setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !farmId || !plannedDate) {
      setError('Title, farm, and planned date are required');
      return;
    }
    setSaving(true);
    setError('');
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
      showToast.success('Operation Created', `"${title.trim()}" scheduled.`);
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

  const handleComplete = async (id: string, actTitle: string) => {
    setCompletingId(id);
    try {
      await activityService.complete(id);
      triggerConfetti();
      showToast.success('Operation Completed', `"${actTitle}" marked as complete!`);
      if (selectedActivity?.id === id) {
        setSelectedActivity(null);
      }
      await loadData();
    } catch (err) {
      console.error(err);
      showToast.error('Failed to complete operation');
    } finally {
      setCompletingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this activity?')) return;
    try {
      await activityService.delete(id);
      showToast.info('Operation Deleted', 'Activity removed.');
      if (selectedActivity?.id === id) {
        setSelectedActivity(null);
      }
      await loadData();
    } catch (err) {
      console.error(err);
      showToast.error('Failed to delete activity');
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

  const filtered = enrichedActivities.filter(a => {
    const matchesFilter =
      filter === 'ALL' ? true :
      filter === 'OVERDUE' ? a.isOverdue :
      filter === 'COMPLETED' ? a.status === 'COMPLETED' :
      (a.status === filter && !a.isOverdue);

    const matchesSearch =
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.activity_type.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const counts = {
    all: enrichedActivities.length,
    completed: enrichedActivities.filter(a => a.status === 'COMPLETED').length,
    pending: enrichedActivities.filter(a => (a.status === 'PENDING' || a.status === 'IN_PROGRESS') && !a.isOverdue).length,
    overdue: enrichedActivities.filter(a => a.isOverdue).length,
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-[#E2E8F0] animate-pulse rounded-lg" />
        {[1, 2, 3, 4].map(i => <div key={i} className="h-16 rounded-xl bg-white border border-[#E5E8EB] animate-pulse" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E5E8EB]">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#143D30] uppercase tracking-wider mb-1">
            <ClipboardList className="w-3.5 h-3.5" />
            <span>Operational Log</span>
          </div>
          <h1 className="text-2xl font-bold text-[#0F172A] tracking-tight">Field Operations Ledger</h1>
          <p className="text-xs text-[#64748B] mt-0.5">Track, schedule, and complete agricultural activities with full audit trail</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#143D30] hover:bg-[#1A4D3E] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Operation</span>
        </button>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex gap-1.5 flex-wrap">
          {([
            ['ALL', `All (${counts.all})`],
            ['OVERDUE', `Overdue (${counts.overdue})`],
            ['PENDING', `Pending (${counts.pending})`],
            ['COMPLETED', `Completed (${counts.completed})`],
          ] as [FilterStatus, string][]).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                filter === key
                  ? key === 'OVERDUE' ? 'bg-red-600 text-white shadow-xs' : 'bg-[#143D30] text-white shadow-xs'
                  : 'bg-white border border-[#E5E8EB] text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-[#94A3B8] absolute left-3 top-1/2 transform -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search operations, crops..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-[#E5E8EB] rounded-lg outline-none focus:border-[#143D30] focus:ring-1 focus:ring-[#143D30] text-[#0F172A] placeholder-[#94A3B8] transition-colors"
          />
        </div>
      </div>

      {/* Activity List */}
      {filtered.length === 0 ? (
        <div className="stitch-card p-12 text-center">
          <ClipboardList className="w-10 h-10 mx-auto mb-2 text-[#94A3B8]" />
          <p className="text-sm font-bold text-[#0F172A]">No operations matching criteria</p>
          <p className="text-xs text-[#64748B] mt-1">Try clearing your search query or switching tabs.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {filtered.map(activity => {
              const isCompleted = activity.computedStatus === 'COMPLETED';
              const isOverdue = activity.isOverdue;
              const isCompleting = completingId === activity.id;

              return (
                <motion.div
                  key={activity.id}
                  layout
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.18 }}
                  onClick={() => setSelectedActivity(activity)}
                  className={`stitch-card p-4 flex items-center justify-between gap-4 cursor-pointer hover:border-[#CBD5E1] transition-all group ${
                    isOverdue ? 'border-red-200 bg-red-50/20' : ''
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      isCompleted ? 'bg-[#F0FDF4] text-[#143D30] border border-[#DCFCE7]' :
                      isOverdue ? 'bg-red-50 text-red-700 border border-red-200' :
                      'bg-[#F8FAFC] text-[#64748B] border border-[#E5E8EB]'
                    }`}>
                      {isCompleted ? <CheckCircle2 className="w-4 h-4" /> :
                       isOverdue ? <AlertTriangle className="w-4 h-4" /> :
                       <Clock className="w-4 h-4" />}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <p className={`text-xs font-bold truncate group-hover:text-[#143D30] transition-colors ${
                          isCompleted ? 'line-through text-[#94A3B8]' : 'text-[#0F172A]'
                        }`}>
                          {activity.title}
                        </p>

                        <span className={`stitch-badge ${
                          isOverdue ? 'stitch-badge-danger' :
                          isCompleted ? 'stitch-badge-success' :
                          'stitch-badge-warning'
                        }`}>
                          {isOverdue ? 'Overdue' : activity.status}
                        </span>

                        <span className="text-[10px] text-[#94A3B8] font-mono uppercase">
                          {ACTIVITY_TYPE_LABELS[activity.activity_type] || activity.activity_type}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-[#64748B] flex-wrap">
                        <span className="flex items-center gap-1 font-mono text-[11px]">
                          <Calendar className="w-3.5 h-3.5 text-[#94A3B8]" />
                          Planned: {activity.planned_date}
                        </span>
                        {activity.crop_cycle && (
                          <span>• {(activity.crop_cycle as any).crop_name}</span>
                        )}
                        <span className="tabular-nums">• Est: ₹{activity.estimated_cost}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                    {!isCompleted && (
                      <button
                        onClick={() => handleComplete(activity.id, activity.title)}
                        disabled={isCompleting}
                        className="stitch-btn-primary px-3 py-1.5 text-xs gap-1 cursor-pointer disabled:opacity-50"
                      >
                        {isCompleting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                        <span>Complete</span>
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(activity.id)}
                      className="p-1.5 rounded-lg text-[#94A3B8] hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                      title="Delete activity"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Slide-Over Inspection Drawer */}
      <SlideOverDrawer
        isOpen={Boolean(selectedActivity)}
        onClose={() => setSelectedActivity(null)}
        title={selectedActivity?.title || 'Operation Details'}
        subtitle="Field Activity & Agronomic Tracking"
      >
        {selectedActivity && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E5E8EB] space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-[#64748B]">Status:</span>
                <span className="font-bold text-[#0F172A]">{selectedActivity.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748B]">Activity Type:</span>
                <span className="font-semibold text-[#0F172A]">{selectedActivity.activity_type.replace('_', ' ')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748B]">Priority:</span>
                <span className="font-semibold text-[#0F172A]">{selectedActivity.priority}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748B]">Planned Date:</span>
                <span className="font-mono text-[#0F172A]">{selectedActivity.planned_date}</span>
              </div>
              {selectedActivity.completed_date && (
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Completed Date:</span>
                  <span className="font-mono text-emerald-700 font-bold">{selectedActivity.completed_date}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-[#64748B]">Estimated Cost:</span>
                <span className="font-mono font-bold text-[#0F172A]">₹{selectedActivity.estimated_cost}</span>
              </div>
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] block mb-1">
                Operation Notes & Description
              </span>
              <p className="text-xs text-[#0F172A] leading-relaxed p-3.5 bg-white border border-[#E5E8EB] rounded-xl">
                {selectedActivity.description || 'No specialized agronomic notes provided for this task.'}
              </p>
            </div>

            {selectedActivity.status !== 'COMPLETED' && (
              <div className="pt-2">
                <button
                  onClick={() => handleComplete(selectedActivity.id, selectedActivity.title)}
                  className="stitch-btn-primary w-full py-2.5 text-xs text-center cursor-pointer"
                >
                  Mark Operation Complete ✓
                </button>
              </div>
            )}
          </div>
        )}
      </SlideOverDrawer>

      {/* Creation Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl border border-[#E5E8EB] animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#E5E8EB]">
              <h2 className="text-sm font-bold text-[#0F172A]">Schedule Field Operation</h2>
              <button onClick={resetForm} className="p-1 rounded text-[#94A3B8] hover:text-[#0F172A]">
                <X className="w-4 h-4" />
              </button>
            </div>

            {error && (
              <div className="p-2.5 rounded-lg bg-red-50 text-red-700 text-xs mb-3 font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-[#334155] mb-1">Operation Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Zinc Sulfate Foliar Application"
                  className="w-full px-3 py-2 border border-[#CBD5E1] bg-[#F8FAFC] rounded-lg outline-none focus:bg-white focus:ring-1 focus:ring-[#143D30]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#334155] mb-1">Operation Type</label>
                  <select
                    value={activityType}
                    onChange={e => setActivityType(e.target.value)}
                    className="w-full px-3 py-2 border border-[#CBD5E1] bg-[#F8FAFC] rounded-lg outline-none focus:bg-white focus:ring-1 focus:ring-[#143D30]"
                  >
                    <option value="LAND_PREPARATION">Land Preparation</option>
                    <option value="SOWING">Sowing / Planting</option>
                    <option value="FERTILIZATION">Fertilization</option>
                    <option value="WEEDING">Weeding</option>
                    <option value="PEST_INSPECTION">Pest Inspection</option>
                    <option value="SPRAYING">Spraying</option>
                    <option value="HARVEST">Harvest</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-[#334155] mb-1">Priority</label>
                  <select
                    value={priority}
                    onChange={e => setPriority(e.target.value)}
                    className="w-full px-3 py-2 border border-[#CBD5E1] bg-[#F8FAFC] rounded-lg outline-none focus:bg-white focus:ring-1 focus:ring-[#143D30]"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#334155] mb-1">Planned Date *</label>
                  <input
                    type="date"
                    required
                    value={plannedDate}
                    onChange={e => setPlannedDate(e.target.value)}
                    className="w-full px-3 py-2 border border-[#CBD5E1] bg-[#F8FAFC] rounded-lg outline-none focus:bg-white font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#334155] mb-1">Estimated Cost (₹)</label>
                  <input
                    type="number"
                    value={estimatedCost}
                    onChange={e => setEstimatedCost(e.target.value)}
                    placeholder="e.g. 2500"
                    className="w-full px-3 py-2 border border-[#CBD5E1] bg-[#F8FAFC] rounded-lg outline-none focus:bg-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#334155] mb-1">Description & Agronomic Notes</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Specific dosage, targeted plot area, labor allocated..."
                  className="w-full px-3 py-2 border border-[#CBD5E1] bg-[#F8FAFC] rounded-lg outline-none focus:bg-white resize-none"
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
                  {saving ? 'Scheduling...' : 'Schedule Operation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
