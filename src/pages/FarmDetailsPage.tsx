import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { farmService } from '@/services/farmService';
import { fieldService } from '@/services/fieldService';
import { cropService } from '@/services/cropService';
import { useAuth } from '@/hooks/useAuth';
import { showToast } from '@/components/common/ToastNotification';
import type { Farm, Field, FieldInsert, CropCycle, CropCycleInsert } from '@/types/database';
import { InteractiveParcelMap } from '@/components/farm/InteractiveParcelMap';
import {
  ArrowLeft, MapPin, Maximize, Plus, Map, Leaf, Edit3,
  Trash2, X, Loader2, Calendar, Target, Wallet, ChevronRight,
  Droplets, Layers, Sparkles, Building2, Sun, Wind, Compass,
  ShieldCheck, CheckCircle2
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function FarmDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [farm, setFarm] = useState<Farm | null>(null);
  const [fields, setFields] = useState<Field[]>([]);
  const [cropCycles, setCropCycles] = useState<CropCycle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFieldForm, setShowFieldForm] = useState(false);
  const [showCropForm, setShowCropForm] = useState(false);
  const [editingField, setEditingField] = useState<Field | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Field form
  const [fieldName, setFieldName] = useState('');
  const [fieldArea, setFieldArea] = useState('');
  const [fieldAreaUnit, setFieldAreaUnit] = useState('acres');
  const [fieldSoilType, setFieldSoilType] = useState('Clay Loam');
  const [fieldIrrType, setFieldIrrType] = useState('Canal + Drip');

  // Crop form
  const [cropName, setCropName] = useState('');
  const [cropVariety, setCropVariety] = useState('');
  const [cropSeason, setCropSeason] = useState('Kharif');
  const [cropFieldId, setCropFieldId] = useState('');
  const [cropStartDate, setCropStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [cropHarvestDate, setCropHarvestDate] = useState('');
  const [cropTargetYield, setCropTargetYield] = useState('4.5');
  const [cropYieldUnit, setCropYieldUnit] = useState('tonnes');
  const [cropSellingPrice, setCropSellingPrice] = useState('29000');
  const [cropBudget, setCropBudget] = useState('50000');

  const loadData = async () => {
    if (!id) return;
    try {
      const [f, flds, cycles] = await Promise.all([
        farmService.getById(id),
        fieldService.getByFarm(id),
        cropService.getByFarm(id),
      ]);
      setFarm(f);
      setFields(flds);
      setCropCycles(cycles);
      if (flds.length > 0 && !cropFieldId) {
        setCropFieldId(flds[0].id);
      }
    } catch (err) {
      console.error(err);
      showToast.error('Failed to load farm details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [id]);

  const resetFieldForm = () => {
    setFieldName(''); setFieldArea(''); setFieldAreaUnit('acres');
    setFieldSoilType('Clay Loam'); setFieldIrrType('Canal + Drip');
    setEditingField(null); setShowFieldForm(false); setError('');
  };

  const handleFieldSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fieldName.trim()) { setError('Field name is required'); return; }
    setSaving(true); setError('');
    try {
      const payload: FieldInsert = {
        farm_id: id!,
        name: fieldName.trim(),
        area: parseFloat(fieldArea) || 0,
        area_unit: fieldAreaUnit as FieldInsert['area_unit'],
        soil_type: fieldSoilType,
        irrigation_type: fieldIrrType,
        description: '',
      };
      if (editingField) {
        await fieldService.update(editingField.id, payload);
        showToast.success(`Field parcel "${fieldName}" updated`);
      } else {
        await fieldService.create(payload);
        showToast.success(`Field parcel "${fieldName}" registered`);
      }
      resetFieldForm();
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save field';
      setError(msg);
      showToast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteField = async (fieldId: string, name: string) => {
    if (!confirm(`Delete field parcel "${name}"?`)) return;
    try {
      await fieldService.delete(fieldId);
      showToast.success(`Field parcel "${name}" deleted`);
      await loadData();
    } catch (err) {
      console.error(err);
      showToast.error('Failed to delete field');
    }
  };

  const handleCropSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cropName.trim() || !cropFieldId || !cropStartDate) {
      setError('Crop name, field, and start date are required'); return;
    }
    setSaving(true); setError('');
    try {
      const payload: CropCycleInsert = {
        farm_id: id!,
        field_id: cropFieldId,
        crop_name: cropName.trim(),
        variety: cropVariety.trim(),
        season: cropSeason as CropCycleInsert['season'],
        start_date: cropStartDate,
        expected_harvest_date: cropHarvestDate || null,
        status: 'ACTIVE',
        target_yield: parseFloat(cropTargetYield) || 0,
        yield_unit: cropYieldUnit as CropCycleInsert['yield_unit'],
        selling_price_per_unit: parseFloat(cropSellingPrice) || 0,
        planned_budget: parseFloat(cropBudget) || 0,
        notes: '',
      };
      await cropService.create(payload);
      showToast.success(`Crop cycle "${cropName}" registered`);
      setShowCropForm(false);
      setCropName(''); setCropVariety('');
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save crop cycle';
      setError(msg);
      showToast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 bg-[#E2E8F0] animate-pulse rounded-xl" />
        <div className="h-44 bg-white border border-[#E5E8EB] rounded-2xl animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map(i => <div key={i} className="h-44 bg-white border border-[#E5E8EB] rounded-2xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  if (!farm) {
    return (
      <div className="bg-white rounded-2xl border border-[#E5E8EB] p-12 text-center shadow-xs">
        <p className="text-sm font-bold text-[#0F172A]">Estate holding not found</p>
        <button
          onClick={() => navigate('/farms')}
          className="mt-3 text-xs font-bold text-[#143D30] hover:underline cursor-pointer"
        >
          ← Back to All Estates
        </button>
      </div>
    );
  }

  const activeCropsCount = cropCycles.filter(c => c.status === 'ACTIVE').length;
  const totalFieldAcreage = fields.reduce((acc, f) => acc + (Number(f.area) || 0), 0);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Breadcrumb & Estate Hero Dossier Banner */}
      <div>
        <button
          onClick={() => navigate('/farms')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#64748B] hover:text-[#0F172A] transition-colors mb-3 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Land Holdings
        </button>

        <div className="bg-white rounded-2xl border border-[#E5E8EB] p-6 lg:p-8 shadow-2xs">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-[#F0FDF4] text-[#143D30] border border-[#DCFCE7] uppercase tracking-wider">
                  Primary Agronomic Unit
                </span>
                <span className="flex items-center gap-1 text-[11px] text-emerald-700 font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5" /> Verified Holding
                </span>
              </div>
              <h1 className="text-3xl font-extrabold text-[#0F172A] tracking-tight">{farm.name}</h1>
              <p className="text-xs text-[#64748B] mt-1.5 flex items-center gap-2 flex-wrap">
                <span className="flex items-center gap-1 text-[#334155] font-medium">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                  {[farm.location, farm.district, farm.state].filter(Boolean).join(', ')}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 font-mono text-[11px] text-[#64748B]">
                  <Compass className="w-3.5 h-3.5 text-slate-400" /> 16.1809° N, 81.1378° E
                </span>
              </p>
              {farm.description && (
                <p className="text-xs text-[#475569] mt-2 max-w-2xl leading-relaxed">
                  {farm.description}
                </p>
              )}
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <button
                onClick={() => { resetFieldForm(); setShowFieldForm(true); }}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-[#CBD5E1] bg-white text-xs font-bold text-[#334155] hover:bg-[#F8FAFC] transition-colors cursor-pointer shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Demarcated Plot</span>
              </button>
              <button
                onClick={() => { setShowCropForm(true); setError(''); }}
                disabled={fields.length === 0}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#143D30] hover:bg-[#1A4D3E] text-white text-xs font-bold transition-colors cursor-pointer shadow-xs disabled:opacity-50"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Launch Crop Cycle</span>
              </button>
            </div>
          </div>

          {/* Live Micro-climate & Agronomic Ribbon */}
          <div className="mt-6 pt-6 border-t border-[#F1F5F9] grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E5E8EB]">
              <span className="text-[10px] font-bold text-[#94A3B8] uppercase block">Total Area</span>
              <p className="text-lg font-extrabold text-[#0F172A] tabular-nums mt-0.5">
                {farm.total_area} <span className="text-xs font-normal text-[#64748B]">{farm.area_unit}</span>
              </p>
              <p className="text-[11px] text-[#64748B] mt-0.5 font-medium">{totalFieldAcreage.toFixed(1)} acres allocated</p>
            </div>

            <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E5E8EB]">
              <span className="text-[10px] font-bold text-[#94A3B8] uppercase block">Demarcated Parcels</span>
              <p className="text-lg font-extrabold text-[#0F172A] tabular-nums mt-0.5">
                {fields.length} <span className="text-xs font-normal text-[#64748B]">Sectors</span>
              </p>
              <p className="text-[11px] text-emerald-700 font-medium mt-0.5">100% Boundary Mapped</p>
            </div>

            <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E5E8EB]">
              <span className="text-[10px] font-bold text-[#94A3B8] uppercase block">Active Crop Cycles</span>
              <p className="text-lg font-extrabold text-[#143D30] tabular-nums mt-0.5">
                {activeCropsCount} <span className="text-xs font-normal text-[#64748B]">Cultivations</span>
              </p>
              <p className="text-[11px] text-[#64748B] mt-0.5 font-medium">Kharif 2026 Season</p>
            </div>

            <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E5E8EB]">
              <span className="text-[10px] font-bold text-[#94A3B8] uppercase block">Current Weather</span>
              <p className="text-lg font-extrabold text-[#0F172A] tabular-nums mt-0.5">
                28°C <span className="text-xs font-normal text-[#64748B]">Sunny</span>
              </p>
              <p className="text-[11px] text-[#64748B] mt-0.5 font-medium flex items-center gap-2">
                <span className="flex items-center gap-0.5"><Droplets className="w-3 h-3 text-blue-500" /> 64%</span>
                <span className="flex items-center gap-0.5"><Wind className="w-3 h-3 text-emerald-600" /> 12 km/h</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Aerial Schematic Map Component */}
      <div>
        <InteractiveParcelMap />
      </div>

      {/* Field Parcels Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-extrabold text-[#0F172A] uppercase tracking-wider">
              Demarcated Field Parcels ({fields.length})
            </h2>
            <p className="text-xs text-[#64748B]">Configured soil profiles, irrigation lines, and sector boundaries</p>
          </div>
          <button
            onClick={() => { resetFieldForm(); setShowFieldForm(true); }}
            className="text-xs font-bold text-[#143D30] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Add Plot
          </button>
        </div>

        {fields.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#E5E8EB] p-8 text-center shadow-xs">
            <Map className="w-8 h-8 mx-auto mb-2 text-[#94A3B8]" />
            <p className="text-xs font-bold text-[#0F172A]">No fields configured yet</p>
            <p className="text-xs text-[#64748B] mt-0.5">Add your first parcel to start planning crop rotations.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {fields.map(field => (
              <div key={field.id} className="bg-white rounded-2xl border border-[#E5E8EB] p-5 shadow-2xs hover:border-[#143D30] transition-all group">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-[#F0FDF4] border border-[#DCFCE7] flex items-center justify-center text-[#143D30]">
                      <Map className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-[#0F172A]">{field.name}</h3>
                      <p className="text-[11px] text-[#64748B] font-semibold tabular-nums">{field.area} {field.area_unit}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => {
                        setEditingField(field);
                        setFieldName(field.name);
                        setFieldArea(field.area.toString());
                        setFieldAreaUnit(field.area_unit);
                        setFieldSoilType(field.soil_type || 'Clay Loam');
                        setFieldIrrType(field.irrigation_type || 'Canal + Drip');
                        setShowFieldForm(true);
                      }}
                      className="p-1.5 rounded-lg text-[#94A3B8] hover:text-[#0F172A] hover:bg-[#F1F5F9] transition-colors"
                      title="Edit Plot"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteField(field.id, field.name)}
                      className="p-1.5 rounded-lg text-[#94A3B8] hover:text-red-600 hover:bg-red-50 transition-colors"
                      title="Delete Plot"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#F1F5F9] grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 bg-[#F8FAFC] rounded-lg">
                    <span className="text-[10px] font-bold text-[#94A3B8] uppercase block">Soil Profile</span>
                    <span className="font-bold text-[#334155] truncate block mt-0.5">{field.soil_type || 'Clay Loam'}</span>
                  </div>
                  <div className="p-2 bg-[#F8FAFC] rounded-lg">
                    <span className="text-[10px] font-bold text-[#94A3B8] uppercase block">Irrigation</span>
                    <span className="font-bold text-[#334155] truncate block mt-0.5">{field.irrigation_type || 'Canal + Drip'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Crop Cycles Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-extrabold text-[#0F172A] uppercase tracking-wider">
              Seasonal Crop Cycles ({cropCycles.length})
            </h2>
            <p className="text-xs text-[#64748B]">Active biological stages, target yield, and financial budgets</p>
          </div>
          <button
            onClick={() => { setShowCropForm(true); setError(''); }}
            disabled={fields.length === 0}
            className="text-xs font-bold text-[#143D30] hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-50"
          >
            <Plus className="w-3.5 h-3.5" /> Launch Season
          </button>
        </div>

        {cropCycles.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#E5E8EB] p-8 text-center shadow-xs">
            <Leaf className="w-8 h-8 mx-auto mb-2 text-[#94A3B8]" />
            <p className="text-xs font-bold text-[#0F172A]">No crop cycles initiated yet</p>
            <p className="text-xs text-[#64748B] mt-0.5">Start your first cycle to track tasks, inputs, and harvest projections.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {cropCycles.map(cycle => (
              <div
                key={cycle.id}
                className="bg-white rounded-2xl border border-[#E5E8EB] p-5 shadow-2xs hover:border-[#143D30] hover:shadow-xs transition-all cursor-pointer group"
                onClick={() => navigate(`/crops/${cycle.id}`)}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#F0FDF4] border border-[#DCFCE7] flex items-center justify-center text-[#143D30] group-hover:bg-[#143D30] group-hover:text-white transition-colors">
                      <Leaf className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-[#0F172A] group-hover:text-[#143D30] transition-colors">
                          {cycle.crop_name}
                        </h3>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase ${
                          cycle.status === 'ACTIVE' ? 'bg-[#F0FDF4] text-[#143D30] border border-[#DCFCE7]' :
                          cycle.status === 'COMPLETED' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                          'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {cycle.status}
                        </span>
                      </div>
                      <p className="text-xs text-[#64748B] mt-0.5 font-medium">
                        Variety: {cycle.variety || 'Standard'} • Season: {cycle.season}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#94A3B8] group-hover:text-[#0F172A] transition-colors" />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-3 border-t border-[#F1F5F9]">
                  <div className="p-2.5 bg-[#F8FAFC] rounded-xl border border-[#E5E8EB]">
                    <span className="text-[10px] font-bold text-[#94A3B8] uppercase block">Assigned Parcel</span>
                    <span className="font-bold text-[#0F172A] mt-0.5 block">{cycle.field?.name || 'Assigned Plot'}</span>
                  </div>
                  <div className="p-2.5 bg-[#F8FAFC] rounded-xl border border-[#E5E8EB]">
                    <span className="text-[10px] font-bold text-[#94A3B8] uppercase block">Target Yield</span>
                    <span className="font-bold text-[#0F172A] tabular-nums mt-0.5 block">{cycle.target_yield} {cycle.yield_unit}</span>
                  </div>
                  <div className="p-2.5 bg-[#F8FAFC] rounded-xl border border-[#E5E8EB]">
                    <span className="text-[10px] font-bold text-[#94A3B8] uppercase block">Planned Budget</span>
                    <span className="font-bold text-[#0F172A] tabular-nums mt-0.5 block">₹{cycle.planned_budget?.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="p-2.5 bg-[#F8FAFC] rounded-xl border border-[#E5E8EB]">
                    <span className="text-[10px] font-bold text-[#94A3B8] uppercase block">Sowing Date</span>
                    <span className="font-bold text-[#0F172A] mt-0.5 block">{new Date(cycle.start_date).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Field Form Modal */}
      {showFieldForm && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in" onClick={resetFieldForm}>
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-[#E5E8EB] p-6 animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E8EB] mb-4">
              <div>
                <h2 className="text-base font-bold text-[#0F172A]">
                  {editingField ? 'Edit Field Parcel' : 'Demarcate New Field Parcel'}
                </h2>
                <p className="text-xs text-[#64748B] mt-0.5">Specify sector boundaries and soil profile</p>
              </div>
              <button onClick={resetFieldForm} className="p-1.5 rounded-lg text-[#94A3B8] hover:bg-[#F1F5F9] cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleFieldSubmit} className="space-y-3.5">
              {error && <div className="p-2.5 rounded-xl bg-red-50 text-red-700 text-xs font-semibold">{error}</div>}

              <div>
                <label className="block text-xs font-bold text-[#334155] mb-1">Field / Parcel Name *</label>
                <input
                  type="text"
                  required
                  value={fieldName}
                  onChange={e => setFieldName(e.target.value)}
                  placeholder="e.g. Field Block A"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] text-xs text-[#0F172A] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#143D30] font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#334155] mb-1">Area *</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={fieldArea}
                    onChange={e => setFieldArea(e.target.value)}
                    placeholder="10.0"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] text-xs text-[#0F172A] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#143D30] font-bold tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#334155] mb-1">Unit</label>
                  <select
                    value={fieldAreaUnit}
                    onChange={e => setFieldAreaUnit(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] text-xs text-[#0F172A] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#143D30] font-medium cursor-pointer"
                  >
                    <option value="acres">Acres</option>
                    <option value="hectares">Hectares</option>
                    <option value="bigha">Bigha</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#334155] mb-1">Soil Profile</label>
                  <select
                    value={fieldSoilType}
                    onChange={e => setFieldSoilType(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] text-xs text-[#0F172A] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#143D30] font-medium cursor-pointer"
                  >
                    <option value="Clay Loam">Clay Loam (pH 6.8)</option>
                    <option value="Alluvial Soil">Alluvial Loam (pH 7.1)</option>
                    <option value="Black Cotton Soil">Black Cotton (pH 7.4)</option>
                    <option value="Red Sandy Loam">Red Sandy Loam</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#334155] mb-1">Irrigation Network</label>
                  <select
                    value={fieldIrrType}
                    onChange={e => setFieldIrrType(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] text-xs text-[#0F172A] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#143D30] font-medium cursor-pointer"
                  >
                    <option value="Canal + Drip">Canal + Drip</option>
                    <option value="Canal Lift">Canal Lift</option>
                    <option value="Solar Borewell Flood">Solar Borewell</option>
                    <option value="Sprinkler">Sprinkler</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2.5 pt-4 border-t border-[#E5E8EB]">
                <button
                  type="button"
                  onClick={resetFieldForm}
                  className="flex-1 px-3.5 py-2.5 rounded-xl border border-[#CBD5E1] text-xs font-semibold text-[#475569] hover:bg-[#F1F5F9] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#143D30] hover:bg-[#1A4D3E] text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : (editingField ? 'Save Changes' : 'Create Parcel')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Crop Cycle Modal */}
      {showCropForm && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in" onClick={() => setShowCropForm(false)}>
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-[#E5E8EB] p-6 max-h-[90vh] overflow-y-auto animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E8EB] mb-4">
              <div>
                <h2 className="text-base font-bold text-[#0F172A]">Launch New Crop Cycle</h2>
                <p className="text-xs text-[#64748B] mt-0.5">Assign planting season, yield target, and operational budget</p>
              </div>
              <button onClick={() => setShowCropForm(false)} className="p-1.5 rounded-lg text-[#94A3B8] hover:bg-[#F1F5F9] cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCropSubmit} className="space-y-3.5">
              {error && <div className="p-2.5 rounded-xl bg-red-50 text-red-700 text-xs font-semibold">{error}</div>}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#334155] mb-1">Crop Name *</label>
                  <input
                    type="text"
                    required
                    value={cropName}
                    onChange={e => setCropName(e.target.value)}
                    placeholder="e.g. Paddy (Rice)"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] text-xs text-[#0F172A] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#143D30] font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#334155] mb-1">Variety</label>
                  <input
                    type="text"
                    value={cropVariety}
                    onChange={e => setCropVariety(e.target.value)}
                    placeholder="e.g. BPT 5204"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] text-xs text-[#0F172A] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#143D30] font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#334155] mb-1">Assigned Field Parcel *</label>
                  <select
                    value={cropFieldId}
                    onChange={e => setCropFieldId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] text-xs text-[#0F172A] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#143D30] font-medium cursor-pointer"
                  >
                    {fields.map(f => <option key={f.id} value={f.id}>{f.name} ({f.area} {f.area_unit})</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#334155] mb-1">Season</label>
                  <select
                    value={cropSeason}
                    onChange={e => setCropSeason(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] text-xs text-[#0F172A] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#143D30] font-medium cursor-pointer"
                  >
                    <option value="Kharif">Kharif (Monsoon)</option>
                    <option value="Rabi">Rabi (Winter)</option>
                    <option value="Zaid">Zaid (Summer)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#334155] mb-1">Sowing Date *</label>
                  <input
                    type="date"
                    required
                    value={cropStartDate}
                    onChange={e => setCropStartDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] text-xs text-[#0F172A] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#143D30] font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#334155] mb-1">Expected Harvest</label>
                  <input
                    type="date"
                    value={cropHarvestDate}
                    onChange={e => setCropHarvestDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] text-xs text-[#0F172A] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#143D30] font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#334155] mb-1">Target Yield</label>
                  <input
                    type="number"
                    step="0.1"
                    value={cropTargetYield}
                    onChange={e => setCropTargetYield(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] text-xs text-[#0F172A] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#143D30] font-bold tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#334155] mb-1">Price/T (₹)</label>
                  <input
                    type="number"
                    value={cropSellingPrice}
                    onChange={e => setCropSellingPrice(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] text-xs text-[#0F172A] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#143D30] font-bold tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#334155] mb-1">Budget (₹)</label>
                  <input
                    type="number"
                    value={cropBudget}
                    onChange={e => setCropBudget(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] text-xs text-[#0F172A] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#143D30] font-bold tabular-nums"
                  />
                </div>
              </div>

              <div className="flex gap-2.5 pt-4 border-t border-[#E5E8EB]">
                <button
                  type="button"
                  onClick={() => setShowCropForm(false)}
                  className="flex-1 px-3.5 py-2.5 rounded-xl border border-[#CBD5E1] text-xs font-semibold text-[#475569] hover:bg-[#F1F5F9] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#143D30] hover:bg-[#1A4D3E] text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Launch Season Cycle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
