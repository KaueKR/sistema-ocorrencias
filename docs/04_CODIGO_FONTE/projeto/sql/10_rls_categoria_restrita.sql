-- =================================================================
-- Categorias restritas: "Problema com aluno" visível apenas para
-- Professor, Admin Institucional e Super Admin.
-- Execute no Supabase → SQL Editor
-- =================================================================


-- =================================================================
-- PARTE 1: COLUNA restrito NA TABELA categorias
-- =================================================================

ALTER TABLE categorias
  ADD COLUMN IF NOT EXISTS restrito boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN categorias.restrito IS
  'true = somente roles privilegiadas (professor, admin, super_admin) podem ver ocorrências desta categoria';


-- =================================================================
-- PARTE 2: MARCAR A CATEGORIA RESTRITA
-- =================================================================

UPDATE categorias
SET restrito = true
WHERE nome = 'Problema com aluno';


-- =================================================================
-- PARTE 3: NOVA PERMISSÃO
-- =================================================================

INSERT INTO permissoes (codigo, descricao, modulo) VALUES
  (
    'ocorrencias.ver_restrito',
    'Visualizar ocorrências de categorias restritas (ex: Problema com aluno)',
    'ocorrencias'
  )
ON CONFLICT (codigo) DO NOTHING;


-- =================================================================
-- PARTE 4: ATRIBUIR A PERMISSÃO ÀS ROLES AUTORIZADAS
-- Professor, Admin Institucional e Super Admin
-- =================================================================

INSERT INTO role_permissoes (role_id, permissao_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissoes p
WHERE r.nome IN ('super_admin', 'admin_institucional', 'professor')
  AND p.codigo = 'ocorrencias.ver_restrito'
ON CONFLICT DO NOTHING;


-- =================================================================
-- PARTE 5: RLS NA TABELA categorias
-- Categorias restritas ficam invisíveis para roles não autorizadas,
-- impedindo também que apareçam no formulário "Nova Ocorrência".
-- =================================================================

ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;

-- Todos os autenticados veem categorias não-restritas
CREATE POLICY "categorias_select_geral"
ON categorias FOR SELECT
TO authenticated
USING (restrito = false);

-- Roles privilegiadas veem TODAS (inclusive as restritas)
CREATE POLICY "categorias_select_restrito"
ON categorias FOR SELECT
TO authenticated
USING (tem_permissao('ocorrencias.ver_restrito'));


-- =================================================================
-- PARTE 6: FUNÇÃO SECURITY DEFINER para checar categoria restrita
-- Necessária para que a política de ocorrências funcione corretamente
-- mesmo com RLS ativa na tabela categorias. Sem SECURITY DEFINER, a
-- subquery em USING não enxerga a linha restrita e NOT EXISTS retorna
-- TRUE para todos, expondo as ocorrências.
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
-- PARTE 7: SUBSTITUIR A POLÍTICA GLOBAL DE LEITURA DE ocorrencias
-- =================================================================

DROP POLICY IF EXISTS "Permitir leitura global de ocorrencias" ON ocorrencias;

-- Ocorrências de categorias NÃO restritas: todos os autenticados veem
CREATE POLICY "ocorrencias_select_geral"
ON ocorrencias FOR SELECT
TO authenticated
USING (
  NOT categoria_e_restrita(categoria_id)
);

-- Ocorrências de categorias restritas: somente quem tem a permissão
CREATE POLICY "ocorrencias_select_restrito"
ON ocorrencias FOR SELECT
TO authenticated
USING (tem_permissao('ocorrencias.ver_restrito'));


-- =================================================================
-- PARTE 8: PERMITIR QUE STAFF ATUALIZE STATUS DE QUALQUER OCORRÊNCIA
-- Sem isso, técnico e admin só conseguem atualizar as próprias.
-- A política existente "Usuarios atualizam suas ocorrencias" cobre o dono.
-- Esta nova política cobre os funcionários autorizados.
-- =================================================================

CREATE POLICY "ocorrencias_update_staff"
ON ocorrencias FOR UPDATE
TO authenticated
USING     (tem_permissao('ocorrencias.atualizar_status'))
WITH CHECK (tem_permissao('ocorrencias.atualizar_status'));


-- =================================================================
-- PARTE 9: PERMITIR QUE ADMIN EXCLUA QUALQUER OCORRÊNCIA
-- A política existente "Usuarios excluem suas ocorrencias" cobre o dono.
-- =================================================================

CREATE POLICY "ocorrencias_delete_admin"
ON ocorrencias FOR DELETE
TO authenticated
USING (tem_permissao('ocorrencias.deletar'));
