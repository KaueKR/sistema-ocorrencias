-- =================================================================
-- CORREÇÃO FINAL — Categoria restrita + conflito de política
--
-- Problemas identificados pelo diagnóstico:
--
-- 1. A categoria "Problema com aluno" tem restrito = false.
--    O UPDATE anterior não encontrou o nome exato.
--    Ajuste o nome abaixo conforme aparecer na consulta:
--       SELECT id, nome, restrito FROM categorias ORDER BY nome;
--
-- 2. A política "Qualquer usuario logado pode ver categorias"
--    está em conflito: permite que QUALQUER usuário veja todas
--    as categorias, anulando a restrição restrito = false.
--
-- Execute APENAS este arquivo no Supabase → SQL Editor.
-- É seguro executar mais de uma vez (idempotente).
-- =================================================================


-- =================================================================
-- PASSO 1: Marcar a categoria correta como restrita
--
-- ⚠️ IMPORTANTE: substitua 'Problema com aluno' pelo nome EXATO
-- que aparecer na query: SELECT id, nome FROM categorias;
-- =================================================================

UPDATE categorias
SET restrito = true
WHERE nome = 'Problema com Aluno';   -- nome exato confirmado no banco

-- Confirmação: mostra o resultado após o UPDATE
SELECT nome, restrito FROM categorias ORDER BY restrito DESC, nome;


-- =================================================================
-- PASSO 2: Remover a política conflitante em categorias
--
-- "Qualquer usuario logado pode ver categorias" usa USING (auth.uid()
-- IS NOT NULL), o que permite que TODOS vejam TUDO — isso anula
-- completamente as políticas categorias_select_geral e
-- categorias_select_restrito criadas no 13_fix_definitivo.sql.
-- =================================================================

DROP POLICY IF EXISTS "Qualquer usuario logado pode ver categorias" ON categorias;


-- =================================================================
-- PASSO 3: Garantir que as políticas corretas estão presentes
-- (idempotente — não falha se já existirem)
-- =================================================================

-- Remove e recria para garantir o estado correto
DROP POLICY IF EXISTS "categorias_select_geral"    ON categorias;
DROP POLICY IF EXISTS "categorias_select_restrito" ON categorias;

-- Todos os autenticados veem categorias não restritas
CREATE POLICY "categorias_select_geral"
ON categorias FOR SELECT
TO authenticated
USING (restrito = false);

-- Só quem tem ver_restrito vê a categoria restrita
CREATE POLICY "categorias_select_restrito"
ON categorias FOR SELECT
TO authenticated
USING (tem_permissao('ocorrencias.ver_restrito'));


-- =================================================================
-- VERIFICAÇÃO FINAL
-- =================================================================

-- Deve mostrar APENAS estas 3 políticas SELECT em categorias:
--   categorias_select_geral    → (restrito = false)
--   categorias_select_restrito → tem_permissao(...)
-- A política "Qualquer usuario logado..." NÃO deve aparecer.
SELECT policyname, cmd, qual AS using_expr
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'categorias'
ORDER BY cmd, policyname;
