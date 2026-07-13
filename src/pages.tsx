import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { createToken, listTokens, revokeToken, type AccountToken } from './api/tokenApi';
import { EmptyState, LoadingState, PageHeader, StatCard, StatusBadge } from './components/ui';
import { useDashboard } from './hooks/useDashboard';
import type { Quest } from './types';

export function DashboardPage() {
  const { data, loading, error, reload } = useDashboard();
  if (loading) return <LoadingState />;
  if (error || !data) return <EmptyState text={error || 'Không có dữ liệu.'} />;
  const onlineServers = data.servers.filter((server) => server.status === 'online').length;
  const onlinePlayers = data.players.filter((player) => player.online).length;
  return <section><PageHeader title="Tổng quan" description="Theo dõi server, player, sync và command queue." action={<button onClick={reload}>Làm mới</button>} /><div className="stats-grid"><StatCard label="Tổng server" value={data.servers.length} /><StatCard label="Server online" value={onlineServers} tone="good" /><StatCard label="Người chơi online" value={onlinePlayers} /><StatCard label="Lệnh đang chờ" value={data.commands.filter((command) => command.status === 'pending').length} tone="warn" /></div><div className="panel"><h3>Máy chủ gần đây</h3><table><thead><tr><th>Tên</th><th>Trạng thái</th><th>Player</th><th>TPS</th><th>Heartbeat</th><th></th></tr></thead><tbody>{data.servers.map((server) => <tr key={server.id}><td>{server.name}<small>{server.id}</small></td><td><StatusBadge status={server.status} /></td><td>{server.playersOnline}</td><td>{server.tps ?? '-'}</td><td>{new Date(server.lastHeartbeat).toLocaleString('vi-VN')}</td><td><Link to="/servers">Xem</Link></td></tr>)}</tbody></table></div></section>;
}

export function ServersPage() {
  const { data, loading } = useDashboard();
  if (loading || !data) return <LoadingState />;
  return <section><PageHeader title="Máy chủ" description="Quản lý server-id, heartbeat và trạng thái kết nối." /><div className="cards-list">{data.servers.map((server) => <article className="panel card-row" key={server.id}><div><h3>{server.name}</h3><p>{server.id}</p><p>{server.paperVersion} · MagicHeroes {server.pluginVersion}</p></div><div><StatusBadge status={server.status} /><p>{server.playersOnline} online</p><p>TPS {server.tps ?? '-'}</p></div></article>)}</div></section>;
}

export function PlayersPage() {
  const { data, loading } = useDashboard();
  if (loading || !data) return <LoadingState />;
  return <section><PageHeader title="Người chơi" description="Xem hồ sơ nhân vật, class, level, skill và quest." /><div className="panel"><table><thead><tr><th>Player</th><th>Class</th><th>Level</th><th>EXP</th><th>K/D</th><th>Online</th></tr></thead><tbody>{data.players.map((player) => <tr key={player.uuid}><td>{player.name}<small>{player.uuid}</small></td><td>{player.classId}</td><td>{player.level}</td><td>{player.experience}</td><td>{player.kills}/{player.deaths}</td><td><StatusBadge status={player.online ? 'online' : 'offline'} /></td></tr>)}</tbody></table></div></section>;
}

function questYaml(quest: Quest) {
  const objectives = quest.objectives.map((objective) => `  - id: ${objective.id}\n    type: ${objective.type}\n    target: ${objective.target}\n    required: ${objective.required}`).join('\n');
  return `id: ${quest.id}\ndisplay-name: "${quest.displayName}"\nobjectives:\n${objectives}\nrewards:\n  exp: ${quest.rewardExp}\nrepeatable: ${quest.repeatable}`;
}

export function QuestsPage() {
  const { data, loading } = useDashboard();
  if (loading || !data) return <LoadingState />;
  return <section><PageHeader title="Nhiệm vụ" description="Form quản lý quest, objective và YAML preview." action={<button>Tạo quest</button>} /><div className="split-grid"><div className="panel"><h3>Danh sách quest</h3>{data.quests.map((quest) => <div className="list-item" key={quest.id}><div><strong>{quest.displayName}</strong><p>{quest.id} · {quest.objectives.length} objective · {quest.rewardExp} EXP</p></div><StatusBadge status={quest.valid ? 'success' : 'failed'} /></div>)}</div><div className="panel"><h3>Quest editor preview</h3><QuestEditorDemo quest={data.quests[0]} /></div></div></section>;
}

function QuestEditorDemo({ quest }: { quest: Quest }) { return <form className="form-grid"><label>ID<input defaultValue={quest.id} /></label><label>Tên hiển thị<input defaultValue={quest.displayName} /></label><label>Loại objective<select defaultValue={quest.objectives[0]?.type}><option>KILL</option><option>COLLECT</option><option>MINE</option><option>REACH</option><option>INTERACT</option></select></label><label>Target<input defaultValue={quest.objectives[0]?.target} /></label><label>Required<input type="number" min="1" defaultValue={quest.objectives[0]?.required} /></label><label>EXP<input type="number" min="0" defaultValue={quest.rewardExp} /></label><pre>{questYaml(quest)}</pre><button type="button">Validate realtime</button></form>; }

export function CommandsPage() { const { data, loading } = useDashboard(); if (loading || !data) return <LoadingState />; return <section><PageHeader title="Command queue" description="Mọi thay đổi từ web đi qua hàng đợi command." /><div className="panel"><table><thead><tr><th>ID</th><th>Server</th><th>Type</th><th>Actor</th><th>Status</th><th>Payload</th></tr></thead><tbody>{data.commands.map((command) => <tr key={command.id}><td>{command.id}</td><td>{command.serverId}</td><td>{command.type}</td><td>{command.actor}</td><td><StatusBadge status={command.status} /></td><td>{command.payload}</td></tr>)}</tbody></table></div></section>; }
export function AuditPage() { const { data, loading } = useDashboard(); if (loading || !data) return <LoadingState />; return <section><PageHeader title="Audit logs" description="Lịch sử thao tác admin, chỉ đọc." /><div className="panel">{data.audits.map((audit) => <div className="list-item" key={audit.id}><div><strong>{audit.action}</strong><p>{audit.actor} · {audit.target} · {new Date(audit.timestamp).toLocaleString('vi-VN')}</p><small>{audit.summary}</small></div><StatusBadge status={audit.result} /></div>)}</div></section>; }
export function SettingsPage() {
  const [tokens, setTokens] = useState<AccountToken[]>([]); const [newToken, setNewToken] = useState(''); const [createdToken, setCreatedToken] = useState('');
  const refresh = () => listTokens().then(setTokens).catch(() => setTokens([])); useEffect(() => { void refresh(); }, []);
  const generate = async () => { if (!newToken.trim()) return; const result = await createToken(newToken.trim()); setCreatedToken(result.token); setNewToken(''); refresh(); };
  return <section><PageHeader title="Cài đặt" description="Ngôn ngữ, theme, API và token tài khoản." /><div className="split-grid"><div className="panel form-grid"><label>Ngôn ngữ<select defaultValue="vi"><option value="vi">Tiếng Việt</option><option value="en">English</option></select></label><label>Theme<select defaultValue="dark"><option value="dark">Dark</option><option value="light">Light</option></select></label><label>Phân trang mặc định<input type="number" min="10" defaultValue="25" /></label></div><div className="panel"><h3>API tokens</h3><p>Token chỉ hiện một lần. Dùng token cho plugin/server của tài khoản này.</p><div className="token-create"><input value={newToken} onChange={(event) => setNewToken(event.target.value)} placeholder="Tên token, ví dụ Survival RPG" /><button onClick={generate}>Tạo token</button></div>{createdToken && <pre className="token-reveal">{createdToken}</pre>}{tokens.map((token) => <div className="list-item" key={token.id}><div><strong>{token.name}</strong><p>{token.prefix}... · {new Date(token.createdAt).toLocaleString('vi-VN')}</p></div>{token.revokedAt ? <StatusBadge status="failed" /> : <button className="danger" onClick={() => revokeToken(token.id).then(refresh)}>Thu hồi</button>}</div>)}</div></div></section>;
}
