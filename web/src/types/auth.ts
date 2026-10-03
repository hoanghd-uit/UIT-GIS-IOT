export type AppRole = 'viewer' | 'manager';
export type UserRole = AppRole;
export type AppAbilityAction = 'read' | 'create' | 'update' | 'delete' | 'manage';
export type AppAbilitySubject = 'Dashboard' | 'DeviceDisplayPosition' | 'FireExtinguisher' | 'FireDrill' | 'all';

export interface AuthUser {
  id: string;
  username: string;
  role: UserRole;
  displayRole: 'Viewer' | 'Manager';
}

export interface AbilityRule {
  action: string;
  subject: string;
  inverted?: boolean;
}

export interface AuthMeResponse {
  user: AuthUser;
  abilityRules: AbilityRule[];
  sessionExpiresAt: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface SessionContextState {
  user: AuthUser | null;
  isLoading: boolean;
  can: (action: string, subject: string) => boolean;
  logout: () => Promise<void>;
}
