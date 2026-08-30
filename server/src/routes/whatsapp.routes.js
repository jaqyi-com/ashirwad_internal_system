const express = require('express');
const twilio = require('twilio');
const prisma = require('../config/prisma');
const whatsappService = require('../services/whatsapp.service');
const emailService = require('../services/email.service');
const languageService = require('../services/language.service');
const ticketService = require('../services/ticket.service');
const { asyncHandler } = require('../middleware/error.middleware');

const router = express.Router();

// Helper to send TwiML empty response quickly
const sendEmptyTwiml = (res) => {
  const twiml = new twilio.twiml.MessagingResponse();
  res.type('text/xml').send(twiml.toString());
};

router.post('/webhook', asyncHandler(async (req, res) => {
  // Acknowledge receipt immediately
  sendEmptyTwiml(res);

  // Parse Twilio payload
  const { From, Body, ProfileName } = req.body;
  if (!From || !Body) return;

  const waNumber = From; // e.g. "whatsapp:+919876543210"
  const messageText = Body.trim();
  const customerName = ProfileName || '';

  // Get or create session
  let session = await prisma.whatsAppSession.findUnique({ where: { waNumber } });
  
  const now = new Date();
  if (!session || session.expiresAt < now || session.state === 'completed') {
    // New conversation
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24h
    if (session) {
      session = await prisma.whatsAppSession.update({
        where: { waNumber },
        data: { state: 'awaiting_complaint', tempComplaint: null, emailAttempts: 0, expiresAt }
      });
    } else {
      session = await prisma.whatsAppSession.create({
        data: { waNumber, state: 'awaiting_complaint', expiresAt }
      });
    }

    await whatsappService.sendMessage(
      waNumber, 
      `Hello ${customerName}! Welcome to Ashirwad Enterprises Support.\n\nPlease describe your complaint in detail. You can type in English, Hindi, or Hinglish.`
    );
    return;
  }

  // Handle existing session states
  if (session.state === 'awaiting_complaint') {
    // Process complaint and ask for email
    await prisma.whatsAppSession.update({
      where: { waNumber },
      data: { state: 'awaiting_email', tempComplaint: messageText }
    });

    await whatsappService.sendMessage(
      waNumber,
      'Got it. Please share your email ID so we can send you the ticket confirmation and updates.'
    );
    return;
  }

  if (session.state === 'awaiting_email') {
    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValidEmail = emailRegex.test(messageText);

    let customerEmail = null;
    let emailPending = false;

    if (isValidEmail) {
      customerEmail = messageText;
    } else {
      const attempts = session.emailAttempts + 1;
      if (attempts < 2) {
        // Re-prompt once
        await prisma.whatsAppSession.update({
          where: { waNumber },
          data: { emailAttempts: attempts }
        });
        await whatsappService.sendMessage(
          waNumber,
          'That doesn\'t look like a valid email address. Please try again (e.g. name@example.com).'
        );
        return;
      } else {
        // Proceed without email after 2 failed attempts
        emailPending = true;
      }
    }

    // Process language
    const originalComplaint = session.tempComplaint;
    const { language, translatedText } = await languageService.detectAndTranslate(originalComplaint);

    // Create ticket
    const ticket = await ticketService.createTicket({
      customerWaNumber: waNumber,
      customerName,
      customerEmail,
      emailPending,
      originalComplaint,
      languageDetected: language,
      translatedComplaint: translatedText,
    });

    // Mark session completed
    await prisma.whatsAppSession.update({
      where: { waNumber },
      data: { state: 'completed', tempComplaint: null }
    });

    // Async notifications (fire and forget)
    // 1. Notify Admin
    try {
      await emailService.sendAdminNotification(ticket);
      await prisma.complaintTicket.update({ where: { id: ticket.id }, data: { adminNotified: true } });
    } catch (e) {
      console.error('Failed to notify admin:', e.message);
    }

    // 2. Notify Customer (WhatsApp)
    try {
      await whatsappService.sendMessage(
        waNumber,
        `Thank you! Your complaint has been registered.\n\n*Ticket ID:* ${ticket.ticketNumber}\n\nOur team will contact you shortly to resolve this issue.`
      );
      await prisma.complaintTicket.update({ where: { id: ticket.id }, data: { customerConfirmed: true } });
    } catch (e) {
      console.error('Failed to notify customer on WhatsApp:', e.message);
    }

    // 3. Notify Customer (Email)
    if (customerEmail) {
      try {
        await emailService.sendCustomerConfirmation(ticket);
      } catch (e) {
        console.error('Failed to notify customer via email:', e.message);
      }
    }
  }
}));

module.exports = router;
