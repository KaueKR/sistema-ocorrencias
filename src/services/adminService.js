import { supabase } from './supabase';

/**
 * Busca todos os usuários com seus perfis e roles.
 * Aplica filtro opcional por role e busca por nome.
 */
export async function buscarUsuarios({ filtroRole = null, busca = '' } = {}) {
  let query = supabase
    .from('perfis')
    .select(`
      id,
      nome_completo,
      role_principal,
      criado_em,
      perfil_roles!perfil_roles_perfil_id_fkey (
        id,
        setor_id,
        roles ( id, nome, label, nivel ),
        setores ( id, nome )
      )
    `)
    .order('nome_completo', { ascending: true });

  if (busca && busca.trim().length > 0) {
    query = query.ilike('nome_completo', `%${busca.trim()}%`);
  }

  if (filtroRole) {
    query = query.eq('role_principal', filtroRole);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

/**
 * Busca todas as roles ativas ordenadas por nível hierárquico.
 */
export async function buscarRoles() {
  const { data, error } = await supabase
    .from('roles')
    .select('id, nome, label, nivel, descricao')
    .eq('ativo', true)
    .order('nivel', { ascending: true });

  if (error) throw error;
  return data || [];
}

/**
 * Busca todos os setores disponíveis.
 */
export async function buscarSetores() {
  const { data, error } = await supabase
    .from('setores')
    .select('id, nome, descricao')
    .order('nome', { ascending: true });

  if (error) throw error;
  return data || [];
}

/**
 * Atribui uma nova role a um usuário de forma atômica via RPC.
 * A função no banco valida hierarquia e permissões antes de executar.
 *
 * @param {string} perfilId   - UUID do perfil alvo
 * @param {string} roleId     - UUID da role a ser atribuída
 * @param {string|null} setorId - UUID do setor (obrigatório para gestor/tecnico)
 */
export async function atribuirRole({ perfilId, roleId, setorId = null }) {
  const { data, error } = await supabase.rpc('atribuir_role_usuario', {
    p_perfil_id: perfilId,
    p_role_id:   roleId,
    p_setor_id:  setorId,
  });

  if (error) {
    console.error('atribuirRole RPC error:', JSON.stringify(error));
    throw new Error(error.message);
  }

  return data;
}
