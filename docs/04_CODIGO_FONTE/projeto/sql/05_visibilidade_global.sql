-- =================================================================
-- SQL para tornar TODAS as Ocorrências visíveis para todos
-- Execute no Supabase → SQL Editor
-- =================================================================

-- 1. Cria uma política permitindo que qualquer usuário autenticado VEJA qualquer ocorrência
CREATE POLICY "Permitir leitura global de ocorrencias"
ON ocorrencias FOR SELECT
TO authenticated
USING (true);

-- 2. Permitir que vejam os históricos também
CREATE POLICY "Permitir leitura global do historico"
ON historico_status FOR SELECT
TO authenticated
USING (true);
