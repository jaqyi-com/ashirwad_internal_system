import { useState, useEffect } from 'react';
import api from '../../utils/api';
import { formatCurrency, formatDate, formatDateTime, getStatusBadge } from '../../utils/helpers';
import { Plus, Search, Eye, X, Trash2, CheckCircle, Package } from 'lucide-react';
import toast from 'react-hot-toast';

const INITIAL_FORM = { supplierId: '', notes: '', expectedDate: '', items: [] };

export default function Purchases() {
  const [orders, setOrders] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [viewOrder, setViewOrder] = useState(null);
  const [showReceive, setShowReceive] = useState(false);
  const [receiveOrder, setReceiveOrder] = useState(null);
  const [receivedQtys, setReceivedQtys] = useState({});
  const [form, setForm] = useState(INITIAL_FORM);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/purchases', { params: { status: statusFilter || undefined } });
      setOrders(data.orders); setTotal(data.total);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const loadMeta = async () => {
    const [supRes, prodRes] = await Promise.all([api.get('/suppliers'), api.get('/products', { params: { limit: 500 } })]);
    setSuppliers(supRes.data);
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
      if (prod) items[i].unitPrice = parseFloat(prod.purchasePrice) || 0;
    }
    setForm(f => ({ ...f, items }));
  };

  const subtotal = form.items.reduce((s, it) => s + (it.quantity * it.unitPrice || 0), 0);

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      await api.post('/purchases', { ...form, items: form.items.map(it => ({ ...it, quantity: parseInt(it.quantity), unitPrice: parseFloat(it.unitPrice) })) });
      toast.success('Purchase order created!');
      setShowCreate(false);
      setForm(INITIAL_FORM);
      load();
    } catch (err) { toast.error(err.response?.data?.error || 'Error'); } finally { setSaving(false); }
  };

  const openReceive = (order) => {
    setReceiveOrder(order);
    const qtys = {};
    order.items.forEach(it => { qtys[it.id] = it.orderedQty - it.receivedQty; });
    setReceivedQtys(qtys);
    setShowReceive(true);
  };

  const handleReceive = async () => {
    setSaving(true);
    try {
      const receivedItems = receiveOrder.items
        .filter(it => receivedQtys[it.id] > 0)
        .map(it => ({ purchaseOrderItemId: it.id, productId: it.productId, receivedQty: parseInt(receivedQtys[it.id]) }));
      await api.post(`/purchases/${receiveOrder.id}/receive`, { receivedItems });
      toast.success('Goods received!');
      setShowReceive(false);
      load();
    } catch (err) { toast.error(err.response?.data?.error || 'Error'); } finally { setSaving(false); }
  };

  const handleCancel = async (id) => {
    if (!confirm('Cancel this order?')) return;
    await api.delete(`/purchases/${id}`);
    toast.success('Order cancelled');
    load();
  };

  const statuses = ['DRAFT', 'PENDING', 'APPROVED', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CANCELLED'];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700 }}>Purchase Orders</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>{total} orders</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}><Plus size={16} /> Create PO</button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {['', ...statuses].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`btn btn-sm ${statusFilter === s ? 'btn-primary' : 'btn-secondary'}`}>
            {s || 'All'}
          </button>
        ))}
      </div>

      <div className="table-wrapper">
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading...</div>
        ) : orders.length === 0 ? (
          <div className="empty-state">
            <Package size={48} />
            <h3>No purchase orders</h3>
            <button className="btn btn-primary" onClick={() => setShowCreate(true)} style={{ marginTop: 8 }}>
              <Plus size={16} /> Create PO
            </button>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>PO Number</th>
                <th>Supplier</th>
                <th>Items</th>
                <th>Total</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(o => (
                <tr key={o.id}>
                  <td><span className="mono" style={{ fontWeight: 700 }}>{o.poNumber}</span></td>
                  <td>{o.supplier?.name || '—'}</td>
                  <td>{o.items?.length || 0} items</td>
                  <td style={{ fontWeight: 600 }}>{formatCurrency(o.totalAmount)}</td>
                  <td><span className={`badge ${getStatusBadge(o.status)}`}>{o.status?.replace('_', ' ')}</span></td>
                  <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{formatDate(o.createdAt)}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => setViewOrder(o)}>
                        <Eye size={13} /> View
                      </button>
                      {(o.status === 'APPROVED' || o.status === 'PARTIALLY_RECEIVED') && (
                        <button className="btn btn-success btn-sm" onClick={() => openReceive(o)}>
                          <CheckCircle size={13} /> Receive
                        </button>
                      )}
                      {o.status === 'DRAFT' && (
                        <button className="btn btn-danger btn-sm btn-icon" onClick={() => handleCancel(o.id)}>
                          <X size={13} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create PO Modal */}
      {showCreate && (
        <div className="modal-overlay">
          <div className="modal modal-lg">
            <div className="modal-header">
              <h2>Create Purchase Order</h2>
              <button className="btn btn-secondary btn-sm btn-icon" onClick={() => setShowCreate(false)}><X size={16} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="grid-2" style={{ gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label">Supplier <span>*</span></label>
                    <select className="form-select" required value={form.supplierId} onChange={e => setForm({ ...form, supplierId: e.target.value })}>
                      <option value="">Select Supplier</option>
                      {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Expected Delivery</label>
                    <input type="date" className="form-input" value={form.expectedDate} onChange={e => setForm({ ...form, expectedDate: e.target.value })} />
                  </div>
                </div>

                {/* Items */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <label className="form-label">Items</label>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={addItem}><Plus size={13} /> Add Item</button>
                  </div>
                  {form.items.length === 0 && (
                    <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)', border: '1px dashed var(--border)', borderRadius: 8 }}>
                      No items yet. Add items to this purchase order.
                    </div>
                  )}
                  {form.items.map((item, i) => (
                    <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'flex-end' }}>
                      <div className="form-group" style={{ flex: 2 }}>
                        {i === 0 && <label className="form-label">Product</label>}
                        <select className="form-select" value={item.productId} onChange={e => updateItem(i, 'productId', e.target.value)} required>
                          <option value="">Select Product</option>
                          {products.map(p => <option key={p.id} value={p.id}>{p.name} {p.sku ? `(${p.sku})` : ''}</option>)}
                        </select>
                      </div>
                      <div className="form-group" style={{ width: 100 }}>
                        {i === 0 && <label className="form-label">Qty</label>}
                        <input type="number" min="1" className="form-input" value={item.quantity} onChange={e => updateItem(i, 'quantity', e.target.value)} required />
                      </div>
                      <div className="form-group" style={{ width: 120 }}>
                        {i === 0 && <label className="form-label">Unit Price (₹)</label>}
                        <input type="number" min="0" step="0.01" className="form-input" value={item.unitPrice} onChange={e => updateItem(i, 'unitPrice', e.target.value)} required />
                      </div>
                      <div style={{ paddingBottom: 1 }}>
                        <button type="button" className="btn btn-danger btn-sm btn-icon" onClick={() => removeItem(i)}><Trash2 size={13} /></button>
                      </div>
                    </div>
                  ))}
                  {form.items.length > 0 && (
                    <div style={{ textAlign: 'right', marginTop: 8, fontWeight: 600 }}>
                      Subtotal: {formatCurrency(subtotal)}
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Notes</label>
                  <textarea className="form-textarea" rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Optional notes" />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving || form.items.length === 0}>
                  {saving ? 'Creating...' : 'Create PO'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Receive Goods Modal */}
      {showReceive && receiveOrder && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 600 }}>
            <div className="modal-header">
              <h2>Receive Goods — {receiveOrder.poNumber}</h2>
              <button className="btn btn-secondary btn-sm btn-icon" onClick={() => setShowReceive(false)}><X size={16} /></button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {receiveOrder.items.map(item => {
                  const remaining = item.orderedQty - item.receivedQty;
                  return (
                    <div key={item.id} style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '12px', background: 'var(--bg-secondary)', borderRadius: 8,
                    }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600 }}>{item.product?.name}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                          Ordered: {item.orderedQty} | Received: {item.receivedQty} | Remaining: {remaining}
                        </div>
                      </div>
                      <div style={{ width: 90 }}>
                        <input type="number" className="form-input" min="0" max={remaining}
                          value={receivedQtys[item.id] || 0}
                          onChange={e => setReceivedQtys({ ...receivedQtys, [item.id]: e.target.value })}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowReceive(false)}>Cancel</button>
              <button className="btn btn-success" onClick={handleReceive} disabled={saving}>
                {saving ? 'Processing...' : 'Confirm Receipt'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
