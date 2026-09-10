import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { farmService } from '@/services/farmService';
import { fieldService } from '@/services/fieldService';
import { cropService } from '@/services/cropService';
import { useAuth } from '@/hooks/useAuth';
import { showToast } from '@/components/common/ToastNotification';
import type { Farm, Field, FieldInsert, CropCycle, CropCycleInsert } from '@/types/database';
import {
  ArrowLeft, MapPin, Maximize, Plus, Map, Leaf, Edit3,
  Trash2, X, Loader2, Calendar, Target, Wallet, ChevronRight,
  Droplets, Layers, Sparkles, Building2
} from 'lucide-react';

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
        showToast.success(`Field "${fieldName}" updated`);
      } else {
        await fieldService.create(payload);
        showToast.success(`Field "${fieldName}" created`);
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
    if (!confirm(`Delete field "${name}"?`)) return;
    try {
      await fieldService.delete(fieldId);
      showToast.success(`Field "${name}" deleted`);
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
        <div className="h-8 w-64 bg-[#E2E8F0] animate-pulse rounded-lg" />
        <div className="h-32 bg-white border border-[#E5E8EB] rounded-xl animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map(i => <div key={i} className="h-44 bg-white border border-[#E5E8EB] rounded-xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  if (!farm) {
    return (
      <div className="bg-white rounded-xl border border-[#E5E8EB] p-12 text-center shadow-xs">
        <p className="text-sm font-semibold text-[#0F172A]">Farm holding not found</p>
        <button
          onClick={() => navigate('/farms')}
          className="mt-3 text-xs font-semibold text-[#143D30] hover:underline"
        >
          ← Back to All Farms
        </button>
      </div>
    );
  }

  const activeCropsCount = cropCycles.filter(c => c.status === 'ACTIVE').length;
  const totalFieldAcreage = fields.reduce((acc, f) => acc + (Number(f.area) || 0), 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <button
          onClick={() => navigate('/farms')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#64748B] hover:text-[#0F172A] transition-colors mb-2 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Holdings
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E5E8EB]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#F0FDF4] text-[#143D30] border border-[#DCFCE7] uppercase tracking-wider">
                Active Operational Unit
              </span>
            </div>
            <h1 className="text-2xl font-bold text-[#0F172A] tracking-tight">{farm.name}</h1>
            <p className="text-xs text-[#64748B] mt-0.5">
              {[farm.location, farm.district, farm.state].filter(Boolean).join(', ')} • {farm.total_area} {farm.area_unit} registered
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => { resetFieldForm(); setShowFieldForm(true); }}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#CBD5E1] bg-white text-xs font-semibold text-[#334155] hover:bg-[#F8FAFC] transition-colors cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Field</span>
            </button>
            <button
              onClick={() => { setShowCropForm(true); setError(''); }}
              disabled={fields.length === 0}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#143D30] hover:bg-[#1A4D3E] text-white text-xs font-semibold transition-colors cursor-pointer shadow-xs disabled:opacity-50"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Launch Crop Cycle</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Overview Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-[#E5E8EB] shadow-xs">
          <p className="text-[11px] font-medium text-[#64748B] uppercase tracking-wider">Total Acreage</p>
          <p className="text-xl font-bold text-[#0F172A] tabular-nums mt-1">{farm.total_area} {farm.area_unit}</p>
          <p className="text-[11px] text-[#94A3B8] mt-0.5">{totalFieldAcreage.toFixed(1)} allocated</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-[#E5E8EB] shadow-xs">
          <p className="text-[11px] font-medium text-[#64748B] uppercase tracking-wider">Parcels / Fields</p>
          <p className="text-xl font-bold text-[#0F172A] tabular-nums mt-1">{fields.length}</p>
          <p className="text-[11px] text-[#94A3B8] mt-0.5">Demarcated plots</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-[#E5E8EB] shadow-xs">
          <p className="text-[11px] font-medium text-[#64748B] uppercase tracking-wider">Active Seasons</p>
          <p className="text-xl font-bold text-[#143D30] tabular-nums mt-1">{activeCropsCount}</p>
          <p className="text-[11px] text-[#94A3B8] mt-0.5">Under cultivation</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-[#E5E8EB] shadow-xs">
          <p className="text-[11px] font-medium text-[#64748B] uppercase tracking-wider">Estate Status</p>
          <div className="flex items-center gap-1.5 mt-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-xs font-semibold text-emerald-700">Healthy & Monitored</span>
          </div>
        </div>
      </div>

      {/* Fields Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-sm font-bold text-[#0F172A] uppercase tracking-wider">
              Field Parcels ({fields.length})
            </h2>
            <p className="text-xs text-[#64748B]">Demarcated land sectors with soil profiles and irrigation</p>
          </div>
          <button
            onClick={() => { resetFieldForm(); setShowFieldForm(true); }}
            className="text-xs font-semibold text-[#143D30] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Add Plot
          </button>
        </div>

        {fields.length === 0 ? (
          <div className="bg-white rounded-xl border border-[#E5E8EB] p-8 text-center shadow-xs">
            <Map className="w-8 h-8 mx-auto mb-2 text-[#94A3B8]" />
            <p className="text-xs font-medium text-[#0F172A]">No fields configured yet</p>
            <p className="text-xs text-[#64748B] mt-0.5">Add your first parcel to start planning crop rotations.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {fields.map(field => (
              <div key={field.id} className="bg-white rounded-xl border border-[#E5E8EB] p-4 shadow-xs hover:border-[#CBD5E1] transition-all group">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-md bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center text-[#143D30]">
                      <Map className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-[#0F172A]">{field.name}</h3>
                      <p className="text-[11px] text-[#64748B] tabular-nums">{field.area} {field.area_unit}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
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
                      className="p-1 rounded text-[#94A3B8] hover:text-[#0F172A] hover:bg-[#F1F5F9]"
                      title="Edit"
                    >
                      <Edit3 className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleDeleteField(field.id, field.name)}
                      className="p-1 rounded text-[#94A3B8] hover:text-red-600 hover:bg-red-50"
                      title="Delete"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#F1F5F9] grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-[#94A3B8] block">Soil Profile</span>
                    <span className="font-semibold text-[#334155] truncate block">{field.soil_type || 'Alluvial'}</span>
                  </div>
                  <div>
                    <span className="text-[#94A3B8] block">Irrigation</span>
                    <span className="font-semibold text-[#334155] truncate block">{field.irrigation_type || 'Canal'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Crop Cycles Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-sm font-bold text-[#0F172A] uppercase tracking-wider">
              Crop Cycles ({cropCycles.length})
            </h2>
            <p className="text-xs text-[#64748B]">Active and completed seasonal planting operations</p>
          </div>
          <button
            onClick={() => { setShowCropForm(true); setError(''); }}
            disabled={fields.length === 0}
            className="text-xs font-semibold text-[#143D30] hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-50"
          >
            <Plus className="w-3.5 h-3.5" /> Launch Season
          </button>
        </div>

        {cropCycles.length === 0 ? (
          <div className="bg-white rounded-xl border border-[#E5E8EB] p-8 text-center shadow-xs">
            <Leaf className="w-8 h-8 mx-auto mb-2 text-[#94A3B8]" />
            <p className="text-xs font-medium text-[#0F172A]">No crop cycles initiated yet</p>
            <p className="text-xs text-[#64748B] mt-0.5">Start your first cycle to track tasks, inputs, and harvest projections.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {cropCycles.map(cycle => (
              <div
                key={cycle.id}
                className="bg-white rounded-xl border border-[#E5E8EB] p-4 shadow-xs hover:border-[#CBD5E1] transition-all cursor-pointer group"
                onClick={() => navigate(`/crops/${cycle.id}`)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[#F0FDF4] border border-[#DCFCE7] flex items-center justify-center text-[#143D30]">
                      <Leaf className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-xs font-bold text-[#0F172A] group-hover:text-[#143D30] transition-colors">
                          {cycle.crop_name}
                        </h3>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                          cycle.status === 'ACTIVE' ? 'bg-[#F0FDF4] text-[#143D30] border border-[#DCFCE7]' :
                          cycle.status === 'COMPLETED' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                          'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {cycle.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#64748B]">
                        Variety: {cycle.variety || 'Standard'} • Season: {cycle.season}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#94A3B8] group-hover:text-[#0F172A] transition-colors" />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-3 border-t border-[#F1F5F9]">
                  <div>
                    <span className="text-[11px] text-[#94A3B8] block">Assigned Field</span>
                    <span className="font-semibold text-[#0F172A]">{cycle.field?.name || 'Assigned Plot'}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-[#94A3B8] block">Target Yield</span>
                    <span className="font-semibold text-[#0F172A] tabular-nums">{cycle.target_yield} {cycle.yield_unit}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-[#94A3B8] block">Planned Budget</span>
                    <span className="font-semibold text-[#0F172A] tabular-nums">₹{cycle.planned_budget?.toLocaleString('en-IN')}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-[#94A3B8] block">Sowing Date</span>
                    <span className="font-semibold text-[#0F172A]">{new Date(cycle.start_date).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Field Form Modal */}
      {showFieldForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in" onClick={resetFieldForm}>
          <div className="bg-white rounded-xl w-full max-w-md shadow-xl border border-[#E5E8EB] p-6 animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E8EB] mb-4">
              <h2 className="text-sm font-bold text-[#0F172A]">
                {editingField ? 'Edit Field Parcel' : 'Add New Field Parcel'}
              </h2>
              <button onClick={resetFieldForm} className="p-1 rounded text-[#94A3B8] hover:bg-[#F1F5F9]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleFieldSubmit} className="space-y-3">
              {error && <div className="p-2.5 rounded bg-red-50 text-red-700 text-xs font-medium">{error}</div>}

              <div>
                <label className="block text-xs font-semibold text-[#334155] mb-1">Field Name *</label>
                <input
                  type="text"
                  required
                  value={fieldName}
                  onChange={e => setFieldName(e.target.value)}
                  placeholder="e.g. Field Block A"
                  className="w-full px-3 py-2 rounded-lg border border-[#CBD5E1] bg-[#F8FAFC] text-xs text-[#0F172A] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#143D30]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#334155] mb-1">Area *</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={fieldArea}
                    onChange={e => setFieldArea(e.target.value)}
                    placeholder="5.0"
                    className="w-full px-3 py-2 rounded-lg border border-[#CBD5E1] bg-[#F8FAFC] text-xs text-[#0F172A] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#143D30]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#334155] mb-1">Unit</label>
                  <select
                    value={fieldAreaUnit}
                    onChange={e => setFieldAreaUnit(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[#CBD5E1] bg-[#F8FAFC] text-xs text-[#0F172A] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#143D30]"
                  >
                    <option value="acres">Acres</option>
                    <option value="hectares">Hectares</option>
                    <option value="bigha">Bigha</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#334155] mb-1">Soil Type</label>
                  <select
                    value={fieldSoilType}
                    onChange={e => setFieldSoilType(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[#CBD5E1] bg-[#F8FAFC] text-xs text-[#0F172A] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#143D30]"
                  >
                    <option value="Clay Loam">Clay Loam</option>
                    <option value="Alluvial Soil">Alluvial Soil</option>
                    <option value="Black Cotton Soil">Black Cotton</option>
                    <option value="Red Sandy Loam">Red Sandy Loam</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#334155] mb-1">Irrigation</label>
                  <select
                    value={fieldIrrType}
                    onChange={e => setFieldIrrType(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[#CBD5E1] bg-[#F8FAFC] text-xs text-[#0F172A] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#143D30]"
                  >
                    <option value="Canal + Drip">Canal + Drip</option>
                    <option value="Canal Lift">Canal Lift</option>
                    <option value="Borewell Flood">Borewell Flood</option>
                    <option value="Sprinkler">Sprinkler</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2.5 pt-3 border-t border-[#E5E8EB]">
                <button
                  type="button"
                  onClick={resetFieldForm}
                  className="flex-1 px-3 py-2 rounded-lg border border-[#CBD5E1] text-xs font-medium text-[#475569] hover:bg-[#F1F5F9]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-3 py-2 rounded-lg bg-[#143D30] hover:bg-[#1A4D3E] text-white text-xs font-semibold shadow-xs"
                >
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin mx-auto" /> : (editingField ? 'Save Changes' : 'Create Field')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Crop Cycle Modal */}
      {showCropForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in" onClick={() => setShowCropForm(false)}>
          <div className="bg-white rounded-xl w-full max-w-lg shadow-xl border border-[#E5E8EB] p-6 max-h-[90vh] overflow-y-auto animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E8EB] mb-4">
              <h2 className="text-sm font-bold text-[#0F172A]">Launch New Crop Cycle</h2>
              <button onClick={() => setShowCropForm(false)} className="p-1 rounded text-[#94A3B8] hover:bg-[#F1F5F9]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCropSubmit} className="space-y-3">
              {error && <div className="p-2.5 rounded bg-red-50 text-red-700 text-xs font-medium">{error}</div>}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#334155] mb-1">Crop Name *</label>
                  <input
                    type="text"
                    required
                    value={cropName}
                    onChange={e => setCropName(e.target.value)}
                    placeholder="e.g. Paddy (Rice)"
                    className="w-full px-3 py-2 rounded-lg border border-[#CBD5E1] bg-[#F8FAFC] text-xs text-[#0F172A] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#143D30]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#334155] mb-1">Variety</label>
                  <input
                    type="text"
                    value={cropVariety}
                    onChange={e => setCropVariety(e.target.value)}
                    placeholder="e.g. BPT 5204"
                    className="w-full px-3 py-2 rounded-lg border border-[#CBD5E1] bg-[#F8FAFC] text-xs text-[#0F172A] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#143D30]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#334155] mb-1">Assigned Field *</label>
                  <select
                    value={cropFieldId}
                    onChange={e => setCropFieldId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[#CBD5E1] bg-[#F8FAFC] text-xs text-[#0F172A] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#143D30]"
                  >
                    {fields.map(f => <option key={f.id} value={f.id}>{f.name} ({f.area} {f.area_unit})</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#334155] mb-1">Season</label>
                  <select
                    value={cropSeason}
                    onChange={e => setCropSeason(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[#CBD5E1] bg-[#F8FAFC] text-xs text-[#0F172A] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#143D30]"
                  >
                    <option value="Kharif">Kharif (Monsoon)</option>
                    <option value="Rabi">Rabi (Winter)</option>
                    <option value="Zaid">Zaid (Summer)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#334155] mb-1">Sowing Date *</label>
                  <input
                    type="date"
                    required
                    value={cropStartDate}
                    onChange={e => setCropStartDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[#CBD5E1] bg-[#F8FAFC] text-xs text-[#0F172A] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#143D30]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#334155] mb-1">Expected Harvest</label>
                  <input
                    type="date"
                    value={cropHarvestDate}
                    onChange={e => setCropHarvestDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[#CBD5E1] bg-[#F8FAFC] text-xs text-[#0F172A] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#143D30]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#334155] mb-1">Target (tonnes)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={cropTargetYield}
                    onChange={e => setCropTargetYield(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[#CBD5E1] bg-[#F8FAFC] text-xs text-[#0F172A] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#143D30]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#334155] mb-1">Price/T (₹)</label>
                  <input
                    type="number"
                    value={cropSellingPrice}
                    onChange={e => setCropSellingPrice(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[#CBD5E1] bg-[#F8FAFC] text-xs text-[#0F172A] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#143D30]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#334155] mb-1">Budget (₹)</label>
                  <input
                    type="number"
                    value={cropBudget}
                    onChange={e => setCropBudget(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[#CBD5E1] bg-[#F8FAFC] text-xs text-[#0F172A] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#143D30]"
                  />
                </div>
              </div>

              <div className="flex gap-2.5 pt-3 border-t border-[#E5E8EB]">
                <button
                  type="button"
                  onClick={() => setShowCropForm(false)}
                  className="flex-1 px-3 py-2 rounded-lg border border-[#CBD5E1] text-xs font-medium text-[#475569] hover:bg-[#F1F5F9]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-3 py-2 rounded-lg bg-[#143D30] hover:bg-[#1A4D3E] text-white text-xs font-semibold shadow-xs"
                >
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin mx-auto" /> : 'Launch Cycle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
