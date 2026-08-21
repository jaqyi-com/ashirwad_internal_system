import { useState, useEffect } from 'react';
import api from '../../utils/api';
import { formatCurrency, formatNumber } from '../../utils/helpers';
import { Plus, X, Minus, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Adjustments() {
  const [adjustments, setAdjustments] = useState([]);
  const [products, setProducts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ productId: '', type: 'INCREASE', quantity: '', reason: '', notes: '' });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const { data } = await api.get('/adjustments');
    setAdjustments(data);
  };
  const loadProducts = async () => {
    const { data } = await api.get('/products', { params: { limit: 500 } });
    setProducts(data.products);
  };
  useEffect(() => { load(); loadProducts(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      await api.post('/adjustments', { ...form, quantity: parseInt(form.quantity) });
      toast.success('Stock adjusted!');
      setShowModal(false);
      setForm({ productId: '', type: 'INCREASE', quantity: '', reason: '', notes: '' });
      load();
    } catch (err) { toast.error(err.response?.data?.error || 'Error'); } finally { setSaving(false); }
  };

  const REASONS = [
    'Physical count correction', 'Damaged goods', 'Theft / shrinkage',
    'Returned from customer', 'Sample / giveaway', 'Expired stock', 'Other'
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700 }}>Stock Adjustments</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Correct stock discrepancies with audit trail</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <TrendingUp size={16} /> New Adjustment
        </button>
      </div>

      <div className="table-wrapper">
        {adjustments.length === 0 ? (
          <div className="empty-state">
            <TrendingUp size={48} />
            <h3>No adjustments yet</h3>
            <p>Stock adjustments will appear here</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Type</th>
                <th>Quantity</th>
                <th>Reason</th>
                <th>Adjusted By</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {adjustments.map(a => (
                <tr key={a.id}>
                  <td style={{ fontWeight: 600 }}>{a.product?.name}</td>
                  <td>
                    <span className={`badge ${a.type === 'INCREASE' ? 'badge-green' : 'badge-red'}`}>
                      {a.type === 'INCREASE' ? '+' : '−'} {a.type}
                    </span>
                  </td>
                  <td style={{ fontWeight: 700, fontSize: '15px', color: a.type === 'INCREASE' ? 'var(--green)' : 'var(--red)' }}>
                    {a.type === 'INCREASE' ? '+' : '−'}{formatNumber(a.quantity)}
                  </td>
                  <td>{a.reason}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{a.adjustedBy?.name || '—'}</td>
                  <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    {new Date(a.createdAt).toLocaleString('en-IN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal" style={{ maxWidth: 520 }}>
            <div className="modal-header">
              <h2>Stock Adjustment</h2>
              <button className="btn btn-secondary btn-sm btn-icon" onClick={() => setShowModal(false)}><X size={16} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="form-group">
                  <label className="form-label">Product <span>*</span></label>
                  <select className="form-select" required value={form.productId} onChange={e => setForm({ ...form, productId: e.target.value })}>
                    <option value="">Select Product</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name} — Current: {p.currentStock} {p.unit}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Adjustment Type <span>*</span></label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {['INCREASE', 'DECREASE'].map(t => (
                      <button key={t} type="button"
                        onClick={() => setForm({ ...form, type: t })}
                        className={`btn btn-sm ${form.type === t ? (t === 'INCREASE' ? 'btn-success' : 'btn-danger') : 'btn-secondary'}`}
                        style={{ flex: 1, justifyContent: 'center' }}
                      >
                        {t === 'INCREASE' ? <Plus size={14} /> : <Minus size={14} />} {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Quantity <span>*</span></label>
                  <input type="number" min="1" required className="form-input" value={form.quantity}
                    onChange={e => setForm({ ...form, quantity: e.target.value })} placeholder="Units to adjust" />
                </div>

                <div className="form-group">
                  <label className="form-label">Reason <span>*</span></label>
                  <select className="form-select" required value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })}>
                    <option value="">Select reason</option>
                    {REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Notes</label>
                  <textarea className="form-textarea" rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Additional details..." />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Apply Adjustment'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
