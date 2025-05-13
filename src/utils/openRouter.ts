
import OpenAI from 'openai';

// Create a class to handle OpenRouter integration
export class OpenRouterService {
  private openai: OpenAI | null = null;
  private apiKey: string = '';

  initialize(apiKey: string) {
    if (!apiKey) {
      console.error('API key is required');
      return false;
    }

    this.apiKey = apiKey;
    this.openai = new OpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: apiKey,
      defaultHeaders: {
        "HTTP-Referer": window.location.href,
        "X-Title": "Interactive Learning Platform",
      },
    });

    return true;
  }

  async generatePollFromTranscript(transcript: string): Promise<any> {
    if (!this.openai || !this.apiKey) {
      console.error('OpenRouter not initialized');
      return null;
    }

    try {
      const completion = await this.openai.chat.completions.create({
        model: "qwen/qwen3-0.6b-04-28:free",
        messages: [
          {
            role: "system",
            content: "You are an AI that creates multiple choice quiz questions from lecture transcripts. Create one good question with 4 options based on the transcript."
          },
          {
            role: "user",
            content: transcript
          }
        ],
        temperature: 0.7,
        max_tokens: 300,
      });

      const responseText = completion.choices[0]?.message?.content;
      if (!responseText) return null;

      // Parse the response to extract question and options
      try {
        // Simple parsing assuming a format like:
        // Question: What is X?
        // A. Option 1
        // B. Option 2
        // C. Option 3
        // D. Option 4
        const lines = responseText.split('\n').filter(line => line.trim());
        const question = lines[0].replace(/^(Question:|Q:)?\s*/i, '').trim();
        const options = lines.slice(1)
          .filter(line => /^[A-D]\./.test(line))
          .map(line => line.replace(/^[A-D]\.\s*/i, '').trim());

        if (question && options.length >= 2) {
          return {
            id: `poll-${Date.now()}`,
            question,
            options,
            createdAt: new Date()
          };
        }
      } catch (parseError) {
        console.error('Error parsing poll response:', parseError);
      }
      return null;
    } catch (error) {
      console.error('Error generating poll:', error);
      return null;
    }
  }

  isInitialized(): boolean {
    return !!this.openai && !!this.apiKey;
  }
}

// Export a singleton instance
const openRouter = new OpenRouterService();
export default openRouter;
