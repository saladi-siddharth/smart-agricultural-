import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { mockDataStore } from '@/services/mockDataStore';
import type { CropCycle, CropCycleInsert } from '@/types/database';

export const cropService = {
  async getByFarm(farmId: string): Promise<CropCycle[]> {
    if (!isSupabaseConfigured) {
      return mockDataStore.getCropCycles(farmId);
    }
    try {
      const { data, error } = await supabase
        .from('crop_cycles')
        .select('*, field:fields(*)')
        .eq('farm_id', farmId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!data || data.length === 0) return mockDataStore.getCropCycles(farmId);
      return data;
    } catch {
      return mockDataStore.getCropCycles(farmId);
    }
  },

  async getAll(): Promise<CropCycle[]> {
    if (!isSupabaseConfigured) {
      return mockDataStore.getCropCycles();
    }
    try {
      const { data, error } = await supabase
        .from('crop_cycles')
        .select('*, field:fields(*), farm:farms(*)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!data || data.length === 0) return mockDataStore.getCropCycles();
      return data;
    } catch {
      return mockDataStore.getCropCycles();
    }
  },

  async getById(id: string): Promise<CropCycle> {
    if (!isSupabaseConfigured) {
      const c = mockDataStore.getCropCycleById(id);
      if (!c) throw new Error('Crop cycle not found');
      return c;
    }
    try {
      const { data, error } = await supabase
        .from('crop_cycles')
        .select('*, field:fields(*), farm:farms(*)')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch {
      const c = mockDataStore.getCropCycleById(id);
      if (!c) throw new Error('Crop cycle not found');
      return c;
    }
  },

  async getActive(): Promise<CropCycle[]> {
    const all = await this.getAll();
    return all.filter(c => c.status === 'ACTIVE');
  },

  async create(cycle: CropCycleInsert): Promise<CropCycle> {
    if (!isSupabaseConfigured) {
      return mockDataStore.createCropCycle(cycle);
    }
    try {
      const { data, error } = await supabase
        .from('crop_cycles')
        .insert(cycle)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch {
      return mockDataStore.createCropCycle(cycle);
    }
  },

  async update(id: string, updates: Partial<CropCycleInsert>): Promise<CropCycle> {
    if (!isSupabaseConfigured) {
      return mockDataStore.updateCropCycle(id, updates);
    }
    try {
      const { data, error } = await supabase
        .from('crop_cycles')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch {
      return mockDataStore.updateCropCycle(id, updates);
    }
  },

  async delete(id: string): Promise<void> {
    if (!isSupabaseConfigured) {
      mockDataStore.deleteCropCycle(id);
      return;
    }
    try {
      const { error } = await supabase
        .from('crop_cycles')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch {
      mockDataStore.deleteCropCycle(id);
    }
  },
};
