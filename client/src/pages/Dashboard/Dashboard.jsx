import { useEffect, useState } from 'react';
import api from '../../utils/api';
import { formatCurrency, formatNumber, formatDateTime, TRANSACTION_TYPE_LABELS } from '../../utils/helpers';
import {
  Package, TrendingUp, AlertTriangle, ShoppingCart, DollarSign,
  ArrowUpRight, ArrowDownRight, RefreshCw, Layers, XCircle,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border-light)',
      borderRadius: '10px', padding: '12px 16px', fontSize: '13px',
    }}>
      <div style={{ fontWeight: 600, marginBottom: 8, color: 'var(--text-secondary)' }}>{label}</div>
      {payload.map((p) => (
        <div key={p.name} style={{ color: p.color, marginBottom: 4 }}>
          {p.name}: {formatCurrency(p.value)}
        </div>
      ))}
    </div>
  );
};

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const { data: d } = await api.get('/dashboard');
      setData(d);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) return <DashboardSkeleton />;

  const { stats, recentTransactions, topProducts, weeklyData } = data;

  const statCards = [
    {
      label: 'Total Products',
      value: formatNumber(stats.totalProducts),
      icon: Package,
      color: 'var(--accent)',
      bg: 'var(--accent-glow)',
    },
    {
      label: 'Total Stock Units',
      value: formatNumber(stats.totalStock),
      icon: Layers,
      color: 'var(--blue)',
      bg: 'rgba(59,130,246,0.12)',
    },
    {
      label: 'Inventory Value',
      value: formatCurrency(stats.inventoryValue),
      icon: DollarSign,
      color: 'var(--green)',
      bg: 'rgba(16,185,129,0.12)',
    },
    {
      label: 'Low Stock Products',
      value: formatNumber(stats.lowStock),
      icon: AlertTriangle,
      color: 'var(--yellow)',
      bg: 'rgba(245,158,11,0.12)',
    },
    {
      label: "Today's Sales",
      value: formatCurrency(stats.todaySales.amount),
      sub: `${stats.todaySales.count} orders`,
      icon: TrendingUp,
      color: 'var(--green)',
      bg: 'rgba(16,185,129,0.12)',
    },
    {
      label: "Today's Purchases",
      value: formatCurrency(stats.todayPurchases.amount),
      sub: `${stats.todayPurchases.count} orders`,
      icon: ShoppingCart,
      color: 'var(--purple)',
      bg: 'rgba(139,92,246,0.12)',
    },
    {
      label: 'Out of Stock',
      value: formatNumber(stats.outOfStock),
      icon: XCircle,
      color: 'var(--red)',
      bg: 'rgba(239,68,68,0.12)',
    },
    {
      label: 'Pending POs',
      value: formatNumber(stats.pendingOrders),
      icon: RefreshCw,
      color: 'var(--orange)',
      bg: 'rgba(249,115,22,0.12)',
    },
  ];

  return (
    <div>
      {/* Stat Grid */}
      <div className="grid-stat" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        {statCards.map((s, i) => (
          <div key={i} className="stat-card">
            <div>
              <div className="stat-card-value">{s.value}</div>
              <div className="stat-card-label">{s.label}</div>
              {s.sub && <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: 2 }}>{s.sub}</div>}
            </div>
            <div className="stat-card-icon" style={{ background: s.bg }}>
              <s.icon size={22} style={{ color: s.color }} />
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid-2" style={{ marginBottom: '24px' }}>
        {/* Area chart */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: '15px' }}>Sales vs Purchases</div>
              <div className="text-muted text-sm">Last 7 days</div>
            </div>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyData}>
                <defs>
                  <linearGradient id="sales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="purchases" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="date" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v >= 1000 ? (v / 1000).toFixed(0) + 'K' : v}`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Area type="monotone" dataKey="sales" name="Sales" stroke="#10b981" strokeWidth={2} fill="url(#sales)" />
                <Area type="monotone" dataKey="purchases" name="Purchases" stroke="#6366f1" strokeWidth={2} fill="url(#purchases)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Products */}
        <div className="card">
          <div style={{ fontWeight: 700, fontSize: '15px', marginBottom: '4px' }}>Top Products by Stock</div>
          <div className="text-muted text-sm" style={{ marginBottom: '16px' }}>Highest current stock</div>
          {topProducts.length === 0 ? (
            <div className="empty-state" style={{ padding: '30px' }}>No products yet</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {topProducts.map((p, i) => (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: '8px',
                    background: `hsl(${i * 60}, 60%, 20%)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '13px', fontWeight: 700, color: `hsl(${i * 60}, 80%, 70%)`,
                    flexShrink: 0,
                  }}>
                    {i + 1}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {p.name}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{p.category?.name || 'Uncategorized'}</div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: '14px' }}>{formatNumber(p.currentStock)}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>units</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="card">
        <div style={{ fontWeight: 700, fontSize: '15px', marginBottom: '4px' }}>Recent Inventory Movements</div>
        <div className="text-muted text-sm" style={{ marginBottom: '16px' }}>Last 10 stock transactions</div>

        {recentTransactions.length === 0 ? (
          <div className="empty-state">No transactions yet</div>
        ) : (
          <div className="table-wrapper" style={{ border: 'none' }}>
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Type</th>
                  <th>Qty</th>
                  <th>Stock Before</th>
                  <th>Stock After</th>
                  <th>By</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {recentTransactions.map((t) => {
                  const meta = TRANSACTION_TYPE_LABELS[t.transactionType] || {};
                  return (
                    <tr key={t.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{t.product?.name}</div>
                        {t.product?.sku && <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{t.product.sku}</div>}
                      </td>
                      <td>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                          fontSize: '12px', fontWeight: 600, color: meta.color,
                        }}>
                          {meta.sign}{t.transactionType?.split('_').join(' ')}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontWeight: 700, color: meta.color }}>
                          {meta.sign}{formatNumber(t.quantity)}
                        </span>
                      </td>
                      <td>{formatNumber(t.previousStock)}</td>
                      <td style={{ fontWeight: 600 }}>{formatNumber(t.newStock)}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>{t.createdBy?.name || '—'}</td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>{formatDateTime(t.createdAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div>
      <div className="grid-stat">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="stat-card">
            <div style={{ flex: 1 }}>
              <div className="skeleton" style={{ height: 32, width: '60%', marginBottom: 8 }} />
              <div className="skeleton" style={{ height: 14, width: '80%' }} />
            </div>
            <div className="skeleton" style={{ width: 48, height: 48, borderRadius: 12 }} />
          </div>
        ))}
      </div>
    </div>
  );
}
