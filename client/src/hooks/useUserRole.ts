import * as React from "react";
// useUserRole.ts - Versão Corrigida
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth.ts";
import { supabase } from "@/integrations/supabase/client.ts";

export const useUserRole = () => {
  const { user } = useAuth();
  const [roles, setRoles] = useState<string[]>([]);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const loadUserData = useCallback(async () => {
    try {
      if (!user?.id) {
        setRoles([]);
        setPermissions([]);
        setLoading(false);
        return;
      }

      // Carregar roles
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      // Carregar permissões - CORRIGIDO: usar a tabela correta
      const { data: permissionsData, error: permissionsError } = await supabase
        .from('user_permissions')
        .select('permission')
        .eq('user_id', user.id);

      if (rolesError) console.error('Erro ao carregar roles:', rolesError);
      if (permissionsError) console.error('Erro ao carregar permissões:', permissionsError);

      setRoles(rolesData?.map(r => r.role) || []);
      setPermissions(permissionsData?.map(p => p.permission) || []);
    } catch (error) {
      console.error('Erro ao carregar dados do usuário:', error);
      setRoles([]);
      setPermissions([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  const hasRole = (role: string) => roles.includes(role);
  const hasPermission = (permission: string) => permissions.includes(permission);

  return {
    roles,
    permissions,
    loading,
    hasRole,
    hasPermission,
    isMaster: hasRole('master'),
    isAdmin: hasRole('admin'),
    canDelete: hasRole('master') || hasPermission('excluir_processo')
  };
};