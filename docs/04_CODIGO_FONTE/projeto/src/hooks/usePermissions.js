import { useCallback, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';

/**
 * Hook central para verificação de permissões e roles.
 *
 * Uso:
 *   const { can, hasRole, isAdmin, canManageRole } = usePermissions();
 *
 *   can('ocorrencias.ver_todas')   → boolean
 *   hasRole('super_admin')         → boolean
 *   isAdmin                        → true se nível <= 2
 *   canManageRole(6)               → true se meu nível < 6
 */
export function usePermissions() {
  const { permissoes, roles } = useAuth();

  // Menor nível entre todas as roles do usuário = maior autoridade
  const nivelMinimo = useMemo(() => {
    if (!roles || roles.length === 0) return 999;
    return Math.min(...roles.map(r => r.nivel));
  }, [roles]);

  /** Verifica se o usuário possui uma permissão específica pelo código */
  const can = useCallback(
    (codigo) => Array.isArray(permissoes) && permissoes.includes(codigo),
    [permissoes]
  );

  /** Verifica se o usuário possui uma role específica pelo nome (slug) */
  const hasRole = useCallback(
    (roleNome) => Array.isArray(roles) && roles.some(r => r.nome === roleNome),
    [roles]
  );

  /**
   * Verifica se o usuário pode atribuir/remover uma role de determinado nível.
   * Regra: meu nível deve ser MENOR (= mais autoridade) que o nível alvo.
   */
  const canManageRole = useCallback(
    (targetNivel) => nivelMinimo < targetNivel,
    [nivelMinimo]
  );

  /** Atalho: true para super_admin e admin_institucional */
  const isAdmin = nivelMinimo <= 2;

  /** Atalho: true somente para super_admin */
  const isSuperAdmin = nivelMinimo === 1;

  return {
    can,
    hasRole,
    canManageRole,
    isAdmin,
    isSuperAdmin,
    nivelMinimo,
  };
}
