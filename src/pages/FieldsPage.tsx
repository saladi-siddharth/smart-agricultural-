import { useState, useEffect } from 'react';
import { fieldService } from '@/services/fieldService';
import { farmService } from '@/services/farmService';
import { cropService } from '@/services/cropService';
import type { Field, Farm, CropCycle, FieldInsert } from '@/types/database';
import {
  Map, Plus, Edit2, Trash2, Droplets, Layers,
  ChevronRight, Sprout, Loader2, Sparkles
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function FieldsPage() {
  const [fields, setFields] = useState<Field[]>([]);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [crops, setCrops] = useState<CropCycle[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingField, setEditingField] = useState<Field | null>(null);

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
    try {
      if (editingField) {
        await fieldService.update(editingField.id, formData);
      } else {
        await fieldService.create(formData);
      }
      setModalOpen(false);
      loadData();
    } catch (err) {
      console.error('Failed saving field', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this field?')) return;
    try {
      await fieldService.delete(id);
      loadData();
    } catch (err) {
      console.error('Failed deleting field', err);
    }
  };

  const totalArea = fields.reduce((sum, f) => sum + Number(f.area || 0), 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[var(--color-primary-700)] uppercase tracking-wider mb-1">
            <Map className="w-3.5 h-3.5" />
            <span>Land & Plot Management</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold text-[var(--color-text-primary)]">
            Farm Fields & Parcels
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-0.5">
            Manage your land parcels, soil profiles, and irrigation infrastructure.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl gradient-primary text-white text-sm font-medium shadow-sm hover:shadow-md transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Field</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-[var(--color-border-light)] shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-[var(--color-text-secondary)]">Total Cultivated Area</p>
            <div className="w-8 h-8 rounded-lg bg-[var(--color-primary-50)] text-[var(--color-primary-700)] flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-[var(--color-text-primary)] mt-2">
            {totalArea.toFixed(1)} <span className="text-sm font-normal text-[var(--color-text-muted)]">acres</span>
          </p>
          <p className="text-xs text-[var(--color-text-secondary)] mt-1">Spread across {fields.length} active plots</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[var(--color-border-light)] shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-[var(--color-text-secondary)]">Active Crop Cycles</p>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Sprout className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-[var(--color-text-primary)] mt-2">
            {crops.filter(c => c.status === 'ACTIVE').length}
          </p>
          <p className="text-xs text-[var(--color-text-secondary)] mt-1">Planted & under cultivation</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[var(--color-border-light)] shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-[var(--color-text-secondary)]">Dominant Soil Profile</p>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <p className="text-lg font-bold text-[var(--color-text-primary)] mt-2 truncate">
            {fields[0]?.soil_type || 'Clay Loam'}
          </p>
          <p className="text-xs text-[var(--color-text-secondary)] mt-1">High water retention capacity</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[var(--color-border-light)] shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-[var(--color-text-secondary)]">Irrigation Network</p>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Droplets className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-[var(--color-text-primary)] mt-2">100%</p>
          <p className="text-xs text-[var(--color-text-secondary)] mt-1">Canal + Solar Borewell cover</p>
        </div>
      </div>

      {/* Fields Grid */}
      {loading ? (
        <div className="p-12 flex flex-col items-center justify-center bg-white rounded-2xl border border-[var(--color-border-light)]">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--color-primary-600)] mb-3" />
          <p className="text-sm text-[var(--color-text-secondary)]">Loading field parcels...</p>
        </div>
      ) : fields.length === 0 ? (
        <div className="text-center p-12 bg-white rounded-2xl border border-[var(--color-border-light)] shadow-xs">
          <Map className="w-12 h-12 text-[var(--color-text-muted)] mx-auto mb-3" />
          <h3 className="text-base font-semibold text-[var(--color-text-primary)]">No fields added yet</h3>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1 max-w-md mx-auto">
            Divide your farm into numbered plots or parcels to track soil condition, irrigation, and crop rotation.
          </p>
          <button
            onClick={openCreateModal}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl gradient-primary text-white text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            <span>Create First Field</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {fields.map(field => {
            const activeCrop = crops.find(c => c.field_id === field.id && c.status === 'ACTIVE');
            const farm = farms.find(f => f.id === field.farm_id);

            return (
              <div
                key={field.id}
                className="bg-white rounded-2xl border border-[var(--color-border-light)] p-5 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <h3 className="text-base font-bold text-[var(--color-text-primary)] leading-snug">
                        {field.name}
                      </h3>
                      <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                        {farm?.name || 'Green Valley Farm'}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(field)}
                        className="p-1.5 rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-tertiary)] hover:text-[var(--color-text-primary)]"
                        title="Edit Field"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(field.id)}
                        className="p-1.5 rounded-lg text-[var(--color-text-secondary)] hover:bg-red-50 hover:text-red-600"
                        title="Delete Field"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-[var(--color-text-secondary)] mb-4 line-clamp-2">
                    {field.description || 'Dedicated cultivation parcel with active soil management.'}
                  </p>

                  <div className="grid grid-cols-2 gap-2 text-xs py-3 border-y border-[var(--color-border-light)] mb-4">
                    <div>
                      <span className="text-[var(--color-text-muted)] block text-[11px]">Area</span>
                      <span className="font-semibold text-[var(--color-text-primary)]">
                        {field.area} {field.area_unit}
                      </span>
                    </div>
                    <div>
                      <span className="text-[var(--color-text-muted)] block text-[11px]">Soil Type</span>
                      <span className="font-semibold text-[var(--color-text-primary)] truncate block">
                        {field.soil_type || 'Alluvial'}
                      </span>
                    </div>
                    <div className="col-span-2 mt-1">
                      <span className="text-[var(--color-text-muted)] block text-[11px]">Irrigation Method</span>
                      <span className="font-medium text-[var(--color-text-secondary)] flex items-center gap-1">
                        <Droplets className="w-3 h-3 text-blue-500" />
                        {field.irrigation_type || 'Canal Supply'}
                      </span>
                    </div>
                  </div>

                  {/* Active crop badge */}
                  {activeCrop ? (
                    <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sprout className="w-4 h-4 text-emerald-600" />
                        <div>
                          <p className="text-xs font-semibold text-emerald-800">{activeCrop.crop_name}</p>
                          <p className="text-[11px] text-emerald-600">{activeCrop.variety} ({activeCrop.season})</p>
                        </div>
                      </div>
                      <Link
                        to={`/crops/${activeCrop.id}`}
                        className="text-xs font-medium text-emerald-700 hover:text-emerald-900 flex items-center gap-0.5"
                      >
                        <span>View</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  ) : (
                    <div className="p-2.5 rounded-xl bg-[var(--color-surface-tertiary)] text-center">
                      <p className="text-xs text-[var(--color-text-muted)]">Currently Fallow / Preparing for next cycle</p>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 flex items-center justify-between text-xs text-[var(--color-text-muted)]">
                  <span>Created: {new Date(field.created_at).toLocaleDateString()}</span>
                  <span className="inline-flex items-center gap-1 text-[var(--color-primary-700)] font-medium">
                    Active Plot
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-[var(--color-border-light)] animate-scale-in">
            <h2 className="text-lg font-bold text-[var(--color-text-primary)] mb-4">
              {editingField ? 'Edit Field Parcel' : 'Add New Field Parcel'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
                  Field / Parcel Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. North Plot (Parcel A)"
                  className="w-full px-3 py-2 rounded-xl border border-[var(--color-border-light)] text-sm focus:ring-2 focus:ring-[var(--color-primary-500)] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
                    Area *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={formData.area}
                    onChange={e => setFormData({ ...formData, area: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-[var(--color-border-light)] text-sm focus:ring-2 focus:ring-[var(--color-primary-500)] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
                    Unit
                  </label>
                  <select
                    value={formData.area_unit}
                    onChange={e => setFormData({ ...formData, area_unit: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-[var(--color-border-light)] text-sm focus:ring-2 focus:ring-[var(--color-primary-500)] outline-none"
                  >
                    <option value="acres">Acres</option>
                    <option value="hectares">Hectares</option>
                    <option value="bigha">Bigha</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
                    Soil Type
                  </label>
                  <select
                    value={formData.soil_type}
                    onChange={e => setFormData({ ...formData, soil_type: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-[var(--color-border-light)] text-sm focus:ring-2 focus:ring-[var(--color-primary-500)] outline-none"
                  >
                    <option value="Clay Loam">Clay Loam</option>
                    <option value="Alluvial Soil">Alluvial Soil</option>
                    <option value="Black Cotton Soil">Black Cotton Soil</option>
                    <option value="Red Sandy Loam">Red Sandy Loam</option>
                    <option value="Sandy Clay">Sandy Clay</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
                    Irrigation Type
                  </label>
                  <select
                    value={formData.irrigation_type}
                    onChange={e => setFormData({ ...formData, irrigation_type: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-[var(--color-border-light)] text-sm focus:ring-2 focus:ring-[var(--color-primary-500)] outline-none"
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
                <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
                  Description / Soil Notes
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Notes on drainage, organic matter, slope, etc."
                  className="w-full px-3 py-2 rounded-xl border border-[var(--color-border-light)] text-sm focus:ring-2 focus:ring-[var(--color-primary-500)] outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--color-border-light)]">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-tertiary)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl gradient-primary text-white text-sm font-medium shadow-sm hover:shadow-md cursor-pointer"
                >
                  {editingField ? 'Save Changes' : 'Create Field'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
