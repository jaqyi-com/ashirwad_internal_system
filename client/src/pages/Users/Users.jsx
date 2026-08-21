import { useState, useEffect } from 'react';
import api from '../../utils/api';
import { formatDate } from '../../utils/helpers';
import { Users, Plus, Edit2, X } from 'lucide-react';
import toast from 'react-hot-toast';

const ROLES = ['ADMIN', 'MANAGER', 'WAREHOUSE_STAFF', 'ACCOUNTANT', 'SALES_STAFF', 'STAFF'];

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [edit, setEdit] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'STAFF', isActive: true });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const { data } = await api.get('/users');
    setUsers(data);
  };
  useEffect(() => { load(); }, []);

  const openAdd = () => { setEdit(null); setForm({ name: '', email: '', password: '', role: 'STAFF', isActive: true }); setShowModal(true); };
  const openEdit = (u) => { setEdit(u); setForm({ name: u.name, email: u.email, password: '', role: u.role, isActive: u.isActive }); setShowModal(true); };

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      if (edit) {
        const data = { name: form.name, role: form.role, isActive: form.isActive };
        if (form.password) data.password = form.password;
        await api.put(`/users/${edit.id}`, data);
        toast.success('User updated!');
      } else {
        await api.post('/auth/register', form);
        toast.success('User created!');
      }
      setShowModal(false); load();
    } catch (err) { toast.error(err.response?.data?.error || 'Error'); } finally { setSaving(false); }
  };

  const ROLE_COLORS = { ADMIN: 'badge-purple', MANAGER: 'badge-blue', WAREHOUSE_STAFF: 'badge-green', ACCOUNTANT: 'badge-yellow', SALES_STAFF: 'badge-orange', STAFF: 'badge-gray' };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700 }}>User Management</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>{users.length} users</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}><Plus size={16} /> Add User</button>
      </div>

      <div className="table-wrapper">
        {users.length === 0 ? (
          <div className="empty-state"><Users size={48} /><h3>No users yet</h3></div>
        ) : (
          <table>
            <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Last Login</th><th></th></tr></thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: '50%',
                        background: 'linear-gradient(135deg, var(--accent), var(--purple))',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '13px', fontWeight: 700, color: 'white', flexShrink: 0,
                      }}>{u.name?.charAt(0).toUpperCase()}</div>
                      <span style={{ fontWeight: 600 }}>{u.name}</span>
                    </div>
                  </td>
                  <td style={{ fontSize: '13px' }}>{u.email}</td>
                  <td><span className={`badge ${ROLE_COLORS[u.role] || 'badge-gray'}`}>{u.role}</span></td>
                  <td><span className={`badge ${u.isActive ? 'badge-green' : 'badge-red'}`}>{u.isActive ? 'Active' : 'Inactive'}</span></td>
                  <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{formatDate(u.lastLogin) || 'Never'}</td>
                  <td>
                    <button className="btn btn-secondary btn-sm" onClick={() => openEdit(u)}><Edit2 size={13} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal" style={{ maxWidth: 480 }}>
            <div className="modal-header">
              <h2>{edit ? 'Edit User' : 'Add User'}</h2>
              <button className="btn btn-secondary btn-sm btn-icon" onClick={() => setShowModal(false)}><X size={16} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Full Name <span>*</span></label>
                  <input className="form-input" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                </div>
                {!edit && (
                  <div className="form-group">
                    <label className="form-label">Email <span>*</span></label>
                    <input type="email" className="form-input" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                  </div>
                )}
                <div className="form-group">
                  <label className="form-label">{edit ? 'New Password (leave blank to keep)' : 'Password *'}</label>
                  <input type="password" className="form-input" required={!edit} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Role</label>
                  <select className="form-select" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                    {ROLES.map(r => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
                  </select>
                </div>
                {edit && (
                  <div className="form-group">
                    <label className="form-label">Status</label>
                    <select className="form-select" value={String(form.isActive)} onChange={e => setForm({ ...form, isActive: e.target.value === 'true' })}>
                      <option value="true">Active</option>
                      <option value="false">Inactive</option>
                    </select>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : edit ? 'Update' : 'Create User'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
