import * as React from "react";
// pages/DebugPermissions.tsx
import React from 'react';
import { usePermissionsDebug } from '@/hooks/usePermissionsDebug.ts';
import { Button } from '@/components/ui/button.tsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.tsx';
import { useAuth } from '@/hooks/useAuth.ts';

const DebugPermissions = () => {
  const debugInfo = usePermissionsDebug();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="container mx-auto max-w-4xl">
        <h1 className="text-2xl font-bold mb-6">Debug de Permissões</h1>
        
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Informações do Usuário</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-sm bg-muted p-4 rounded">
              {JSON.stringify({
                id: user?.id,
                email: user?.email,
                isAuthenticated: !!user
              }, null, 2)}
            </pre>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Resultado do Debug</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-sm bg-muted p-4 rounded overflow-auto max-h-96">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </CardContent>
        </Card>

        <Button 
          className="mt-6"
          onClick={() => window.location.reload()}
        >
          Recarregar Página
        </Button>
      </div>
    </div>
  );
};

export default DebugPermissions;