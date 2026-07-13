export type ServerStatus = 'online' | 'offline' | 'unauthorized';
export type CommandStatus = 'pending' | 'running' | 'success' | 'failed' | 'expired';
export type QuestObjectiveType = 'KILL' | 'COLLECT' | 'MINE' | 'REACH' | 'INTERACT';

export interface Server {
  id: string;
  name: string;
  status: ServerStatus;
  playersOnline: number;
  tps: number | null;
  mspt: number | null;
  pluginVersion: string;
  paperVersion: string;
  lastHeartbeat: string;
  lastSync: string;
  integrations: string[];
  lastError?: string;
}

export interface PlayerProfile {
  uuid: string;
  name: string;
  serverId: string;
  online: boolean;
  classId: string;
  level: number;
  experience: number;
  mana: number;
  maxMana: number;
  kills: number;
  deaths: number;
  attributes: Record<string, number>;
  skills: string[];
  quests: string[];
  lastSeen: string;
}

export interface QuestObjective {
  id: string;
  type: QuestObjectiveType;
  target: string;
  required: number;
}

export interface Quest {
  id: string;
  displayName: string;
  prerequisites: string[];
  objectives: QuestObjective[];
  rewardExp: number;
  rewards: Record<string, number>;
  repeatable: boolean;
  updatedAt: string;
  valid: boolean;
}

export interface CommandRecord {
  id: string;
  serverId: string;
  type: string;
  actor: string;
  target: string;
  status: CommandStatus;
  payload: string;
  createdAt: string;
  completedAt?: string;
  error?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  serverId: string;
  target: string;
  result: 'success' | 'failed';
  summary: string;
}

export interface DashboardData {
  servers: Server[];
  players: PlayerProfile[];
  commands: CommandRecord[];
  audits: AuditLog[];
  quests: Quest[];
}
