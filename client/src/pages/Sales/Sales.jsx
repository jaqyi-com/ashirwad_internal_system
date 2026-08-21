import { useState, useEffect } from 'react';
import api from '../../utils/api';
import { formatCurrency, formatDate, getStatusBadge } from '../../utils/helpers';
import { Plus, Search, X, Trash2, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Sales() {
  const [sales, setSales] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ customerId: '', notes: '', discount: '0', items: [] });
  const [saving, setSaving] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/sales', { params: { status: statusFilter || undefined } });
      setSales(data.sales); setTotal(data.total);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const loadMeta = async () => {
    const [cusRes, prodRes] = await Promise.all([api.get('/customers'), api.get('/products', { params: { limit: 500 } })]);
    setCustomers(cusRes.data);
    setProducts(prodRes.data.products);
  };

  useEffect(() => { load(); }, [statusFilter]);
  useEffect(() => { loadMeta(); }, []);

  const addItem = () => setForm(f => ({ ...f, items: [...f.items, { productId: '', quantity: 1, unitPrice: 0 }] }));
  const removeItem = (i) => setForm(f => ({ ...f, items: f.items.filter((_, idx) => idx !== i) }));
  const updateItem = (i, field, val) => {
    const items = [...form.items];
    items[i] = { ...items[i], [field]: val };
    if (field === 'productId') {
      const prod = products.find(p => p.id === val);
      if (prod) items[i].unitPrice = parseFloat(prod.price) || 0;
    }
    setForm(f => ({ ...f, items }));
  };

  const subtotal = form.items.reduce((s, it) => s + (it.quantity * it.unitPrice || 0), 0);

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      await api.post('/sales', {
        ...form,
        discount: parseFloat(form.discount) || 0,
        items: form.items.map(it => ({ ...it, quantity: parseInt(it.quantity), unitPrice: parseFloat(it.unitPrice) })),
      });
      toast.success('Sale created!');
      setShowCreate(false);
      setForm({ customerId: '', notes: '', discount: '0', items: [] });
      load();
    } catch (err) { toast.error(err.response?.data?.error || 'Error creating sale'); } finally { setSaving(false); }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700 }}>Sales Orders</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>{total} orders</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}><Plus size={16} /> New Sale</button>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {['', 'CONFIRMED', 'INVOICED', 'PAID', 'CANCELLED'].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`btn btn-sm ${statusFilter === s ? 'btn-primary' : 'btn-secondary'}`}>
            {s || 'All'}
          </button>
        ))}
      </div>

      <div className="table-wrapper">
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading...</div>
        ) : sales.length === 0 ? (
          <div className="empty-state">
            <TrendingUp size={48} />
            <h3>No sales yet</h3>
            <button className="btn btn-primary" onClick={() => setShowCreate(true)} style={{ marginTop: 8 }}>
              <Plus size={16} /> Create Sale
            </button>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Sale No.</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Total</th>
                <th>Paid</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {sales.map(s => (
                <tr key={s.id}>
                  <td><span className="mono" style={{ fontWeight: 700 }}>{s.saleNumber}</span></td>
                  <td>{s.customer?.name || <span style={{ color: 'var(--text-muted)' }}>Walk-in</span>}</td>
                  <td>{s.items?.length || 0} items</td>
                  <td style={{ fontWeight: 600 }}>{formatCurrency(s.totalAmount)}</td>
                  <td style={{ color: 'var(--green)' }}>{formatCurrency(s.paidAmount)}</td>
                  <td><span className={`badge ${getStatusBadge(s.status)}`}>{s.status}</span></td>
                  <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{formatDate(s.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create Sale Modal */}
      {showCreate && (
        <div className="modal-overlay">
          <div className="modal modal-lg">
            <div className="modal-header">
              <h2>New Sale Order</h2>
              <button className="btn btn-secondary btn-sm btn-icon" onClick={() => setShowCreate(false)}><X size={16} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="grid-2" style={{ gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label">Customer</label>
                    <select className="form-select" value={form.customerId} onChange={e => setForm({ ...form, customerId: e.target.value })}>
                      <option value="">Walk-in Customer</option>
                      {customers.map(c => <option key={c.id} value={c.id}>{c.name} {c.company ? `(${c.company})` : ''}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Discount (₹)</label>
                    <input type="number" min="0" step="0.01" className="form-input" value={form.discount} onChange={e => setForm({ ...form, discount: e.target.value })} />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <label className="form-label">Items <span>*</span></label>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={addItem}><Plus size={13} /> Add Item</button>
                  </div>
                  {form.items.length === 0 && (
                    <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)', border: '1px dashed var(--border)', borderRadius: 8 }}>
                      Add products to sell
                    </div>
                  )}
                  {form.items.map((item, i) => (
                    <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'flex-end' }}>
                      <div className="form-group" style={{ flex: 2 }}>
                        {i === 0 && <label className="form-label">Product</label>}
                        <select className="form-select" value={item.productId} onChange={e => updateItem(i, 'productId', e.target.value)} required>
                          <option value="">Select Product</option>
                          {products.map(p => (
                            <option key={p.id} value={p.id}>
                              {p.name} — Stock: {p.currentStock} {p.unit}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="form-group" style={{ width: 90 }}>
                        {i === 0 && <label className="form-label">Qty</label>}
                        <input type="number" min="1" className="form-input" value={item.quantity} onChange={e => updateItem(i, 'quantity', e.target.value)} required />
                      </div>
                      <div className="form-group" style={{ width: 110 }}>
                        {i === 0 && <label className="form-label">Unit Price</label>}
                        <input type="number" min="0" step="0.01" className="form-input" value={item.unitPrice} onChange={e => updateItem(i, 'unitPrice', e.target.value)} />
                      </div>
                      <div style={{ paddingBottom: 1 }}>
                        <button type="button" className="btn btn-danger btn-sm btn-icon" onClick={() => removeItem(i)}><Trash2 size={13} /></button>
                      </div>
                    </div>
                  ))}
                  {form.items.length > 0 && (
                    <div style={{ textAlign: 'right', marginTop: 8, fontWeight: 600 }}>
                      Subtotal: {formatCurrency(subtotal)}
                      {parseFloat(form.discount) > 0 && (
                        <span style={{ color: 'var(--green)', marginLeft: 12 }}>— {formatCurrency(form.discount)} discount</span>
                      )}
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Notes</label>
                  <textarea className="form-textarea" rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving || form.items.length === 0}>
                  {saving ? 'Creating...' : 'Confirm Sale'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
