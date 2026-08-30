// ── Central AI engine — shared types ──────────────────────────────────────────

/** Providers that passed the capability audit (text + JSON, browser CORS, free/freemium API). */
export type ProviderId =
  | "gemini"
  | "mistral"
  | "groq"
  | "openrouter"
  | "cerebras"
  | "together"
  | "huggingface"
  | "cohere";

export type ModelInfo = {
  id: string;
  label: string;
  /** True when this model accepts image input. */
  vision: boolean;
  /** Rough note shown in the UI, e.g. "fast", "vision". */
  note?: string;
};

export type ProviderCapabilities = {
  text: boolean;
  vision: boolean;
  structuredOutput: boolean;
  /** Max output tokens the engine will request from this provider. */
  maxOutputTokens: number;
  /** Max input characters accepted for prompt + system combined. */
  maxInputChars: number;
  /** Max image payload (bytes, decoded) the engine will send. */
  maxImageBytes: number;
};

export type ChatRequest = {
  system: string;
  user: string;
  /** data: URL — presence switches the request to vision mode. */
  imageDataUrl?: string;
  maxTokens?: number;
  temperature?: number;
  /** Ask the provider for JSON output when supported. */
  jsonMode?: boolean;
  signal?: AbortSignal;
};

export type ProviderRuntimeConfig = {
  apiKey: string;
  model: string;
};

export type ProviderAdapter = {
  id: ProviderId;
  name: string;
  icon: string;
  /** Accurate access wording — "Free tier", "Free trial credits", etc. Never plain "Free". */
  accessLabel: string;
  description: string;
  docsUrl: string;
  keyPlaceholder: string;
  keyPattern?: RegExp;
  capabilities: ProviderCapabilities;
  models: ModelInfo[];
  defaultModel: string;
  /** Model automatically used for vision requests when the selected model lacks vision (same provider only). */
  defaultVisionModel?: string;
  /** Returns true when the given model id supports image input. */
  modelSupportsVision: (model: string) => boolean;
  chat: (req: ChatRequest, cfg: ProviderRuntimeConfig) => Promise<string>;
  validateKey: (key: string) => Promise<void>;
  listModels?: (key: string) => Promise<string[]>;
};

export type AIConfig = {
  version: 2;
  /** Active provider — every AI feature in the app uses this. No silent fallback. */
  provider: ProviderId | "";
  providers: Partial<
    Record<
      ProviderId,
      {
        apiKey: string;
        model: string;
        connectedAt: number;
        /** Only set after a real successful validation call. */
        validated: boolean;
      }
    >
  >;
};
