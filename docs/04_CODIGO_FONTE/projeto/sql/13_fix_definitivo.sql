-- =================================================================
-- FIX DEFINITIVO — Restrição "Problema com aluno"
--
-- Este arquivo substitui e corrige tudo dos arquivos 10 e 11.
-- Execute APENAS este arquivo no Supabase → SQL Editor.
-- É seguro executar mais de uma vez (idempotente).
-- =================================================================


-- =================================================================
-- PASSO 1: Garantir coluna restrito na tabela categorias
-- =================================================================

ALTER TABLE categorias
  ADD COLUMN IF NOT EXISTS restrito boolean NOT NULL DEFAULT false;

-- Garantir que "Problema com aluno" está marcada
UPDATE categorias SET restrito = true WHERE nome = 'Problema com Aluno';


-- =================================================================
-- PASSO 2: Garantir permissão e atribuição às roles corretas
-- =================================================================

INSERT INTO permissoes (codigo, descricao, modulo)
VALUES (
  'ocorrencias.ver_restrito',
  'Visualizar ocorrências de categorias restritas (ex: Problema com aluno)',
  'ocorrencias'
)
ON CONFLICT (codigo) DO NOTHING;

INSERT INTO role_permissoes (role_id, permissao_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissoes p
WHERE r.nome IN ('super_admin', 'admin_institucional', 'professor')
  AND p.codigo = 'ocorrencias.ver_restrito'
ON CONFLICT DO NOTHING;


-- =================================================================
-- PASSO 3: Função SECURITY DEFINER para checar categoria restrita
--
-- SECURITY DEFINER é obrigatório: sem ela, a política de ocorrências
-- consulta categorias sob as permissões do usuário logado. Como a
-- tabela categorias também tem RLS, o aluno não enxerga a linha
-- restrita, NOT EXISTS retorna TRUE e a ocorrência aparece indevida-
-- mente. Com SECURITY DEFINER a função roda como superuser e sempre
-- enxerga o valor real de restrito.
-- =================================================================

CREATE OR REPLACE FUNCTION categoria_e_restrita(p_categoria_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM categorias
    WHERE id = p_categoria_id
      AND restrito = true
  );
$$;


-- =================================================================
-- PASSO 4: Remover TODAS as políticas SELECT de ocorrencias
--
-- Usamos um loop para não depender de nomes específicos — qualquer
-- política SELECT que tenha sobrevivido de execuções anteriores é
-- removida aqui.
-- =================================================================

DO $$
DECLARE
  pol text;
BEGIN
  FOR pol IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'ocorrencias'
      AND cmd        = 'SELECT'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON ocorrencias', pol);
  END LOOP;
END;
$$;


-- =================================================================
-- PASSO 5: Recriar as políticas SELECT corretas
-- =================================================================

-- Ocorrências de categorias NÃO restritas → todos os autenticados
CREATE POLICY "ocorrencias_select_geral"
ON ocorrencias FOR SELECT
TO authenticated
USING (
  NOT categoria_e_restrita(categoria_id)
);

-- Ocorrências de qualquer categoria → somente quem tem a permissão
CREATE POLICY "ocorrencias_select_restrito"
ON ocorrencias FOR SELECT
TO authenticated
USING (
  tem_permissao('ocorrencias.ver_restrito')
);


-- =================================================================
-- PASSO 6: RLS na tabela categorias (esconde do formulário Nova
-- Ocorrência e de qualquer query de listagem de categorias)
-- =================================================================

ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;

-- Remove políticas existentes antes de recriar
DROP POLICY IF EXISTS "categorias_select_geral"    ON categorias;
DROP POLICY IF EXISTS "categorias_select_restrito" ON categorias;

CREATE POLICY "categorias_select_geral"
ON categorias FOR SELECT
TO authenticated
USING (restrito = false);

CREATE POLICY "categorias_select_restrito"
ON categorias FOR SELECT
TO authenticated
USING (tem_permissao('ocorrencias.ver_restrito'));


-- =================================================================
-- PASSO 7: Políticas UPDATE/DELETE para staff (necessárias para que
-- técnico e admin consigam atualizar e excluir ocorrências alheias)
-- =================================================================

DROP POLICY IF EXISTS "ocorrencias_update_staff" ON ocorrencias;
CREATE POLICY "ocorrencias_update_staff"
ON ocorrencias FOR UPDATE
TO authenticated
USING     (tem_permissao('ocorrencias.atualizar_status'))
WITH CHECK (tem_permissao('ocorrencias.atualizar_status'));

DROP POLICY IF EXISTS "ocorrencias_delete_admin" ON ocorrencias;
CREATE POLICY "ocorrencias_delete_admin"
ON ocorrencias FOR DELETE
TO authenticated
USING (tem_permissao('ocorrencias.deletar'));


-- =================================================================
-- PASSO 8: Política RESTRICTIVE de INSERT — impede criação de
-- ocorrências em categorias restritas para quem não tem permissão
-- =================================================================

DROP POLICY IF EXISTS "ocorrencias_insert_categoria_permitida" ON ocorrencias;
CREATE POLICY "ocorrencias_insert_categoria_permitida"
ON ocorrencias AS RESTRICTIVE FOR INSERT
TO authenticated
WITH CHECK (
  NOT categoria_e_restrita(categoria_id)
  OR tem_permissao('ocorrencias.ver_restrito')
);


-- =================================================================
-- VERIFICAÇÃO FINAL (opcional — confira os resultados)
-- =================================================================

-- Deve mostrar "Problema com aluno" com restrito = true:
-- SELECT nome, restrito FROM categorias WHERE restrito = true;

-- Deve listar as políticas ativas em ocorrencias:
-- SELECT policyname, cmd, qual FROM pg_policies
-- WHERE tablename = 'ocorrencias' ORDER BY cmd, policyname;

-- Deve mostrar professor, admin_institucional, super_admin com a permissão:
-- SELECT r.nome, p.codigo
-- FROM role_permissoes rp
-- JOIN roles r ON r.id = rp.role_id
-- JOIN permissoes p ON p.id = rp.permissao_id
-- WHERE p.codigo = 'ocorrencias.ver_restrito';
