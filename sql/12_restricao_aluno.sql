-- =================================================================
-- Restrições do nível Aluno
--
-- 1. Aluno não pode criar ocorrências de categoria restrita
--    ("Problema com aluno"), nem pela UI nem diretamente.
--
-- 2. As políticas de SELECT já bloqueiam a visualização (arquivo 11).
--    Este arquivo adiciona a camada de INSERT.
--
-- Execute no Supabase → SQL Editor
-- =================================================================


-- =================================================================
-- POLÍTICA RESTRICTIVE de INSERT em ocorrencias
--
-- Políticas RESTRICTIVE são AND-adas com as permissivas: mesmo que
-- outra política permita o INSERT, esta barra se a categoria for
-- restrita e o usuário não tiver a permissão necessária.
-- =================================================================

DROP POLICY IF EXISTS "ocorrencias_insert_categoria_permitida" ON ocorrencias;

CREATE POLICY "ocorrencias_insert_categoria_permitida"
ON ocorrencias AS RESTRICTIVE FOR INSERT
TO authenticated
WITH CHECK (
  -- Categoria não é restrita (caminho normal para todos)
  NOT categoria_e_restrita(categoria_id)
  OR
  -- OU o usuário tem permissão para ver/criar em categorias restritas
  tem_permissao('ocorrencias.ver_restrito')
);
