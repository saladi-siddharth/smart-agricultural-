import React, { useState } from 'react';
import { Layers, Droplets, Sparkles, Sprout, ChevronRight, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';

export interface ParcelPlot {
  id: string;
  name: string;
  code: string;
  area: number;
  areaUnit: string;
  cropName?: string;
  variety?: string;
  stage?: string;
  soilType: string;
  irrigation: string;
  status: 'OPTIMAL' | 'ATTENTION' | 'FALLOW';
  coordinates: string; // SVG path
}

interface InteractiveParcelMapProps {
  plots?: ParcelPlot[];
  onSelectPlot?: (plot: ParcelPlot) => void;
}

const DEFAULT_PLOTS: ParcelPlot[] = [
  {
    id: 'plot-a',
    name: 'North Block (Plot A)',
    code: 'SEC-01',
    area: 10.0,
    areaUnit: 'acres',
    cropName: 'Paddy (Rice)',
    variety: 'BPT-5204',
    stage: 'Tillering & Nutrition',
    soilType: 'Clay Loam (pH 6.8)',
    irrigation: 'Canal Lift + Drip',
    status: 'ATTENTION', // Overdue zinc spray
    coordinates: 'M 20,20 L 260,20 L 260,180 L 20,180 Z',
  },
  {
    id: 'plot-b',
    name: 'Central Sector (Plot B)',
    code: 'SEC-02',
    area: 8.5,
    areaUnit: 'acres',
    cropName: 'Paddy (Rice)',
    variety: 'MTU-1010',
    stage: 'Sowing & Nursery',
    soilType: 'Alluvial Loam (pH 7.1)',
    irrigation: 'Solar Borewell Flood',
    status: 'OPTIMAL',
    coordinates: 'M 280,20 L 520,20 L 520,180 L 280,180 Z',
  },
  {
    id: 'plot-c',
    name: 'South Sector (Plot C)',
    code: 'SEC-03',
    area: 6.5,
    areaUnit: 'acres',
    cropName: 'Fallow / Green Manure',
    variety: 'Dhaincha (Nitrogen Fixer)',
    stage: 'Soil Preparation',
    soilType: 'Black Cotton Soil (pH 7.4)',
    irrigation: 'Rainfed + Canal Line',
    status: 'FALLOW',
    coordinates: 'M 20,200 L 520,200 L 520,290 L 20,290 Z',
  },
];

export function InteractiveParcelMap({
  plots = DEFAULT_PLOTS,
  onSelectPlot,
}: InteractiveParcelMapProps) {
  const [selectedPlot, setSelectedPlot] = useState<ParcelPlot>(plots[0]);

  const handleSelect = (plot: ParcelPlot) => {
    setSelectedPlot(plot);
    if (onSelectPlot) onSelectPlot(plot);
  };

  return (
    <div className="bg-white rounded-2xl border border-[#E5E8EB] p-6 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 mb-5 border-b border-[#F1F5F9]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <h3 className="text-sm font-bold text-[#0F172A] tracking-tight">
              Aerial Parcel Schematic & Field Demarcation
            </h3>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#F0FDF4] text-[#143D30] border border-[#DCFCE7] uppercase">
              Interactive Map
            </span>
          </div>
          <p className="text-xs text-[#64748B]">
            Vector representation of farm plots with live biological states and soil telemetry
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#143D30]" />
            <span className="text-[#64748B] font-medium text-[11px]">Active Crop</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" />
            <span className="text-[#64748B] font-medium text-[11px]">Attention Needed</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-slate-300" />
            <span className="text-[#64748B] font-medium text-[11px]">Fallow / Prep</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: SVG Parcel Map Visualization */}
        <div className="lg:col-span-2 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] p-4 relative overflow-hidden flex flex-col items-center justify-center min-h-[320px]">
          {/* Subtle field grid pattern */}
          <div className="absolute inset-0 opacity-20 pointer-events-none">
            <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="field-grid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#94A3B8" strokeWidth="0.5" strokeDasharray="2 2" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#field-grid)" />
            </svg>
          </div>

          <svg viewBox="0 0 540 310" className="w-full max-w-lg h-auto relative z-10 filter drop-shadow-xs">
            {plots.map(plot => {
              const isSelected = selectedPlot.id === plot.id;
              const fillColor =
                plot.status === 'ATTENTION'
                  ? isSelected ? '#FEF3C7' : '#FFFBEB'
                  : plot.status === 'OPTIMAL'
                  ? isSelected ? '#D1FAE5' : '#ECFDF5'
                  : isSelected ? '#E2E8F0' : '#F1F5F9';

              const strokeColor =
                plot.status === 'ATTENTION'
                  ? '#D97706'
                  : plot.status === 'OPTIMAL'
                  ? '#059669'
                  : '#94A3B8';

              return (
                <g
                  key={plot.id}
                  onClick={() => handleSelect(plot)}
                  className="cursor-pointer transition-all duration-200"
                >
                  <path
                    d={plot.coordinates}
                    fill={fillColor}
                    stroke={strokeColor}
                    strokeWidth={isSelected ? '3' : '1.5'}
                    strokeDasharray={plot.status === 'FALLOW' ? '4 3' : undefined}
                    className="hover:opacity-90 transition-opacity"
                  />
                  {/* Label Text Centered */}
                  {plot.id === 'plot-a' && (
                    <g pointerEvents="none">
                      <text x="140" y="80" textAnchor="middle" fontSize="13" fontWeight="bold" fill="#0F172A">
                        {plot.name}
                      </text>
                      <text x="140" y="105" textAnchor="middle" fontSize="11" fill="#64748B">
                        {plot.cropName} • {plot.area} {plot.areaUnit}
                      </text>
                      <text x="140" y="125" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#D97706">
                        ⚠️ Overdue Zinc Spray
                      </text>
                    </g>
                  )}
                  {plot.id === 'plot-b' && (
                    <g pointerEvents="none">
                      <text x="400" y="80" textAnchor="middle" fontSize="13" fontWeight="bold" fill="#0F172A">
                        {plot.name}
                      </text>
                      <text x="400" y="105" textAnchor="middle" fontSize="11" fill="#64748B">
                        {plot.cropName} • {plot.area} {plot.areaUnit}
                      </text>
                      <text x="400" y="125" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#059669">
                        ✓ Optimal Sowing Stage
                      </text>
                    </g>
                  )}
                  {plot.id === 'plot-c' && (
                    <g pointerEvents="none">
                      <text x="270" y="240" textAnchor="middle" fontSize="13" fontWeight="bold" fill="#0F172A">
                        {plot.name}
                      </text>
                      <text x="270" y="260" textAnchor="middle" fontSize="11" fill="#64748B">
                        {plot.area} {plot.areaUnit} • {plot.cropName}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </svg>

          <div className="mt-3 flex items-center justify-between w-full px-2 text-[11px] text-[#64748B] border-t border-[#E2E8F0] pt-2">
            <span>Click any parcel sector to inspect micro-telemetry and soil profile.</span>
            <span className="font-semibold text-[#143D30]">25.0 Acres Cultivated</span>
          </div>
        </div>

        {/* Right: Selected Parcel Telemetry Card */}
        <div className="bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between mb-3">
              <div>
                <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider font-mono">
                  {selectedPlot.code}
                </span>
                <h4 className="text-base font-bold text-[#0F172A] mt-0.5">
                  {selectedPlot.name}
                </h4>
              </div>
              <span className={`stitch-badge ${
                selectedPlot.status === 'OPTIMAL' ? 'stitch-badge-success' :
                selectedPlot.status === 'ATTENTION' ? 'stitch-badge-warning' :
                'stitch-badge-neutral'
              }`}>
                {selectedPlot.status === 'OPTIMAL' ? 'Healthy' : selectedPlot.status === 'ATTENTION' ? 'Action Req.' : 'Fallow'}
              </span>
            </div>

            <div className="space-y-3 text-xs pt-2">
              <div className="p-3 bg-white rounded-lg border border-[#E5E8EB]">
                <span className="text-[10px] font-bold text-[#94A3B8] uppercase block">Crop & Stage</span>
                <p className="font-bold text-[#0F172A] mt-0.5">{selectedPlot.cropName}</p>
                <p className="text-[11px] text-[#64748B]">Variety: {selectedPlot.variety} • {selectedPlot.stage}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 bg-white rounded-lg border border-[#E5E8EB]">
                  <span className="text-[10px] text-[#94A3B8] uppercase block font-semibold">Area</span>
                  <span className="font-bold text-[#0F172A] tabular-nums">{selectedPlot.area} {selectedPlot.areaUnit}</span>
                </div>
                <div className="p-2.5 bg-white rounded-lg border border-[#E5E8EB]">
                  <span className="text-[10px] text-[#94A3B8] uppercase block font-semibold">Soil Profile</span>
                  <span className="font-bold text-[#0F172A] truncate block">{selectedPlot.soilType}</span>
                </div>
              </div>

              <div className="p-3 bg-white rounded-lg border border-[#E5E8EB]">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#94A3B8] uppercase">
                  <Droplets className="w-3 h-3 text-blue-500" />
                  <span>Irrigation Network</span>
                </div>
                <p className="font-semibold text-[#0F172A] mt-0.5">{selectedPlot.irrigation}</p>
              </div>
            </div>
          </div>

          <div className="pt-4 mt-3 border-t border-[#E2E8F0]">
            <button
              onClick={() => onSelectPlot && onSelectPlot(selectedPlot)}
              className="w-full stitch-btn-primary py-2 text-xs"
            >
              <span>Inspect Crop Lifecycle</span>
              <ChevronRight className="w-3.5 h-3.5 ml-1" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
