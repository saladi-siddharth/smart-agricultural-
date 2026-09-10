import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { mockDataStore } from '@/services/mockDataStore';
import type { Field, FieldInsert } from '@/types/database';

export const fieldService = {
  async getByFarm(farmId: string): Promise<Field[]> {
    if (!isSupabaseConfigured) {
      return mockDataStore.getFields(farmId);
    }
    try {
      const { data, error } = await supabase
        .from('fields')
        .select('*')
        .eq('farm_id', farmId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!data || data.length === 0) return mockDataStore.getFields(farmId);
      return data;
    } catch {
      return mockDataStore.getFields(farmId);
    }
  },

  async getAll(): Promise<Field[]> {
    if (!isSupabaseConfigured) {
      return mockDataStore.getFields();
    }
    try {
      const { data, error } = await supabase
        .from('fields')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!data || data.length === 0) return mockDataStore.getFields();
      return data;
    } catch {
      return mockDataStore.getFields();
    }
  },

  async getById(id: string): Promise<Field> {
    if (!isSupabaseConfigured) {
      const f = mockDataStore.getFieldById(id);
      if (!f) throw new Error('Field not found');
      return f;
    }
    try {
      const { data, error } = await supabase
        .from('fields')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch {
      const f = mockDataStore.getFieldById(id);
      if (!f) throw new Error('Field not found');
      return f;
    }
  },

  async create(field: FieldInsert): Promise<Field> {
    if (!isSupabaseConfigured) {
      return mockDataStore.createField(field);
    }
    try {
      const { data, error } = await supabase
        .from('fields')
        .insert(field)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch {
      return mockDataStore.createField(field);
    }
  },

  async update(id: string, updates: Partial<FieldInsert>): Promise<Field> {
    if (!isSupabaseConfigured) {
      return mockDataStore.updateField(id, updates);
    }
    try {
      const { data, error } = await supabase
        .from('fields')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch {
      return mockDataStore.updateField(id, updates);
    }
  },

  async delete(id: string): Promise<void> {
    if (!isSupabaseConfigured) {
      mockDataStore.deleteField(id);
      return;
    }
    try {
      const { error } = await supabase
        .from('fields')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch {
      mockDataStore.deleteField(id);
    }
  },
};
