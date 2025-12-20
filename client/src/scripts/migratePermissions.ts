// scripts/migratePermissions.ts
import { supabase } from '@/integrations/supabase/client.ts';

export const migrateUserPermissions = async () => {
  console.log('Iniciando migração de permissões...');

  // ID do usuário master (unionassessoriajuridica@gmail.com)
  const masterUserId = '7d97a26a-3a5c-41c7-81aa-9679ad065c2f';
  
  // ID do usuário que precisa das permissões (giovannafaccioanastacio@gmail.com)
  const targetUserId = 'f3527e78-baf4-4de5-8529-340f1bfff9fc';

  // Permissões a serem concedidas
  const permissionsToAdd = [
    'ver_todos_processos',
    'financeiro',
    'modificar_clientes',
    'excluir_processo',
    'ia_facilita',
    'facilisign',
    'novo_processo',
    'google_integration',
    'agenda',
    'user_management'
  ];

  try {
    // Verificar se as permissões já existem
    const { data: existingPermissions, error: checkError } = await supabase
      .from('user_permissions')
      .select('permission')
      .eq('user_id', targetUserId);

    if (checkError) throw checkError;

    const existingPermissionKeys = existingPermissions?.map(p => p.permission) || [];

    // Adicionar apenas as permissões que não existem
    const permissionsToInsert = permissionsToAdd
      .filter(permission => !existingPermissionKeys.includes(permission))
      .map(permission => ({
        user_id: targetUserId,
        permission: permission,
        granted_by: masterUserId
      }));

    if (permissionsToInsert.length > 0) {
      const { error: insertError } = await supabase
        .from('user_permissions')
        .insert(permissionsToInsert);

      if (insertError) throw insertError;

      console.log(`Adicionadas ${permissionsToInsert.length} permissões para o usuário ${targetUserId}`);
    } else {
      console.log('Todas as permissões já existem para este usuário');
    }

    console.log('Migração concluída com sucesso!');
  } catch (error) {
    console.error('Erro durante a migração:', error);
  }
};

// Don't auto-execute - this should only run manually
// migrateUserPermissions();