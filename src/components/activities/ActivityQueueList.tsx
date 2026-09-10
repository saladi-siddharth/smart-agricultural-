import React, { useState } from 'react';
import type { Activity } from '@/types/database';
import { formatCurrency } from '@/services/intelligenceService';
import { CheckCircle2, AlertTriangle, Clock, Plus, Filter, Check, Loader2 } from 'lucide-react';

interface ActivityQueueListProps {
  activities: Activity[];
  onCompleteActivity: (id: string) => Promise<void>;
  onOpenCreateModal: () => void;
}

export function ActivityQueueList({
  activities,
  onCompleteActivity,
  onOpenCreateModal,
}: ActivityQueueListProps) {
  const [filter, setFilter] = useState<'ALL' | 'OVERDUE' | 'PENDING' | 'COMPLETED'>('ALL');
  const [completingId, setCompletingId] = useState<string | null>(null);

  const filteredActivities = activities.filter(a => {
    if (filter === 'ALL') return true;
    if (filter === 'OVERDUE') return a.status === 'OVERDUE';
    if (filter === 'COMPLETED') return a.status === 'COMPLETED';
    if (filter === 'PENDING') return a.status === 'PENDING' || a.status === 'IN_PROGRESS';
    return true;
  });

  const handleComplete = async (id: string) => {
    setCompletingId(id);
    try {
      await onCompleteActivity(id);
    } finally {
      setCompletingId(null);
    }
  };

  const overdueCount = activities.filter(a => a.status === 'OVERDUE').length;

  return (
    <div className="bg-white rounded-2xl border border-[var(--color-border-light)] p-6 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div>
          <h3 className="text-base font-bold text-[var(--color-text-primary)]">
            Agricultural Operations Ledger
          </h3>
          <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
            Track and complete field operations across the crop cycle
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Filters */}
          <div className="flex items-center gap-1 bg-[var(--color-surface-secondary)] p-1 rounded-xl border border-[var(--color-border-light)]">
            {(['ALL', 'OVERDUE', 'PENDING', 'COMPLETED'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  filter === tab
                    ? 'bg-white text-[var(--color-primary-700)] shadow-xs'
                    : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                }`}
              >
                {tab === 'OVERDUE' && overdueCount > 0 ? (
                  <span className="flex items-center gap-1 text-red-600">
                    Overdue ({overdueCount})
                  </span>
                ) : (
                  tab.charAt(0) + tab.slice(1).toLowerCase()
                )}
              </button>
            ))}
          </div>

          <button
            onClick={onOpenCreateModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl gradient-primary text-white text-xs font-semibold shadow-xs hover:shadow-md cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Schedule Task</span>
          </button>
        </div>
      </div>

      {filteredActivities.length === 0 ? (
        <div className="py-12 text-center text-xs text-[var(--color-text-muted)]">
          No operations found matching this filter.
        </div>
      ) : (
        <div className="space-y-3">
          {filteredActivities.map(activity => {
            const isOverdue = activity.status === 'OVERDUE';
            const isCompleted = activity.status === 'COMPLETED';
            const isCompleting = completingId === activity.id;

            return (
              <div
                key={activity.id}
                className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isOverdue
                    ? 'border-red-200 bg-red-50/40'
                    : isCompleted
                    ? 'border-slate-200 bg-white'
                    : 'border-amber-200 bg-amber-50/30'
                }`}
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div
                    className={`mt-0.5 p-2 rounded-xl flex-shrink-0 ${
                      isCompleted
                        ? 'bg-emerald-100 text-emerald-700'
                        : isOverdue
                        ? 'bg-red-100 text-red-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : isOverdue ? (
                      <AlertTriangle className="w-4 h-4" />
                    ) : (
                      <Clock className="w-4 h-4" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">
                        {activity.activity_type.replace('_', ' ')}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          isOverdue
                            ? 'bg-red-100 text-red-800'
                            : isCompleted
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {activity.status}
                      </span>
                      <span className="text-[10px] text-[var(--color-text-muted)]">
                        Priority: {activity.priority}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-[var(--color-text-primary)] mt-0.5">
                      {activity.title}
                    </h4>

                    {activity.description && (
                      <p className="text-xs text-[var(--color-text-secondary)] mt-0.5 leading-relaxed">
                        {activity.description}
                      </p>
                    )}

                    <div className="flex items-center gap-3 text-[11px] text-[var(--color-text-muted)] mt-1">
                      <span>Planned: {new Date(activity.planned_date).toLocaleDateString()}</span>
                      {activity.completed_date && (
                        <span className="text-emerald-700 font-medium">
                          Completed: {new Date(activity.completed_date).toLocaleDateString()}
                        </span>
                      )}
                      <span>Est: {formatCurrency(activity.estimated_cost)}</span>
                    </div>
                  </div>
                </div>

                {!isCompleted && (
                  <button
                    onClick={() => handleComplete(activity.id)}
                    disabled={isCompleting}
                    className="self-start sm:self-center inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl gradient-primary text-white text-xs font-semibold shadow-xs hover:shadow-md transition-all cursor-pointer whitespace-nowrap disabled:opacity-60"
                  >
                    {isCompleting ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Mark Done</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
