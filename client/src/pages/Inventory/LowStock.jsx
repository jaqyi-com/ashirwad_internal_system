import { useState, useEffect } from 'react';
import api from '../../utils/api';
import { formatNumber, formatCurrency, getStockStatus } from '../../utils/helpers';
import { AlertTriangle } from 'lucide-react';

export default function LowStock() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const { data } = await api.get('/reports/low-stock');
        setProducts(data);
      } catch (e) { console.error(e); } finally { setLoading(false); }
    };
    load();
  }, []);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700 }}>Low Stock Alerts</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
            {products.length} products need attention
          </p>
        </div>
      </div>

      {!loading && products.length > 0 && (
        <div style={{
          padding: '12px 16px',
          background: 'rgba(245,158,11,0.08)',
          border: '1px solid rgba(245,158,11,0.25)',
          borderRadius: 10,
          marginBottom: 20,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          color: 'var(--yellow)',
          fontSize: '13px',
        }}>
          <AlertTriangle size={16} />
          <strong>{products.length}</strong> products are at or below their minimum stock level. Consider placing purchase orders.
        </div>
      )}

      <div className="table-wrapper">
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading...</div>
        ) : products.length === 0 ? (
          <div className="empty-state">
            <AlertTriangle size={48} style={{ color: 'var(--green)' }} />
            <h3 style={{ color: 'var(--green)' }}>All stock levels are healthy!</h3>
            <p>No products are below their minimum stock level.</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Supplier</th>
                <th>Location</th>
                <th>Current Stock</th>
                <th>Min. Stock</th>
                <th>Deficit</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {products.map(p => {
                const deficit = (p.minStock || p.min_stock) - (p.currentStock || p.current_stock);
                const current = p.currentStock || p.current_stock || 0;
                const min = p.minStock || p.min_stock || 0;
                const status = getStockStatus(current, min);
                return (
                  <tr key={p.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{p.name}</div>
                      {p.sku && <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{p.sku}</div>}
                    </td>
                    <td>{p.category_name || '—'}</td>
                    <td>{p.supplier_name || '—'}</td>
                    <td>{p.location || '—'}</td>
                    <td style={{ fontWeight: 700, fontSize: '16px', color: current <= 0 ? 'var(--red)' : 'var(--yellow)' }}>
                      {formatNumber(current)}
                    </td>
                    <td>{formatNumber(min)}</td>
                    <td style={{ color: 'var(--red)', fontWeight: 600 }}>
                      {deficit > 0 ? `−${formatNumber(deficit)}` : '0'}
                    </td>
                    <td><span className={`badge ${status.className}`}>{status.label}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
