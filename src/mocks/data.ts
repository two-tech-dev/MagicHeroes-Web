import type { AuditLog, CommandRecord, DashboardData, PlayerProfile, Quest, Server } from '../types';

const now = new Date();
const minutesAgo = (minutes: number) => new Date(now.getTime() - minutes * 60_000).toISOString();

export const servers: Server[] = [
  { id: 'survival-01', name: 'Survival RPG', status: 'online', playersOnline: 42, tps: 19.96, mspt: 28.4, pluginVersion: '1.0-SNAPSHOT', paperVersion: '1.21.1', lastHeartbeat: minutesAgo(1), lastSync: minutesAgo(1), integrations: ['PlaceholderAPI', 'Vault'] },
  { id: 'test-01', name: 'Development', status: 'offline', playersOnline: 0, tps: null, mspt: null, pluginVersion: '1.0-SNAPSHOT', paperVersion: '1.21.1', lastHeartbeat: minutesAgo(94), lastSync: minutesAgo(94), integrations: ['PlaceholderAPI'] },
];

export const players: PlayerProfile[] = [
  { uuid: '00000000-0000-0000-0000-000000000001', name: 'HuyBao', serverId: 'survival-01', online: true, classId: 'warrior', level: 25, experience: 72, mana: 84, maxMana: 120, kills: 381, deaths: 11, attributes: { strength: 18, vitality: 12, intelligence: 4, wisdom: 2 }, skills: ['slash', 'whirlwind'], quests: ['first-blood'], lastSeen: minutesAgo(0) },
  { uuid: '00000000-0000-0000-0000-000000000002', name: 'MageLinh', serverId: 'survival-01', online: true, classId: 'mage', level: 19, experience: 40, mana: 160, maxMana: 160, kills: 156, deaths: 8, attributes: { intelligence: 17, wisdom: 11, vitality: 3 }, skills: ['minor-heal'], quests: ['reach-spawn'], lastSeen: minutesAgo(0) },
  { uuid: '00000000-0000-0000-0000-000000000003', name: 'ArcherKhanh', serverId: 'test-01', online: false, classId: 'archer', level: 12, experience: 10, mana: 95, maxMana: 100, kills: 72, deaths: 4, attributes: { dexterity: 13, luck: 4 }, skills: [], quests: [], lastSeen: minutesAgo(82) },
];

export const quests: Quest[] = [
  { id: 'first-blood', displayName: 'First Blood', prerequisites: [], objectives: [{ id: 'zombie', type: 'KILL', target: 'ZOMBIE', required: 1 }], rewardExp: 100, rewards: {}, repeatable: false, updatedAt: minutesAgo(180), valid: true },
  { id: 'reach-spawn', displayName: 'Reach Spawn', prerequisites: [], objectives: [{ id: 'spawn', type: 'REACH', target: 'world,0,64,0,5', required: 1 }], rewardExp: 50, rewards: {}, repeatable: false, updatedAt: minutesAgo(240), valid: true },
];

export const commands: CommandRecord[] = [
  { id: 'cmd-81a2', serverId: 'survival-01', type: 'SET_PLAYER_LEVEL', actor: 'admin@magicheroes', target: 'HuyBao', status: 'success', payload: 'level: 25', createdAt: minutesAgo(15), completedAt: minutesAgo(14) },
  { id: 'cmd-73dd', serverId: 'survival-01', type: 'RELOAD_QUESTS', actor: 'admin@magicheroes', target: 'Survival RPG', status: 'pending', payload: 'scope: global', createdAt: minutesAgo(2) },
];

export const audits: AuditLog[] = [
  { id: 'audit-1', timestamp: minutesAgo(14), actor: 'admin@magicheroes', action: 'SET_PLAYER_LEVEL', serverId: 'survival-01', target: 'HuyBao', result: 'success', summary: 'Level 24 → 25' },
  { id: 'audit-2', timestamp: minutesAgo(2), actor: 'admin@magicheroes', action: 'RELOAD_QUESTS', serverId: 'survival-01', target: 'Survival RPG', result: 'success', summary: 'Queued reload request' },
];

export const mockDashboard = (): DashboardData => ({ servers, players, quests, commands, audits });
