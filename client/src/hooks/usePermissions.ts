import * as React from "react";
// usePermissions.ts - VERSÃO CORRIGIDA
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client.ts';
import { useToast } from '@/hooks/use-toast.ts';
import { useAuth } from '@/hooks/useAuth.ts';

export type UserPermission = 
  | 'READ'
  | 'WRITE'
  | 'ADMIN'
  | 'financeiro'
  | 'ia_facilita' 
  | 'facilisign'
  | 'novo_processo'
  | 'google_integration'
  | 'agenda'
  | 'modificar_clientes'
  | 'excluir_processo'
  | 'user_management'
  | 'ver_todos_processos'
  | 'master';

export const usePermissions = () => {
  const [permissions, setPermissions] = useState<UserPermission[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();

  const loadUserPermissions = async () => {
    try {
      if (!user?.id) {
        setPermissions([]);
        setLoading(false);
        return;
      }

      const { data: permissionsData, error: permissionsError } = await supabase
        .from('user_permissions')
        .select('permission')
        .eq('user_id', user.id);

      if (permissionsError) {
        console.error('Erro ao carregar permissões:', permissionsError);
        toast({
          title: 'Erro',
          description: 'Falha ao carregar permissões do banco de dados',
          variant: 'destructive',
        });
      }

      const explicitPermissions = permissionsData?.map(item => 
        item.permission as UserPermission
      ) || [];

      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      if (rolesError) {
        console.error('Erro ao carregar roles:', rolesError);
      }

      const roles = rolesData?.map(item => item.role) || [];
      
      const automaticPermissions: UserPermission[] = [];
      if (roles.includes('master') || roles.includes('admin')) {
        automaticPermissions.push('ver_todos_processos');
        automaticPermissions.push('financeiro');
        automaticPermissions.push('modificar_clientes');
        automaticPermissions.push('excluir_processo');
      }

      const allPermissions = [...automaticPermissions, ...explicitPermissions];
      const uniquePermissions = Array.from(new Set(allPermissions));
      
      setPermissions(uniquePermissions);

    } catch (error) {
      console.error('Erro inesperado ao carregar permissões:', error);
      setPermissions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Só carregar permissões quando a autenticação não estiver loading E usuário existir
    if (!authLoading && user) {
      loadUserPermissions();
    } else if (!authLoading && !user) {
      // Usuário não autenticado
      setLoading(false);
      setPermissions([]);
    }
  }, [authLoading, user]);

  const hasPermission = (permission: UserPermission): boolean => {
    return permissions.includes(permission);
  };

  const requirePermission = (permission: UserPermission, action: string = 'realizar esta ação') => {
    if (!hasPermission(permission)) {
      toast({
        title: 'Acesso negado',
        description: `Você não tem permissão para ${action}`,
        variant: 'destructive',
      });
      return false;
    }
    return true;
  };

  return {
    permissions,
    loading,
    hasPermission,
    requirePermission,
    refreshPermissions: loadUserPermissions
  };
};