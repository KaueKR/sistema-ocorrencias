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
 * Atualiza a role principal do usuário.
 * A Trigger no banco cuidará de atualizar a tabela perfil_roles automaticamente.
 */
export async function atribuirRole({ perfilId, roleNome }) {
  const { data, error } = await supabase
    .from('perfis')
    .update({ 
      role_principal: roleNome,
      tipo_usuario: (roleNome === 'super_admin' || roleNome === 'admin_institucional') 
        ? 'administrador' 
        : 'usuario'
    })
    .eq('id', perfilId)
    .select(); // <--- IMPORTANTE: Isso força o retorno dos dados alterados

  if (error) {
    console.error('Erro ao atribuir role:', error.message);
    throw error;
  }

  // Verificação de segurança: se data estiver vazio ou for array vazio, a RLS barrou
  if (!data || data.length === 0) {
    console.error('Atenção: O banco não retornou dados. Verifique as Policies (RLS).');
    throw new Error('Permissão negada ou usuário não encontrado.');
  }

  return data[0];
}
