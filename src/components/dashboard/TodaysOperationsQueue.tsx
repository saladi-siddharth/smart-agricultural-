import React, { useState } from 'react';
import type { Activity } from '@/types/database';
import {
  Clock, AlertTriangle, CheckCircle2, ChevronRight,
  ClipboardList, Check, Loader2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { showToast } from '@/components/common/ToastNotification';

interface TodaysOperationsQueueProps {
  activities: Activity[];
  onCompleteActivity: (id: string) => Promise<void>;
}

export function TodaysOperationsQueue({
  activities,
  onCompleteActivity,
}: TodaysOperationsQueueProps) {
  const [completingId, setCompletingId] = useState<string | null>(null);

  // Priority-ranked operational tasks
  const pendingActivities = activities
    .filter(a => a.status !== 'COMPLETED')
    .sort((a, b) => {
      if (a.status === 'OVERDUE' && b.status !== 'OVERDUE') return -1;
      if (b.status === 'OVERDUE' && a.status !== 'OVERDUE') return 1;
      const pOrder: Record<string, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
      return (pOrder[a.priority] ?? 2) - (pOrder[b.priority] ?? 2);
    })
    .slice(0, 4);

  const handleComplete = async (id: string, title: string) => {
    setCompletingId(id);
    try {
      await onCompleteActivity(id);
      showToast.success('Operation Completed', `"${title}" resolved. Farm Health index updated!`);
    } catch (err) {
      showToast.error('Failed to complete operation', 'Please try again.');
    } finally {
      setCompletingId(null);
    }
  };

  return (
    <div className="stitch-card p-6 flex flex-col justify-between h-full">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-[var(--color-text-title)]">
              Today's Priority Operations
            </h3>
            <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5">
              High-priority field operations requiring immediate action
            </p>
          </div>

          <Link
            to="/activities"
            className="text-xs font-semibold text-[var(--color-primary-700)] hover:text-[var(--color-primary-800)] flex items-center gap-1 transition-colors"
          >
            <span>All Tasks ({activities.length})</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Task Queue List */}
        {pendingActivities.length === 0 ? (
          <div className="py-12 text-center text-xs text-[var(--color-text-muted)]">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
            <p className="font-semibold text-[var(--color-text-title)]">All field operations up to date</p>
            <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5">No critical or overdue tasks pending for today.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {pendingActivities.map(activity => {
              const isOverdue = activity.status === 'OVERDUE' || (new Date(activity.planned_date) < new Date());
              const isCritical = activity.priority === 'CRITICAL' || activity.priority === 'HIGH';
              const isCompleting = completingId === activity.id;

              return (
                <div
                  key={activity.id}
                  className={`p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isOverdue
                      ? 'border-red-200/80 bg-red-50/30'
                      : 'border-[var(--color-border-subtle)] bg-slate-50/40 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className={`mt-0.5 w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 ${
                      isOverdue ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {isOverdue ? <AlertTriangle className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={`stitch-badge ${isOverdue ? 'stitch-badge-danger' : 'stitch-badge-warning'}`}>
                          {isOverdue ? '2 Days Overdue' : 'Due Today'}
                        </span>
                        <span className="text-[10px] text-[var(--color-text-faint)] font-mono">
                          {activity.activity_type.replace('_', ' ')}
                        </span>
                      </div>

                      <h4 className="text-xs font-bold text-[var(--color-text-title)] truncate">
                        {activity.title}
                      </h4>
                      <p className="text-[11px] text-[var(--color-text-muted)] truncate mt-0.5">
                        {activity.description || 'Assigned field operation'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0">
                    <button
                      onClick={() => handleComplete(activity.id, activity.title)}
                      disabled={isCompleting}
                      className="stitch-btn-primary px-3 py-1.5 text-xs gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {isCompleting ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Check className="w-3 h-3" />
                      )}
                      <span>Complete</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-[var(--color-border-subtle)] flex items-center justify-between text-[11px] text-[var(--color-text-muted)]">
        <span>Clicking Complete executes live DB update & refreshes Farm Health score.</span>
        <span className="font-semibold text-emerald-700">Live Sync</span>
      </div>
    </div>
  );
}
