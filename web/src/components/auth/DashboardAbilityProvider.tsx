'use client';

import React, { createContext, useContext, useMemo, useState, useCallback, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { AuthUser, AbilityRule } from '../../types/auth';
import { createAbilityFromRules, ClientAppAbility, canPerform } from '../../lib/auth/ability';
import { apiLogout } from '../../lib/auth/auth-api';

export interface DashboardAbilityContextValue {
  user: AuthUser | null;
  ability: ClientAppAbility;
  can: (action: string, subject: string) => boolean;
  logout: () => Promise<void>;
  isLoggingOut: boolean;
}

const fallbackAbility = createAbilityFromRules([]);

const defaultContextValue: DashboardAbilityContextValue = {
  user: null,
  ability: fallbackAbility,
  can: () => false,
  logout: async () => {},
  isLoggingOut: false,
};

const DashboardAbilityContext = createContext<DashboardAbilityContextValue>(defaultContextValue);

export interface DashboardAbilityProviderProps {
  initialUser: AuthUser;
  initialRules: AbilityRule[];
  children: ReactNode;
}

export function DashboardAbilityProvider({
  initialUser,
  initialRules,
  children,
}: DashboardAbilityProviderProps) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(initialUser);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const ability = useMemo(() => {
    return createAbilityFromRules(initialRules);
  }, [initialRules]);

  const can = useCallback(
    (action: string, subject: string) => {
      return canPerform(ability, action, subject);
    },
    [ability],
  );

  const logout = useCallback(async () => {
    try {
      setIsLoggingOut(true);
      await apiLogout();
      setUser(null);
      router.push('/login');
      router.refresh();
    } catch (error) {
      console.error('[DashboardAbilityProvider] Logout failed:', error);
      setIsLoggingOut(false);
      throw error;
    }
  }, [router]);

  const value = useMemo(
    () => ({
      user,
      ability,
      can,
      logout,
      isLoggingOut,
    }),
    [user, ability, can, logout, isLoggingOut],
  );

  return (
    <DashboardAbilityContext.Provider value={value}>
      {children}
    </DashboardAbilityContext.Provider>
  );
}

/**
 * Hook to access current dashboard user and CASL abilities.
 * Safe for use outside Dashboard provider (e.g. campus/viewer pages) by returning
 * empty/deny-all fallback without throwing or forcing login.
 */
export function useDashboardAbility(): DashboardAbilityContextValue {
  return useContext(DashboardAbilityContext);
}
