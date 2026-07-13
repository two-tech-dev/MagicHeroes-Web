import { apiFetch } from './client';
export interface AccountToken { id: string; name: string; prefix: string; createdAt: string; lastUsedAt?: string; revokedAt?: string }
export function listTokens() { return apiFetch<AccountToken[]>('/account/tokens'); }
export function createToken(name: string) { return apiFetch<{ id: string; token: string; prefix: string }>('/account/tokens', { method: 'POST', body: JSON.stringify({ name }) }); }
export function revokeToken(id: string) { return apiFetch<{ ok: true }>(`/account/tokens/${encodeURIComponent(id)}`, { method: 'DELETE' }); }
