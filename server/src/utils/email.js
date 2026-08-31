const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'akshat@jaqyi.com',
    pass: 'lyda wzfw dvlh uhcr'
  }
});

const sendTicketEmail = async (ticket) => {
  try {
    const mailOptions = {
      from: '"Ashirwad Helpdesk" <akshat@jaqyi.com>',
      to: 'ashirwad.2512@gmail.com',
      subject: `New Complaint Ticket Generated: ${ticket.ticketNumber}`,
      html: `
        <h2>New Complaint Ticket Received</h2>
        <p><strong>Ticket Number:</strong> ${ticket.ticketNumber}</p>
        <p><strong>Customer WhatsApp:</strong> ${ticket.customerWaNumber}</p>
        <p><strong>Complaint:</strong> ${ticket.originalComplaint}</p>
        ${ticket.translatedComplaint && ticket.languageDetected !== 'en' ? `<p><strong>Translated:</strong> ${ticket.translatedComplaint}</p>` : ''}
        <p><strong>Status:</strong> ${ticket.status}</p>
        <p>Please log in to the admin panel to view more details.</p>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Ticket email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending ticket email:', error);
    return false;
  }
};

module.exports = {
  sendTicketEmail
};
