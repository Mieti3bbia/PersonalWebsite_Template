import { environment } from '../environments/environment';

declare global {
  interface Window {
    __APP_CONFIG__?: {
      apiBaseUrl?: string;
      resourceBaseUrl?: string;
    };
  }
}

const runtimeConfig = typeof window === 'undefined'
  ? undefined
  : window.__APP_CONFIG__;

const configuredResourceBaseUrl = runtimeConfig?.resourceBaseUrl ?? environment.resourceBaseUrl;

export const apiBaseUrl = (runtimeConfig?.apiBaseUrl ?? environment.apiBaseUrl).replace(/\/+$/, '');
export const resourceBaseUrl = (configuredResourceBaseUrl || apiBaseUrl).replace(/\/+$/, '');

export function apiUrl(path: string): string {
  return joinUrl(apiBaseUrl, path);
}

export function resourceUrl(path: string): string {
  return joinUrl(resourceBaseUrl, path);
}

function joinUrl(baseUrl: string, path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return baseUrl ? `${baseUrl}${normalizedPath}` : normalizedPath;
}
