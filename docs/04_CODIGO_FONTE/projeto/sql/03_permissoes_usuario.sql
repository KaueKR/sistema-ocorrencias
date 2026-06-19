-- =================================================================
-- SQL para habilitar ações do usuário sobre suas próprias ocorrências
-- Execute no Supabase → SQL Editor
-- =================================================================

-- 1. Permitir que o usuário ATUALIZE o status das suas próprias ocorrências
CREATE POLICY "Usuarios atualizam suas ocorrencias"
ON ocorrencias
FOR UPDATE
USING (auth.uid() = usuario_id)
WITH CHECK (auth.uid() = usuario_id);

-- 2. Permitir que o usuário EXCLUA suas próprias ocorrências
CREATE POLICY "Usuarios excluem suas ocorrencias"
ON ocorrencias
FOR DELETE
USING (auth.uid() = usuario_id);

-- 3. Permitir que o usuário INSIRA no histórico de status (para registrar as ações)
CREATE POLICY "Usuarios inserem historico de status"
ON historico_status
FOR INSERT
WITH CHECK (auth.uid() = alterado_por);

-- 4. Permitir que o usuário EXCLUA registros filhos de fotos (necessário para remoção completa)
CREATE POLICY "Usuarios excluem fotos das suas ocorrencias"
ON fotos_ocorrencias
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM ocorrencias
    WHERE ocorrencias.id = fotos_ocorrencias.ocorrencia_id
    AND ocorrencias.usuario_id = auth.uid()
  )
);

-- 5. Permitir que o usuário exclua histórico (necessário para remoção completa)
CREATE POLICY "Usuarios excluem historico das suas ocorrencias"
ON historico_status
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM ocorrencias
    WHERE ocorrencias.id = historico_status.ocorrencia_id
    AND ocorrencias.usuario_id = auth.uid()
  )
);

-- 6. Adicionar 'cancelada' como valor válido (caso a coluna tenha enum/check constraint)
-- Se a coluna 'status' for do tipo TEXT, este passo não é necessário.
-- Se for ENUM, rode:
-- ALTER TYPE status_ocorrencia ADD VALUE IF NOT EXISTS 'cancelada';
