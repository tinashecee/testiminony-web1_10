"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { recordingsApi, CurrentUser } from '@/services/api';
import { getTempCurrentUser } from '@/utils/tempAuth';
import { auditLogger } from '@/services/auditService';

interface AuthContextType {
  user: CurrentUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  hasRole: (roles: string | string[]) => boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCurrentUser = async () => {
    try {
      console.log('🔍 Using temporary authentication since /me endpoint is not available...');
      
      // Check if we have a token first
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('token='))
        ?.split('=')[1];
      
      if (!token) {
        console.log('❌ No token found in cookies');
        setUser(null);
        setLoading(false);
        return;
      }
      
      console.log('🔍 Token found, using temporary user mapping...');
      
      // Use temporary user mapping directly
      const tempUser = getTempCurrentUser();
      if (tempUser) {
        console.log('✅ Using temporary user mapping:', tempUser);
        setUser(tempUser);
      } else {
        console.log('❌ No temporary user mapping found');
        setUser(null);
      }
    } catch (error) {
      console.error('❌ Error in temporary authentication:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // Add a function to force refresh user data
  const forceRefreshUser = async () => {
    console.log('🔍 Force refreshing user data...');
    setLoading(true);
    await fetchCurrentUser();
  };

  const refreshUser = async () => {
    setLoading(true);
    await fetchCurrentUser();
  };

  const logout = async () => {
    try {
      // Log logout event before actually logging out
      if (user?.email) {
        auditLogger.logout(user.email);
      }
      
      await recordingsApi.logoutUser();
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
      setUser(null);
    }
  };

  const hasRole = (roles: string | string[]): boolean => {
    if (!user) {
      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 hasRole: No user found');
      }
      return false;
    }
    
    const roleArray = Array.isArray(roles) ? roles : [roles];
    const hasRequiredRole = roleArray.includes(user.role);
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔍 hasRole: User role "${user.role}", checking against [${roleArray.join(', ')}], result: ${hasRequiredRole}`);
    }
    return hasRequiredRole;
  };

  const isAuthenticated = !!user;
  const isAdmin = hasRole(['admin', 'super_admin']);
  const isSuperAdmin = hasRole('super_admin');

  // Debug logging (remove in production)
  React.useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 AuthContext Debug:');
      console.log('- user:', user);
      console.log('- isAuthenticated:', isAuthenticated);
      console.log('- isAdmin:', isAdmin);
      console.log('- isSuperAdmin:', isSuperAdmin);
    }
  }, [user, isAuthenticated, isAdmin, isSuperAdmin]);

  useEffect(() => {
    // Only fetch user if we have a token
    const token = document.cookie
      .split('; ')
      .find(row => row.startsWith('token='))
      ?.split('=')[1];

    console.log('🔍 AuthContext useEffect - Token found:', !!token);
    
    if (token) {
      fetchCurrentUser();
    } else {
      console.log('🔍 No token found, setting loading to false');
      setLoading(false);
    }
  }, []);

  // Add a listener for storage changes to handle token updates
  useEffect(() => {
    const handleStorageChange = () => {
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('token='))
        ?.split('=')[1];
      
      if (token && !user) {
        console.log('🔍 Token detected, fetching user data...');
        fetchCurrentUser();
      }
    };

    // Listen for cookie changes
    window.addEventListener('storage', handleStorageChange);
    
    // Also check periodically for token changes (fallback)
    const interval = setInterval(() => {
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('token='))
        ?.split('=')[1];
      
      if (token && !user && !loading) {
        console.log('🔍 Token detected via interval, fetching user data...');
        fetchCurrentUser();
      }
    }, 1000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [user, loading]);

  const value: AuthContextType = {
    user,
    loading,
    isAuthenticated,
    hasRole,
    isAdmin,
    isSuperAdmin,
    refreshUser,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext; 