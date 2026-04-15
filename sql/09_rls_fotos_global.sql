-- =================================================================
-- Fix: Permitir que todos os usuários autenticados vejam as fotos
-- Execute no Supabase → SQL Editor
-- =================================================================
-- A tabela fotos_ocorrencias só tinha política de DELETE.
-- Sem uma política SELECT, usuários que não são donos recebem
-- um array vazio no join, fazendo a foto sumir na tela de detalhe.

CREATE POLICY "Permitir leitura global de fotos"
ON fotos_ocorrencias FOR SELECT
TO authenticated
USING (true);
