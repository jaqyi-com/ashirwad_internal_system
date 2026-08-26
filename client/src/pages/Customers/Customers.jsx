import { useState, useEffect } from 'react';
import api from '../../utils/api';
import { formatCurrency, formatDate } from '../../utils/helpers';
import { Plus, X, Edit2, Trash2, UserCheck, Search, Phone, Mail, MapPin, Building2, Hash, CreditCard, ShoppingBag, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

const INITIAL = {
  name: '', company: '', contactPerson: '', phone: '', email: '',
  city: '', state: '', address: '', gstNumber: '', panNumber: '',
  paymentTerms: '', creditLimit: '0', notes: '',
};

export default function Customers() {
  const [customers, setCustomers]     = useState([]);
  const [showModal, setShowModal]     = useState(false);
  const [detail, setDetail]           = useState(null);
  const [edit, setEdit]               = useState(null);
  const [form, setForm]               = useState(INITIAL);
  const [saving, setSaving]           = useState(false);
  const [search, setSearch]           = useState('');

  const load = async () => {
    const { data } = await api.get('/customers', { params: { search } });
    setCustomers(data);
  };
  useEffect(() => { load(); }, [search]);

  const openAdd  = () => { setEdit(null); setForm(INITIAL); setShowModal(true); };
  const openEdit = (c) => {
    setDetail(null);
    setEdit(c);
    setForm({ ...INITIAL, ...c, creditLimit: String(c.creditLimit || '0') });
    setShowModal(true);
  };

  const handleDelete = async (c) => {
    if (!confirm(`Delete customer "${c.name}"?`)) return;
    try {
      await api.delete(`/customers/${c.id}`);
      toast.success('Customer deleted');
      setDetail(null);
      load();
    } catch { toast.error('Error deleting customer'); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      if (edit) { await api.put(`/customers/${edit.id}`, form); toast.success('Customer updated!'); }
      else       { await api.post('/customers', form);           toast.success('Customer added!');   }
      setShowModal(false); load();
    } catch (err) { toast.error(err.response?.data?.error || 'Error'); }
    finally { setSaving(false); }
  };

  const F = ({ label, value }) => value ? (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
      <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
      <span style={{ fontWeight: 500, textAlign: 'right', maxWidth: '60%' }}>{value}</span>
    </div>
  ) : null;

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700 }}>Customers</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>{customers.length} customers</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}><Plus size={16} /> Add Customer</button>
      </div>

      {/* Search */}
      <div className="search-bar" style={{ maxWidth: 380, marginBottom: 20 }}>
        <Search size={15} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
        <input placeholder="Search by name, company, email, phone..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Table */}
      {customers.length === 0 ? (
        <div className="empty-state">
          <UserCheck size={48} />
          <h3>No customers yet</h3>
          <button className="btn btn-primary" onClick={openAdd} style={{ marginTop: 8 }}><Plus size={16} /> Add Customer</button>
        </div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Customer</th>
                <th className="hide-mobile">Contact Person</th>
                <th className="hide-mobile">Phone</th>
                <th className="hide-tablet">Email</th>
                <th className="hide-tablet">City</th>
                <th className="hide-mobile">GST No.</th>
                <th>Orders</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {customers.map(c => (
                <tr key={c.id} style={{ cursor: 'pointer' }} onClick={() => setDetail(c)}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{c.name}</div>
                    {c.company && <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{c.company}</div>}
                  </td>
                  <td className="hide-mobile">{c.contactPerson || '—'}</td>
                  <td className="hide-mobile">{c.phone || '—'}</td>
                  <td className="hide-tablet" style={{ fontSize: '12px' }}>{c.email || '—'}</td>
                  <td className="hide-tablet">{c.city ? `${c.city}${c.state ? `, ${c.state}` : ''}` : '—'}</td>
                  <td className="hide-mobile"><span className="mono" style={{ fontSize: '12px' }}>{c.gstNumber || '—'}</span></td>
                  <td><span className="badge badge-blue">{c._count?.sales ?? 0} orders</span></td>
                  <td onClick={e => e.stopPropagation()}>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="btn btn-secondary btn-sm btn-icon" onClick={() => openEdit(c)} title="Edit"><Edit2 size={13} /></button>
                      <button className="btn btn-danger btn-sm btn-icon" onClick={() => handleDelete(c)} title="Delete"><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Detail Panel ── */}
      {detail && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setDetail(null)}>
          <div className="modal modal-lg">
            <div className="modal-header">
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 700 }}>{detail.name}</h2>
                {detail.company && <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: 2 }}>{detail.company}</div>}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-primary btn-sm" onClick={() => openEdit(detail)}><Edit2 size={13} /> Edit</button>
                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(detail)}><Trash2 size={13} /> Delete</button>
                <button className="btn btn-secondary btn-sm btn-icon" onClick={() => setDetail(null)}><X size={16} /></button>
              </div>
            </div>

            <div className="modal-body">
              {/* Quick stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
                {[
                  { label: 'Total Orders', value: detail._count?.sales ?? 0, color: 'var(--accent)' },
                  { label: 'Credit Limit', value: formatCurrency(detail.creditLimit), color: 'var(--green)' },
                  { label: 'Outstanding', value: formatCurrency(detail.outstandingAmt), color: 'var(--red)' },
                ].map(s => (
                  <div key={s.label} style={{ background: 'var(--bg-secondary)', borderRadius: 10, padding: '14px', border: '1px solid var(--border)', textAlign: 'center' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: 4 }}>{s.label}</div>
                    <div style={{ fontSize: '18px', fontWeight: 700, color: s.color }}>{s.value}</div>
                  </div>
                ))}
              </div>

              <div className="grid-2" style={{ gap: 20 }}>
                {/* Contact Info */}
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 8 }}>Contact Information</div>
                  <F label="Contact Person" value={detail.contactPerson} />
                  <F label="Phone"          value={detail.phone} />
                  <F label="Email"          value={detail.email} />
                  <F label="City"           value={detail.city} />
                  <F label="State"          value={detail.state} />
                  <F label="Address"        value={detail.address} />
                </div>

                {/* Business Info */}
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 8 }}>Business Details</div>
                  <F label="GST Number"    value={detail.gstNumber} />
                  <F label="PAN Number"    value={detail.panNumber} />
                  <F label="Payment Terms" value={detail.paymentTerms} />
                  <F label="Added"         value={formatDate(detail.createdAt)} />
                  {detail.notes && (
                    <div style={{ marginTop: 12, background: 'var(--bg-secondary)', borderRadius: 8, padding: 12, border: '1px solid var(--border)' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: 4 }}>Notes</div>
                      <div style={{ fontSize: '13px', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>{detail.notes}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Add / Edit Modal ── */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal modal-lg">
            <div className="modal-header">
              <h2>{edit ? 'Edit Customer' : 'Add Customer'}</h2>
              <button className="btn btn-secondary btn-sm btn-icon" onClick={() => setShowModal(false)}><X size={16} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                {/* Basic */}
                <Section title="Basic Information">
                  <div className="grid-2" style={{ gap: 12 }}>
                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                      <label className="form-label">Customer Name <span>*</span></label>
                      <input className="form-input" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Full name" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Company / Firm</label>
                      <input className="form-input" value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} placeholder="Company name" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Contact Person</label>
                      <input className="form-input" value={form.contactPerson} onChange={e => setForm({ ...form, contactPerson: e.target.value })} placeholder="Primary contact" />
                    </div>
                  </div>
                </Section>

                {/* Contact */}
                <Section title="Contact Details">
                  <div className="grid-2" style={{ gap: 12 }}>
                    <div className="form-group">
                      <label className="form-label">Phone</label>
                      <input className="form-input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+91-XXXXXXXXXX" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Email</label>
                      <input type="email" className="form-input" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
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
                  </div>
                </Section>

                {/* Business */}
                <Section title="Business Details">
                  <div className="grid-2" style={{ gap: 12 }}>
                    <div className="form-group">
                      <label className="form-label">GST Number</label>
                      <input className="form-input mono" value={form.gstNumber} onChange={e => setForm({ ...form, gstNumber: e.target.value })} placeholder="22AAAAA0000A1Z5" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">PAN Number</label>
                      <input className="form-input mono" value={form.panNumber} onChange={e => setForm({ ...form, panNumber: e.target.value })} placeholder="AAAAA0000A" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Payment Terms</label>
                      <input className="form-input" value={form.paymentTerms} onChange={e => setForm({ ...form, paymentTerms: e.target.value })} placeholder="e.g. 30 Days, COD" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Credit Limit (₹)</label>
                      <input type="number" min="0" className="form-input" value={form.creditLimit} onChange={e => setForm({ ...form, creditLimit: e.target.value })} />
                    </div>
                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                      <label className="form-label">Notes</label>
                      <textarea className="form-textarea" rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
                    </div>
                  </div>
                </Section>

              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : edit ? 'Update Customer' : 'Add Customer'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div>
      <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{title}</div>
      {children}
    </div>
  );
}
