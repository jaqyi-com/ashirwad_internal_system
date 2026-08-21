import { useState, useEffect } from 'react';
import api from '../utils/api';
import { formatDateTime } from '../utils/helpers';
import { ClipboardList } from 'lucide-react';

export default function Audit() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const { data } = await api.get('/audit');
        setLogs(data);
      } catch (e) { console.error(e); } finally { setLoading(false); }
    };
    load();
  }, []);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700 }}>Audit Logs</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>System activity and change history</p>
        </div>
      </div>

      <div className="table-wrapper">
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading...</div>
        ) : logs.length === 0 ? (
          <div className="empty-state"><ClipboardList size={48} /><h3>No audit logs yet</h3></div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>User</th>
                <th>Action</th>
                <th>Resource</th>
                <th>Resource ID</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(l => (
                <tr key={l.id}>
                  <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{formatDateTime(l.createdAt)}</td>
                  <td>{l.user?.name || 'System'}</td>
                  <td>
                    <span className={`badge ${l.action === 'DELETE' ? 'badge-red' : l.action === 'CREATE' ? 'badge-green' : 'badge-blue'}`}>
                      {l.action}
                    </span>
                  </td>
                  <td>{l.resource}</td>
                  <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }} className="mono">{l.resourceId || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
