import api from './api';

export interface Ticket {
  id: string;
  ticketNumber: string;
  customerWaNumber: string;
  customerName?: string;
  customerEmail?: string;
  emailPending: boolean;
  originalComplaint: string;
  languageDetected: string;
  translatedComplaint?: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  createdAt: string;
}

export const getTickets = async (search = '') => {
  const response = await api.get(`/tickets?search=${encodeURIComponent(search)}`);
  return response.data.tickets as Ticket[];
};

export const updateTicketStatus = async (id: string, status: string) => {
  const response = await api.patch(`/tickets/${id}/status`, { status });
  return response.data;
};
