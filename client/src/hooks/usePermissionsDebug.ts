import * as React from "react";
// usePermissionsDebug.ts - Versão para diagnóstico
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client.ts';
import { useAuth } from '@/hooks/useAuth.ts';

export const usePermissionsDebug = () => {
  const [debugInfo, setDebugInfo] = useState<any>({});
  const { user } = useAuth();

  useEffect(() => {
    const debugPermissions = async () => {
      if (!user?.id) {
        setDebugInfo({ error: 'Usuário não logado' });
        return;
      }

      const info: any = {
        userId: user.id,
        userEmail: user.email,
        steps: []
      };

      try {
        // 1. Verificar tabela user_permissions
        info.steps.push('Verificando tabela user_permissions...');
        const { data: permissionsData, error: permissionsError } = await supabase
          .from('user_permissions')
          .select('*')
          .eq('user_id', user.id);

        info.permissionsData = permissionsData;
        info.permissionsError = permissionsError;

        // 2. Verificar tabela user_roles
        info.steps.push('Verificando tabela user_roles...');
        const { data: rolesData, error: rolesError } = await supabase
          .from('user_roles')
          .select('*')
          .eq('user_id', user.id);

        info.rolesData = rolesData;
        info.rolesError = rolesError;

        // 3. Verificar estrutura da tabela
        info.steps.push('Verificando estrutura das tabelas...');
        const { data: tableInfo, error: tableError } = await supabase
          .from('user_permissions')
          .select('count')
          .limit(1);

        info.tableInfo = tableInfo;
        info.tableError = tableError;

      } catch (error) {
        info.error = error;
      }

      setDebugInfo(info);
    };

    debugPermissions();
  }, [user]);

  return debugInfo;
};