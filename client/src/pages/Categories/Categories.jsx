import { useState, useEffect } from 'react';
import api from '../../utils/api';
import { Plus, Edit2, Trash2, X, Tags } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [edit, setEdit] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', color: '#6366f1', icon: '' });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const { data } = await api.get('/categories');
    setCategories(data);
  };
  useEffect(() => { load(); }, []);

  const openAdd = () => { setEdit(null); setForm({ name: '', description: '', color: '#6366f1', icon: '' }); setShowModal(true); };
  const openEdit = (c) => {
    setEdit(c);
    setForm({ name: c.name, description: c.description || '', color: c.color || '#6366f1', icon: c.icon || '' });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      if (edit) { await api.put(`/categories/${edit.id}`, form); toast.success('Category updated!'); }
      else { await api.post('/categories', form); toast.success('Category added!'); }
      setShowModal(false); load();
    } catch (err) { toast.error(err.response?.data?.error || 'Error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this category?')) return;
    try { await api.delete(`/categories/${id}`); toast.success('Deleted'); load(); }
    catch { toast.error('Error'); }
  };

  const PRESET_COLORS = ['#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#f97316', '#06b6d4'];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700 }}>Categories</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: 2 }}>{categories.length} categories</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}><Plus size={16} /> Add Category</button>
      </div>

      <div className="grid-3" style={{ gap: 12 }}>
        {categories.map(c => (
          <div key={c.id} className="card" style={{ borderLeft: `3px solid ${c.color || 'var(--accent)'}` }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10, background: `${c.color}20`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px',
                }}>
                  {c.icon || '📦'}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '14px' }}>{c.name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    {c._count?.products || 0} products
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                <button className="btn btn-secondary btn-sm btn-icon" onClick={() => openEdit(c)}><Edit2 size={13} /></button>
                <button className="btn btn-danger btn-sm btn-icon" onClick={() => handleDelete(c.id)}><Trash2 size={13} /></button>
              </div>
            </div>
            {c.description && <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: 10 }}>{c.description}</p>}
          </div>
        ))}
      </div>

      {categories.length === 0 && (
        <div className="empty-state" style={{ marginTop: 40 }}>
          <Tags size={48} />
          <h3>No categories yet</h3>
          <p>Create categories to organize your products</p>
          <button className="btn btn-primary" onClick={openAdd} style={{ marginTop: 8 }}><Plus size={16} /> Add Category</button>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal" style={{ maxWidth: 480 }}>
            <div className="modal-header">
              <h2>{edit ? 'Edit Category' : 'Add Category'}</h2>
              <button className="btn btn-secondary btn-sm btn-icon" onClick={() => setShowModal(false)}><X size={16} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="form-group">
                  <label className="form-label">Name <span>*</span></label>
                  <input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Category name" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea className="form-textarea" rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Optional description" />
                </div>
                <div className="form-group">
                  <label className="form-label">Icon (emoji)</label>
                  <input className="form-input" value={form.icon} onChange={e => setForm({ ...form, icon: e.target.value })} placeholder="e.g. 📦 🔩 ⚡" />
                </div>
                <div className="form-group">
                  <label className="form-label">Color</label>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {PRESET_COLORS.map(color => (
                      <button key={color} type="button" onClick={() => setForm({ ...form, color })}
                        style={{
                          width: 32, height: 32, borderRadius: 8, background: color, border: 'none', cursor: 'pointer',
                          outline: form.color === color ? `3px solid white` : '3px solid transparent',
                          transition: 'outline 0.1s',
                        }}
                      />
                    ))}
                    <input type="color" value={form.color} onChange={e => setForm({ ...form, color: e.target.value })}
                      style={{ width: 32, height: 32, border: 'none', borderRadius: 8, cursor: 'pointer', padding: 0 }} />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : edit ? 'Update' : 'Add Category'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
