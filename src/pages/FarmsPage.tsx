import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { farmService } from '@/services/farmService';
import type { Farm, FarmInsert } from '@/types/database';
import {
  Plus, Tractor, MapPin, Maximize, Edit3, Trash2, X,
  Loader2, ChevronRight
} from 'lucide-react';

export default function FarmsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [farms, setFarms] = useState<Farm[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingFarm, setEditingFarm] = useState<Farm | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

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
      } else {
        await farmService.create(payload);
      }
      resetForm();
      await loadFarms();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this farm? All fields, crops, and data will be removed.')) return;
    setDeleting(id);
    try {
      await farmService.delete(id);
      await loadFarms();
    } catch (err) {
      console.error(err);
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <div key={i} className="skeleton h-48 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Farms</h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-0.5">
            Manage your farming operations
          </p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl gradient-primary text-white text-sm font-medium
            shadow-sm hover:shadow-md transition-all"
        >
          <Plus className="w-4 h-4" />
          Add Farm
        </button>
      </div>

      {/* Farm Cards */}
      {farms.length === 0 ? (
        <div className="text-center py-16">
          <Tractor className="w-16 h-16 mx-auto mb-4 text-[var(--color-text-muted)]" />
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">No farms yet</h3>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1 mb-6">
            Create your first farm to begin managing operations
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl gradient-primary text-white font-medium"
          >
            <Plus className="w-4 h-4" />
            Create Your First Farm
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {farms.map((farm, i) => (
            <div
              key={farm.id}
              className="glass-card p-5 cursor-pointer group animate-slide-up"
              style={{ animationDelay: `${i * 0.05}s` }}
              onClick={() => navigate(`/farms/${farm.id}`)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-11 h-11 rounded-xl bg-[var(--color-primary-50)] flex items-center justify-center">
                  <Tractor className="w-5 h-5 text-[var(--color-primary-600)]" />
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                  <button
                    onClick={() => openEdit(farm)}
                    className="p-1.5 rounded-lg hover:bg-[var(--color-surface-tertiary)] text-[var(--color-text-muted)]"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(farm.id)}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-[var(--color-text-muted)] hover:text-red-600"
                  >
                    {deleting === farm.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
              <h3 className="text-base font-semibold text-[var(--color-text-primary)] mb-1">{farm.name}</h3>
              <div className="space-y-1 mb-3">
                {farm.location && (
                  <p className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)]">
                    <MapPin className="w-3 h-3" />
                    {[farm.location, farm.district, farm.state].filter(Boolean).join(', ')}
                  </p>
                )}
                <p className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)]">
                  <Maximize className="w-3 h-3" />
                  {farm.total_area} {farm.area_unit}
                </p>
              </div>
              <div className="flex items-center text-xs text-[var(--color-primary-600)] font-medium group-hover:text-[var(--color-primary-700)]">
                View Details <ChevronRight className="w-3 h-3 ml-1" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={resetForm}>
          <div
            className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl animate-scale-in"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-[var(--color-border-light)]">
              <h2 className="text-lg font-semibold">{editingFarm ? 'Edit Farm' : 'Create Farm'}</h2>
              <button onClick={resetForm} className="p-2 rounded-lg hover:bg-[var(--color-surface-tertiary)]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">{error}</div>
              )}

              <div>
                <label className="block text-sm font-medium mb-1.5">Farm Name *</label>
                <input
                  type="text" value={name} onChange={e => setName(e.target.value)} required
                  placeholder="e.g. Green Valley Farm"
                  className="w-full px-4 py-2.5 rounded-xl border border-[var(--color-border-light)] bg-[var(--color-surface-secondary)]
                    text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)] focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Location</label>
                  <input
                    type="text" value={location} onChange={e => setLocation(e.target.value)}
                    placeholder="Village/Town"
                    className="w-full px-4 py-2.5 rounded-xl border border-[var(--color-border-light)] bg-[var(--color-surface-secondary)]
                      text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">District</label>
                  <input
                    type="text" value={district} onChange={e => setDistrict(e.target.value)}
                    placeholder="District"
                    className="w-full px-4 py-2.5 rounded-xl border border-[var(--color-border-light)] bg-[var(--color-surface-secondary)]
                      text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)] focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">State</label>
                <input
                  type="text" value={state} onChange={e => setState(e.target.value)}
                  placeholder="e.g. Andhra Pradesh"
                  className="w-full px-4 py-2.5 rounded-xl border border-[var(--color-border-light)] bg-[var(--color-surface-secondary)]
                    text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)] focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Total Area *</label>
                  <input
                    type="number" value={totalArea} onChange={e => setTotalArea(e.target.value)}
                    placeholder="25" min="0" step="0.1"
                    className="w-full px-4 py-2.5 rounded-xl border border-[var(--color-border-light)] bg-[var(--color-surface-secondary)]
                      text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Unit</label>
                  <select
                    value={areaUnit} onChange={e => setAreaUnit(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-[var(--color-border-light)] bg-[var(--color-surface-secondary)]
                      text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)] focus:border-transparent"
                  >
                    <option value="acres">Acres</option>
                    <option value="hectares">Hectares</option>
                    <option value="bigha">Bigha</option>
                    <option value="sq_meters">Sq. Meters</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">Description</label>
                <textarea
                  value={description} onChange={e => setDescription(e.target.value)}
                  placeholder="Brief description of the farm..."
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-xl border border-[var(--color-border-light)] bg-[var(--color-surface-secondary)]
                    text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)] focus:border-transparent resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={resetForm}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-[var(--color-border-light)] text-sm font-medium
                    hover:bg-[var(--color-surface-tertiary)] transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 px-4 py-2.5 rounded-xl gradient-primary text-white text-sm font-medium
                    shadow-sm hover:shadow-md transition-all disabled:opacity-60">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : (editingFarm ? 'Update Farm' : 'Create Farm')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
