import * as React from "react";
// components/WithResourceAccess.tsx
import React from 'react';
import { useResourceAccess } from '@/utils/resourceAccessUtils.ts';
import { useToast } from '@/hooks/use-toast.ts';
import { useNavigate } from 'react-router-dom';

interface WithResourceAccessProps {
  resourceUserId?: string;
  children: React.ReactNode;
  requiredAccess?: 'view' | 'edit' | 'delete';
}

export const WithResourceAccess: React.FC<WithResourceAccessProps> = ({
  resourceUserId,
  children,
  requiredAccess = 'view'
}) => {
  const { canAccessResource, canEditResource, canDeleteResource, permissionsLoading } = useResourceAccess();
  const { toast } = useToast();
  const navigate = useNavigate();

  if (permissionsLoading) {
    return <div>Carregando...</div>;
  }

  let hasAccess = false;

  switch (requiredAccess) {
    case 'view':
      hasAccess = canAccessResource(resourceUserId);
      break;
    case 'edit':
      hasAccess = canEditResource(resourceUserId);
      break;
    case 'delete':
      hasAccess = canDeleteResource(resourceUserId);
      break;
    default:
      hasAccess = canAccessResource(resourceUserId);
  }

  if (!hasAccess) {
    // Mostrar mensagem e redirecionar
    toast({
      title: 'Acesso negado',
      description: 'Você não tem permissão para acessar este recurso',
      variant: 'destructive',
    });
    navigate('/dashboard');
    return null;
  }

  return <>{children}</>;
};