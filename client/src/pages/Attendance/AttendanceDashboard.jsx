import { useEffect, useState, useCallback } from 'react';
import api from '../../utils/api';
import { formatDateTime } from '../../utils/helpers';
import { Users, UserCheck, UserX, Clock, RefreshCw, Wifi } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';

const PUNCH_COLOR = { IN: 'var(--green)', OUT: 'var(--red)', UNKNOWN: 'var(--text-muted)' };

export default function AttendanceDashboard() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data: d } = await api.get('/attendance/today');
      setData(d);
    } catch { toast.error('Failed to load attendance'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); const t = setInterval(load, 30000); return () => clearInterval(t); }, [load]);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const { data: r } = await api.post('/attendance/sync');
      toast.success(`Sync done — ${r.results?.filter(x => x.success).length || 0} device(s) updated`);
      await load();
    } catch { toast.error('Sync failed — check device connection'); }
    finally { setSyncing(false); }
  };

  if (loading) return <div className="page-loading"><RefreshCw size={24} className="spin" /></div>;

  const { logs = [], summary = {} } = data || {};

  // Last 10 punches for live feed
  const recentLogs = logs.slice(0, 15);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
        <StatCard icon={<Users size={20} />} label="Total Employees" value={summary.total ?? '—'} color="var(--accent)" />
        <StatCard icon={<UserCheck size={20} />} label="Present Today" value={summary.present ?? '—'} color="var(--green)" />
        <StatCard icon={<UserX size={20} />} label="Absent Today" value={summary.absent ?? '—'} color="var(--red)" />
      </div>

      {/* Live punch feed */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600 }}>Live Punch Feed</h3>
            <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>Auto-refreshes every 30 seconds</p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--green)' }}>
              <Wifi size={14} /> Live
            </div>
            <button className="btn btn-secondary" onClick={handleSync} disabled={syncing} style={{ fontSize: '12px', padding: '6px 12px' }}>
              <RefreshCw size={14} className={syncing ? 'spin' : ''} />
              {syncing ? 'Syncing…' : 'Sync Now'}
            </button>
          </div>
        </div>

        {recentLogs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            <Clock size={32} style={{ marginBottom: '8px', opacity: 0.4 }} />
            <p>No punches recorded today</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {recentLogs.map(log => (
              <div key={log.id} style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '10px 14px', borderRadius: '8px',
                background: 'var(--bg-hover)', border: '1px solid var(--border-light)',
              }}>
                <div style={{
                  width: '32px', height: '32px', borderRadius: '50%',
                  background: PUNCH_COLOR[log.punchType] + '22',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: PUNCH_COLOR[log.punchType] }}>
                    {log.punchType === 'IN' ? '→' : log.punchType === 'OUT' ? '←' : '?'}
                  </span>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '14px' }}>{log.employee?.name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{log.device?.name}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: PUNCH_COLOR[log.punchType] }}>{log.punchType}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    {new Date(log.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }) {
  return (
    <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
      <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', color, flexShrink: 0 }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: '24px', fontWeight: 700 }}>{value}</div>
        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{label}</div>
      </div>
    </div>
  );
}
