import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { farmService } from '@/services/farmService';
import { fieldService } from '@/services/fieldService';
import { cropService } from '@/services/cropService';
import { useAuth } from '@/hooks/useAuth';
import type { Farm, Field, FieldInsert, CropCycle, CropCycleInsert } from '@/types/database';
import {
  ArrowLeft, MapPin, Maximize, Plus, Map, Leaf, Edit3,
  Trash2, X, Loader2, Calendar, Target, Wallet, ChevronRight
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
  const [fieldSoilType, setFieldSoilType] = useState('');
  const [fieldIrrType, setFieldIrrType] = useState('');

  // Crop form
  const [cropName, setCropName] = useState('');
  const [cropVariety, setCropVariety] = useState('');
  const [cropSeason, setCropSeason] = useState('Kharif');
  const [cropFieldId, setCropFieldId] = useState('');
  const [cropStartDate, setCropStartDate] = useState('');
  const [cropHarvestDate, setCropHarvestDate] = useState('');
  const [cropTargetYield, setCropTargetYield] = useState('');
  const [cropYieldUnit, setCropYieldUnit] = useState('tonnes');
  const [cropSellingPrice, setCropSellingPrice] = useState('');
  const [cropBudget, setCropBudget] = useState('');

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
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [id]);

  const resetFieldForm = () => {
    setFieldName(''); setFieldArea(''); setFieldAreaUnit('acres');
    setFieldSoilType(''); setFieldIrrType('');
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
      } else {
        await fieldService.create(payload);
      }
      resetFieldForm();
      await loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
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
      setShowCropForm(false);
      setCropName(''); setCropVariety(''); setCropSeason('Kharif');
      setCropFieldId(''); setCropStartDate(''); setCropHarvestDate('');
      setCropTargetYield(''); setCropYieldUnit('tonnes'); setCropSellingPrice(''); setCropBudget('');
      await loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-8 w-64" />
        <div className="skeleton h-32 rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map(i => <div key={i} className="skeleton h-40 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  if (!farm) {
    return <div className="text-center py-16 text-[var(--color-text-muted)]">Farm not found</div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/farms')} className="p-2 rounded-lg hover:bg-[var(--color-surface-tertiary)]">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">{farm.name}</h1>
          <p className="text-sm text-[var(--color-text-muted)]">
            {[farm.location, farm.district, farm.state].filter(Boolean).join(', ')} · {farm.total_area} {farm.area_unit}
          </p>
        </div>
      </div>

      {/* Fields Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Fields ({fields.length})</h2>
          <button onClick={() => { resetFieldForm(); setShowFieldForm(true); }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium
              bg-[var(--color-primary-50)] text-[var(--color-primary-700)] hover:bg-[var(--color-primary-100)] transition-colors">
            <Plus className="w-4 h-4" /> Add Field
          </button>
        </div>

        {fields.length === 0 ? (
          <div className="glass-card p-8 text-center">
            <Map className="w-12 h-12 mx-auto mb-3 text-[var(--color-text-muted)]" />
            <p className="text-sm text-[var(--color-text-secondary)]">No fields yet. Add your first field to start managing crops.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {fields.map(field => (
              <div key={field.id} className="glass-card p-4 group">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Map className="w-4 h-4 text-[var(--color-primary-600)]" />
                    <h3 className="text-sm font-semibold">{field.name}</h3>
                  </div>
                  <button
                    onClick={() => fieldService.delete(field.id).then(loadData)}
                    className="p-1 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-50 text-[var(--color-text-muted)] hover:text-red-600 transition-all"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
                <p className="text-xs text-[var(--color-text-muted)]">{field.area} {field.area_unit}</p>
                {field.soil_type && <p className="text-xs text-[var(--color-text-muted)]">Soil: {field.soil_type}</p>}
                {field.irrigation_type && <p className="text-xs text-[var(--color-text-muted)]">Irrigation: {field.irrigation_type}</p>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Crop Cycles Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Crop Cycles ({cropCycles.length})</h2>
          <button onClick={() => { setShowCropForm(true); setError(''); }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium
              bg-[var(--color-primary-50)] text-[var(--color-primary-700)] hover:bg-[var(--color-primary-100)] transition-colors"
            disabled={fields.length === 0}>
            <Plus className="w-4 h-4" /> New Crop Cycle
          </button>
        </div>

        {cropCycles.length === 0 ? (
          <div className="glass-card p-8 text-center">
            <Leaf className="w-12 h-12 mx-auto mb-3 text-[var(--color-text-muted)]" />
            <p className="text-sm text-[var(--color-text-secondary)]">No crop cycles. Create a field first, then start a crop cycle.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {cropCycles.map(cycle => (
              <div key={cycle.id}
                className="glass-card p-5 cursor-pointer hover:shadow-md transition-all"
                onClick={() => navigate(`/crops/${cycle.id}`)}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Leaf className="w-5 h-5 text-[var(--color-primary-600)]" />
                    <h3 className="font-semibold">{cycle.crop_name}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      cycle.status === 'ACTIVE' ? 'status-in-progress' :
                      cycle.status === 'COMPLETED' ? 'status-completed' :
                      'status-pending'
                    }`}>{cycle.status}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[var(--color-text-muted)]" />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div>
                    <p className="text-[var(--color-text-muted)]">Season</p>
                    <p className="font-medium">{cycle.season}</p>
                  </div>
                  <div>
                    <p className="text-[var(--color-text-muted)]">Field</p>
                    <p className="font-medium">{cycle.field?.name || '-'}</p>
                  </div>
                  <div>
                    <p className="text-[var(--color-text-muted)]">Target Yield</p>
                    <p className="font-medium">{cycle.target_yield} {cycle.yield_unit}</p>
                  </div>
                  <div>
                    <p className="text-[var(--color-text-muted)]">Budget</p>
                    <p className="font-medium">₹{cycle.planned_budget?.toLocaleString('en-IN')}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Field Form Modal */}
      {showFieldForm && (
        <Modal title={editingField ? 'Edit Field' : 'Add Field'} onClose={resetFieldForm}>
          <form onSubmit={handleFieldSubmit} className="space-y-4">
            {error && <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">{error}</div>}
            <FormInput label="Field Name *" value={fieldName} onChange={setFieldName} placeholder="e.g. Field A" />
            <div className="grid grid-cols-2 gap-3">
              <FormInput label="Area" value={fieldArea} onChange={setFieldArea} type="number" placeholder="10" />
              <FormSelect label="Unit" value={fieldAreaUnit} onChange={setFieldAreaUnit}
                options={[['acres','Acres'],['hectares','Hectares'],['bigha','Bigha']]} />
            </div>
            <FormInput label="Soil Type" value={fieldSoilType} onChange={setFieldSoilType} placeholder="e.g. Black Cotton, Alluvial" />
            <FormInput label="Irrigation Type" value={fieldIrrType} onChange={setFieldIrrType} placeholder="e.g. Canal, Borewell" />
            <FormButtons saving={saving} onCancel={resetFieldForm} label={editingField ? 'Update Field' : 'Add Field'} />
          </form>
        </Modal>
      )}

      {/* Crop Form Modal */}
      {showCropForm && (
        <Modal title="New Crop Cycle" onClose={() => setShowCropForm(false)}>
          <form onSubmit={handleCropSubmit} className="space-y-4">
            {error && <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">{error}</div>}
            <div className="grid grid-cols-2 gap-3">
              <FormInput label="Crop Name *" value={cropName} onChange={setCropName} placeholder="e.g. Paddy" />
              <FormInput label="Variety" value={cropVariety} onChange={setCropVariety} placeholder="e.g. BPT-5204" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <FormSelect label="Field *" value={cropFieldId} onChange={setCropFieldId}
                options={fields.map(f => [f.id, f.name])} placeholder="Select field" />
              <FormSelect label="Season" value={cropSeason} onChange={setCropSeason}
                options={[['Kharif','Kharif'],['Rabi','Rabi'],['Zaid','Zaid'],['Annual','Annual']]} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <FormInput label="Start Date *" value={cropStartDate} onChange={setCropStartDate} type="date" />
              <FormInput label="Expected Harvest" value={cropHarvestDate} onChange={setCropHarvestDate} type="date" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <FormInput label="Target Yield" value={cropTargetYield} onChange={setCropTargetYield} type="number" placeholder="4.2" />
              <FormSelect label="Unit" value={cropYieldUnit} onChange={setCropYieldUnit}
                options={[['tonnes','Tonnes'],['quintals','Quintals'],['kg','Kg']]} />
              <FormInput label="Price/Unit (₹)" value={cropSellingPrice} onChange={setCropSellingPrice} type="number" placeholder="29500" />
            </div>
            <FormInput label="Planned Budget (₹)" value={cropBudget} onChange={setCropBudget} type="number" placeholder="55000" />
            <FormButtons saving={saving} onCancel={() => setShowCropForm(false)} label="Create Crop Cycle" />
          </form>
        </Modal>
      )}
    </div>
  );
}

// ============================================
// REUSABLE FORM COMPONENTS
// ============================================
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl animate-scale-in" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-[var(--color-border-light)]">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-[var(--color-surface-tertiary)]"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

function FormInput({ label, value, onChange, type = 'text', placeholder, min, step }: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; placeholder?: string; min?: string; step?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1.5">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} min={min} step={step}
        className="w-full px-4 py-2.5 rounded-xl border border-[var(--color-border-light)] bg-[var(--color-surface-secondary)]
          text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)] focus:border-transparent" />
    </div>
  );
}

function FormSelect({ label, value, onChange, options, placeholder }: {
  label: string; value: string; onChange: (v: string) => void;
  options: string[][]; placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1.5">{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)}
        className="w-full px-4 py-2.5 rounded-xl border border-[var(--color-border-light)] bg-[var(--color-surface-secondary)]
          text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)] focus:border-transparent">
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(([val, lbl]) => <option key={val} value={val}>{lbl}</option>)}
      </select>
    </div>
  );
}

function FormButtons({ saving, onCancel, label }: { saving: boolean; onCancel: () => void; label: string }) {
  return (
    <div className="flex gap-3 pt-2">
      <button type="button" onClick={onCancel}
        className="flex-1 px-4 py-2.5 rounded-xl border border-[var(--color-border-light)] text-sm font-medium
          hover:bg-[var(--color-surface-tertiary)] transition-colors">Cancel</button>
      <button type="submit" disabled={saving}
        className="flex-1 px-4 py-2.5 rounded-xl gradient-primary text-white text-sm font-medium
          shadow-sm hover:shadow-md transition-all disabled:opacity-60">
        {saving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : label}
      </button>
    </div>
  );
}
