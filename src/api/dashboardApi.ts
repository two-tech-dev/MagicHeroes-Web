import { apiFetch } from './client';
import { mockDashboard } from '../mocks/data';
import type { DashboardData } from '../types';

const delay = (milliseconds = 260) => new Promise<void>((resolve) => window.setTimeout(resolve, milliseconds));
const useMock = import.meta.env.VITE_USE_MOCK_API !== 'false';

export async function getDashboard(): Promise<DashboardData> {
  if (!useMock) return apiFetch<DashboardData>('/dashboard');
  await delay();
  return mockDashboard();
}
