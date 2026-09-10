import React from 'react';
import type { Activity } from '@/types/database';
import { formatCurrency } from '@/services/intelligenceService';
import {
  Clock, AlertTriangle, CheckCircle2, ChevronRight,
  ClipboardList, Check, Loader2
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface TodaysOperationsQueueProps {
  activities: Activity[];
  onCompleteActivity: (id: string) => Promise<void>;
}

export function TodaysOperationsQueue({
  activities,
  onCompleteActivity,
}: TodaysOperationsQueueProps) {
  const [completingId, setCompletingId] = React.useState<string | null>(null);

  // Filter tasks that need attention: OVERDUE, or PENDING/IN_PROGRESS
  const pendingActivities = activities
    .filter(a => a.status !== 'COMPLETED')
    .sort((a, b) => {
      // Overdue first
      if (a.status === 'OVERDUE' && b.status !== 'OVERDUE') return -1;
      if (b.status === 'OVERDUE' && a.status !== 'OVERDUE') return 1;
      // Then by priority
      const pOrder: Record<string, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
      return (pOrder[a.priority] ?? 2) - (pOrder[b.priority] ?? 2);
    })
    .slice(0, 5); // top 5 operational priorities

  const handleComplete = async (id: string) => {
    setCompletingId(id);
    try {
      await onCompleteActivity(id);
    } finally {
      setCompletingId(null);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-[var(--color-border-light)] p-6 shadow-xs hover:shadow-md transition-all">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-[var(--color-text-primary)]">
            Today's Operational Queue
          </h3>
          <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
            Priority-ranked tasks requiring immediate field action
          </p>
        </div>
        <Link
          to="/activities"
          className="text-xs font-semibold text-[var(--color-primary-700)] hover:text-[var(--color-primary-800)] flex items-center gap-0.5"
        >
          <span>View All ({activities.length})</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {pendingActivities.length === 0 ? (
        <div className="p-8 text-center bg-emerald-50/50 rounded-xl border border-emerald-100">
          <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
          <h4 className="text-sm font-bold text-emerald-900">All Operations Up To Date!</h4>
          <p className="text-xs text-emerald-700 mt-0.5">
            No overdue or pressing field tasks. All crop milestones are on schedule.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {pendingActivities.map(activity => {
            const isOverdue = activity.status === 'OVERDUE';
            const isCompleting = completingId === activity.id;

            return (
              <div
                key={activity.id}
                className={`p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                  isOverdue
                    ? 'border-red-200 bg-red-50/40 hover:bg-red-50/70'
                    : 'border-[var(--color-border-light)] bg-white hover:bg-[var(--color-surface-secondary)]'
                }`}
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div
                    className={`mt-0.5 p-1.5 rounded-lg flex-shrink-0 ${
                      isOverdue ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {isOverdue ? (
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
                        className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase ${
                          isOverdue
                            ? 'bg-red-200 text-red-900'
                            : 'bg-amber-200 text-amber-900'
                        }`}
                      >
                        {activity.status}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-[var(--color-text-primary)] mt-0.5 truncate">
                      {activity.title}
                    </h4>
                    <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5">
                      Planned: {new Date(activity.planned_date).toLocaleDateString()} • Est Cost: {formatCurrency(activity.estimated_cost)}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleComplete(activity.id)}
                  disabled={isCompleting}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl gradient-primary text-white text-xs font-semibold shadow-xs hover:shadow-md transition-all flex-shrink-0 cursor-pointer disabled:opacity-60"
                  title="Mark this operation complete"
                >
                  {isCompleting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Complete</span>
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
