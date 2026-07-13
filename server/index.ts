import 'dotenv/config';
import { config as loadEnv } from 'dotenv';
import { createHash, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';
import { createServer, IncomingMessage, ServerResponse } from 'node:http';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

loadEnv({ path: '.env.server.local', override: false });

interface Account { id: string; googleId: string; email: string; name: string; picture?: string; createdAt: string }
interface Session { idHash: string; accountId: string; expiresAt: string }
interface ApiToken { id: string; accountId: string; name: string; tokenHash: string; prefix: string; createdAt: string; lastUsedAt?: string; revokedAt?: string }
interface ServerRecord { id: string; ownerId: string; name: string; tokenHash: string; status: 'online' | 'offline' | 'unauthorized'; playersOnline: number; tps: number | null; mspt: number | null; pluginVersion: string; paperVersion: string; lastHeartbeat: string; lastSync: string; integrations: string[]; lastError?: string }
interface PlayerRecord { uuid: string; name: string; serverId: string; online: boolean; classId: string; level: number; experience: number; mana: number; maxMana: number; kills: number; deaths: number; attributes: Record<string, number>; skills: string[]; quests: string[]; lastSeen: string }
interface CommandRecord { id: string; serverId: string; type: string; actor: string; target: string; status: 'pending' | 'running' | 'success' | 'failed' | 'expired'; payload: string; createdAt: string; completedAt?: string; error?: string }
interface AuditRecord { id: string; timestamp: string; actor: string; action: string; serverId: string; target: string; result: 'success' | 'failed'; summary: string }
interface Store { accounts: Account[]; sessions: Session[]; apiTokens: ApiToken[]; servers: ServerRecord[]; players: PlayerRecord[]; quests: unknown[]; commands: CommandRecord[]; audits: AuditRecord[] }
interface GoogleTokenResponse { access_token?: string }
interface GoogleUser { sub?: string; email?: string; email_verified?: boolean; name?: string; picture?: string }

const dataDir = join(process.cwd(), 'data');
const storePath = join(dataDir, 'store.json');
const port = Number(process.env.PORT ?? 8787);
const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:5173';
const apiUrl = process.env.API_URL ?? `http://localhost:${port}`;
const googleClientId = process.env.GOOGLE_CLIENT_ID ?? '';
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET ?? '';
const production = process.env.NODE_ENV === 'production';
const emptyStore = (): Store => ({ accounts: [], sessions: [], apiTokens: [], servers: [], players: [], quests: [], commands: [], audits: [] });
const hash = (value: string) => createHash('sha256').update(value).digest('hex');
const now = () => new Date().toISOString();

async function loadStore(): Promise<Store> {
  await mkdir(dataDir, { recursive: true });
  if (!existsSync(storePath)) return emptyStore();
  const raw = JSON.parse(await readFile(storePath, 'utf8')) as Partial<Store>;
  return { ...emptyStore(), ...raw };
}
async function saveStore(store: Store) { await writeFile(storePath, JSON.stringify(store, null, 2)); }
function headers(extra: Record<string, string> = {}) { return { 'content-type': 'application/json; charset=utf-8', 'access-control-allow-origin': frontendUrl, 'access-control-allow-credentials': 'true', 'access-control-allow-headers': 'authorization,content-type,x-server-id,x-request-id', 'access-control-allow-methods': 'GET,POST,PUT,DELETE,OPTIONS', ...extra }; }
function json(res: ServerResponse, status: number, value: unknown, extra: Record<string, string> = {}) { res.writeHead(status, headers(extra)); res.end(JSON.stringify(value)); }
function redirect(res: ServerResponse, location: string, cookies: string[] = []) { res.writeHead(302, { location, 'set-cookie': cookies }); res.end(); }
async function body(req: IncomingMessage) { const chunks: Buffer[] = []; for await (const chunk of req) chunks.push(Buffer.from(chunk)); return chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) as Record<string, unknown> : {}; }
function cookies(req: IncomingMessage) { return Object.fromEntries((req.headers.cookie ?? '').split(';').map((part) => part.trim().split('=').map(decodeURIComponent)).filter((pair) => pair.length === 2)); }
function cookie(name: string, value: string, maxAge: number) { return `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${production ? '; Secure' : ''}`; }
function bearer(req: IncomingMessage) { const value = req.headers.authorization ?? ''; return value.startsWith('Bearer ') ? value.slice(7) : ''; }
function safeEqual(a: string, b: string) { const left = Buffer.from(a); const right = Buffer.from(b); return left.length === right.length && timingSafeEqual(left, right); }
function accountForRequest(store: Store, req: IncomingMessage) { const sessionId = cookies(req).mh_session; if (!sessionId) return null; const session = store.sessions.find((entry) => safeEqual(entry.idHash, hash(sessionId)) && Date.parse(entry.expiresAt) > Date.now()); return session ? store.accounts.find((account) => account.id === session.accountId) ?? null : null; }
function findAuthorizedServer(store: Store, req: IncomingMessage, serverId: string) { const server = store.servers.find((entry) => entry.id === serverId); if (!server) return null; const tokenHash = hash(bearer(req)); if (safeEqual(server.tokenHash, tokenHash)) return server; const accountToken = store.apiTokens.find((entry) => entry.accountId === server.ownerId && !entry.revokedAt && safeEqual(entry.tokenHash, tokenHash)); if (!accountToken) return null; accountToken.lastUsedAt = now(); return server; }
function ownedStore(store: Store, account: Account) { const servers = store.servers.filter((server) => server.ownerId === account.id); const ids = new Set(servers.map((server) => server.id)); return { servers: servers.map(({ tokenHash, ownerId, ...server }) => server), players: store.players.filter((player) => ids.has(player.serverId)), quests: store.quests, commands: store.commands.filter((command) => ids.has(command.serverId)), audits: store.audits.filter((audit) => ids.has(audit.serverId)) }; }

async function route(req: IncomingMessage, res: ServerResponse) {
  if (req.method === 'OPTIONS') return json(res, 204, {});
  const url = new URL(req.url ?? '/', `http://${req.headers.host}`);
  const store = await loadStore();

  if (req.method === 'GET' && url.pathname === '/api/v1/auth/google') {
    if (!googleClientId || !googleClientSecret) return json(res, 503, { message: 'Google OAuth chưa được cấu hình.' });
    const state = randomBytes(24).toString('hex');
    const params = new URLSearchParams({ client_id: googleClientId, redirect_uri: `${apiUrl}/api/v1/auth/google/callback`, response_type: 'code', scope: 'openid email profile', state, prompt: 'select_account' });
    return redirect(res, `https://accounts.google.com/o/oauth2/v2/auth?${params}`, [cookie('mh_oauth_state', state, 600)]);
  }

  if (req.method === 'GET' && url.pathname === '/api/v1/auth/google/callback') {
    const state = url.searchParams.get('state') ?? '';
    const code = url.searchParams.get('code') ?? '';
    if (!state || !code || !safeEqual(cookies(req).mh_oauth_state ?? '', state)) return redirect(res, `${frontendUrl}/login?error=oauth_state`);
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ code, client_id: googleClientId, client_secret: googleClientSecret, redirect_uri: `${apiUrl}/api/v1/auth/google/callback`, grant_type: 'authorization_code' }) });
    if (!tokenResponse.ok) return redirect(res, `${frontendUrl}/login?error=oauth_token`);
    const token = await tokenResponse.json() as GoogleTokenResponse;
    const profileResponse = await fetch('https://openidconnect.googleapis.com/v1/userinfo', { headers: { authorization: `Bearer ${token.access_token ?? ''}` } });
    if (!profileResponse.ok) return redirect(res, `${frontendUrl}/login?error=oauth_profile`);
    const profile = await profileResponse.json() as GoogleUser;
    if (!profile.sub || !profile.email || profile.email_verified !== true) return redirect(res, `${frontendUrl}/login?error=email_unverified`);
    let account = store.accounts.find((entry) => entry.googleId === profile.sub);
    if (!account) { account = { id: randomUUID(), googleId: profile.sub, email: profile.email, name: profile.name ?? profile.email, picture: profile.picture, createdAt: now() }; store.accounts.push(account); }
    else { account.email = profile.email; account.name = profile.name ?? account.name; account.picture = profile.picture; }
    const sessionId = randomBytes(32).toString('hex');
    store.sessions = store.sessions.filter((entry) => Date.parse(entry.expiresAt) > Date.now());
    store.sessions.push({ idHash: hash(sessionId), accountId: account.id, expiresAt: new Date(Date.now() + 7 * 86_400_000).toISOString() });
    await saveStore(store);
    return redirect(res, frontendUrl, [cookie('mh_session', sessionId, 7 * 86_400), cookie('mh_oauth_state', '', 0)]);
  }

  if (req.method === 'GET' && url.pathname === '/api/v1/auth/me') { const account = accountForRequest(store, req); return account ? json(res, 200, { id: account.id, email: account.email, name: account.name, picture: account.picture }) : json(res, 401, { message: 'Unauthorized' }); }
  if (req.method === 'POST' && url.pathname === '/api/v1/auth/logout') { const sessionId = cookies(req).mh_session; if (sessionId) store.sessions = store.sessions.filter((entry) => !safeEqual(entry.idHash, hash(sessionId))); await saveStore(store); return json(res, 200, { ok: true }, { 'set-cookie': cookie('mh_session', '', 0) }); }

  const account = accountForRequest(store, req);
  if (req.method === 'GET' && url.pathname === '/api/v1/dashboard') return account ? json(res, 200, ownedStore(store, account)) : json(res, 401, { message: 'Unauthorized' });
  if (req.method === 'GET' && url.pathname === '/api/v1/account/tokens') return account ? json(res, 200, store.apiTokens.filter((token) => token.accountId === account.id).map(({ tokenHash, accountId, ...token }) => token)) : json(res, 401, { message: 'Unauthorized' });
  if (req.method === 'POST' && url.pathname === '/api/v1/account/tokens') {
    if (!account) return json(res, 401, { message: 'Unauthorized' });
    const input = await body(req); const rawToken = `mh_account_${randomBytes(24).toString('hex')}`;
    const record: ApiToken = { id: randomUUID(), accountId: account.id, name: String(input.name ?? 'API token').slice(0, 80), tokenHash: hash(rawToken), prefix: rawToken.slice(0, 15), createdAt: now() };
    store.apiTokens.push(record); await saveStore(store); return json(res, 201, { id: record.id, token: rawToken, prefix: record.prefix });
  }
  const revokeMatch = url.pathname.match(/^\/api\/v1\/account\/tokens\/([^/]+)$/);
  if (req.method === 'DELETE' && revokeMatch) { if (!account) return json(res, 401, { message: 'Unauthorized' }); const token = store.apiTokens.find((entry) => entry.id === revokeMatch[1] && entry.accountId === account.id); if (!token) return json(res, 404, { message: 'Token not found' }); token.revokedAt = now(); await saveStore(store); return json(res, 200, { ok: true }); }

  if (req.method === 'POST' && url.pathname === '/api/v1/servers') {
    if (!account) return json(res, 401, { message: 'Unauthorized' });
    const input = await body(req); const id = String(input.id || `server-${randomUUID().slice(0, 8)}`).toLowerCase().replace(/[^a-z0-9_-]/g, '-');
    if (store.servers.some((server) => server.id === id)) return json(res, 409, { message: 'Server already exists' });
    const token = `mh_live_${randomBytes(24).toString('hex')}`;
    store.servers.push({ id, ownerId: account.id, name: String(input.name || id), tokenHash: hash(token), status: 'offline', playersOnline: 0, tps: null, mspt: null, pluginVersion: '-', paperVersion: '-', lastHeartbeat: now(), lastSync: now(), integrations: [] });
    store.audits.push({ id: randomUUID(), timestamp: now(), actor: account.email, action: 'CREATE_SERVER', serverId: id, target: id, result: 'success', summary: 'Created server and generated token' }); await saveStore(store); return json(res, 201, { serverId: id, apiToken: token });
  }

  const snapshotMatch = url.pathname.match(/^\/api\/v1\/servers\/([^/]+)\/snapshot$/);
  if (req.method === 'POST' && snapshotMatch) { const serverId = decodeURIComponent(snapshotMatch[1]); const server = findAuthorizedServer(store, req, serverId); if (!server) return json(res, 401, { message: 'Unauthorized server' }); const input = await body(req); const players = Array.isArray(input.players) ? input.players : []; server.status = 'online'; server.playersOnline = players.length; server.pluginVersion = String(input.pluginVersion ?? server.pluginVersion); server.lastHeartbeat = now(); server.lastSync = now(); store.players.filter((entry) => entry.serverId === serverId).forEach((entry) => entry.online = false); for (const raw of players) { const player = raw as Record<string, unknown>; const uuid = String(player.uuid ?? ''); if (!uuid) continue; const record: PlayerRecord = { uuid, name: String(player.name ?? uuid), serverId, online: true, classId: String(player.class ?? 'none'), level: Number(player.level ?? 1), experience: Number(player.experience ?? 0), mana: Number(player.mana ?? 0), maxMana: Number(player.maxMana ?? 0), kills: Number(player.kills ?? 0), deaths: Number(player.deaths ?? 0), attributes: {}, skills: [], quests: [], lastSeen: now() }; const index = store.players.findIndex((entry) => entry.uuid === uuid && entry.serverId === serverId); if (index >= 0) store.players[index] = { ...store.players[index], ...record }; else store.players.push(record); } await saveStore(store); return json(res, 200, { ok: true }); }
  const commandMatch = url.pathname.match(/^\/api\/v1\/servers\/([^/]+)\/commands$/);
  if (req.method === 'GET' && commandMatch) { const serverId = decodeURIComponent(commandMatch[1]); if (!findAuthorizedServer(store, req, serverId)) return json(res, 401, { message: 'Unauthorized server' }); return json(res, 200, store.commands.filter((command) => command.serverId === serverId && command.status === 'pending')); }
  const resultMatch = url.pathname.match(/^\/api\/v1\/commands\/([^/]+)\/result$/);
  if (req.method === 'POST' && resultMatch) { const input = await body(req); const command = store.commands.find((entry) => entry.id === decodeURIComponent(resultMatch[1])); if (!command || !findAuthorizedServer(store, req, command.serverId)) return json(res, 401, { message: 'Unauthorized command result' }); command.status = input.success === false ? 'failed' : 'success'; command.completedAt = now(); command.error = input.error ? String(input.error) : undefined; store.audits.push({ id: randomUUID(), timestamp: now(), actor: 'plugin', action: command.type, serverId: command.serverId, target: command.target, result: command.status === 'success' ? 'success' : 'failed', summary: command.error ?? 'Command completed' }); await saveStore(store); return json(res, 200, { ok: true }); }
  json(res, 404, { message: 'Not found' });
}

createServer((req, res) => route(req, res).catch(() => json(res, 500, { message: 'Internal server error' }))).listen(port, () => console.log(`MagicHeroes API listening on http://localhost:${port}`));
