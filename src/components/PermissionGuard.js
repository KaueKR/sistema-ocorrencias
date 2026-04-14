import React from 'react';
import { usePermissions } from '../hooks/usePermissions';

/**
 * Componente de guarda de permissão.
 * Renderiza `children` somente se o usuário satisfizer o critério.
 * Caso contrário, renderiza `fallback` (padrão: null).
 *
 * Uso:
 *   // Por permissão
 *   <PermissionGuard permissao="ocorrencias.atualizar_status">
 *     <BotaoAlterarStatus />
 *   </PermissionGuard>
 *
 *   // Por role
 *   <PermissionGuard role="super_admin" fallback={<Text>Acesso negado</Text>}>
 *     <ConfiguracoesSistema />
 *   </PermissionGuard>
 *
 *   // Somente admins (nível <= 2)
 *   <PermissionGuard admin>
 *     <PainelAdmin />
 *   </PermissionGuard>
 */
export function PermissionGuard({
  permissao,
  role,
  admin = false,
  fallback = null,
  children,
}) {
  const { can, hasRole, isAdmin } = usePermissions();

  let permitido = true;

  if (admin) {
    permitido = isAdmin;
  } else if (permissao) {
    permitido = can(permissao);
  } else if (role) {
    permitido = hasRole(role);
  }

  return permitido ? <>{children}</> : <>{fallback}</>;
}
