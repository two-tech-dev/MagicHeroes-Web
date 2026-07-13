import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppShell } from './components/AppShell';
import { GoogleLoginPage, Protected } from './api/authView';
import { DashboardPage, ServersPage, PlayersPage, QuestsPage, CommandsPage, AuditPage, SettingsPage } from './pages';
import './styles.css';

export default function App() { return <BrowserRouter><Routes><Route path="/login" element={<GoogleLoginPage />} /><Route path="/*" element={<Protected><AppShell><Routes><Route path="/" element={<DashboardPage />} /><Route path="/servers" element={<ServersPage />} /><Route path="/players" element={<PlayersPage />} /><Route path="/quests" element={<QuestsPage />} /><Route path="/commands" element={<CommandsPage />} /><Route path="/audit-logs" element={<AuditPage />} /><Route path="/settings" element={<SettingsPage />} /></Routes></AppShell></Protected>} /></Routes></BrowserRouter>; }
