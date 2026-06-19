import { supabase } from './supabase';
import { decode } from 'base64-arraybuffer';

export async function criarOcorrencia(novaOcorrencia, userId, fotoBase64 = null) {
  try {
    const { data: ocorrencia, error: errorOcorrencia } = await supabase
      .from('ocorrencias')
      .insert({
        usuario_id: userId,
        titulo: novaOcorrencia.titulo,
        descricao: novaOcorrencia.descricao,
        categoria_id: novaOcorrencia.categoria_id,
        local: novaOcorrencia.local,
        urgencia: novaOcorrencia.urgencia,
      })
      .select()
      .single();

    if (errorOcorrencia) throw errorOcorrencia;

    if (fotoBase64) {
      await uploadFoto(ocorrencia.id, fotoBase64);
    }

    return ocorrencia;
  } catch (error) {
    console.error('Erro ao criar ocorrencia:', error);
    throw error;
  }
}

async function uploadFoto(ocorrenciaId, base64Data) {
  try {
    const nomeArquivo = `${ocorrenciaId}_${Date.now()}.jpg`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('fotos-ocorrencias')
      .upload(nomeArquivo, decode(base64Data), {
        contentType: 'image/jpeg'
      });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('fotos-ocorrencias')
      .getPublicUrl(nomeArquivo);
    const { error: dbError } = await supabase
      .from('fotos_ocorrencias')
      .insert({
        ocorrencia_id: ocorrenciaId,
        url: publicUrl,
        storage_path: nomeArquivo
      });

    if (dbError) throw dbError;

  } catch (error) {
    console.error('Erro ao registrar foto', error);
  }
}

export async function buscarOcorrencias(userId = null, podVerRestrito = true) {
  // Defesa em camadas: se o usuário não pode ver categorias restritas, usamos
  // INNER JOIN (!inner) para que o PostgREST exclua automaticamente as
  // ocorrências cuja categoria foi bloqueada pela RLS de categorias.
  // A RLS no banco já é a barreira principal; este filtro é a camada secundária.
  const joinCategorias = podVerRestrito
    ? 'categorias (nome, icone)'
    : 'categorias!inner (nome, icone)';

  let query = supabase
    .from('ocorrencias')
    .select(`
      id,
      titulo,
      status,
      urgencia,
      criado_em,
      usuario_id,
      ${joinCategorias},
      fotos_ocorrencias (url)
    `)
    .order('criado_em', { ascending: false });

  if (userId) {
    query = query.eq('usuario_id', userId);
  }

  if (!podVerRestrito) {
    query = query.eq('categorias.restrito', false);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function buscarOcorrenciaId(ocorrenciaId) {
  const { data, error } = await supabase
    .from('ocorrencias')
    .select(`
      *,
      categorias (nome, icone),
      setores (nome),
      fotos_ocorrencias (url),
      historico_status (
        status_anterior,
        status_novo,
        observacao,
        criado_em,
        perfis (nome_completo)
      )
    `)
    .eq('id', ocorrenciaId)
    .single();

  if (error) throw error;
  return data;
}

export async function atualizarStatusOcorrencia(ocorrenciaId, novoStatus, userId, observacao = null, statusAnterior = 'aberta') {
  const { error: updateError } = await supabase
    .from('ocorrencias')
    .update({ status: novoStatus })
    .eq('id', ocorrenciaId);

  if (updateError) throw updateError;

  const { error: histError } = await supabase
    .from('historico_status')
    .insert({
      ocorrencia_id: ocorrenciaId,
      status_anterior: statusAnterior,
      status_novo: novoStatus,
      observacao: observacao,
      alterado_por: userId,
    });

  if (histError) console.warn('Erro ao registrar histórico:', histError);
}

export async function excluirOcorrencia(ocorrenciaId, userId) {
  const { data: fotos } = await supabase
    .from('fotos_ocorrencias')
    .select('storage_path')
    .eq('ocorrencia_id', ocorrenciaId);

  if (fotos && fotos.length > 0) {
    const paths = fotos.map(f => f.storage_path);
    await supabase.storage.from('fotos-ocorrencias').remove(paths);
  }

  await supabase.from('fotos_ocorrencias').delete().eq('ocorrencia_id', ocorrenciaId);
  await supabase.from('historico_status').delete().eq('ocorrencia_id', ocorrenciaId);

  const { error } = await supabase
    .from('ocorrencias')
    .delete()
    .eq('id', ocorrenciaId);

  if (error) throw error;
}
