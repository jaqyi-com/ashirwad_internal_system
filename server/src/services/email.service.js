const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.adminEmail = process.env.ADMIN_EMAIL || 'admin@ashirwadenterprises.com';
    
    // Create reusable transporter object using SMTP transport
    if (process.env.SMTP_HOST && process.env.SMTP_USER) {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT || 587,
        secure: process.env.SMTP_PORT === '465',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    }
  }

  async sendEmail(to, subject, html) {
    if (!this.transporter) {
      console.log(`[Email Mock] Sending to ${to} | Subject: ${subject}`);
      return { messageId: 'mock_message_id' };
    }

    try {
      const info = await this.transporter.sendMail({
        from: `"Ashirwad Enterprises" <${process.env.SMTP_USER || 'no-reply@ashirwadenterprises.com'}>`,
        to: to,
        subject: subject,
        html: html,
      });
      return info;
    } catch (error) {
      console.error(`Email send error to ${to}:`, error.message);
      throw error;
    }
  }

  async sendAdminNotification(ticket) {
    const subject = `[New Complaint] Ticket ${ticket.ticketNumber} from ${ticket.customerName || ticket.customerWaNumber}`;
    const html = `
      <h2>New Complaint Ticket Created</h2>
      <p><strong>Ticket ID:</strong> ${ticket.ticketNumber}</p>
      <p><strong>Customer WhatsApp:</strong> ${ticket.customerWaNumber}</p>
      <p><strong>Customer Name:</strong> ${ticket.customerName || 'N/A'}</p>
      <p><strong>Customer Email:</strong> ${ticket.customerEmail || 'N/A'}</p>
      <p><strong>Language:</strong> ${ticket.languageDetected}</p>
      <hr />
      <h3>Original Complaint:</h3>
      <p>${ticket.originalComplaint}</p>
      ${ticket.translatedComplaint ? `
      <hr />
      <h3>English Translation:</h3>
      <p>${ticket.translatedComplaint}</p>
      ` : ''}
      <hr />
      <p>Please log in to the IMS Dashboard to update the status.</p>
    `;

    return this.sendEmail(this.adminEmail, subject, html);
  }

  async sendCustomerConfirmation(ticket) {
    if (!ticket.customerEmail) return null;

    const subject = `Ashirwad Enterprises - Complaint Received (Ticket ${ticket.ticketNumber})`;
    const html = `
      <h2>Complaint Ticket Confirmation</h2>
      <p>Dear ${ticket.customerName || 'Customer'},</p>
      <p>We have successfully registered your complaint. Our team will contact you shortly.</p>
      <p><strong>Ticket ID:</strong> ${ticket.ticketNumber}</p>
      <p><strong>Date Raised:</strong> ${new Date(ticket.createdAt).toLocaleString('en-IN')}</p>
      <hr />
      <h3>Complaint Summary:</h3>
      <p>${ticket.translatedComplaint || ticket.originalComplaint}</p>
      <hr />
      <p>Thank you for choosing Ashirwad Enterprises.</p>
    `;

    return this.sendEmail(ticket.customerEmail, subject, html);
  }
}

module.exports = new EmailService();
