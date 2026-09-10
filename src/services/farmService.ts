import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { mockDataStore } from '@/services/mockDataStore';
import type { Farm, FarmInsert } from '@/types/database';

export const farmService = {
  async getAll(): Promise<Farm[]> {
    if (!isSupabaseConfigured) {
      return mockDataStore.getFarms();
    }
    try {
      const { data, error } = await supabase
        .from('farms')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!data || data.length === 0) return mockDataStore.getFarms();
      return data;
    } catch (err) {
      console.warn('farmService.getAll fallback to mockDataStore', err);
      return mockDataStore.getFarms();
    }
  },

  async getById(id: string): Promise<Farm> {
    if (!isSupabaseConfigured) {
      const f = mockDataStore.getFarmById(id);
      if (!f) throw new Error('Farm not found');
      return f;
    }
    try {
      const { data, error } = await supabase
        .from('farms')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch {
      const f = mockDataStore.getFarmById(id);
      if (!f) throw new Error('Farm not found');
      return f;
    }
  },

  async create(farm: FarmInsert): Promise<Farm> {
    if (!isSupabaseConfigured) {
      return mockDataStore.createFarm(farm);
    }
    try {
      const { data, error } = await supabase
        .from('farms')
        .insert(farm)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch {
      return mockDataStore.createFarm(farm);
    }
  },

  async update(id: string, updates: Partial<FarmInsert>): Promise<Farm> {
    if (!isSupabaseConfigured) {
      return mockDataStore.updateFarm(id, updates);
    }
    try {
      const { data, error } = await supabase
        .from('farms')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch {
      return mockDataStore.updateFarm(id, updates);
    }
  },

  async delete(id: string): Promise<void> {
    if (!isSupabaseConfigured) {
      mockDataStore.deleteFarm(id);
      return;
    }
    try {
      const { error } = await supabase
        .from('farms')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch {
      mockDataStore.deleteFarm(id);
    }
  },
};
