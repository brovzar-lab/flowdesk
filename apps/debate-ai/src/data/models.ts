import type { Model } from '../types';

export const MODELS: Model[] = [
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    provider: 'OpenAI',
    openrouterId: 'openai/gpt-4o',
    color: '#74AA9C',
  },
  {
    id: 'claude-3.5-sonnet',
    name: 'Claude 3.5 Sonnet',
    provider: 'Anthropic',
    openrouterId: 'anthropic/claude-3.5-sonnet',
    color: '#CC785C',
  },
  {
    id: 'gemini-pro-1.5',
    name: 'Gemini 1.5 Pro',
    provider: 'Google',
    openrouterId: 'google/gemini-pro-1.5',
    color: '#4285F4',
  },
  {
    id: 'llama-3.1-70b',
    name: 'Llama 3.1 70B',
    provider: 'Meta',
    openrouterId: 'meta-llama/llama-3.1-70b-instruct',
    color: '#0668E1',
  },
  {
    id: 'mistral-large',
    name: 'Mistral Large',
    provider: 'Mistral AI',
    openrouterId: 'mistralai/mistral-large',
    color: '#FF7000',
  },
  {
    id: 'gpt-4-turbo',
    name: 'GPT-4 Turbo',
    provider: 'OpenAI',
    openrouterId: 'openai/gpt-4-turbo',
    color: '#5CA885',
  },
  {
    id: 'claude-3-opus',
    name: 'Claude 3 Opus',
    provider: 'Anthropic',
    openrouterId: 'anthropic/claude-3-opus',
    color: '#D4916A',
  },
  {
    id: 'gemini-flash-1.5',
    name: 'Gemini 1.5 Flash',
    provider: 'Google',
    openrouterId: 'google/gemini-flash-1.5',
    color: '#34A853',
  },
];

export const DEMO_TOPIC =
  'Is remote work better than in-office work for long-term team productivity?';
