import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { mockDataStore } from '@/services/mockDataStore';
import type { Expense, ExpenseInsert } from '@/types/database';

export const expenseService = {
  async getByFarm(farmId: string): Promise<Expense[]> {
    if (!isSupabaseConfigured) {
      return mockDataStore.getExpenses(farmId);
    }
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('farm_id', farmId)
        .order('expense_date', { ascending: false });

      if (error) throw error;
      if (!data || data.length === 0) return mockDataStore.getExpenses(farmId);
      return data;
    } catch {
      return mockDataStore.getExpenses(farmId);
    }
  },

  async getByCropCycle(cropCycleId: string): Promise<Expense[]> {
    if (!isSupabaseConfigured) {
      return mockDataStore.getExpenses(undefined, cropCycleId);
    }
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('crop_cycle_id', cropCycleId)
        .order('expense_date', { ascending: false });

      if (error) throw error;
      if (!data || data.length === 0) return mockDataStore.getExpenses(undefined, cropCycleId);
      return data;
    } catch {
      return mockDataStore.getExpenses(undefined, cropCycleId);
    }
  },

  async getAll(): Promise<Expense[]> {
    if (!isSupabaseConfigured) {
      return mockDataStore.getExpenses();
    }
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .order('expense_date', { ascending: false });

      if (error) throw error;
      if (!data || data.length === 0) return mockDataStore.getExpenses();
      return data;
    } catch {
      return mockDataStore.getExpenses();
    }
  },

  async create(expense: ExpenseInsert): Promise<Expense> {
    if (!isSupabaseConfigured) {
      return mockDataStore.createExpense(expense);
    }
    try {
      const { data, error } = await supabase
        .from('expenses')
        .insert(expense)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch {
      return mockDataStore.createExpense(expense);
    }
  },

  async update(id: string, updates: Partial<ExpenseInsert>): Promise<Expense> {
    if (!isSupabaseConfigured) {
      return mockDataStore.updateExpense(id, updates);
    }
    try {
      const { data, error } = await supabase
        .from('expenses')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch {
      return mockDataStore.updateExpense(id, updates);
    }
  },

  async delete(id: string): Promise<void> {
    if (!isSupabaseConfigured) {
      mockDataStore.deleteExpense(id);
      return;
    }
    try {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch {
      mockDataStore.deleteExpense(id);
    }
  },
};
