-- =================================================================
-- Fix: corrige a política RLS de leitura de ocorrências restritas.
--
-- PROBLEMA: a política "ocorrencias_select_geral" usava uma subquery
-- direta em "categorias". Quando a RLS da tabela "categorias" está
-- ativa, um aluno/técnico/gestor não enxerga a linha da categoria
-- restrita — então NOT EXISTS retorna TRUE e a ocorrência aparece
-- para todos.
--
-- SOLUÇÃO: criar uma função SECURITY DEFINER que acessa "categorias"
-- sem restrição de RLS. Usar essa função na política de ocorrências.
--
-- Execute no Supabase → SQL Editor
-- =================================================================


-- =================================================================
-- PARTE 1: FUNÇÃO SECURITY DEFINER
-- Acessa "categorias" sem restrição de RLS para checar o flag restrito.
-- =================================================================

CREATE OR REPLACE FUNCTION categoria_e_restrita(p_categoria_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM categorias
    WHERE id = p_categoria_id
      AND restrito = true
  );
$$;


-- =================================================================
-- PARTE 2: RECRIAR A POLÍTICA GERAL DE SELECT EM ocorrencias
-- A função SECURITY DEFINER garante que a checagem de "restrito"
-- funciona corretamente independente das permissões do usuário.
-- =================================================================

DROP POLICY IF EXISTS "ocorrencias_select_geral" ON ocorrencias;

CREATE POLICY "ocorrencias_select_geral"
ON ocorrencias FOR SELECT
TO authenticated
USING (
  NOT categoria_e_restrita(categoria_id)
);

-- Política para usuários privilegiados (já existe, mas recriamos
-- para garantir que está presente após qualquer reset parcial)
DROP POLICY IF EXISTS "ocorrencias_select_restrito" ON ocorrencias;

CREATE POLICY "ocorrencias_select_restrito"
ON ocorrencias FOR SELECT
TO authenticated
USING (
  tem_permissao('ocorrencias.ver_restrito')
);
