-- =================================================================
-- Fix: Permitir que administradores vejam todos os perfis
-- Execute no Supabase → SQL Editor
-- IMPORTANTE: Execute APÓS os arquivos 06 e 07
-- =================================================================

-- A tabela `perfis` provavelmente tem uma policy restritiva que só
-- permite cada usuário ver o próprio registro. Adicionamos uma
-- segunda policy que libera leitura total para admins.

-- Se ainda não tiver RLS habilitada na tabela perfis, habilite:
ALTER TABLE perfis ENABLE ROW LEVEL SECURITY;

-- Remove a policy genérica de leitura, se existir alguma muito permissiva
-- (ajuste o nome conforme o que aparecer em Authentication → Policies no dashboard)
-- DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON perfis;
-- DROP POLICY IF EXISTS "perfis_select" ON perfis;

-- Policy 1: cada usuário sempre enxerga o próprio perfil
CREATE POLICY "perfis_select_proprio"
ON perfis FOR SELECT
TO authenticated
USING ( id = auth.uid() );

-- Policy 2: usuários com permissão 'usuarios.ver' enxergam todos os perfis
CREATE POLICY "perfis_select_admin"
ON perfis FOR SELECT
TO authenticated
USING ( tem_permissao('usuarios.ver') );

-- Policy de UPDATE: cada usuário edita apenas o próprio perfil
-- (o super_admin pode ter uma policy separada se necessário)
CREATE POLICY "perfis_update_proprio"
ON perfis FOR UPDATE
TO authenticated
USING ( id = auth.uid() )
WITH CHECK ( id = auth.uid() );
