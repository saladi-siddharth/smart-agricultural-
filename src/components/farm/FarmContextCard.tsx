import React from 'react';
import type { Farm, Field } from '@/types/database';
import { MapPin, Layers, Tractor, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface FarmContextCardProps {
  farm: Farm;
  fields?: Field[];
}

export function FarmContextCard({ farm, fields = [] }: FarmContextCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-[var(--color-border-light)] p-5 shadow-xs hover:shadow-md transition-all">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)] mb-1">
            <MapPin className="w-3.5 h-3.5 text-[var(--color-primary-600)]" />
            <span>{farm.location || 'Machilipatnam'}, {farm.district}, {farm.state}</span>
          </div>
          <h3 className="text-lg font-bold text-[var(--color-text-primary)]">
            {farm.name}
          </h3>
        </div>
        <Link
          to={`/farms/${farm.id}`}
          className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-primary-700)] hover:bg-[var(--color-primary-50)] transition-colors"
          title="View Farm Details"
        >
          <ChevronRight className="w-5 h-5" />
        </Link>
      </div>

      <p className="text-xs text-[var(--color-text-secondary)] mb-4 line-clamp-2">
        {farm.description || 'Precision and organic agriculture unit with dedicated irrigation.'}
      </p>

      <div className="grid grid-cols-2 gap-3 py-3 border-y border-[var(--color-border-light)] text-xs">
        <div>
          <span className="text-[11px] text-[var(--color-text-muted)] block">Total Area</span>
          <span className="font-bold text-[var(--color-text-primary)] text-sm">
            {farm.total_area} {farm.area_unit}
          </span>
        </div>
        <div>
          <span className="text-[11px] text-[var(--color-text-muted)] block">Cultivated Plots</span>
          <span className="font-bold text-[var(--color-text-primary)] text-sm">
            {fields.length} Parcels
          </span>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-[var(--color-text-muted)]">
        <span>Owner: Green Valley Agro</span>
        <span className="font-medium text-emerald-700">Active Operational Unit</span>
      </div>
    </div>
  );
}
