import { supabase } from './supabase';

export async function buscarCategorias() {
  const { data, error } = await supabase
    .from('categorias')
    .select(`
      id,
      nome,
      icone,
      setores (
        id,
        nome
      )
    `)
    .eq('ativo', true);

  if (error) {
    console.error('Erro ao buscar categorias:', error);
    throw error;
  }

  return data;
}

export async function buscarSetores() {
  const { data, error } = await supabase
    .from('setores')
    .select('*')
    .eq('ativo', true);

  if (error) {
    console.error('Erro ao buscar setores:', error);
    throw error;
  }

  return data;
}
