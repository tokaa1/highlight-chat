import { OpenAI } from 'openai';
import { createContext, useContext, useState, ReactNode } from 'react';
import { atomWithStorage } from 'jotai/utils';
import { Atom, useAtom, useAtomValue, useSetAtom } from 'jotai';

const apiKeyAtom = atomWithStorage<string>('apiKey', '');

const useApiKey = () => {
  const [apiKey, setApiKey] = useAtom(apiKeyAtom);
  return { apiKey, setApiKey };
};

export default useApiKey;
