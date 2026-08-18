import { environment } from '../environments/environment';

const localBackendUrlPattern = /^https?:\/\/localhost:5109(?=\/|$)/i;
const absoluteUrlPattern = /^https?:\/\//i;

export function resolveBackendAssetUrl(path: string): string {
  const value = path.trim();

  if (!value) {
    return '';
  }

  if (localBackendUrlPattern.test(value)) {
    return value.replace(localBackendUrlPattern, environment.apiUrl);
  }

  if (absoluteUrlPattern.test(value)) {
    return value;
  }

  return `${environment.apiUrl}${value.startsWith('/') ? '' : '/'}${value}`;
}
