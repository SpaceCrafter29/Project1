import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { ServerConfig } from '../../shared/api';
import { api } from './api';

const ConfigContext = createContext<ServerConfig | null>(null);

export function ConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<ServerConfig | null>(null);
  useEffect(() => {
    api.config().then(setConfig, () => setConfig(null));
  }, []);
  return <ConfigContext.Provider value={config}>{children}</ConfigContext.Provider>;
}

export function useConfig(): ServerConfig | null {
  return useContext(ConfigContext);
}

export const isDemo = (config: ServerConfig | null) => config?.provider === 'mock';
