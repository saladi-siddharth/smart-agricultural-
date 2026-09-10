import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { farmService } from '@/services/farmService';
import { showToast } from '@/components/common/ToastNotification';
import type { Farm, FarmInsert } from '@/types/database';
import { InteractiveParcelMap, type ParcelPlot } from '@/components/farm/InteractiveParcelMap';
import {
  Plus, Tractor, MapPin, Maximize, Edit3, Trash2, X,
  Loader2, ChevronRight, Layers, Building2, Map as MapIcon,
  Grid, Droplets, Compass, CheckCircle2, ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function FarmsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [farms, setFarms] = useState<Farm[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingFarm, setEditingFarm] = useState<Farm | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'schematic' | 'grid'>('schematic');

  // Form state
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [district, setDistrict] = useState('');
  const [state, setState] = useState('');
  const [totalArea, setTotalArea] = useState('');
  const [areaUnit, setAreaUnit] = useState('acres');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadFarms = async () => {
    try {
      const data = await farmService.getAll();
      setFarms(data);
    } catch (err) {
      console.error(err);
      showToast.error('Failed to load farms');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadFarms(); }, []);

  const resetForm = () => {
    setName(''); setLocation(''); setDistrict(''); setState('');
    setTotalArea(''); setAreaUnit('acres'); setDescription('');
    setEditingFarm(null); setShowForm(false); setError('');
  };

  const openEdit = (farm: Farm) => {
    setEditingFarm(farm);
    setName(farm.name);
    setLocation(farm.location);
    setDistrict(farm.district);
    setState(farm.state);
    setTotalArea(farm.total_area.toString());
    setAreaUnit(farm.area_unit);
    setDescription(farm.description);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError('Farm name is required'); return; }
    setSaving(true); setError('');

    try {
      const payload: FarmInsert = {
        owner_id: user!.id,
        name: name.trim(),
        location: location.trim(),
        district: district.trim(),
        state: state.trim(),
        total_area: parseFloat(totalArea) || 0,
        area_unit: areaUnit as FarmInsert['area_unit'],
        description: description.trim(),
      };

      if (editingFarm) {
        await farmService.update(editingFarm.id, payload);
        showToast.success(`Estate "${name}" updated successfully`);
      } else {
        await farmService.create(payload);
        showToast.success(`Estate "${name}" registered successfully`);
      }
      resetForm();
      await loadFarms();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save farm';
      setError(msg);
      showToast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, farmName: string) => {
    if (!confirm(`Delete farm "${farmName}"? All associated fields, crops, and financial logs will be permanently removed.`)) return;
    setDeleting(id);
    try {
      await farmService.delete(id);
      showToast.success(`Estate "${farmName}" removed`);
      await loadFarms();
    } catch (err) {
      console.error(err);
      showToast.error('Failed to delete farm');
    } finally {
      setDeleting(null);
    }
  };

  const totalAcreage = farms.reduce((acc, f) => acc + (Number(f.total_area) || 0), 0);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-[#E2E8F0] animate-pulse rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-44 bg-white border border-[#E5E8EB] rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E5E8EB]">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#143D30] uppercase tracking-wider mb-1">
            <Building2 className="w-4 h-4 text-emerald-600" />
            <span>Agricultural Estates & Land Holdings</span>
          </div>
          <h1 className="text-2xl font-extrabold text-[#0F172A] tracking-tight">Farms Management</h1>
          <p className="text-xs text-[#64748B] mt-0.5">
            Configure land holdings, aerial parcel boundaries, soil chemistry, and irrigation networks
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          {/* View Mode Toggle */}
          <div className="flex items-center p-1 bg-[#F1F5F9] rounded-xl border border-[#E2E8F0]">
            <button
              onClick={() => setViewMode('schematic')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'schematic'
                  ? 'bg-white text-[#143D30] shadow-2xs'
                  : 'text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              <MapIcon className="w-3.5 h-3.5" />
              <span>Aerial Schematic</span>
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white text-[#143D30] shadow-2xs'
                  : 'text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span>Estate Dossiers</span>
            </button>
          </div>

          <button
            onClick={() => { resetForm(); setShowForm(true); }}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#143D30] hover:bg-[#1A4D3E] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Register Estate</span>
          </button>
        </div>
      </div>

      {/* Estate Metrics Ribbon */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-[#E5E8EB] shadow-2xs">
          <p className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Registered Estates</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-extrabold text-[#0F172A] tabular-nums">{farms.length}</span>
            <span className="text-xs text-[#64748B]">Operational</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#E5E8EB] shadow-2xs">
          <p className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Total Acreage Managed</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-extrabold text-[#143D30] tabular-nums">{totalAcreage.toFixed(1)}</span>
            <span className="text-xs font-semibold text-[#64748B]">Acres Under Cultivation</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#E5E8EB] shadow-2xs">
          <p className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Demarcated Parcels</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-extrabold text-[#0F172A] tabular-nums">3</span>
            <span className="text-xs text-[#64748B]">Active Field Blocks</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#E5E8EB] shadow-2xs">
          <p className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Estate Coordinates</p>
          <div className="flex items-center gap-1.5 mt-1.5">
            <Compass className="w-3.5 h-3.5 text-emerald-600" />
            <span className="text-xs font-bold text-[#0F172A] font-mono">16.1809° N, 81.1378° E</span>
          </div>
        </div>
      </div>

      {/* Aerial Schematic Map Section (When in schematic view) */}
      {viewMode === 'schematic' && (
        <div className="space-y-4">
          <InteractiveParcelMap
            onSelectPlot={(plot) => {
              if (farms.length > 0) {
                navigate(`/farms/${farms[0].id}`);
              }
            }}
          />
        </div>
      )}

      {/* Farm Cards Grid */}
      {farms.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#E5E8EB] p-12 text-center shadow-xs">
          <div className="w-12 h-12 rounded-xl bg-[#F0FDF4] text-[#143D30] flex items-center justify-center mx-auto mb-3">
            <Tractor className="w-6 h-6 text-emerald-600" />
          </div>
          <h3 className="text-sm font-bold text-[#0F172A]">No agricultural estates registered yet</h3>
          <p className="text-xs text-[#64748B] mt-1 max-w-sm mx-auto">
            Register your first agricultural property to begin tracking parcels, seasonal crops, and financial ledgers.
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-4 inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#143D30] hover:bg-[#1A4D3E] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create First Estate</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider">
              Registered Estate Dossiers ({farms.length})
            </h3>
            <span className="text-[11px] text-[#64748B]">Click any card to access Field Parcels and Crop Rotations</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {farms.map((farm) => (
              <div
                key={farm.id}
                className="bg-white rounded-2xl border border-[#E5E8EB] p-5 shadow-2xs hover:border-[#143D30] hover:shadow-md transition-all duration-200 cursor-pointer group flex flex-col justify-between"
                onClick={() => navigate(`/farms/${farm.id}`)}
              >
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-[#F0FDF4] border border-[#DCFCE7] flex items-center justify-center text-[#143D30] group-hover:bg-[#143D30] group-hover:text-white transition-colors">
                      <Tractor className="w-5 h-5" />
                    </div>
                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => openEdit(farm)}
                        className="p-1.5 rounded-lg hover:bg-[#F1F5F9] text-[#64748B] hover:text-[#0F172A] transition-colors"
                        title="Edit Estate"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(farm.id, farm.name)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-[#64748B] hover:text-red-600 transition-colors"
                        title="Delete Estate"
                      >
                        {deleting === farm.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold text-[#143D30] uppercase tracking-wider bg-[#DCFCE7] px-2 py-0.5 rounded-md">
                      Primary Estate
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  </div>

                  <h3 className="text-base font-bold text-[#0F172A] group-hover:text-[#143D30] transition-colors">
                    {farm.name}
                  </h3>

                  {farm.description && (
                    <p className="text-xs text-[#64748B] mt-1 line-clamp-2 leading-relaxed font-normal">
                      {farm.description}
                    </p>
                  )}

                  <div className="mt-4 pt-3 border-t border-[#F1F5F9] space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#64748B] flex items-center gap-1.5">
                        <Maximize className="w-3.5 h-3.5 text-[#94A3B8]" /> Total Acreage
                      </span>
                      <span className="font-bold text-[#0F172A] tabular-nums">
                        {farm.total_area} {farm.area_unit}
                      </span>
                    </div>

                    {(farm.location || farm.district || farm.state) && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[#64748B] flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-[#94A3B8]" /> Location
                        </span>
                        <span className="font-semibold text-[#334155] truncate max-w-[180px] text-right">
                          {[farm.location, farm.district, farm.state].filter(Boolean).join(', ')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[#F1F5F9] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-emerald-700 font-semibold text-[11px]">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Verified Geotag</span>
                  </div>
                  <span className="text-xs font-bold text-[#143D30] group-hover:text-[#1A4D3E] flex items-center gap-1">
                    Manage Plots <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in" onClick={resetForm}>
          <div
            className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl border border-[#E5E8EB] animate-scale-in"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E8EB]">
              <div>
                <h2 className="text-base font-bold text-[#0F172A]">
                  {editingFarm ? 'Edit Agricultural Estate' : 'Register Agricultural Estate'}
                </h2>
                <p className="text-xs text-[#64748B] mt-0.5">Specify operational boundaries, acreage, and regional territory</p>
              </div>
              <button onClick={resetForm} className="p-1.5 rounded-lg text-[#64748B] hover:bg-[#F1F5F9] transition-colors cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-semibold">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-[#334155] mb-1.5">
                  Estate / Farm Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  placeholder="e.g. Green Valley Farm"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] text-xs text-[#0F172A] placeholder-[#94A3B8] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#143D30] focus:border-[#143D30] transition-colors font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#334155] mb-1.5">Village / Locality</label>
                  <input
                    type="text"
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                    placeholder="e.g. Rampur"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] text-xs text-[#0F172A] placeholder-[#94A3B8] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#143D30] focus:border-[#143D30] transition-colors font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#334155] mb-1.5">District</label>
                  <input
                    type="text"
                    value={district}
                    onChange={e => setDistrict(e.target.value)}
                    placeholder="e.g. Guntur"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] text-xs text-[#0F172A] placeholder-[#94A3B8] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#143D30] focus:border-[#143D30] transition-colors font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#334155] mb-1.5">State</label>
                <input
                  type="text"
                  value={state}
                  onChange={e => setState(e.target.value)}
                  placeholder="e.g. Andhra Pradesh"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] text-xs text-[#0F172A] placeholder-[#94A3B8] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#143D30] focus:border-[#143D30] transition-colors font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#334155] mb-1.5">
                    Total Area <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={totalArea}
                    onChange={e => setTotalArea(e.target.value)}
                    placeholder="25"
                    min="0"
                    step="0.1"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] text-xs text-[#0F172A] placeholder-[#94A3B8] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#143D30] focus:border-[#143D30] transition-colors font-bold tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#334155] mb-1.5">Unit</label>
                  <select
                    value={areaUnit}
                    onChange={e => setAreaUnit(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] text-xs text-[#0F172A] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#143D30] focus:border-[#143D30] transition-colors font-medium cursor-pointer"
                  >
                    <option value="acres">Acres</option>
                    <option value="hectares">Hectares</option>
                    <option value="bigha">Bigha</option>
                    <option value="sq_meters">Sq. Meters</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#334155] mb-1.5">Description & Soil Profile</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Primary crop rotation types, water table, irrigation sources, top soil characteristics..."
                  rows={3}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] text-xs text-[#0F172A] placeholder-[#94A3B8] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#143D30] focus:border-[#143D30] transition-colors resize-none font-medium"
                />
              </div>

              <div className="flex gap-2.5 pt-3 border-t border-[#E5E8EB]">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 px-3.5 py-2.5 rounded-xl border border-[#CBD5E1] text-xs font-semibold text-[#475569] hover:bg-[#F1F5F9] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#143D30] hover:bg-[#1A4D3E] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-60"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : (editingFarm ? 'Save Changes' : 'Register Estate')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
