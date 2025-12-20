// accessUtils.ts - VERSÃO CORRIGIDA E MELHORADA
import { usePermissions } from "@/hooks/usePermissions.ts";

export const canViewAllProcesses = (permissions: string[]): boolean => {
  return permissions.includes("ver_todos_processos") || 
         permissions.includes("ADMIN") || 
         permissions.includes("master");
};

export const canViewAllFinancial = (permissions: string[]): boolean => {
  return permissions.includes("financeiro") && 
         (permissions.includes("ver_todos_processos") || 
          permissions.includes("ADMIN") || 
          permissions.includes("master"));
};

export const canViewAllClients = (permissions: string[]): boolean => {
  return permissions.includes("ver_todos_processos") || 
         permissions.includes("ADMIN") || 
         permissions.includes("master");
};

export const useGlobalAccess = () => {
  const { permissions, loading } = usePermissions();

  return {
    canViewAllProcesses: canViewAllProcesses(permissions),
    canViewAllFinancial: canViewAllFinancial(permissions),
    canViewAllClients: canViewAllClients(permissions),
    permissionsLoading: loading,
  };
};