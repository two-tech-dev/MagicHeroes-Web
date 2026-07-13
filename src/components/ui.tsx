import type { ReactNode } from 'react';

export function PageHeader({ title, description, action }: { title: string; description?: string; action?: ReactNode }) { return <div className="page-header"><div><h2>{title}</h2>{description && <p>{description}</p>}</div>{action}</div>; }
export function StatCard({ label, value, detail, tone = '' }: { label: string; value: string | number; detail?: string; tone?: string }) { return <article className={`stat-card ${tone}`}><span>{label}</span><strong>{value}</strong>{detail && <small>{detail}</small>}</article>; }
export function StatusBadge({ status }: { status: string }) { return <span className={`status status-${status}`}>{status === 'online' ? 'Online' : status === 'offline' ? 'Offline' : status === 'success' ? 'Thành công' : status === 'pending' ? 'Đang chờ' : status}</span>; }
export function EmptyState({ text }: { text: string }) { return <div className="empty-state">{text}</div>; }
export function LoadingState() { return <div className="loading-state">Đang tải dữ liệu...</div>; }
