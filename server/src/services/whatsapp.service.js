class WhatsAppService {
  constructor() {
    this.token = process.env.META_WHATSAPP_TOKEN;
    this.phoneNumberId = process.env.META_PHONE_NUMBER_ID;
    this.apiVersion = 'v19.0';
  }

  async sendMessage(to, bodyText) {
    if (!this.token || !this.phoneNumberId || this.token.includes('your_meta')) {
      console.log(`[WhatsApp Mock] Sending message to ${to}: ${bodyText}`);
      return { status: 'mocked' };
    }

    // Clean phone number (Meta expects pure numbers, e.g., '919876543210' without '+' or 'whatsapp:')
    let cleanTo = to.replace(/\D/g, '');

    try {
      const response = await fetch(`https://graph.facebook.com/${this.apiVersion}/${this.phoneNumberId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: cleanTo,
          type: 'text',
          text: {
            preview_url: false,
            body: bodyText
          }
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to send WhatsApp message');
      }

      return data;
    } catch (error) {
      console.error(`Meta WhatsApp send error to ${cleanTo}:`, error.message);
      throw error;
    }
  }
}

module.exports = new WhatsAppService();
