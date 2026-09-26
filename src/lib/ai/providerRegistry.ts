import { AIProviderName } from '../../types';
import { AIProviderAdapter } from './providerTypes';
import { GeminiProvider } from './providers/gemini';
import { GroqProvider } from './providers/groq';
import { MistralProvider } from './providers/mistral';
import { OpenRouterProvider } from './providers/openrouter';
import { HuggingFaceProvider } from './providers/huggingface';
import { CerebrasProvider } from './providers/cerebras';

class ProviderRegistry {
  private adapters: Map<AIProviderName, AIProviderAdapter> = new Map();

  constructor() {
    this.register(new GeminiProvider());
    this.register(new GroqProvider());
    this.register(new MistralProvider());
    this.register(new OpenRouterProvider());
    this.register(new HuggingFaceProvider());
    this.register(new CerebrasProvider());
  }

  register(adapter: AIProviderAdapter) {
    this.adapters.set(adapter.id, adapter);
  }

  get(id: AIProviderName): AIProviderAdapter {
    const adapter = this.adapters.get(id);
    if (!adapter) {
      // Default fallback to Gemini
      return this.adapters.get('gemini')!;
    }
    return adapter;
  }

  getAll(): AIProviderAdapter[] {
    return Array.from(this.adapters.values());
  }

  has(id: AIProviderName): boolean {
    return this.adapters.has(id);
  }

  detectProviderFromKey(key: string): AIProviderName | null {
    if (!key || typeof key !== 'string') return null;
    const trimmed = key.trim();
    if (!trimmed) return null;

    // Check each adapter's detectKey method
    for (const adapter of this.adapters.values()) {
      if (adapter.detectKey(trimmed)) {
        return adapter.id;
      }
    }

    return null;
  }
}

export const providerRegistry = new ProviderRegistry();
