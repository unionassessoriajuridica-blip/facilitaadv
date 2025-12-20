// resourceAccessUtils.ts
import { useAuth } from "@/hooks/useAuth.ts";
import { useGlobalAccess } from "@/utils/accessUtils.ts";

export const useResourceAccess = () => {
  const { user } = useAuth();
  const { 
    canViewAllProcesses, 
    canViewAllFinancial, 
    canViewAllClients,
    permissionsLoading 
  } = useGlobalAccess();

  const canAccessResource = (resourceUserId: string | undefined): boolean => {
    if (permissionsLoading) return false;
    
    // Se tem acesso global OU é o dono do recurso
    const hasGlobalAccess = canViewAllProcesses || canViewAllFinancial || canViewAllClients;
    const isOwner = resourceUserId === user?.id;
    
    return hasGlobalAccess || isOwner;
  };

  const canEditResource = (resourceUserId: string | undefined): boolean => {
    if (permissionsLoading) return false;
    
    // Para editar, precisa ser o dono OU ter acesso global + permissões de modificação
    const isOwner = resourceUserId === user?.id;
    const hasModificationAccess = canViewAllProcesses; // ver_todos_processos já implica em acesso de modificação
    
    return isOwner || hasModificationAccess;
  };

  const canDeleteResource = (resourceUserId: string | undefined): boolean => {
    if (permissionsLoading) return false;
    
    // Para deletar, precisa ser o dono OU ter acesso global + permissão específica
    const isOwner = resourceUserId === user?.id;
    const hasDeleteAccess = canViewAllProcesses; // ver_todos_processos já inclui capacidade de exclusão
    
    return isOwner || hasDeleteAccess;
  };

  return {
    canAccessResource,
    canEditResource,
    canDeleteResource,
    permissionsLoading
  };
};