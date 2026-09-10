import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { mockDataStore } from '@/services/mockDataStore';
import type { Harvest, HarvestInsert } from '@/types/database';

export const harvestService = {
  async getByFarm(farmId: string): Promise<Harvest[]> {
    if (!isSupabaseConfigured) {
      return mockDataStore.getHarvests(farmId);
    }
    try {
      const { data, error } = await supabase
        .from('harvests')
        .select('*')
        .eq('farm_id', farmId)
        .order('harvest_date', { ascending: false });

      if (error) throw error;
      if (!data || data.length === 0) return mockDataStore.getHarvests(farmId);
      return data;
    } catch {
      return mockDataStore.getHarvests(farmId);
    }
  },

  async getByCropCycle(cropCycleId: string): Promise<Harvest[]> {
    if (!isSupabaseConfigured) {
      return mockDataStore.getHarvests(undefined, cropCycleId);
    }
    try {
      const { data, error } = await supabase
        .from('harvests')
        .select('*')
        .eq('crop_cycle_id', cropCycleId)
        .order('harvest_date', { ascending: false });

      if (error) throw error;
      if (!data || data.length === 0) return mockDataStore.getHarvests(undefined, cropCycleId);
      return data;
    } catch {
      return mockDataStore.getHarvests(undefined, cropCycleId);
    }
  },

  async getAll(): Promise<Harvest[]> {
    if (!isSupabaseConfigured) {
      return mockDataStore.getHarvests();
    }
    try {
      const { data, error } = await supabase
        .from('harvests')
        .select('*')
        .order('harvest_date', { ascending: false });

      if (error) throw error;
      if (!data || data.length === 0) return mockDataStore.getHarvests();
      return data;
    } catch {
      return mockDataStore.getHarvests();
    }
  },

  async create(harvest: HarvestInsert): Promise<Harvest> {
    if (!isSupabaseConfigured) {
      return mockDataStore.createHarvest(harvest);
    }
    try {
      const { data, error } = await supabase
        .from('harvests')
        .insert(harvest)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch {
      return mockDataStore.createHarvest(harvest);
    }
  },

  async update(id: string, updates: Partial<HarvestInsert>): Promise<Harvest> {
    if (!isSupabaseConfigured) {
      return mockDataStore.updateHarvest(id, updates);
    }
    try {
      const { data, error } = await supabase
        .from('harvests')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch {
      return mockDataStore.updateHarvest(id, updates);
    }
  },

  async delete(id: string): Promise<void> {
    if (!isSupabaseConfigured) {
      mockDataStore.deleteHarvest(id);
      return;
    }
    try {
      const { error } = await supabase
        .from('harvests')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch {
      mockDataStore.deleteHarvest(id);
    }
  },
};
