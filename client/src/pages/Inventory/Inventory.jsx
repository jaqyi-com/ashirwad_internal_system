import { useState, useEffect } from 'react';
import api from '../../utils/api';
import { formatNumber, formatDate, TRANSACTION_TYPE_LABELS } from '../../utils/helpers';
import { Search, History } from 'lucide-react';

export default function Inventory() {
  const [transactions, setTransactions] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/inventory/transactions', {
        params: { type: typeFilter || undefined, page, limit: 50 },
      });
      setTransactions(data.transactions);
      setTotal(data.total);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [typeFilter, page]);

  const types = Object.keys(TRANSACTION_TYPE_LABELS);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700 }}>Stock Movements</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>{total} transactions</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
        <button onClick={() => { setTypeFilter(''); setPage(1); }}
          className={`btn btn-sm ${!typeFilter ? 'btn-primary' : 'btn-secondary'}`}>All</button>
        {types.map(t => {
          const meta = TRANSACTION_TYPE_LABELS[t];
          return (
            <button key={t} onClick={() => { setTypeFilter(t); setPage(1); }}
              className={`btn btn-sm ${typeFilter === t ? 'btn-primary' : 'btn-secondary'}`}>
              {meta.sign} {t.split('_').map(w => w[0] + w.slice(1).toLowerCase()).join(' ')}
            </button>
          );
        })}
      </div>

      <div className="table-wrapper">
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading...</div>
        ) : transactions.length === 0 ? (
          <div className="empty-state"><History size={48} /><h3>No transactions yet</h3></div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Product</th>
                <th>Type</th>
                <th>Qty Change</th>
                <th>Previous Stock</th>
                <th>New Stock</th>
                <th>Reference</th>
                <th>Notes</th>
                <th>By</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map(t => {
                const meta = TRANSACTION_TYPE_LABELS[t.transactionType] || { sign: '', color: 'var(--text-primary)', label: t.transactionType };
                return (
                  <tr key={t.id}>
                    <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{formatDate(t.createdAt)}</td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{t.product?.name}</div>
                      {t.product?.sku && <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{t.product.sku}</div>}
                    </td>
                    <td>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: meta.color }}>
                        {t.transactionType.split('_').join(' ')}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 700, color: meta.color, fontSize: '15px' }}>
                        {meta.sign}{formatNumber(t.quantity)}
                      </span>
                    </td>
                    <td>{formatNumber(t.previousStock)}</td>
                    <td style={{ fontWeight: 700 }}>{formatNumber(t.newStock)}</td>
                    <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      {t.referenceType ? `${t.referenceType}` : '—'}
                    </td>
                    <td style={{ fontSize: '12px', color: 'var(--text-secondary)', maxWidth: 200 }}>
                      {t.notes || '—'}
                    </td>
                    <td style={{ fontSize: '12px' }}>{t.createdBy?.name || '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {total > 50 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16 }}>
          <button className="btn btn-secondary btn-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</button>
          <span style={{ padding: '6px 12px', fontSize: '13px', color: 'var(--text-secondary)' }}>Page {page}</span>
          <button className="btn btn-secondary btn-sm" disabled={page * 50 >= total} onClick={() => setPage(p => p + 1)}>Next</button>
        </div>
      )}
    </div>
  );
}
