import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { mockDataStore } from '@/services/mockDataStore';
import type { Activity, ActivityInsert } from '@/types/database';

export const activityService = {
  async getByFarm(farmId: string): Promise<Activity[]> {
    if (!isSupabaseConfigured) {
      return mockDataStore.getActivities(farmId);
    }
    try {
      const { data, error } = await supabase
        .from('activities')
        .select('*, crop_cycle:crop_cycles(id, crop_name, season), field:fields(id, name)')
        .eq('farm_id', farmId)
        .order('planned_date', { ascending: true });

      if (error) throw error;
      if (!data || data.length === 0) return mockDataStore.getActivities(farmId);
      return data;
    } catch {
      return mockDataStore.getActivities(farmId);
    }
  },

  async getByCropCycle(cropCycleId: string): Promise<Activity[]> {
    if (!isSupabaseConfigured) {
      return mockDataStore.getActivities(undefined, cropCycleId);
    }
    try {
      const { data, error } = await supabase
        .from('activities')
        .select('*, field:fields(id, name)')
        .eq('crop_cycle_id', cropCycleId)
        .order('planned_date', { ascending: true });

      if (error) throw error;
      if (!data || data.length === 0) return mockDataStore.getActivities(undefined, cropCycleId);
      return data;
    } catch {
      return mockDataStore.getActivities(undefined, cropCycleId);
    }
  },

  async getAll(): Promise<Activity[]> {
    if (!isSupabaseConfigured) {
      return mockDataStore.getActivities();
    }
    try {
      const { data, error } = await supabase
        .from('activities')
        .select('*, crop_cycle:crop_cycles(id, crop_name, season, farm_id), field:fields(id, name)')
        .order('planned_date', { ascending: true });

      if (error) throw error;
      if (!data || data.length === 0) return mockDataStore.getActivities();
      return data;
    } catch {
      return mockDataStore.getActivities();
    }
  },

  async getOverdue(): Promise<Activity[]> {
    const today = new Date().toISOString().split('T')[0];
    const all = await this.getAll();
    return all.filter(a => a.status !== 'COMPLETED' && a.planned_date < today);
  },

  async getDueToday(): Promise<Activity[]> {
    const today = new Date().toISOString().split('T')[0];
    const all = await this.getAll();
    return all.filter(a => a.status !== 'COMPLETED' && a.planned_date === today);
  },

  async getById(id: string): Promise<Activity> {
    if (!isSupabaseConfigured) {
      const a = mockDataStore.getActivityById(id);
      if (!a) throw new Error('Activity not found');
      return a;
    }
    try {
      const { data, error } = await supabase
        .from('activities')
        .select('*, crop_cycle:crop_cycles(id, crop_name, season), field:fields(id, name)')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch {
      const a = mockDataStore.getActivityById(id);
      if (!a) throw new Error('Activity not found');
      return a;
    }
  },

  async create(activity: ActivityInsert): Promise<Activity> {
    if (!isSupabaseConfigured) {
      return mockDataStore.createActivity(activity);
    }
    try {
      const { data, error } = await supabase
        .from('activities')
        .insert(activity)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch {
      return mockDataStore.createActivity(activity);
    }
  },

  async update(id: string, updates: Partial<ActivityInsert>): Promise<Activity> {
    if (!isSupabaseConfigured) {
      return mockDataStore.updateActivity(id, updates);
    }
    try {
      const { data, error } = await supabase
        .from('activities')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch {
      return mockDataStore.updateActivity(id, updates);
    }
  },

  async complete(id: string, actualCost?: number): Promise<Activity> {
    if (!isSupabaseConfigured) {
      return mockDataStore.completeActivity(id, actualCost);
    }
    try {
      const updates: Record<string, unknown> = {
        status: 'COMPLETED',
        completed_date: new Date().toISOString().split('T')[0],
      };
      if (actualCost !== undefined) {
        updates.actual_cost = actualCost;
      }

      const { data, error } = await supabase
        .from('activities')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch {
      return mockDataStore.completeActivity(id, actualCost);
    }
  },

  async delete(id: string): Promise<void> {
    if (!isSupabaseConfigured) {
      mockDataStore.deleteActivity(id);
      return;
    }
    try {
      const { error } = await supabase
        .from('activities')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch {
      mockDataStore.deleteActivity(id);
    }
  },
};
