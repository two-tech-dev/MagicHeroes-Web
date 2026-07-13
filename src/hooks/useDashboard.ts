import { useEffect, useState } from 'react';
import { getDashboard } from '../api/dashboardApi';
import type { DashboardData } from '../types';

export function useDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const load = () => { setLoading(true); setError(''); getDashboard().then(setData).catch(() => setError('Không thể tải dữ liệu dashboard.')).finally(() => setLoading(false)); };
  useEffect(load, []);
  return { data, loading, error, reload: load };
}
