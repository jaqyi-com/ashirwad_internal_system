import { useState, useEffect } from 'react';
import api from '../../utils/api';
import { formatCurrency, formatNumber, formatDate } from '../../utils/helpers';
import { BarChart2, Download } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';

export default function Reports() {
  const [tab, setTab] = useState('valuation');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState({ from: '', to: '' });

  const load = async () => {
    setLoading(true);
    try {
      let res;
      if (tab === 'valuation') res = await api.get('/reports/valuation');
      else if (tab === 'low-stock') res = await api.get('/reports/low-stock');
      else if (tab === 'sales') res = await api.get('/reports/sales', { params: dateRange });
      else if (tab === 'purchases') res = await api.get('/reports/purchases', { params: dateRange });
      setData(res.data);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [tab]);

  const TABS = [
    { id: 'valuation', label: 'Inventory Valuation' },
    { id: 'low-stock', label: 'Low Stock' },
    { id: 'sales', label: 'Sales Report' },
    { id: 'purchases', label: 'Purchase Report' },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700 }}>Reports</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Analytics and business insights</p>
        </div>
      </div>

      <div className="tab-nav">
        {TABS.map(t => (
          <button key={t.id} className={`tab-btn ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {(tab === 'sales' || tab === 'purchases') && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'flex-end' }}>
          <div className="form-group" style={{ width: 160 }}>
            <label className="form-label">From</label>
            <input type="date" className="form-input" value={dateRange.from} onChange={e => setDateRange(d => ({ ...d, from: e.target.value }))} />
          </div>
          <div className="form-group" style={{ width: 160 }}>
            <label className="form-label">To</label>
            <input type="date" className="form-input" value={dateRange.to} onChange={e => setDateRange(d => ({ ...d, to: e.target.value }))} />
          </div>
          <button className="btn btn-primary btn-sm" onClick={load}>Apply Filter</button>
        </div>
      )}

      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <BarChart2 size={32} style={{ opacity: 0.3, display: 'block', margin: '0 auto 12px' }} />
          Loading report...
        </div>
      ) : (
        <>
          {/* Inventory Valuation */}
          {tab === 'valuation' && data && (
            <div>
              <div className="grid-2" style={{ marginBottom: 20 }}>
                <div className="card" style={{ borderLeft: '3px solid var(--accent)' }}>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '12px', marginBottom: 4 }}>Total Stock Value (at cost)</div>
                  <div style={{ fontSize: '28px', fontWeight: 800 }}>{formatCurrency(data.totalValue)}</div>
                </div>
                <div className="card" style={{ borderLeft: '3px solid var(--green)' }}>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '12px', marginBottom: 4 }}>Potential Revenue (at selling price)</div>
                  <div style={{ fontSize: '28px', fontWeight: 800 }}>{formatCurrency(data.totalRevenue)}</div>
                </div>
              </div>
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Category</th>
                      <th>Stock Qty</th>
                      <th>Stock Value</th>
                      <th>Selling Price</th>
                      <th>Potential Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.products?.map(p => (
                      <tr key={p.id}>
                        <td>
                          <div style={{ fontWeight: 600 }}>{p.name}</div>
                          {p.sku && <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{p.sku}</div>}
                        </td>
                        <td>{p.category || '—'}</td>
                        <td style={{ fontWeight: 600 }}>{formatNumber(p.currentStock)}</td>
                        <td style={{ fontWeight: 700, color: 'var(--accent)' }}>{formatCurrency(p.stockValue)}</td>
                        <td>{formatCurrency(p.sellingPrice)}</td>
                        <td style={{ fontWeight: 700, color: 'var(--green)' }}>{formatCurrency(p.potentialRevenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Low Stock Report */}
          {tab === 'low-stock' && Array.isArray(data) && (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Category</th>
                    <th>Current Stock</th>
                    <th>Min Stock</th>
                    <th>Deficit</th>
                    <th>Supplier</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map(p => (
                    <tr key={p.id}>
                      <td style={{ fontWeight: 600 }}>{p.name}</td>
                      <td>{p.category_name || '—'}</td>
                      <td style={{ fontWeight: 700, color: 'var(--red)' }}>{formatNumber(p.current_stock || p.currentStock)}</td>
                      <td>{formatNumber(p.min_stock || p.minStock)}</td>
                      <td style={{ color: 'var(--red)', fontWeight: 600 }}>
                        {formatNumber((p.min_stock || p.minStock) - (p.current_stock || p.currentStock))}
                      </td>
                      <td>{p.supplier_name || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Sales / Purchases Report */}
          {(tab === 'sales' || tab === 'purchases') && data && (
            <div>
              <div className="grid-2" style={{ marginBottom: 20 }}>
                <div className="card" style={{ borderLeft: '3px solid var(--green)' }}>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '12px', marginBottom: 4 }}>
                    Total {tab === 'sales' ? 'Revenue' : 'Purchase Amount'}
                  </div>
                  <div style={{ fontSize: '28px', fontWeight: 800 }}>
                    {formatCurrency(data.totals?._sum?.totalAmount)}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: 4 }}>
                    {data.totals?._count?.id || 0} orders
                  </div>
                </div>
                <div className="card" style={{ borderLeft: '3px solid var(--purple)' }}>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '12px', marginBottom: 4 }}>Total GST</div>
                  <div style={{ fontSize: '28px', fontWeight: 800 }}>
                    {formatCurrency(data.totals?._sum?.gstAmount)}
                  </div>
                </div>
              </div>
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Number</th>
                      <th>{tab === 'sales' ? 'Customer' : 'Supplier'}</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(tab === 'sales' ? data.sales : data.orders)?.map(o => (
                      <tr key={o.id}>
                        <td className="mono" style={{ fontWeight: 700 }}>{o.saleNumber || o.poNumber}</td>
                        <td>{o.customer?.name || o.supplier?.name || '—'}</td>
                        <td style={{ fontWeight: 600 }}>{formatCurrency(o.totalAmount)}</td>
                        <td><span className="badge badge-blue">{o.status}</span></td>
                        <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{formatDate(o.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
