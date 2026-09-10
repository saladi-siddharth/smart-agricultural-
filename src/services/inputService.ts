import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { mockDataStore } from '@/services/mockDataStore';
import type { Input as FarmInput, InputInsert } from '@/types/database';

export const inputService = {
  async getByFarm(farmId: string): Promise<FarmInput[]> {
    if (!isSupabaseConfigured) {
      return mockDataStore.getInputs(farmId);
    }
    try {
      const { data, error } = await supabase
        .from('inputs')
        .select('*')
        .eq('farm_id', farmId)
        .order('used_date', { ascending: false });

      if (error) throw error;
      if (!data || data.length === 0) return mockDataStore.getInputs(farmId);
      return data;
    } catch {
      return mockDataStore.getInputs(farmId);
    }
  },

  async getByCropCycle(cropCycleId: string): Promise<FarmInput[]> {
    if (!isSupabaseConfigured) {
      return mockDataStore.getInputs(undefined, cropCycleId);
    }
    try {
      const { data, error } = await supabase
        .from('inputs')
        .select('*')
        .eq('crop_cycle_id', cropCycleId)
        .order('used_date', { ascending: false });

      if (error) throw error;
      if (!data || data.length === 0) return mockDataStore.getInputs(undefined, cropCycleId);
      return data;
    } catch {
      return mockDataStore.getInputs(undefined, cropCycleId);
    }
  },

  async getAll(): Promise<FarmInput[]> {
    if (!isSupabaseConfigured) {
      return mockDataStore.getInputs();
    }
    try {
      const { data, error } = await supabase
        .from('inputs')
        .select('*')
        .order('used_date', { ascending: false });

      if (error) throw error;
      if (!data || data.length === 0) return mockDataStore.getInputs();
      return data;
    } catch {
      return mockDataStore.getInputs();
    }
  },

  async create(input: InputInsert): Promise<FarmInput> {
    if (!isSupabaseConfigured) {
      return mockDataStore.createInput(input);
    }
    try {
      const { data, error } = await supabase
        .from('inputs')
        .insert(input)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch {
      return mockDataStore.createInput(input);
    }
  },

  async update(id: string, updates: Partial<InputInsert>): Promise<FarmInput> {
    if (!isSupabaseConfigured) {
      return mockDataStore.updateInput(id, updates);
    }
    try {
      const { data, error } = await supabase
        .from('inputs')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch {
      return mockDataStore.updateInput(id, updates);
    }
  },

  async delete(id: string): Promise<void> {
    if (!isSupabaseConfigured) {
      mockDataStore.deleteInput(id);
      return;
    }
    try {
      const { error } = await supabase
        .from('inputs')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch {
      mockDataStore.deleteInput(id);
    }
  },
};
