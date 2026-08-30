import { useState, useEffect } from 'react';
import api from '../../utils/api';
import { formatCurrency, formatDate, formatDateTime, getStatusBadge } from '../../utils/helpers';
import { Plus, X, Trash2, TrendingUp, Download, Eye, Edit2, Search, Printer, ClipboardList } from 'lucide-react';
import toast from 'react-hot-toast';
import ChallanPrintView from '../../components/Sales/ChallanPrintView';

export default function Challans() {
  const [challans, setChallans]     = useState([]);
  const [total, setTotal]           = useState(0);
  const [loading, setLoading]       = useState(true);
  const [customers, setCustomers]   = useState([]);
  const [products, setProducts]     = useState([]);
  const [showModal, setShowModal]   = useState(false);
  const [editingSale, setEditingSale] = useState(null);
  const [detail, setDetail]         = useState(null);
  const [form, setForm]             = useState({ customerId: '', status: 'CONFIRMED', notes: '', discount: '0', items: [] });
  const [saving, setSaving]         = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch]         = useState('');
  const [printChallanSale, setPrintChallanSale] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/sales', { params: { type: 'CHALLAN', status: statusFilter || undefined, limit: 100 } });
      setChallans(data.sales);
      setTotal(data.total);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const loadMeta = async () => {
    const [cusRes, prodRes] = await Promise.all([
      api.get('/customers'),
      api.get('/products', { params: { limit: 1500 } })
    ]);
    setCustomers(cusRes.data);
    setProducts(prodRes.data.products);
  };

  useEffect(() => { load(); }, [statusFilter]);
  useEffect(() => { loadMeta(); }, []);

  const openCreate = () => {
    setEditingSale(null);
    setForm({ customerId: '', status: 'CONFIRMED', notes: '', discount: '0', items: [] });
    setShowModal(true);
  };

  const openEdit = (s) => {
    setDetail(null);
    setEditingSale(s);
    setForm({
      customerId: s.customerId || '',
      status: s.status || 'CONFIRMED',
      notes: s.notes || '',
      discount: String(s.discount || '0'),
      items: (s.items || []).map(it => ({
        productId: it.productId,
        quantity: it.quantity,
        unitPrice: parseFloat(it.unitPrice) || 0,
      })),
    });
    setShowModal(true);
  };

  const handleDelete = async (s) => {
    if (!confirm(`Are you sure you want to delete challan "${s.saleNumber}"?`)) return;
    try {
      await api.delete(`/sales/${s.id}`);
      toast.success('Challan deleted successfully!');
      if (detail?.id === s.id) setDetail(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error deleting sale');
    }
  };

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
    e.preventDefault();
    if (form.items.length === 0) {
      toast.error('Please add at least one item');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        type: 'CHALLAN',
        discount: parseFloat(form.discount) || 0,
        items: form.items.map(it => ({
          ...it,
          quantity: parseInt(it.quantity) || 1,
          unitPrice: parseFloat(it.unitPrice) || 0,
        })),
      };

      if (editingSale) {
        await api.put(`/sales/${editingSale.id}`, payload);
        toast.success('Challan updated!');
      } else {
        await api.post('/sales', payload);
        toast.success('Challan created!');
      }

      setShowModal(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error saving sale');
    } finally {
      setSaving(false);
    }
  };

  const handlePrintChallan = (saleData) => {
    setPrintChallanSale(saleData);
    setTimeout(() => {
      window.print();
      // Don't reset state immediately to allow print dialog to capture the DOM
      setTimeout(() => setPrintChallanSale(null), 1000);
    }, 150);
  };

  // ── PDF Print ──────────────────────────────────────────────
  const downloadPDF = (sale) => {
    const customer = sale.customer;
    const items = sale.items || [];
    const subtotal = items.reduce((s, it) => s + parseFloat(it.unitPrice) * it.quantity, 0);
    const gst = parseFloat(sale.gstAmount) || 0;
    const discount = parseFloat(sale.discount) || 0;
    const total = parseFloat(sale.totalAmount) || 0;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <title>Sale Order - ${sale.saleNumber}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; font-size: 13px; color: #1a1a2e; background: white; padding: 32px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 28px; padding-bottom: 20px; border-bottom: 2px solid #6366f1; }
    .company-name { font-size: 22px; font-weight: 800; color: #6366f1; }
    .company-sub  { font-size: 12px; color: #666; margin-top: 2px; }
    .invoice-title { font-size: 18px; font-weight: 700; text-align: right; }
    .invoice-num   { font-size: 13px; color: #666; margin-top: 4px; text-align: right; }
    .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px; }
    .meta-box { background: #f8f9ff; border: 1px solid #e0e0f0; border-radius: 8px; padding: 14px; }
    .meta-title { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #888; margin-bottom: 8px; }
    .meta-row { display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 12px; }
    .meta-row span:last-child { font-weight: 600; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    thead th { background: #6366f1; color: white; padding: 10px 12px; text-align: left; font-size: 12px; font-weight: 600; }
    tbody tr:nth-child(even) { background: #f8f9ff; }
    tbody td { padding: 10px 12px; border-bottom: 1px solid #eee; font-size: 12px; }
    .totals { display: flex; justify-content: flex-end; margin-top: 8px; }
    .totals-box { width: 280px; }
    .totals-row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #eee; font-size: 13px; }
    .totals-total { display: flex; justify-content: space-between; padding: 10px 0; font-size: 16px; font-weight: 800; color: #6366f1; border-top: 2px solid #6366f1; margin-top: 4px; }
    .status-badge { display: inline-block; padding: 3px 10px; border-radius: 99px; font-size: 11px; font-weight: 700;
      background: ${sale.status === 'PAID' ? '#d1fae5' : sale.status === 'CONFIRMED' ? '#dbeafe' : '#f3e8ff'};
      color: ${sale.status === 'PAID' ? '#065f46' : sale.status === 'CONFIRMED' ? '#1e40af' : '#6b21a8'}; }
    .notes { margin-top: 24px; padding: 14px; background: #f8f9ff; border-radius: 8px; border: 1px solid #e0e0f0; font-size: 12px; color: #555; }
    .footer { margin-top: 32px; text-align: center; font-size: 11px; color: #aaa; border-top: 1px solid #eee; padding-top: 16px; }
    @media print { body { padding: 16px; } }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="company-name">🏭 Ashirwad Enterprises</div>
      <div class="company-sub">Inventory Management System</div>
    </div>
    <div>
      <div class="invoice-title">SALE ORDER</div>
      <div class="invoice-num">${sale.saleNumber}</div>
      <div style="margin-top:6px"><span class="status-badge">${sale.status}</span></div>
    </div>
  </div>

  <div class="meta">
    <div class="meta-box">
      <div class="meta-title">Bill To</div>
      ${customer ? `
        <div style="font-weight:700;font-size:14px;margin-bottom:6px">${customer.name}</div>
        ${customer.company ? `<div style="color:#666;margin-bottom:4px">${customer.company}</div>` : ''}
        ${customer.phone   ? `<div style="color:#666;margin-bottom:2px">📞 ${customer.phone}</div>` : ''}
        ${customer.email   ? `<div style="color:#666;margin-bottom:2px">✉️ ${customer.email}</div>` : ''}
        ${customer.address ? `<div style="color:#666;margin-bottom:2px">📍 ${customer.address}</div>` : ''}
        ${customer.city || customer.state ? `<div style="color:#666">${[customer.city, customer.state].filter(Boolean).join(', ')}</div>` : ''}
        ${customer.gstNumber ? `<div style="color:#666;margin-top:4px">GST: ${customer.gstNumber}</div>` : ''}
      ` : '<div style="color:#888">Walk-in Customer</div>'}
    </div>
    <div class="meta-box">
      <div class="meta-title">Order Details</div>
      <div class="meta-row"><span>Sale Number</span><span>${sale.saleNumber}</span></div>
      <div class="meta-row"><span>Date</span><span>${formatDate(sale.createdAt)}</span></div>
      <div class="meta-row"><span>Status</span><span>${sale.status}</span></div>
      <div class="meta-row"><span>Paid Amount</span><span>${formatCurrency(sale.paidAmount)}</span></div>
      ${sale.createdBy ? `<div class="meta-row"><span>Created By</span><span>${sale.createdBy.name}</span></div>` : ''}
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>Product</th>
        <th>Part No.</th>
        <th style="text-align:center">Qty</th>
        <th style="text-align:right">Unit Price</th>
        <th style="text-align:center">GST %</th>
        <th style="text-align:right">Total</th>
      </tr>
    </thead>
    <tbody>
      ${items.map((it, i) => `
        <tr>
          <td>${i + 1}</td>
          <td><strong>${it.product?.name || '—'}</strong></td>
          <td style="color:#888">${it.product?.partNumber || '—'}</td>
          <td style="text-align:center">${it.quantity} ${it.product?.unit || ''}</td>
          <td style="text-align:right">${formatCurrency(it.unitPrice)}</td>
          <td style="text-align:center">${it.gstPercent || 0}%</td>
          <td style="text-align:right;font-weight:600">${formatCurrency(it.totalPrice)}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="totals">
    <div class="totals-box">
      <div class="totals-row"><span>Subtotal</span><span>${formatCurrency(subtotal)}</span></div>
      <div class="totals-row"><span>GST</span><span>${formatCurrency(gst)}</span></div>
      ${discount > 0 ? `<div class="totals-row" style="color:#16a34a"><span>Discount</span><span>− ${formatCurrency(discount)}</span></div>` : ''}
      <div class="totals-total"><span>Grand Total</span><span>${formatCurrency(total)}</span></div>
    </div>
  </div>

  ${sale.notes ? `<div class="notes"><strong>Notes:</strong> ${sale.notes}</div>` : ''}

  <div class="footer">
    Generated on ${new Date().toLocaleString('en-IN')} · Ashirwad Enterprises IMS
  </div>
</body>
</html>`;

    const win = window.open('', '_blank');
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); }, 500);
  };

  const filteredChallans = challans.filter(s => {
    if (!search) return true;
    const q = search.toLowerCase();
    return s.saleNumber.toLowerCase().includes(q) ||
           (s.customer?.name && s.customer.name.toLowerCase().includes(q)) ||
           (s.customer?.company && s.customer.company.toLowerCase().includes(q));
  });

  if (loading) return <div className="page-loader"><div className="spinner"></div></div>;

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Delivery Challans</h1>
          <p className="page-subtitle">Manage delivery challans and invoices</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}><Plus size={16} /> New Challan</button>
      </div>

      {/* Filters & Search */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <div className="search-bar" style={{ flex: 1, minWidth: 260, maxWidth: 360 }}>
          <Search size={15} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          <input
            placeholder="Search by challan no. or customer..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {['', 'CONFIRMED', 'INVOICED', 'PAID', 'CANCELLED'].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`btn btn-sm ${statusFilter === s ? 'btn-primary' : 'btn-secondary'}`}>
              {s || 'All'}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="table-wrapper">
        {filteredChallans.length === 0 ? (
          <div className="empty-state">
            <ClipboardList size={48} />
            <h3>No challans found</h3>
            <p>Get started by creating a new delivery challan.</p>
            <button className="btn btn-primary" onClick={openCreate} style={{ marginTop: 12 }}>
              <Plus size={16} /> Create Challan
            </button>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Challan No.</th>
                <th>Customer</th>
                <th className="hide-mobile">Items</th>
                <th>Total</th>
                <th className="hide-mobile">Paid</th>
                <th>Status</th>
                <th className="hide-mobile">Date</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredChallans.map(s => (
                <tr key={s.id} style={{ cursor: 'pointer' }} onClick={() => setDetail(s)}>
                  <td><span className="mono" style={{ fontWeight: 700 }}>{s.saleNumber}</span></td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{s.customer?.name || <span style={{ color: 'var(--text-muted)' }}>Walk-in</span>}</div>
                    {s.customer?.company && <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{s.customer.company}</div>}
                  </td>
                  <td className="hide-mobile">{s.items?.length || 0} items</td>
                  <td style={{ fontWeight: 600 }}>{formatCurrency(s.totalAmount)}</td>
                  <td className="hide-mobile" style={{ color: 'var(--green)' }}>{formatCurrency(s.paidAmount)}</td>
                  <td><span className={`badge ${getStatusBadge(s.status)}`}>{s.status}</span></td>
                  <td className="hide-mobile" style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{formatDate(s.createdAt)}</td>
                  <td onClick={e => e.stopPropagation()}>
                    <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                      <button className="btn btn-secondary btn-sm btn-icon" title="View Details" onClick={() => setDetail(s)}><Eye size={13} /></button>
                      <button className="btn btn-primary btn-sm btn-icon" title="Print Challan" onClick={() => handlePrintChallan(s)}><Printer size={13} /></button>
                      <button className="btn btn-secondary btn-sm btn-icon" title="Edit Challan" onClick={() => openEdit(s)}><Edit2 size={13} /></button>
                      <button className="btn btn-danger btn-sm btn-icon" title="Delete Challan" onClick={() => handleDelete(s)}><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Sale Detail Modal ── */}
      {detail && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setDetail(null)}>
          <div className="modal modal-lg" style={{ maxWidth: 780 }}>
            <div className="modal-header">
              <div>
                <h2 style={{ fontWeight: 700 }}>{detail.saleNumber}</h2>
                <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                  <span className={`badge ${getStatusBadge(detail.status)}`}>{detail.status}</span>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{formatDateTime(detail.createdAt)}</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-secondary btn-sm" onClick={() => openEdit(detail)}><Edit2 size={13} /> Edit</button>
                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(detail)}><Trash2 size={13} /> Delete</button>
                <button className="btn btn-primary btn-sm" onClick={() => handlePrintChallan(detail)}><Printer size={13} /> Print Challan</button>
                <button className="btn btn-secondary btn-sm btn-icon" onClick={() => setDetail(null)}><X size={16} /></button>
              </div>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

              {/* Customer + Order info */}
              <div className="grid-2" style={{ gap: 16 }}>
                <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 10, padding: 14 }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 8 }}>Customer</div>
                  {detail.customer ? (
                    <>
                      <div style={{ fontWeight: 700, fontSize: 15 }}>{detail.customer.name}</div>
                      {detail.customer.company   && <div style={{ color: 'var(--text-secondary)', fontSize: 12, marginTop: 2 }}>{detail.customer.company}</div>}
                      {detail.customer.phone     && <div style={{ color: 'var(--text-secondary)', fontSize: 12, marginTop: 4 }}>📞 {detail.customer.phone}</div>}
                      {detail.customer.email     && <div style={{ color: 'var(--text-secondary)', fontSize: 12 }}>✉️ {detail.customer.email}</div>}
                      {detail.customer.gstNumber && <div style={{ color: 'var(--text-secondary)', fontSize: 12, marginTop: 4 }}>GST: <span className="mono">{detail.customer.gstNumber}</span></div>}
                      {(detail.customer.city || detail.customer.state) && (
                        <div style={{ color: 'var(--text-secondary)', fontSize: 12 }}>📍 {[detail.customer.city, detail.customer.state].filter(Boolean).join(', ')}</div>
                      )}
                    </>
                  ) : (
                    <div style={{ color: 'var(--text-muted)' }}>Walk-in Customer</div>
                  )}
                </div>

                <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 10, padding: 14 }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 8 }}>Challan Details</div>
                  {[
                    ['Challan Number', detail.saleNumber],
                    ['Date', formatDate(detail.createdAt)],
                    ['Status', detail.status],
                    ['Paid Amount', formatCurrency(detail.paidAmount)],
                    detail.createdBy ? ['Created By', detail.createdBy.name] : null,
                  ].filter(Boolean).map(([label, value]) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '4px 0', borderBottom: '1px solid var(--border)' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
                      <span style={{ fontWeight: 600 }}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Items table */}
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 8 }}>Order Items</div>
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Product</th>
                        <th>Part No.</th>
                        <th style={{ textAlign: 'center' }}>Qty</th>
                        <th style={{ textAlign: 'right' }}>Unit Price</th>
                        <th style={{ textAlign: 'center' }}>GST</th>
                        <th style={{ textAlign: 'right' }}>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(detail.items || []).map((it, i) => (
                        <tr key={it.id || i}>
                          <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{i + 1}</td>
                          <td style={{ fontWeight: 600 }}>{it.product?.name || '—'}</td>
                          <td><span className="mono" style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{it.product?.partNumber || '—'}</span></td>
                          <td style={{ textAlign: 'center' }}>{it.quantity} <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>{it.product?.unit || ''}</span></td>
                          <td style={{ textAlign: 'right' }}>{formatCurrency(it.unitPrice)}</td>
                          <td style={{ textAlign: 'center' }}><span className="badge badge-gray">{it.gstPercent || 0}%</span></td>
                          <td style={{ textAlign: 'right', fontWeight: 700 }}>{formatCurrency(it.totalPrice)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Totals */}
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <div style={{ width: 260 }}>
                  {[
                    ['Subtotal', formatCurrency(detail.subtotal)],
                    ['GST', formatCurrency(detail.gstAmount)],
                    ...(parseFloat(detail.discount) > 0 ? [['Discount', `− ${formatCurrency(detail.discount)}`]] : []),
                  ].map(([label, value]) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>{label}</span><span>{value}</span>
                    </div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 800, padding: '10px 0', color: 'var(--accent)' }}>
                    <span>Grand Total</span><span>{formatCurrency(detail.totalAmount)}</span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {detail.notes && (
                <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8, padding: 12 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Notes</div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{detail.notes}</div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setDetail(null)}>Close</button>
              <button className="btn btn-secondary" onClick={() => openEdit(detail)}><Edit2 size={14} /> Edit</button>
              <button className="btn btn-primary" onClick={() => handlePrintChallan(detail)}><Printer size={14} /> Print Challan</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Create / Edit Sale Modal ── */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal modal-lg" style={{ maxWidth: 800 }}>
            <div className="modal-header">
              <h2>{editingSale ? 'Edit Challan' : 'Create Challan'}</h2>
              <button className="btn btn-secondary btn-sm btn-icon" onClick={() => setShowModal(false)}><X size={16} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ gap: 12, marginBottom: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Customer</label>
                    <select className="form-select" value={form.customerId} onChange={e => setForm({ ...form, customerId: e.target.value })}>
                      <option value="">Walk-in Customer</option>
                      {customers.map(c => <option key={c.id} value={c.id}>{c.name} {c.company ? `(${c.company})` : ''}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <label className="form-label">Items <span>*</span></label>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={addItem}><Plus size={13} /> Add Item</button>
                  </div>
                  {form.items.length === 0 && (
                    <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)', border: '1px dashed var(--border)', borderRadius: 8 }}>
                      Add products to this sale order
                    </div>
                  )}
                  {form.items.map((item, i) => (
                    <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'flex-end' }}>
                      <div className="form-group" style={{ flex: 2 }}>
                        {i === 0 && <label className="form-label">Product</label>}
                        <select className="form-select" value={item.productId} onChange={e => updateItem(i, 'productId', e.target.value)} required>
                          <option value="">Select Product</option>
                          {products.map(p => <option key={p.id} value={p.id}>{p.name} {p.partNumber ? `(${p.partNumber})` : ''} — Stock: {p.currentStock} {p.unit}</option>)}
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
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving || form.items.length === 0}>
                  {saving ? 'Saving...' : editingSale ? 'Update Challan' : 'Confirm Challan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {printChallanSale && <ChallanPrintView sale={printChallanSale} />}
    </div>
  );
}
