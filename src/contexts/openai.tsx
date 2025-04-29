import { OpenAI } from 'openai';
import { createContext, useContext, useState, ReactNode } from 'react';

interface ApiKeyContextType {
  apiKey: string | null;
  setApiKey: (key: string | null) => void;
  setOpenKeyPrompt: (b: boolean) => void;
  isOpenKeyPromptOpen: boolean;
  openai: OpenAI;
}

const ApiKeyContext = createContext<ApiKeyContextType | undefined>(undefined);

export function ApiKeyProvider({ setOpenKeyPrompt, isOpenKeyPromptOpen, children }: { setOpenKeyPrompt: (b: boolean) => void, isOpenKeyPromptOpen: boolean, children: ReactNode }) {
  const [apiKey, setApiKeyState] = useState<string | null>(() => {
    return localStorage.getItem('apiKey');
  });

  const setApiKey = (key: string | null) => {
    if (key) {
      localStorage.setItem('apiKey', key);
    } else {
      localStorage.removeItem('apiKey');
    }
    setApiKeyState(key);
  };

  const openai = new OpenAI({// todo: make this nullable so code is clearer
    apiKey: apiKey || '',
    dangerouslyAllowBrowser: true
  });

  const value = {
    apiKey,
    setApiKey,
    setOpenKeyPrompt,
    isOpenKeyPromptOpen,
    openai,
  };

  return (
    <ApiKeyContext.Provider value={value}>
      {children}
    </ApiKeyContext.Provider>
  );
}

export function useApiKey() {
  const context = useContext(ApiKeyContext);
  if (context === undefined) {
    throw new Error('useApiKey must be used within an ApiKeyProvider');
  }
  return context;
} 