import OpenAI from 'openai';

import config from './configs/config';
import { ChatMessage } from './types/ai';

let deepseekClient: OpenAI | null = null;
let embeddingClient: OpenAI | null = null;

export function initializeClients(): void {
  const deepseekApiKey = process.env.DEEPSEEK_API_KEY;
  const embeddingApiKey = process.env.EMBEDDING_API_KEY;

  if (!deepseekApiKey) {
    throw new Error('DEEPSEEK_API_KEY not found in environment variables');
  }

  if (!embeddingApiKey) {
    throw new Error('EMBEDDING_API_KEY not found in environment variables');
  }

  deepseekClient = new OpenAI({
    apiKey: deepseekApiKey,
    baseURL: 'https://api.deepseek.com/v1',
  });

  embeddingClient = new OpenAI({
    apiKey: embeddingApiKey,
    baseURL: 'https://api.together.xyz/v1',
  });

  console.log('API clients initialized successfully');
}

export async function callDeepseekChat(
  prompt: string,
  model: string = config.models.deepseekChatModel,
  systemPrompt?: string
): Promise<string | null> {
  if (!deepseekClient) {
    throw new Error('Deepseek client not initialized. Call initializeClients() first.');
  }

  const messages: ChatMessage[] = [];

  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
  }

  messages.push({ role: 'user', content: prompt });

  try {
    const response = await deepseekClient.chat.completions.create({
      model,
      messages,
      max_tokens: 2048,
      temperature: 0.7,
    });

    return response.choices[0]?.message?.content?.trim() || null;
  } catch (error) {
    console.error('Error calling Deepseek Chat API:', error);

    // Basic backoff - wait 1 second before returning null
    await new Promise(resolve => setTimeout(resolve, 1000));
    return null;
  }
}

export async function getEmbedding(
  text: string,
  model: string = config.models.embeddingModel
): Promise<number[] | null> {
  if (!embeddingClient) {
    throw new Error('Embedding client not initialized. Call initializeClients() first.');
  }

  console.log(`INFO: Getting embedding for text snippet: '${text.substring(0, 50)}...'`);

  try {
    const response = await embeddingClient.embeddings.create({
      model,
      input: [text],
    });

    if (response.data && response.data.length > 0) {
      return response.data[0].embedding;
    } else {
      console.warn('Warning: No embedding returned for text.');
      return null;
    }
  } catch (error) {
    console.error('Error calling Embedding API:', error);
    return null;
  }
}

export async function getBatchEmbeddings(
  texts: string[],
  model: string = config.models.embeddingModel
): Promise<(number[] | null)[]> {
  if (!embeddingClient) {
    throw new Error('Embedding client not initialized. Call initializeClients() first.');
  }

  const results: (number[] | null)[] = [];

  // Process in batches to avoid rate limits
  const batchSize = 10;
  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);

    try {
      const response = await embeddingClient.embeddings.create({
        model,
        input: batch,
      });

      batch.forEach((_, index) => {
        if (response.data[index]) {
          results.push(response.data[index].embedding);
        } else {
          results.push(null);
        }
      });

      // Rate limiting between batches
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`Error getting batch embeddings for batch ${i}:`, error);
      // Add nulls for failed batch
      batch.forEach(() => results.push(null));
    }
  }

  return results;
}

export async function testApiConnectivity(): Promise<{
  deepseek: boolean;
  embedding: boolean;
  errors: string[];
}> {
  const errors: string[] = [];
  let deepseekWorking = false;
  let embeddingWorking = false;

  // Test Deepseek
  try {
    const testPrompt = 'Respond with "OK" if you can read this.';
    const response = await callDeepseekChat(testPrompt);
    deepseekWorking = response !== null;
    if (!deepseekWorking) {
      errors.push('Deepseek API returned null response');
    }
  } catch (error) {
    errors.push(`Deepseek API error: ${error}`);
  }

  try {
    const testText = 'This is a test for embedding API connectivity.';
    const embedding = await getEmbedding(testText);
    embeddingWorking = embedding !== null && embedding.length > 0;
    if (!embeddingWorking) {
      errors.push('Embedding API returned null or empty embedding');
    }
  } catch (error) {
    errors.push(`Embedding API error: ${error}`);
  }

  return {
    deepseek: deepseekWorking,
    embedding: embeddingWorking,
    errors,
  };
}

export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;

      if (attempt === maxRetries) {
        throw lastError;
      }

      const delay = baseDelay * Math.pow(2, attempt - 1);
      console.log(`API call failed (attempt ${attempt}/${maxRetries}). Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}

export async function getAvailableModels(): Promise<{
  chatModels: string[];
  embeddingModels: string[];
}> {
  const chatModels: string[] = [];
  const embeddingModels: string[] = [];

  try {
    if (deepseekClient) {
      // Note: This might not be supported by all APIs
      // const response = await deepseekClient.models.list();
      // chatModels = response.data.map(model => model.id);

      // For now, return known models
      chatModels.push(config.models.deepseekChatModel);
    }
  } catch (error) {
    console.warn('Could not fetch chat models:', error);
  }

  try {
    if (embeddingClient) {
      // Similarly, return known embedding models
      embeddingModels.push(config.models.embeddingModel);
    }
  } catch (error) {
    console.warn('Could not fetch embedding models:', error);
  }

  return {
    chatModels,
    embeddingModels,
  };
}
