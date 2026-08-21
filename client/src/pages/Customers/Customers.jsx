import { useState, useEffect } from 'react';
import api from '../../utils/api';
import { Plus, X, Edit2, UserCheck } from 'lucide-react';
import toast from 'react-hot-toast';

const INITIAL = { name: '', company: '', phone: '', email: '', address: '', gstNumber: '', creditLimit: '0' };

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [edit, setEdit] = useState(null);
  const [form, setForm] = useState(INITIAL);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  const load = async () => {
    const { data } = await api.get('/customers', { params: { search } });
    setCustomers(data);
  };
  useEffect(() => { load(); }, [search]);

  const openAdd = () => { setEdit(null); setForm(INITIAL); setShowModal(true); };
  const openEdit = (c) => { setEdit(c); setForm({ ...INITIAL, ...c, creditLimit: String(c.creditLimit || '0') }); setShowModal(true); };

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      if (edit) { await api.put(`/customers/${edit.id}`, form); toast.success('Customer updated!'); }
      else { await api.post('/customers', form); toast.success('Customer added!'); }
      setShowModal(false); load();
    } catch (err) { toast.error(err.response?.data?.error || 'Error'); } finally { setSaving(false); }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700 }}>Customers</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>{customers.length} customers</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}><Plus size={16} /> Add Customer</button>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <div className="search-bar" style={{ flex: 1, maxWidth: 360 }}>
          <input placeholder="Search customers..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {customers.length === 0 ? (
        <div className="empty-state"><UserCheck size={48} /><h3>No customers yet</h3>
          <button className="btn btn-primary" onClick={openAdd} style={{ marginTop: 8 }}><Plus size={16} /> Add Customer</button>
        </div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead><tr><th>Name</th><th>Company</th><th>Phone</th><th>Email</th><th>GST No.</th><th>City</th><th></th></tr></thead>
            <tbody>
              {customers.map(c => (
                <tr key={c.id}>
                  <td style={{ fontWeight: 600 }}>{c.name}</td>
                  <td>{c.company || '—'}</td>
                  <td>{c.phone || '—'}</td>
                  <td style={{ fontSize: '12px' }}>{c.email || '—'}</td>
                  <td><span className="mono" style={{ fontSize: '12px' }}>{c.gstNumber || '—'}</span></td>
                  <td>—</td>
                  <td>
                    <button className="btn btn-secondary btn-sm" onClick={() => openEdit(c)}><Edit2 size={13} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h2>{edit ? 'Edit Customer' : 'Add Customer'}</h2>
              <button className="btn btn-secondary btn-sm btn-icon" onClick={() => setShowModal(false)}><X size={16} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div className="grid-2" style={{ gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label">Name <span>*</span></label>
                    <input className="form-input" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Company</label>
                    <input className="form-input" value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phone</label>
                    <input className="form-input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input type="email" className="form-input" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">GST Number</label>
                    <input className="form-input mono" value={form.gstNumber} onChange={e => setForm({ ...form, gstNumber: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Credit Limit (₹)</label>
                    <input type="number" min="0" className="form-input" value={form.creditLimit} onChange={e => setForm({ ...form, creditLimit: e.target.value })} />
                  </div>
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label">Address</label>
                    <textarea className="form-textarea" rows={2} value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : edit ? 'Update' : 'Add Customer'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
