import React, { useState } from 'react';
import type { Activity } from '@/types/database';
import {
  Clock, AlertTriangle, CheckCircle2, ChevronRight,
  Check, Loader2, Calendar, MapPin
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { showToast, triggerConfetti } from '@/components/common/ToastNotification';
import { motion, AnimatePresence } from 'framer-motion';

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
      triggerConfetti();
      showToast.success('Operation Completed', `"${title}" has been completed. Farm Health index updated!`);
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
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#F1F5F9]">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-[#0F172A] tracking-tight">
                Today's Priority Operations
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#F0FDF4] text-[#143D30] border border-[#DCFCE7]">
                Live Field Queue
              </span>
            </div>
            <p className="text-xs text-[#64748B] mt-0.5">
              Urgent tasks requiring agronomic action in the field today
            </p>
          </div>

          <Link
            to="/activities"
            className="text-xs font-semibold text-[#143D30] hover:text-[#1A4D3E] flex items-center gap-1 transition-colors"
          >
            <span>All Tasks ({activities.length})</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Task Queue List */}
        {pendingActivities.length === 0 ? (
          <div className="py-12 text-center text-xs text-[#64748B]">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-2.5" />
            <p className="text-sm font-bold text-[#0F172A]">All field operations up to date</p>
            <p className="text-xs text-[#64748B] mt-1">No critical or overdue tasks pending for today.</p>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {pendingActivities.map(activity => {
                const isOverdue = activity.status === 'OVERDUE' || (new Date(activity.planned_date) < new Date());
                const isCompleting = completingId === activity.id;

                return (
                  <motion.div
                    key={activity.id}
                    layout
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isOverdue
                        ? 'border-red-200/80 bg-red-50/20 hover:bg-red-50/30'
                        : 'border-[#E5E8EB] bg-[#F8FAFC]/50 hover:bg-white hover:border-[#CBD5E1]'
                    }`}
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className={`mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        isOverdue ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}>
                        {isOverdue ? <AlertTriangle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className={`stitch-badge ${isOverdue ? 'stitch-badge-danger' : 'stitch-badge-warning'}`}>
                            {isOverdue ? 'Overdue' : 'Due Today'}
                          </span>
                          <span className="text-[10px] text-[#64748B] font-semibold uppercase tracking-wider">
                            {activity.activity_type.replace('_', ' ')}
                          </span>
                          <span className="text-[11px] text-[#94A3B8]">•</span>
                          <span className="text-[11px] text-[#64748B] flex items-center gap-1 font-mono">
                            <Calendar className="w-3 h-3 text-[#94A3B8]" />
                            {activity.planned_date}
                          </span>
                        </div>

                        <h4 className="text-xs font-bold text-[#0F172A] truncate">
                          {activity.title}
                        </h4>
                        <p className="text-xs text-[#64748B] truncate mt-0.5">
                          {activity.description || 'Assigned field operation'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0">
                      <button
                        onClick={() => handleComplete(activity.id, activity.title)}
                        disabled={isCompleting}
                        className="stitch-btn-primary px-3.5 py-1.5 text-xs gap-1.5 shadow-xs transition-all active:scale-95 disabled:opacity-50"
                      >
                        {isCompleting ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Check className="w-3.5 h-3.5" />
                        )}
                        <span>Complete</span>
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-[#F1F5F9] flex items-center justify-between text-xs text-[#64748B]">
        <span>Clicking <strong>Complete</strong> immediately recalculates the composite Farm Health Score.</span>
        <span className="font-semibold text-emerald-700 flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Live Reactive Engine
        </span>
      </div>
    </div>
  );
}
