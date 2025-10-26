import {genkit} from 'genkit';
import {openAI} from 'genkitx-openai';
import {config} from 'dotenv';

config();

export const ai = genkit({
  plugins: [
    openAI({
      apiKey: process.env.AI_API_KEY,
      baseURL: 'https://openrouter.ai/api/v1',
    }),
  ],
  model: 'openai/gpt-4o',
});
