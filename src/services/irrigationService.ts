import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { mockDataStore } from '@/services/mockDataStore';
import type { IrrigationLog, IrrigationLogInsert } from '@/types/database';

export const irrigationService = {
  async getByFarm(farmId: string): Promise<IrrigationLog[]> {
    if (!isSupabaseConfigured) {
      return mockDataStore.getIrrigationLogs(farmId);
    }
    try {
      const { data, error } = await supabase
        .from('irrigation_logs')
        .select('*')
        .eq('farm_id', farmId)
        .order('irrigation_date', { ascending: false });

      if (error) throw error;
      if (!data || data.length === 0) return mockDataStore.getIrrigationLogs(farmId);
      return data;
    } catch {
      return mockDataStore.getIrrigationLogs(farmId);
    }
  },

  async getByCropCycle(cropCycleId: string): Promise<IrrigationLog[]> {
    if (!isSupabaseConfigured) {
      return mockDataStore.getIrrigationLogs(undefined, cropCycleId);
    }
    try {
      const { data, error } = await supabase
        .from('irrigation_logs')
        .select('*')
        .eq('crop_cycle_id', cropCycleId)
        .order('irrigation_date', { ascending: false });

      if (error) throw error;
      if (!data || data.length === 0) return mockDataStore.getIrrigationLogs(undefined, cropCycleId);
      return data;
    } catch {
      return mockDataStore.getIrrigationLogs(undefined, cropCycleId);
    }
  },

  async getAll(): Promise<IrrigationLog[]> {
    if (!isSupabaseConfigured) {
      return mockDataStore.getIrrigationLogs();
    }
    try {
      const { data, error } = await supabase
        .from('irrigation_logs')
        .select('*')
        .order('irrigation_date', { ascending: false });

      if (error) throw error;
      if (!data || data.length === 0) return mockDataStore.getIrrigationLogs();
      return data;
    } catch {
      return mockDataStore.getIrrigationLogs();
    }
  },

  async create(log: IrrigationLogInsert): Promise<IrrigationLog> {
    if (!isSupabaseConfigured) {
      return mockDataStore.createIrrigationLog(log);
    }
    try {
      const { data, error } = await supabase
        .from('irrigation_logs')
        .insert(log)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch {
      return mockDataStore.createIrrigationLog(log);
    }
  },

  async update(id: string, updates: Partial<IrrigationLogInsert>): Promise<IrrigationLog> {
    if (!isSupabaseConfigured) {
      return mockDataStore.updateIrrigationLog(id, updates);
    }
    try {
      const { data, error } = await supabase
        .from('irrigation_logs')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch {
      return mockDataStore.updateIrrigationLog(id, updates);
    }
  },

  async delete(id: string): Promise<void> {
    if (!isSupabaseConfigured) {
      mockDataStore.deleteIrrigationLog(id);
      return;
    }
    try {
      const { error } = await supabase
        .from('irrigation_logs')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch {
      mockDataStore.deleteIrrigationLog(id);
    }
  },
};
