const { OpenAI } = require('openai');

class LanguageService {
  constructor() {
    this.openai = null;
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    }
  }

  async detectAndTranslate(text) {
    if (this.openai) {
      try {
        const response = await this.openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: `You are a helpful language assistant. Analyze the given text and determine its language: 'en' for English, 'hi' for Hindi (Devanagari), or 'hinglish' for Hindi written in Latin script or mixed Hindi-English. 
              If the text is NOT purely English, provide a translated version in professional English. 
              Respond ONLY with a JSON object in this format: {"language": "en|hi|hinglish", "translatedText": "english translation here, or empty if already english"}`
            },
            {
              role: 'user',
              content: text
            }
          ],
          response_format: { type: 'json_object' }
        });

        const result = JSON.parse(response.choices[0].message.content);
        return {
          language: result.language || 'en',
          translatedText: result.translatedText || null
        };
      } catch (error) {
        console.error('OpenAI translation failed, falling back to heuristics:', error.message);
        return this.fallbackHeuristics(text);
      }
    } else {
      return this.fallbackHeuristics(text);
    }
  }

  fallbackHeuristics(text) {
    // Simple heuristic fallback if no OpenAI key
    const devanagariRegex = /[\u0900-\u097F]/;
    
    let language = 'en';
    if (devanagariRegex.test(text)) {
      language = 'hi';
    } else {
      // Basic Hinglish check: contains common Hinglish words
      const hinglishWords = ['kya', 'hai', 'bhi', 'mera', 'ka', 'ko', 'se', 'hai', 'nahi'];
      const words = text.toLowerCase().split(/\s+/);
      const hinglishCount = words.filter(w => hinglishWords.includes(w)).length;
      
      if (hinglishCount > 0) {
        language = 'hinglish';
      }
    }

    return {
      language: language,
      translatedText: null // Cannot translate without AI
    };
  }
}

module.exports = new LanguageService();
