import { AISettings, HistoryItem } from '../../types';

const SETTINGS_KEY = 'sweetprompts_pro_settings_v1';
const HISTORY_KEY = 'sweetprompts_pro_history_v1';

export const DEFAULT_SETTINGS: AISettings = {
  provider: 'gemini',
  apiKey: '',
  apiKeys: {
    gemini: '',
    groq: '',
    mistral: '',
    openrouter: '',
    huggingface: '',
    cerebras: '',
  },
  model: 'gemini-2.5-flash',
  temperature: 0.7,
  maxTokens: 1000,
  defaultPromptCount: 5,
  commercialMode: true,
  theme: 'dark',
  themeStyle: 'sweet',
  defaultCopySpace: 'Right',
  defaultContentType: 'Photo'
};

export function getStoredSettings(): AISettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    const mergedApiKeys: Partial<Record<string, string>> = {
      gemini: '',
      groq: '',
      mistral: '',
      openrouter: '',
      huggingface: '',
      cerebras: '',
      ...(parsed.apiKeys || {})
    };
    // If there is a legacy single apiKey and active provider, ensure it's in apiKeys
    if (parsed.apiKey && parsed.provider && !mergedApiKeys[parsed.provider]) {
      mergedApiKeys[parsed.provider] = parsed.apiKey;
    }
    return { 
      ...DEFAULT_SETTINGS, 
      ...parsed,
      apiKeys: mergedApiKeys as any
    };
  } catch (e) {
    return DEFAULT_SETTINGS;
  }
}

export function saveStoredSettings(settings: AISettings): void {
  try {
    // Ensure apiKey is kept in sync with the active provider's key
    const currentProvider = settings.provider || 'gemini';
    const activeKey = settings.apiKeys?.[currentProvider] || settings.apiKey || '';
    const syncedSettings: AISettings = {
      ...settings,
      apiKey: activeKey,
      apiKeys: {
        ...(settings.apiKeys || {}),
        [currentProvider]: activeKey,
      }
    };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(syncedSettings));
  } catch (e) {
    console.error('Failed to save settings:', e);
  }
}

export function getStoredHistory(): HistoryItem[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}

export function saveHistoryItem(item: Omit<HistoryItem, 'id' | 'createdAt'>): HistoryItem {
  const history = getStoredHistory();
  const newItem: HistoryItem = {
    ...item,
    id: 'hist_' + Math.random().toString(36).substr(2, 9),
    createdAt: Date.now(),
  };

  const updated = [newItem, ...history].slice(0, 150); // Keep last 150
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save history:', e);
  }
  return newItem;
}

export function deleteHistoryItem(id: string): HistoryItem[] {
  const history = getStoredHistory();
  const updated = history.filter(item => item.id !== id);
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to delete history:', e);
  }
  return updated;
}

export function clearAllHistory(): void {
  try {
    localStorage.removeItem(HISTORY_KEY);
  } catch (e) {
    console.error('Failed to clear history:', e);
  }
}

const LIBRARY_KEY = 'sweetprompts_pro_library_v1';

export function getStoredLibrary(): any[] {
  try {
    const raw = localStorage.getItem(LIBRARY_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}

export function saveLibraryItem(item: any): any {
  const library = getStoredLibrary();
  const newItem = {
    ...item,
    id: item.id || 'lib_' + Math.random().toString(36).substr(2, 9),
    createdAt: item.createdAt || Date.now(),
  };

  const updated = [newItem, ...library.filter((l: any) => l.id !== newItem.id)];
  try {
    localStorage.setItem(LIBRARY_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save library item:', e);
  }
  return newItem;
}

export function deleteLibraryItem(id: string): any[] {
  const library = getStoredLibrary();
  const updated = library.filter((item: any) => item.id !== id);
  try {
    localStorage.setItem(LIBRARY_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to delete library item:', e);
  }
  return updated;
}

export function clearAllLibrary(): void {
  try {
    localStorage.removeItem(LIBRARY_KEY);
  } catch (e) {
    console.error('Failed to clear library:', e);
  }
}
