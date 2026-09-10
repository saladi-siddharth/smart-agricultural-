import React from 'react';
import type { Input as FarmInput } from '@/types/database';
import { formatCurrency } from '@/services/intelligenceService';
import { Package, Plus } from 'lucide-react';

interface InputConsumptionTableProps {
  inputs: FarmInput[];
  onOpenAddModal: () => void;
}

export function InputConsumptionTable({
  inputs,
  onOpenAddModal,
}: InputConsumptionTableProps) {
  const totalInputCost = inputs.reduce((sum, i) => sum + Number(i.cost || 0), 0);

  return (
    <div className="bg-white rounded-2xl border border-[var(--color-border-light)] p-6 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div>
          <h3 className="text-base font-bold text-[var(--color-text-primary)]">
            Resource & Input Consumption
          </h3>
          <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
            Seeds, fertilizers, bio-agents, and soil amendments applied
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-[var(--color-text-muted)]">
            Total Input Value: <strong className="text-[var(--color-text-primary)]">{formatCurrency(totalInputCost)}</strong>
          </span>
          <button
            onClick={onOpenAddModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl gradient-primary text-white text-xs font-semibold shadow-xs hover:shadow-md cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Record Input</span>
          </button>
        </div>
      </div>

      {inputs.length === 0 ? (
        <div className="py-12 text-center text-xs text-[var(--color-text-muted)]">
          No agricultural inputs recorded for this cycle yet.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[var(--color-surface-secondary)] border-b border-[var(--color-border-light)] text-[var(--color-text-secondary)] uppercase">
              <tr>
                <th className="py-3 px-4 font-semibold">Resource / Input</th>
                <th className="py-3 px-4 font-semibold">Type</th>
                <th className="py-3 px-4 font-semibold">Quantity</th>
                <th className="py-3 px-4 font-semibold">Cost</th>
                <th className="py-3 px-4 font-semibold">Used Date</th>
                <th className="py-3 px-4 font-semibold">Supplier</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border-light)]">
              {inputs.map(inp => (
                <tr key={inp.id} className="hover:bg-[var(--color-surface-secondary)] transition-colors">
                  <td className="py-3.5 px-4 font-bold text-[var(--color-text-primary)]">
                    {inp.name}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-700">
                      {inp.input_type}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-bold text-[var(--color-text-primary)]">
                    {inp.quantity} {inp.unit}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-[var(--color-primary-700)]">
                    {formatCurrency(inp.cost)}
                  </td>
                  <td className="py-3.5 px-4 text-[var(--color-text-muted)]">
                    {new Date(inp.used_date).toLocaleDateString()}
                  </td>
                  <td className="py-3.5 px-4 text-[var(--color-text-secondary)]">
                    {inp.supplier || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
