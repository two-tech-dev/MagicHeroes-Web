import { apiFetch } from './client';

export interface Account { id: string; email: string; name: string; picture?: string }
export function currentAccount() { return apiFetch<Account>('/auth/me'); }
export function logout() { return apiFetch<{ ok: true }>('/auth/logout', { method: 'POST' }); }
