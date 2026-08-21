import { useState, useEffect } from 'react';
import api from '../utils/api';
import { Settings as SettingsIcon, Plus, X, Edit2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Settings() {
  const [coatings, setCoatings] = useState([]);
  const [newCoating, setNewCoating] = useState('');
  const [saving, setSaving] = useState(false);

  const loadCoatings = async () => {
    const { data } = await api.get('/coatings');
    setCoatings(data);
  };

  useEffect(() => { loadCoatings(); }, []);

  const addCoating = async (e) => {
    e.preventDefault();
    if (!newCoating.trim()) return;
    setSaving(true);
    try {
      await api.post('/coatings', { name: newCoating });
      toast.success('Coating type added!');
      setNewCoating('');
      loadCoatings();
    } catch (err) { toast.error(err.response?.data?.error || 'Error'); } finally { setSaving(false); }
  };

  const deleteCoating = async (id) => {
    await api.delete(`/coatings/${id}`);
    toast.success('Deleted');
    loadCoatings();
  };

  return (
    <div style={{ maxWidth: 640 }}>
      <div className="page-header">
        <h1 style={{ fontSize: '22px', fontWeight: 700 }}>Settings</h1>
      </div>

      {/* Coating Types */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ fontWeight: 700, fontSize: '15px', marginBottom: 4 }}>Coating Types</div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: 16 }}>
          Manage available coating options for products
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
          {coatings.map(c => (
            <span key={c.id} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 12px', background: 'var(--bg-secondary)',
              border: '1px solid var(--border)', borderRadius: 99, fontSize: '13px',
            }}>
              {c.name}
              <button onClick={() => deleteCoating(c.id)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: 0 }}>
                <X size={13} />
              </button>
            </span>
          ))}
        </div>

        <form onSubmit={addCoating} style={{ display: 'flex', gap: 8 }}>
          <input
            className="form-input"
            placeholder="New coating type name..."
            value={newCoating}
            onChange={e => setNewCoating(e.target.value)}
            style={{ flex: 1 }}
          />
          <button type="submit" className="btn btn-primary" disabled={saving}>
            <Plus size={15} /> Add
          </button>
        </form>
      </div>

      {/* System Info */}
      <div className="card">
        <div style={{ fontWeight: 700, fontSize: '15px', marginBottom: 12 }}>System Information</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            ['Application', 'Ashirwad IMS'],
            ['Version', '1.0.0'],
            ['Company', 'Ashirwad Enterprises'],
            ['Currency', '₹ Indian Rupee (INR)'],
            ['Tax System', 'GST (India)'],
          ].map(([label, value]) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>{label}</span>
              <span style={{ fontWeight: 600, fontSize: '13px' }}>{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
