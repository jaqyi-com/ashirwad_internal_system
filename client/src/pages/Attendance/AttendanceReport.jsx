import { useEffect, useState } from 'react';
import api from '../../utils/api';
import { Download, Search, Filter } from 'lucide-react';
import toast from 'react-hot-toast';

const today = new Date().toISOString().slice(0, 10);
const monthAgo = new Date(Date.now() - 30 * 864e5).toISOString().slice(0, 10);

export default function AttendanceReport() {
  const [logs, setLogs]         = useState([]);
  const [employees, setEmployees] = useState([]);
  const [from, setFrom]         = useState(monthAgo);
  const [to, setTo]             = useState(today);
  const [empId, setEmpId]       = useState('');
  const [loading, setLoading]   = useState(false);

  useEffect(() => {
    api.get('/attendance/employees').then(r => setEmployees(r.data)).catch(() => {});
    fetchReport();
  }, []);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ from, to, ...(empId && { employeeId: empId }) });
      const { data } = await api.get(`/attendance/range?${params}`);
      setLogs(data);
    } catch { toast.error('Failed to load report'); }
    finally { setLoading(false); }
  };

  // Build daily summary rows: employee → date → first IN / last OUT / hours
  const rows = buildSummaryRows(logs);

  const exportCSV = () => {
    const header = 'Employee,Date,First IN,Last OUT,Hours\n';
    const body = rows.map(r =>
      `${r.name},${r.date},${r.firstIn || '-'},${r.lastOut || '-'},${r.hours}`
    ).join('\n');
    const blob = new Blob([header + body], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `attendance_${from}_${to}.csv`; a.click();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Filters */}
      <div className="card" style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'flex-end' }}>
        <div>
          <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>From</label>
          <input type="date" className="input" value={from} onChange={e => setFrom(e.target.value)} style={{ width: '150px' }} />
        </div>
        <div>
          <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>To</label>
          <input type="date" className="input" value={to} onChange={e => setTo(e.target.value)} style={{ width: '150px' }} />
        </div>
        <div>
          <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Employee</label>
          <select className="input" value={empId} onChange={e => setEmpId(e.target.value)} style={{ width: '180px' }}>
            <option value="">All Employees</option>
            {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
        </div>
        <button className="btn btn-primary" onClick={fetchReport} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Search size={14} /> {loading ? 'Loading…' : 'Apply'}
        </button>
        <button className="btn btn-secondary" onClick={exportCSV} style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: 'auto' }}>
          <Download size={14} /> Export CSV
        </button>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Date</th>
              <th>First IN</th>
              <th>Last OUT</th>
              <th>Hours</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No records found for selected range</td></tr>
            ) : rows.map((r, i) => (
              <tr key={i}>
                <td style={{ fontWeight: 500 }}>{r.name}</td>
                <td>{r.date}</td>
                <td style={{ color: 'var(--green)', fontFamily: 'monospace' }}>{r.firstIn || '—'}</td>
                <td style={{ color: 'var(--red)', fontFamily: 'monospace' }}>{r.lastOut || '—'}</td>
                <td style={{ fontWeight: 600 }}>{r.hours ? `${r.hours}h` : '—'}</td>
                <td>
                  <span style={{
                    padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: 600,
                    background: r.hours >= 8 ? 'var(--green)22' : r.hours > 0 ? 'var(--yellow)22' : 'var(--red)22',
                    color: r.hours >= 8 ? 'var(--green)' : r.hours > 0 ? 'var(--yellow)' : 'var(--red)',
                  }}>
                    {r.hours >= 8 ? 'Full Day' : r.hours > 0 ? 'Partial' : 'Absent'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function buildSummaryRows(logs) {
  // Group by employee + date
  const map = {};
  for (const log of logs) {
    const date = new Date(log.timestamp).toLocaleDateString('en-IN');
    const key  = `${log.employeeId}__${date}`;
    if (!map[key]) map[key] = { name: log.employee?.name || log.employeeId, date, ins: [], outs: [] };
    if (log.punchType === 'IN')  map[key].ins.push(new Date(log.timestamp));
    if (log.punchType === 'OUT') map[key].outs.push(new Date(log.timestamp));
  }

  return Object.values(map).map(r => {
    r.ins.sort(); r.outs.sort();
    const firstIn  = r.ins[0]?.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    const lastOut  = r.outs[r.outs.length - 1]?.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    const hours    = r.ins[0] && r.outs.length
      ? +((r.outs[r.outs.length - 1] - r.ins[0]) / 36e5).toFixed(1)
      : 0;
    return { ...r, firstIn, lastOut, hours };
  }).sort((a, b) => a.name.localeCompare(b.name) || a.date.localeCompare(b.date));
}
