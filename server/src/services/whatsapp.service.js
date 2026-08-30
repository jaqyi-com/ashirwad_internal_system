const twilio = require('twilio');

class WhatsAppService {
  constructor() {
    this.accountSid = process.env.TWILIO_ACCOUNT_SID;
    this.authToken = process.env.TWILIO_AUTH_TOKEN;
    this.fromNumber = process.env.TWILIO_WHATSAPP_FROM;
    
    if (this.accountSid && this.authToken) {
      this.client = twilio(this.accountSid, this.authToken);
    }
  }

  async sendMessage(to, body) {
    if (!this.client) {
      console.log(`[WhatsApp Mock] Sending message to ${to}: ${body}`);
      return { sid: 'mock_sid', status: 'mocked' };
    }

    try {
      // Ensure 'to' number starts with 'whatsapp:' if not already
      const formattedTo = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;
      
      const message = await this.client.messages.create({
        body: body,
        from: this.fromNumber,
        to: formattedTo
      });
      
      return message;
    } catch (error) {
      console.error(`WhatsApp send error to ${to}:`, error.message);
      
      // Retry once logic
      try {
        console.log(`Retrying message to ${to}...`);
        const formattedTo = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;
        const message = await this.client.messages.create({
          body: body,
          from: this.fromNumber,
          to: formattedTo
        });
        return message;
      } catch (retryError) {
        console.error(`WhatsApp retry failed to ${to}:`, retryError.message);
        throw retryError;
      }
    }
  }

  validateRequest(requestUrl, body, signature) {
    if (!this.authToken) return true; // skip validation if no token
    return twilio.validateRequest(this.authToken, signature, requestUrl, body);
  }
}

module.exports = new WhatsAppService();
