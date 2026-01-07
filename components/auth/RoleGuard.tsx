"use client";

import React, { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

interface RoleGuardProps {
  children: ReactNode;
  allowedRoles: string | string[];
  fallback?: ReactNode;
  showFallback?: boolean;
}

export function RoleGuard({
  children,
  allowedRoles,
  fallback,
  showFallback = true
}: RoleGuardProps) {
  const { user, loading, hasRole, isAuthenticated } = useAuth();
  const router = useRouter();

  // Show loading state with a skeleton that matches page structure
  if (loading) {
    return (
      <div className="container mx-auto p-6 animate-pulse">
        <div className="h-9 w-48 bg-gray-200 rounded mb-8" />
        <div className="grid grid-cols-1 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center justify-between p-4 rounded-lg border border-gray-200 bg-white">
              <div className="flex items-center gap-4">
                <div className="p-2 rounded-md bg-gray-100 w-10 h-10" />
                <div className="space-y-2">
                  <div className="h-5 w-32 bg-gray-200 rounded" />
                  <div className="h-4 w-64 bg-gray-100 rounded" />
                </div>
              </div>
              <div className="w-5 h-5 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated) {
    return (
      <Card className="max-w-md mx-auto mt-8">
        <CardHeader className="text-center">
          <Lock className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
          <CardTitle>Authentication Required</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">
            You need to be logged in to access this content.
          </p>
          <Button onClick={() => router.push('/login')}>
            Go to Login
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Check if user has required role
  const hasRequiredRole = hasRole(allowedRoles);

  if (!hasRequiredRole) {
    if (fallback) {
      return <>{fallback}</>;
    }

    if (!showFallback) {
      return null;
    }

    return (
      <Card className="max-w-md mx-auto mt-8">
        <CardHeader className="text-center">
          <AlertTriangle className="w-12 h-12 mx-auto text-destructive mb-2" />
          <CardTitle>Access Restricted</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">
            You don't have the required permissions to access this content.
          </p>
          <div className="text-sm text-muted-foreground">
            <p>Your role: <span className="font-medium capitalize">{user?.role?.replace('_', ' ')}</span></p>
            <p>Required role(s): <span className="font-medium">
              {Array.isArray(allowedRoles)
                ? allowedRoles.map(role => role.replace('_', ' ')).join(', ')
                : allowedRoles.replace('_', ' ')
              }
            </span></p>
          </div>
          <Button variant="outline" onClick={() => router.push('/')}>
            Return to Dashboard
          </Button>
        </CardContent>
      </Card>
    );
  }

  return <>{children}</>;
}

export default RoleGuard; 