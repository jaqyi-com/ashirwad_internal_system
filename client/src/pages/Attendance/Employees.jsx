import { useEffect, useState } from 'react';
import api from '../../utils/api';
import { RefreshCw, Pencil, Check, X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [editId, setEditId]       = useState(null);
  const [editData, setEditData]   = useState({});
  const [syncing, setSyncing]     = useState(false);

  const load = async () => {
    try { const { data } = await api.get('/attendance/employees'); setEmployees(data); }
    catch { toast.error('Failed to load employees'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const syncAll = async () => {
    setSyncing(true);
    try {
      const { data } = await api.post('/attendance/sync');
      toast.success('Employees synced from device');
      load();
    } catch { toast.error('Sync failed — check device connection'); }
    finally { setSyncing(false); }
  };

  const saveEdit = async (id) => {
    try {
      await api.put(`/attendance/employees/${id}`, editData);
      toast.success('Updated');
      setEditId(null);
      load();
    } catch { toast.error('Update failed'); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button className="btn btn-secondary" onClick={syncAll} disabled={syncing} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <RefreshCw size={14} className={syncing ? 'spin' : ''} />
          {syncing ? 'Syncing…' : 'Sync from Device'}
        </button>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="table">
          <thead>
            <tr>
              <th>Device ID</th>
              <th>Name</th>
              <th>Department</th>
              <th>Designation</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px' }}>Loading…</td></tr>
            ) : employees.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                No employees found. Sync from your device first.
              </td></tr>
            ) : employees.map(emp => (
              <tr key={emp.id}>
                <td><code style={{ fontSize: '12px' }}>{emp.deviceUserId}</code></td>
                <td>
                  {editId === emp.id ? (
                    <input className="input" style={{ padding: '4px 8px', fontSize: '13px', width: '140px' }}
                      value={editData.name ?? emp.name}
                      onChange={e => setEditData(d => ({ ...d, name: e.target.value }))} />
                  ) : <strong>{emp.name}</strong>}
                </td>
                <td>
                  {editId === emp.id ? (
                    <input className="input" style={{ padding: '4px 8px', fontSize: '13px', width: '120px' }}
                      placeholder="Department"
                      value={editData.department ?? emp.department ?? ''}
                      onChange={e => setEditData(d => ({ ...d, department: e.target.value }))} />
                  ) : emp.department || '—'}
                </td>
                <td>
                  {editId === emp.id ? (
                    <input className="input" style={{ padding: '4px 8px', fontSize: '13px', width: '120px' }}
                      placeholder="Designation"
                      value={editData.designation ?? emp.designation ?? ''}
                      onChange={e => setEditData(d => ({ ...d, designation: e.target.value }))} />
                  ) : emp.designation || '—'}
                </td>
                <td>
                  <span style={{
                    padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: 600,
                    background: emp.isActive ? 'var(--green)22' : 'var(--red)22',
                    color: emp.isActive ? 'var(--green)' : 'var(--red)',
                  }}>
                    {emp.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>
                  {editId === emp.id ? (
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button className="btn btn-primary" style={{ padding: '4px 8px', fontSize: '12px' }} onClick={() => saveEdit(emp.id)}>
                        <Check size={13} />
                      </button>
                      <button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '12px' }} onClick={() => setEditId(null)}>
                        <X size={13} />
                      </button>
                    </div>
                  ) : (
                    <button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '12px' }}
                      onClick={() => { setEditId(emp.id); setEditData({}); }}>
                      <Pencil size={13} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
