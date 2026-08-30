import { useState, useEffect } from 'react';
import { Search, RefreshCw, MessageSquare, AlertCircle, CheckCircle2, FileText, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/authStore';
import api from '../../utils/api';

const STATUS_COLORS = {
  OPEN: 'var(--red)',
  IN_PROGRESS: 'var(--amber)',
  RESOLVED: 'var(--green)',
  CLOSED: 'var(--text-muted)',
};

export default function Complaints() {
  const { token } = useAuthStore();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [updating, setUpdating] = useState(false);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/tickets?search=${search}`);
      setTickets(res.data.tickets || []);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to fetch tickets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [search]);

  const updateStatus = async (id, newStatus) => {
    setUpdating(true);
    try {
      await api.patch(`/tickets/${id}/status`, { status: newStatus });
      toast.success('Status updated successfully');
      
      // Update local state
      setTickets(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t));
      if (selectedTicket?.id === id) {
        setSelectedTicket({ ...selectedTicket, status: newStatus });
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setUpdating(false);
    }
  };

  const openTicket = (ticket) => {
    setSelectedTicket(ticket);
  };

  const closeTicketDetail = () => {
    setSelectedTicket(null);
  };

  const stats = {
    total: tickets.length,
    open: tickets.filter(t => t.status === 'OPEN').length,
    inProgress: tickets.filter(t => t.status === 'IN_PROGRESS').length,
    resolved: tickets.filter(t => t.status === 'RESOLVED').length,
  };

  return (
    <div className="page-container">
      {/* Stats Bar */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'rgba(99, 102, 241, 0.1)', color: 'var(--accent)' }}>
            <MessageSquare size={20} />
          </div>
          <div className="stat-details">
            <h3>Total Tickets</h3>
            <p className="stat-value">{stats.total}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--red)' }}>
            <AlertCircle size={20} />
          </div>
          <div className="stat-details">
            <h3>Open</h3>
            <p className="stat-value">{stats.open}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', color: 'var(--amber)' }}>
            <RefreshCw size={20} />
          </div>
          <div className="stat-details">
            <h3>In Progress</h3>
            <p className="stat-value">{stats.inProgress}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', color: 'var(--green)' }}>
            <CheckCircle2 size={20} />
          </div>
          <div className="stat-details">
            <h3>Resolved</h3>
            <p className="stat-value">{stats.resolved}</p>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="toolbar">
        <div className="search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search tickets by number, phone or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button className="btn btn-secondary" onClick={fetchTickets} disabled={loading}>
          <RefreshCw size={16} className={loading ? 'spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Table */}
      <div className="table-container">
        {loading ? (
          <div className="empty-state">Loading tickets...</div>
        ) : tickets.length === 0 ? (
          <div className="empty-state">
            <FileText size={48} color="var(--text-muted)" />
            <p>No complaints found</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Ticket No.</th>
                <th>Customer WA</th>
                <th>Email</th>
                <th>Language</th>
                <th>Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map(ticket => (
                <tr key={ticket.id}>
                  <td className="font-medium">{ticket.ticketNumber}</td>
                  <td>{ticket.customerWaNumber.replace('whatsapp:', '')}</td>
                  <td>
                    {ticket.customerEmail || <span style={{ color: 'var(--text-muted)' }}>N/A</span>}
                    {ticket.emailPending && <span style={{ fontSize: '10px', color: 'var(--amber)', marginLeft: '4px' }}>(Pending)</span>}
                  </td>
                  <td>
                    <span style={{ 
                      padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold',
                      backgroundColor: 'var(--bg-hover)', color: 'var(--text-primary)', textTransform: 'uppercase'
                    }}>
                      {ticket.languageDetected}
                    </span>
                  </td>
                  <td>{new Date(ticket.createdAt).toLocaleDateString('en-IN')}</td>
                  <td>
                    <span style={{
                      padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold',
                      backgroundColor: STATUS_COLORS[ticket.status] + '20',
                      color: STATUS_COLORS[ticket.status]
                    }}>
                      {ticket.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td>
                    <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => openTicket(ticket)}>
                      View Detail
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Detail Modal */}
      {selectedTicket && (
        <div className="modal-overlay" onClick={closeTicketDetail}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '700px' }}>
            <div className="modal-header">
              <h2>Ticket {selectedTicket.ticketNumber}</h2>
              <button className="close-btn" onClick={closeTicketDetail}>&times;</button>
            </div>
            <div className="modal-body">
              
              <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
                <div style={{ flex: 1, backgroundColor: 'var(--bg-hover)', padding: '15px', borderRadius: '8px' }}>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Customer Info</p>
                  <p><strong>WA:</strong> {selectedTicket.customerWaNumber.replace('whatsapp:', '')}</p>
                  <p><strong>Name:</strong> {selectedTicket.customerName || 'N/A'}</p>
                  <p><strong>Email:</strong> {selectedTicket.customerEmail || 'N/A'}</p>
                </div>
                <div style={{ flex: 1, backgroundColor: 'var(--bg-hover)', padding: '15px', borderRadius: '8px' }}>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Ticket Info</p>
                  <p><strong>Date:</strong> {new Date(selectedTicket.createdAt).toLocaleString('en-IN')}</p>
                  <p><strong>Language:</strong> {selectedTicket.languageDetected.toUpperCase()}</p>
                  
                  <div style={{ marginTop: '10px' }}>
                    <label style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Status</label>
                    <div style={{ position: 'relative', marginTop: '4px' }}>
                      <select 
                        value={selectedTicket.status} 
                        onChange={(e) => updateStatus(selectedTicket.id, e.target.value)}
                        disabled={updating}
                        style={{
                          width: '100%', padding: '8px', borderRadius: '6px',
                          border: `1px solid ${STATUS_COLORS[selectedTicket.status]}`,
                          backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)',
                          appearance: 'none', fontWeight: 'bold'
                        }}
                      >
                        <option value="OPEN">OPEN</option>
                        <option value="IN_PROGRESS">IN PROGRESS</option>
                        <option value="RESOLVED">RESOLVED</option>
                        <option value="CLOSED">CLOSED</option>
                      </select>
                      <ChevronDown size={14} style={{ position: 'absolute', right: '10px', top: '10px', pointerEvents: 'none' }} />
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 style={{ marginBottom: '10px', fontSize: '14px', borderBottom: '1px solid var(--border-light)', paddingBottom: '8px' }}>Complaint Details</h3>
                
                <div style={{ marginBottom: '16px' }}>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Original Message ({selectedTicket.languageDetected})</p>
                  <div style={{ padding: '12px', backgroundColor: 'var(--bg-primary)', borderRadius: '6px', border: '1px solid var(--border-light)' }}>
                    {selectedTicket.originalComplaint}
                  </div>
                </div>

                {selectedTicket.translatedComplaint && (
                  <div>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>English Translation</p>
                    <div style={{ padding: '12px', backgroundColor: 'var(--bg-primary)', borderRadius: '6px', border: '1px solid var(--border-light)' }}>
                      {selectedTicket.translatedComplaint}
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
