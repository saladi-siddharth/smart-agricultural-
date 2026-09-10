import { useState, useEffect } from 'react';
import { fieldService } from '@/services/fieldService';
import { farmService } from '@/services/farmService';
import { cropService } from '@/services/cropService';
import { showToast } from '@/components/common/ToastNotification';
import type { Field, Farm, CropCycle, FieldInsert } from '@/types/database';
import {
  Map, Plus, Edit2, Trash2, Droplets, Layers,
  ChevronRight, Sprout, Loader2, Sparkles, X
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function FieldsPage() {
  const [fields, setFields] = useState<Field[]>([]);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [crops, setCrops] = useState<CropCycle[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingField, setEditingField] = useState<Field | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState<FieldInsert>({
    farm_id: '',
    name: '',
    area: 1,
    area_unit: 'acres',
    soil_type: 'Clay Loam',
    irrigation_type: 'Canal + Drip',
    description: '',
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [allFields, allFarms, allCrops] = await Promise.all([
        fieldService.getAll(),
        farmService.getAll(),
        cropService.getAll(),
      ]);
      setFields(allFields);
      setFarms(allFarms);
      setCrops(allCrops);
      if (allFarms.length > 0 && !formData.farm_id) {
        setFormData(prev => ({ ...prev, farm_id: allFarms[0].id }));
      }
    } catch (err) {
      console.error('Failed loading fields', err);
      showToast.error('Failed to load fields');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreateModal = () => {
    setEditingField(null);
    setFormData({
      farm_id: farms[0]?.id || '',
      name: '',
      area: 2.5,
      area_unit: 'acres',
      soil_type: 'Alluvial Soil',
      irrigation_type: 'Canal Lift',
      description: '',
    });
    setModalOpen(true);
  };

  const openEditModal = (field: Field) => {
    setEditingField(field);
    setFormData({
      farm_id: field.farm_id,
      name: field.name,
      area: field.area,
      area_unit: field.area_unit,
      soil_type: field.soil_type,
      irrigation_type: field.irrigation_type,
      description: field.description || '',
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingField) {
        await fieldService.update(editingField.id, formData);
        showToast.success(`Field "${formData.name}" updated`);
      } else {
        await fieldService.create(formData);
        showToast.success(`Field "${formData.name}" created`);
      }
      setModalOpen(false);
      loadData();
    } catch (err) {
      console.error('Failed saving field', err);
      showToast.error('Failed to save field');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete plot "${name}"?`)) return;
    try {
      await fieldService.delete(id);
      showToast.success(`Plot "${name}" removed`);
      loadData();
    } catch (err) {
      console.error('Failed deleting field', err);
      showToast.error('Failed to delete field');
    }
  };

  const totalArea = fields.reduce((sum, f) => sum + Number(f.area || 0), 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E5E8EB]">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#143D30] uppercase tracking-wider mb-1">
            <Map className="w-3.5 h-3.5" />
            <span>Land & Plot Management</span>
          </div>
          <h1 className="text-2xl font-bold text-[#0F172A] tracking-tight">
            Farm Fields & Parcels
          </h1>
          <p className="text-xs text-[#64748B] mt-0.5">
            Manage your land parcels, soil profiles, and irrigation infrastructure.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#143D30] hover:bg-[#1A4D3E] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add New Field</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-[#E5E8EB] shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-medium text-[#64748B] uppercase tracking-wider">Cultivated Area</p>
            <div className="w-7 h-7 rounded-md bg-[#F0FDF4] text-[#143D30] flex items-center justify-center">
              <Layers className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-[#0F172A] tabular-nums mt-1">
            {totalArea.toFixed(1)} <span className="text-xs font-normal text-[#64748B]">acres</span>
          </p>
          <p className="text-[11px] text-[#64748B] mt-0.5">{fields.length} active plots</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#E5E8EB] shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-medium text-[#64748B] uppercase tracking-wider">Active Crops</p>
            <div className="w-7 h-7 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Sprout className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-[#143D30] tabular-nums mt-1">
            {crops.filter(c => c.status === 'ACTIVE').length}
          </p>
          <p className="text-[11px] text-[#64748B] mt-0.5">Planted & growing</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#E5E8EB] shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-medium text-[#64748B] uppercase tracking-wider">Soil Profile</p>
            <div className="w-7 h-7 rounded-md bg-amber-50 text-amber-600 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-base font-bold text-[#0F172A] mt-1 truncate">
            {fields[0]?.soil_type || 'Clay Loam'}
          </p>
          <p className="text-[11px] text-[#64748B] mt-0.5">High moisture hold</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#E5E8EB] shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-medium text-[#64748B] uppercase tracking-wider">Irrigation Cover</p>
            <div className="w-7 h-7 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center">
              <Droplets className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-[#0F172A] tabular-nums mt-1">100%</p>
          <p className="text-[11px] text-[#64748B] mt-0.5">Canal + Drip</p>
        </div>
      </div>

      {/* Fields Grid */}
      {loading ? (
        <div className="p-12 flex flex-col items-center justify-center bg-white rounded-xl border border-[#E5E8EB]">
          <Loader2 className="w-6 h-6 animate-spin text-[#143D30] mb-2" />
          <p className="text-xs text-[#64748B]">Loading field parcels...</p>
        </div>
      ) : fields.length === 0 ? (
        <div className="text-center p-12 bg-white rounded-xl border border-[#E5E8EB] shadow-xs">
          <Map className="w-10 h-10 text-[#94A3B8] mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-[#0F172A]">No fields configured yet</h3>
          <p className="text-xs text-[#64748B] mt-1 max-w-sm mx-auto">
            Demarcate your farm into numbered plots or sectors to track soil condition and crop rotations.
          </p>
          <button
            onClick={openCreateModal}
            className="mt-4 inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#143D30] text-white text-xs font-semibold shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create First Field</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {fields.map(field => {
            const activeCrop = crops.find(c => c.field_id === field.id && c.status === 'ACTIVE');
            const farm = farms.find(f => f.id === field.farm_id);

            return (
              <div
                key={field.id}
                className="bg-white rounded-xl border border-[#E5E8EB] p-5 shadow-xs hover:border-[#CBD5E1] transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <h3 className="text-sm font-bold text-[#0F172A] leading-snug">
                        {field.name}
                      </h3>
                      <p className="text-[11px] text-[#64748B]">
                        {farm?.name || 'Green Valley Farm'}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(field)}
                        className="p-1 rounded text-[#94A3B8] hover:text-[#0F172A] hover:bg-[#F1F5F9] transition-colors"
                        title="Edit Field"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(field.id, field.name)}
                        className="p-1 rounded text-[#94A3B8] hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Delete Field"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-[#64748B] mb-3 line-clamp-2">
                    {field.description || 'Dedicated cultivation parcel with active soil management.'}
                  </p>

                  <div className="grid grid-cols-2 gap-2 text-xs py-2.5 border-y border-[#F1F5F9] mb-3">
                    <div>
                      <span className="text-[11px] text-[#94A3B8] block">Area</span>
                      <span className="font-semibold text-[#0F172A] tabular-nums">
                        {field.area} {field.area_unit}
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] text-[#94A3B8] block">Soil Type</span>
                      <span className="font-semibold text-[#0F172A] truncate block">
                        {field.soil_type || 'Alluvial'}
                      </span>
                    </div>
                    <div className="col-span-2 pt-1">
                      <span className="text-[11px] text-[#94A3B8] block">Irrigation</span>
                      <span className="font-medium text-[#334155] flex items-center gap-1">
                        <Droplets className="w-3 h-3 text-blue-500" />
                        {field.irrigation_type || 'Canal Supply'}
                      </span>
                    </div>
                  </div>

                  {/* Active crop badge */}
                  {activeCrop ? (
                    <div className="p-2.5 rounded-lg bg-[#F0FDF4] border border-[#DCFCE7] flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sprout className="w-3.5 h-3.5 text-[#143D30]" />
                        <div>
                          <p className="text-xs font-bold text-[#143D30]">{activeCrop.crop_name}</p>
                          <p className="text-[10px] text-[#166534]">{activeCrop.variety} ({activeCrop.season})</p>
                        </div>
                      </div>
                      <Link
                        to={`/crops/${activeCrop.id}`}
                        className="text-xs font-semibold text-[#143D30] hover:underline flex items-center gap-0.5"
                      >
                        <span>View</span>
                        <ChevronRight className="w-3 h-3" />
                      </Link>
                    </div>
                  ) : (
                    <div className="p-2 rounded-lg bg-[#F8FAFC] border border-[#F1F5F9] text-center">
                      <p className="text-[11px] text-[#94A3B8]">Currently Fallow / Ready for planting</p>
                    </div>
                  )}
                </div>

                <div className="mt-3 pt-2.5 flex items-center justify-between text-[11px] text-[#94A3B8]">
                  <span>Created {new Date(field.created_at).toLocaleDateString()}</span>
                  <span className="font-medium text-[#143D30]">Active Sector</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in" onClick={() => setModalOpen(false)}>
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl border border-[#E5E8EB] animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E8EB] mb-4">
              <h2 className="text-sm font-bold text-[#0F172A]">
                {editingField ? 'Edit Field Parcel' : 'Add New Field Parcel'}
              </h2>
              <button onClick={() => setModalOpen(false)} className="p-1 rounded text-[#94A3B8] hover:bg-[#F1F5F9]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#334155] mb-1">
                  Field / Parcel Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. North Plot (Parcel A)"
                  className="w-full px-3 py-2 rounded-lg border border-[#CBD5E1] bg-[#F8FAFC] text-xs text-[#0F172A] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#143D30]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#334155] mb-1">
                    Area *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={formData.area}
                    onChange={e => setFormData({ ...formData, area: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg border border-[#CBD5E1] bg-[#F8FAFC] text-xs text-[#0F172A] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#143D30] tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#334155] mb-1">
                    Unit
                  </label>
                  <select
                    value={formData.area_unit}
                    onChange={e => setFormData({ ...formData, area_unit: e.target.value as any })}
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
                  <label className="block text-xs font-semibold text-[#334155] mb-1">
                    Soil Type
                  </label>
                  <select
                    value={formData.soil_type}
                    onChange={e => setFormData({ ...formData, soil_type: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-[#CBD5E1] bg-[#F8FAFC] text-xs text-[#0F172A] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#143D30]"
                  >
                    <option value="Clay Loam">Clay Loam</option>
                    <option value="Alluvial Soil">Alluvial Soil</option>
                    <option value="Black Cotton Soil">Black Cotton Soil</option>
                    <option value="Red Sandy Loam">Red Sandy Loam</option>
                    <option value="Sandy Clay">Sandy Clay</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#334155] mb-1">
                    Irrigation Type
                  </label>
                  <select
                    value={formData.irrigation_type}
                    onChange={e => setFormData({ ...formData, irrigation_type: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-[#CBD5E1] bg-[#F8FAFC] text-xs text-[#0F172A] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#143D30]"
                  >
                    <option value="Canal + Drip">Canal + Drip</option>
                    <option value="Canal Lift">Canal Lift</option>
                    <option value="Borewell Flood">Borewell Flood</option>
                    <option value="Sprinkler">Sprinkler</option>
                    <option value="Rainfed">Rainfed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#334155] mb-1">
                  Description / Soil Notes
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Notes on drainage, organic matter, slope, etc."
                  className="w-full px-3 py-2 rounded-lg border border-[#CBD5E1] bg-[#F8FAFC] text-xs text-[#0F172A] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#143D30] resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#E5E8EB]">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-3 py-2 rounded-lg text-xs font-medium text-[#475569] hover:bg-[#F1F5F9]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-3.5 py-2 rounded-lg bg-[#143D30] hover:bg-[#1A4D3E] text-white text-xs font-semibold shadow-xs"
                >
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin mx-auto" /> : (editingField ? 'Save Changes' : 'Create Field')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
