import { useState, useEffect } from 'react';
import api from '../../utils/api';
import { formatCurrency, formatNumber, formatDate } from '../../utils/helpers';
import { Plus, X, Search, Truck } from 'lucide-react';
import toast from 'react-hot-toast';

const INITIAL_FORM = {
  name: '', company: '', contactPerson: '', phone: '', email: '',
  address: '', city: '', state: '', pincode: '', gstNumber: '', panNumber: '',
  paymentTerms: '', notes: '',
};

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [edit, setEdit] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const { data } = await api.get('/suppliers', { params: { search } });
    setSuppliers(data);
  };
  useEffect(() => { load(); }, [search]);

  const openAdd = () => { setEdit(null); setForm(INITIAL_FORM); setShowModal(true); };
  const openEdit = (s) => { setEdit(s); setForm({ ...INITIAL_FORM, ...s }); setShowModal(true); };

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      if (edit) { await api.put(`/suppliers/${edit.id}`, form); toast.success('Supplier updated!'); }
      else { await api.post('/suppliers', form); toast.success('Supplier added!'); }
      setShowModal(false); load();
    } catch (err) { toast.error(err.response?.data?.error || 'Error'); } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this supplier?')) return;
    await api.delete(`/suppliers/${id}`);
    toast.success('Deleted'); load();
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700 }}>Suppliers</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>{suppliers.length} suppliers</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}><Plus size={16} /> Add Supplier</button>
      </div>

      <div className="search-bar" style={{ marginBottom: 20, maxWidth: 360 }}>
        <Search size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
        <input placeholder="Search suppliers..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {suppliers.length === 0 ? (
        <div className="empty-state" style={{ marginTop: 40 }}>
          <Truck size={48} />
          <h3>No suppliers yet</h3>
          <button className="btn btn-primary" onClick={openAdd} style={{ marginTop: 8 }}><Plus size={16} /> Add Supplier</button>
        </div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Company</th>
                <th>Contact</th>
                <th>Phone</th>
                <th>Email</th>
                <th>GST No.</th>
                <th>City</th>
                <th>Products</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {suppliers.map(s => (
                <tr key={s.id}>
                  <td style={{ fontWeight: 600 }}>{s.name}</td>
                  <td>{s.company || '—'}</td>
                  <td>{s.contactPerson || '—'}</td>
                  <td>{s.phone || '—'}</td>
                  <td style={{ fontSize: '12px' }}>{s.email || '—'}</td>
                  <td><span className="mono" style={{ fontSize: '12px' }}>{s.gstNumber || '—'}</span></td>
                  <td>{s.city || '—'}</td>
                  <td>
                    <span className="badge badge-blue">{s._count?.products || 0}</span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => openEdit(s)}>Edit</button>
                      <button className="btn btn-danger btn-sm btn-icon" onClick={() => handleDelete(s.id)}><X size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal modal-lg">
            <div className="modal-header">
              <h2>{edit ? 'Edit Supplier' : 'Add Supplier'}</h2>
              <button className="btn btn-secondary btn-sm btn-icon" onClick={() => setShowModal(false)}><X size={16} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="grid-2" style={{ gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label">Supplier Name <span>*</span></label>
                    <input className="form-input" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Supplier name" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Company Name</label>
                    <input className="form-input" value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} placeholder="Company / firm name" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Contact Person</label>
                    <input className="form-input" value={form.contactPerson} onChange={e => setForm({ ...form, contactPerson: e.target.value })} />
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
                    <input className="form-input mono" value={form.gstNumber} onChange={e => setForm({ ...form, gstNumber: e.target.value })} placeholder="GSTIN" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">City</label>
                    <input className="form-input" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">State</label>
                    <input className="form-input" value={form.state} onChange={e => setForm({ ...form, state: e.target.value })} />
                  </div>
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label">Address</label>
                    <textarea className="form-textarea" rows={2} value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Payment Terms</label>
                    <input className="form-input" value={form.paymentTerms} onChange={e => setForm({ ...form, paymentTerms: e.target.value })} placeholder="e.g. Net 30" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">PAN Number</label>
                    <input className="form-input mono" value={form.panNumber} onChange={e => setForm({ ...form, panNumber: e.target.value })} />
                  </div>
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label">Notes</label>
                    <textarea className="form-textarea" rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : edit ? 'Update' : 'Add Supplier'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
