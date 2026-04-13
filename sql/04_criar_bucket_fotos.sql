-- =================================================================
-- SQL para criar o Bucket de Fotos e configurar as políticas 
-- Execute no Supabase → SQL Editor
-- =================================================================

-- 1. Criação do Bucket Público "fotos-ocorrencias"
INSERT INTO storage.buckets (id, name, public)
VALUES ('fotos-ocorrencias', 'fotos-ocorrencias', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Permitir que qualquer usuário LOGADO faça UPLOAD de fotos
CREATE POLICY "Obrigatorio estar logado para enviar fotos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'fotos-ocorrencias');

-- 3. Permitir que qualquer usuário LOGADO possa VISUALIZAR as fotos
CREATE POLICY "Permitir visualizar fotos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'fotos-ocorrencias');

-- 4. Permitir que o usuário LOGADO exclua suas respectivas fotos
CREATE POLICY "Permitir exclusao de fotos pelo dono"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'fotos-ocorrencias' AND auth.uid() = owner);
