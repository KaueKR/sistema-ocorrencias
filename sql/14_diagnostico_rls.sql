-- =================================================================
-- DIAGNÓSTICO E VERIFICAÇÃO DAS POLÍTICAS RLS
--
-- Execute este arquivo ANTES de qualquer correção para entender
-- o estado atual do banco. Não altera nada — apenas consultas.
-- =================================================================


-- =================================================================
-- 1. Verificar se a coluna restrito existe e quais categorias
--    estão marcadas como restritas
-- =================================================================

SELECT nome, restrito
FROM categorias
ORDER BY restrito DESC, nome;


-- =================================================================
-- 2. Verificar TODAS as políticas ativas na tabela ocorrencias
--    (Se aparecer "Permitir leitura global de ocorrencias" aqui,
--    ela está em conflito com as políticas restritivas!)
-- =================================================================

SELECT
  policyname,
  cmd,
  permissive,
  qual AS using_expr,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'ocorrencias'
ORDER BY cmd, policyname;


-- =================================================================
-- 3. Verificar políticas ativas na tabela categorias
-- =================================================================

SELECT
  policyname,
  cmd,
  permissive,
  qual AS using_expr
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'categorias'
ORDER BY cmd, policyname;


-- =================================================================
-- 4. Verificar quais roles possuem a permissão ver_restrito
--    (Deve aparecer: super_admin, admin_institucional, professor)
-- =================================================================

SELECT r.nome AS role, r.nivel, p.codigo AS permissao
FROM role_permissoes rp
JOIN roles r      ON r.id = rp.role_id
JOIN permissoes p ON p.id = rp.permissao_id
WHERE p.codigo = 'ocorrencias.ver_restrito'
ORDER BY r.nivel;


-- =================================================================
-- 5. Verificar se a função categoria_e_restrita existe
-- =================================================================

SELECT routine_name, security_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('categoria_e_restrita', 'tem_permissao', 'nivel_minimo_usuario');


-- =================================================================
-- RESULTADO ESPERADO:
--
-- Consulta 1: "Problema com aluno" deve ter restrito = true
--
-- Consulta 2: Deve ter APENAS estas políticas em ocorrencias:
--   - ocorrencias_select_geral   (SELECT, PERMISSIVE)
--   - ocorrencias_select_restrito (SELECT, PERMISSIVE)
--   - ocorrencias_update_staff   (UPDATE)
--   - ocorrencias_delete_admin   (DELETE)
--   - ocorrencias_insert_*       (INSERT)
--   NÃO deve aparecer "Permitir leitura global de ocorrencias"!
--
-- Consulta 3: categorias deve ter apenas:
--   - categorias_select_geral    (SELECT, PERMISSIVE)
--   - categorias_select_restrito (SELECT, PERMISSIVE)
--
-- Consulta 4: 3 linhas (super_admin, admin_institucional, professor)
--
-- Consulta 5: As 3 funções devem existir com SECURITY DEFINER
--
-- Se algum resultado divergir, execute o arquivo 13_fix_definitivo.sql!
-- =================================================================
