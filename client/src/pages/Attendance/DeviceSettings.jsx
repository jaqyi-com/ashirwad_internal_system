import { useEffect, useState } from 'react';
import api from '../../utils/api';
import { Wifi, WifiOff, RefreshCw, Plus, Trash2, TestTube } from 'lucide-react';
import toast from 'react-hot-toast';

export default function DeviceSettings() {
  const [devices, setDevices]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]         = useState({ name: '', ipAddress: '', port: '4370' });
  const [testing, setTesting]   = useState({});
  const [syncing, setSyncing]   = useState({});

  const load = async () => {
    try { const { data } = await api.get('/attendance/devices'); setDevices(data); }
    catch { toast.error('Failed to load devices'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const addDevice = async (e) => {
    e.preventDefault();
    try {
      await api.post('/attendance/devices', form);
      toast.success('Device registered!');
      setShowForm(false); setForm({ name: '', ipAddress: '', port: '4370' });
      load();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to add device'); }
  };

  const testDevice = async (id) => {
    setTesting(t => ({ ...t, [id]: true }));
    try {
      const { data } = await api.post(`/attendance/devices/${id}/test`);
      if (data.success) toast.success(data.message);
      else toast.error(data.message);
    } catch { toast.error('Test failed — device unreachable'); }
    finally { setTesting(t => ({ ...t, [id]: false })); }
  };

  const syncDevice = async (id, name) => {
    setSyncing(s => ({ ...s, [id]: true }));
    try {
      const { data } = await api.post(`/attendance/devices/${id}/sync`);
      toast.success(`${name} synced — ${data.records} records`);
      load();
    } catch (err) { toast.error(err.response?.data?.error || 'Sync failed'); }
    finally { setSyncing(s => ({ ...s, [id]: false })); }
  };

  const removeDevice = async (id) => {
    if (!confirm('Deactivate this device?')) return;
    await api.delete(`/attendance/devices/${id}`);
    toast.success('Device deactivated');
    load();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Plus size={16} /> Add Device
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="card">
          <h3 style={{ margin: '0 0 16px', fontSize: '15px' }}>Register CP Plus Device</h3>
          <form onSubmit={addDevice} style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'flex-end' }}>
            <div>
              <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Device Name</label>
              <input className="input" placeholder="e.g. Main Gate" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
            </div>
            <div>
              <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>IP Address</label>
              <input className="input" placeholder="192.168.1.100" value={form.ipAddress} onChange={e => setForm(f => ({ ...f, ipAddress: e.target.value }))} required />
            </div>
            <div>
              <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Port</label>
              <input className="input" placeholder="4370" value={form.port} onChange={e => setForm(f => ({ ...f, port: e.target.value }))} style={{ width: '80px' }} />
            </div>
            <button type="submit" className="btn btn-primary">Register</button>
            <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
          </form>
          <p style={{ margin: '12px 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
            💡 Make sure the device is on the same network and port 4370 is open.
          </p>
        </div>
      )}

      {/* Device list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {loading ? <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Loading…</div>
          : devices.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
              <Wifi size={32} style={{ marginBottom: '12px', opacity: 0.3 }} />
              <p style={{ margin: 0 }}>No devices registered yet. Add your CP Plus device above.</p>
            </div>
          ) : devices.map(d => (
            <div key={d.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: d.isActive ? 'var(--green)22' : 'var(--red)22', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {d.isActive ? <Wifi size={18} color="var(--green)" /> : <WifiOff size={18} color="var(--red)" />}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600 }}>{d.name}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  {d.ipAddress}:{d.port} &nbsp;·&nbsp;
                  Last sync: {d.lastSync ? new Date(d.lastSync).toLocaleString('en-IN') : 'Never'}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn btn-secondary" style={{ fontSize: '12px', padding: '6px 10px' }} onClick={() => testDevice(d.id)} disabled={testing[d.id]}>
                  <TestTube size={13} /> {testing[d.id] ? 'Testing…' : 'Test'}
                </button>
                <button className="btn btn-secondary" style={{ fontSize: '12px', padding: '6px 10px' }} onClick={() => syncDevice(d.id, d.name)} disabled={syncing[d.id]}>
                  <RefreshCw size={13} className={syncing[d.id] ? 'spin' : ''} /> {syncing[d.id] ? 'Syncing…' : 'Sync'}
                </button>
                <button className="btn btn-secondary" style={{ fontSize: '12px', padding: '6px 10px', color: 'var(--red)' }} onClick={() => removeDevice(d.id)}>
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
