const express = require('express');
const prisma = require('../config/prisma');
const whatsappService = require('../services/whatsapp.service');
const emailService = require('../services/email.service');
const languageService = require('../services/language.service');
const ticketService = require('../services/ticket.service');
const { asyncHandler } = require('../middleware/error.middleware');

const router = express.Router();

// Meta requires a GET endpoint for webhook verification during setup
router.get('/webhook', (req, res) => {
  const verify_token = process.env.META_WEBHOOK_VERIFY_TOKEN;

  let mode = req.query['hub.mode'];
  let token = req.query['hub.verify_token'];
  let challenge = req.query['hub.challenge'];

  if (mode && token) {
    if (mode === 'subscribe' && token === verify_token) {
      console.log('WEBHOOK_VERIFIED');
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  } else {
    res.sendStatus(400);
  }
});

router.post('/webhook', asyncHandler(async (req, res) => {
  try {
    const body = req.body;

    // Validate incoming webhook structure from Meta
    if (body.object !== 'whatsapp_business_account') {
      return res.sendStatus(404);
    }

  // Iterate over entries and changes
  for (const entry of body.entry) {
    for (const change of entry.changes) {
      const value = change.value;
      
      // We only care about incoming messages
      if (value && value.messages && value.messages[0]) {
        const message = value.messages[0];
        
        // Only process text messages for now
        if (message.type !== 'text') continue;

        const waNumber = message.from; // Usually in format "919876543210"
        const messageText = message.text.body.trim();
        
        // Extract customer name if available
        let customerName = '';
        if (value.contacts && value.contacts[0] && value.contacts[0].profile) {
          customerName = value.contacts[0].profile.name || '';
        }

        // --- Core State Machine Logic ---
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
          continue;
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
          continue;
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
              continue;
            } else {
              // Proceed without email after 2 failed attempts
              emailPending = true;
            }
          }

          // Process language
          const originalComplaint = session.tempComplaint;
          const { language, translatedText } = await languageService.detectAndTranslate(originalComplaint);

          // Create ticket (add prefix so UI knows it's whatsapp)
          const formattedWaNumber = `whatsapp:+${waNumber}`;
          const ticket = await ticketService.createTicket({
            customerWaNumber: formattedWaNumber,
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
      }
    }
  }
    
    // Successfully processed everything, send 200 OK so Meta doesn't retry
    res.sendStatus(200);

  } catch (error) {
    console.error('Webhook processing error:', error);
    // Meta requires 200 OK even on failures to prevent endless retries
    res.sendStatus(200); 
  }
}));

module.exports = router;
