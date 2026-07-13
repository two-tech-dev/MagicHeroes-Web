import { NavLink } from 'react-router-dom';

const links = [
  ['/', 'Tổng quan'], ['servers', 'Máy chủ'], ['players', 'Người chơi'], ['quests', 'Nhiệm vụ'], ['commands', 'Command queue'], ['audit-logs', 'Audit logs'], ['settings', 'Cài đặt'],
];

export function Sidebar() {
  return <aside className="sidebar"><div className="brand"><span className="brand-mark">M</span><span>MagicHeroes</span></div><nav>{links.map(([to, label]) => <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>{label}</NavLink>)}</nav><div className="sidebar-footer">Web Dashboard<br /><small>v0.1 MVP</small></div></aside>;
}

export function Header() {
  return <header className="topbar"><div><span className="eyebrow">MAGICHEROES</span><h1>Quản lý hệ thống</h1></div><div className="topbar-actions"><span className="connection-dot" /> Mock API <button className="avatar">HB</button></div></header>;
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return <div className="app-shell"><Sidebar /><main className="main"><Header />{children}</main></div>;
}
