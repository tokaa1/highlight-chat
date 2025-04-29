import { OpenAI } from 'openai';
import { createContext, useContext, useState, ReactNode } from 'react';
import useApiKey from './settings';

interface ApiKeyContextType {
  openai: OpenAI;
}

const ApiKeyContext = createContext<ApiKeyContextType | undefined>(undefined);

export function OpenAIProvider({ children }: { children: ReactNode }) {
  const { apiKey } = useApiKey();

  const openai = new OpenAI({
    apiKey: apiKey || '',
    dangerouslyAllowBrowser: true
  });

  const value = {
    openai,
  };

  return (
    <ApiKeyContext.Provider value={value}>
      {children}
    </ApiKeyContext.Provider>
  );
}

export function useOpenAI() {
  const context = useContext(ApiKeyContext);
  if (context === undefined) {
    throw new Error('useOpenAI must be used within an OpenAIProvider');
  }
  return context;
} 