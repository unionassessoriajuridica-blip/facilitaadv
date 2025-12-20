import * as React from "react";
// pages/MigratePermissions.tsx
import React from 'react';
import { migrateUserPermissions } from '@/scripts/migratePermissions.ts';
import { Button } from '@/components/ui/button.tsx';

const MigratePermissions = () => {
  const handleMigrate = async () => {
    await migrateUserPermissions();
    alert('Migração executada! Verifique o console para detalhes.');
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Migração de Permissões</h1>
        <p className="mb-4">Este script irá conceder todas as permissões necessárias para o usuário Giovanna.</p>
        <Button onClick={handleMigrate}>Executar Migração</Button>
      </div>
    </div>
  );
};

export default MigratePermissions;