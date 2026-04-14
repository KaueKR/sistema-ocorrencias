-- =================================================================
-- Sistema de Roles e Permissões (RBAC)
-- Execute no Supabase → SQL Editor
-- Ordem de execução: rodar todo o arquivo de uma vez
-- =================================================================


-- =================================================================
-- PARTE 1: FUNÇÕES AUXILIARES
-- Definidas como SECURITY DEFINER para evitar recursão infinita
-- nas políticas RLS que precisam consultar as próprias tabelas
-- de roles e permissões.
-- =================================================================

-- Retorna true se o usuário logado possui a permissão informada
CREATE OR REPLACE FUNCTION tem_permissao(p_codigo varchar)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM perfil_roles pr
    JOIN role_permissoes rp ON rp.role_id = pr.role_id
    JOIN permissoes      p  ON p.id = rp.permissao_id
    WHERE pr.perfil_id = auth.uid()
      AND p.codigo     = p_codigo
  );
END;
$$;

-- Retorna o nível hierárquico mais alto (= menor número) do usuário logado
-- Ex: se o usuário tem as roles nivel 2 e 4, retorna 2
-- Retorna 999 se o usuário não tiver nenhuma role atribuída
CREATE OR REPLACE FUNCTION nivel_minimo_usuario()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN COALESCE(
    (
      SELECT MIN(r.nivel)
      FROM perfil_roles pr
      JOIN roles r ON r.id = pr.role_id
      WHERE pr.perfil_id = auth.uid()
    ),
    999
  );
END;
$$;


-- =================================================================
-- PARTE 2: TABELA DE ROLES
-- =================================================================

CREATE TABLE IF NOT EXISTS roles (
  id        uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  nome      varchar(50) UNIQUE NOT NULL,
  label     varchar(100) NOT NULL,
  -- Hierarquia: 1 = maior autoridade, valores maiores = menos autoridade
  -- Um usuário só pode atribuir roles cujo nível seja > ao seu próprio nível
  nivel     integer     NOT NULL CHECK (nivel BETWEEN 1 AND 10),
  descricao text,
  ativo     boolean     DEFAULT true,
  criado_em timestamptz DEFAULT now()
);

COMMENT ON TABLE  roles                IS 'Perfis de acesso disponíveis no sistema';
COMMENT ON COLUMN roles.nome          IS 'Slug único da role (ex: super_admin, aluno)';
COMMENT ON COLUMN roles.nivel         IS 'Hierarquia: 1 = mais alto, 10 = mais baixo';
COMMENT ON COLUMN roles.ativo         IS 'Roles inativas não podem ser atribuídas';


-- =================================================================
-- PARTE 3: TABELA DE PERMISSÕES
-- =================================================================

CREATE TABLE IF NOT EXISTS permissoes (
  id        uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Padrão: modulo.acao — ex: ocorrencias.ver_todas, usuarios.gerenciar_roles
  codigo    varchar(100) UNIQUE NOT NULL,
  descricao varchar(255) NOT NULL,
  modulo    varchar(50)  NOT NULL,
  criado_em timestamptz  DEFAULT now()
);

COMMENT ON TABLE  permissoes        IS 'Permissões atômicas do sistema';
COMMENT ON COLUMN permissoes.codigo IS 'Identificador único no padrão modulo.acao';
COMMENT ON COLUMN permissoes.modulo IS 'Agrupamento: ocorrencias | usuarios | setores | relatorios | sistema';


-- =================================================================
-- PARTE 4: TABELA DE MAPEAMENTO ROLE → PERMISSÕES
-- =================================================================

CREATE TABLE IF NOT EXISTS role_permissoes (
  role_id      uuid REFERENCES roles(id)      ON DELETE CASCADE,
  permissao_id uuid REFERENCES permissoes(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permissao_id)
);

COMMENT ON TABLE role_permissoes IS 'Define quais permissões cada role possui por padrão';


-- =================================================================
-- PARTE 5: TABELA DE ASSOCIAÇÃO PERFIL → ROLES
-- =================================================================

CREATE TABLE IF NOT EXISTS perfil_roles (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  perfil_id     uuid        NOT NULL REFERENCES perfis(id)  ON DELETE CASCADE,
  role_id       uuid        NOT NULL REFERENCES roles(id)   ON DELETE CASCADE,
  -- Escopo opcional: se preenchido, a role vale SOMENTE para este setor
  -- Ex: um Gestor de Setor só gerencia o setor de Manutenção
  setor_id      uuid        REFERENCES setores(id) ON DELETE SET NULL,
  concedido_por uuid        REFERENCES perfis(id)  ON DELETE SET NULL,
  criado_em     timestamptz DEFAULT now()
);

COMMENT ON TABLE  perfil_roles              IS 'Associação muitos-para-muitos entre perfis e roles';
COMMENT ON COLUMN perfil_roles.setor_id     IS 'Escopo: null = acesso geral; preenchido = acesso restrito ao setor';
COMMENT ON COLUMN perfil_roles.concedido_por IS 'Audit trail: quem atribuiu esta role';

-- Garante unicidade considerando que setor_id pode ser NULL
-- (NULL != NULL em constraints UNIQUE padrão do PostgreSQL)
CREATE UNIQUE INDEX IF NOT EXISTS idx_perfil_roles_sem_setor
  ON perfil_roles (perfil_id, role_id)
  WHERE setor_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_perfil_roles_com_setor
  ON perfil_roles (perfil_id, role_id, setor_id)
  WHERE setor_id IS NOT NULL;

-- Índices de performance para as queries mais frequentes
CREATE INDEX IF NOT EXISTS idx_perfil_roles_perfil_id ON perfil_roles (perfil_id);
CREATE INDEX IF NOT EXISTS idx_perfil_roles_role_id   ON perfil_roles (role_id);


-- =================================================================
-- PARTE 6: MODIFICAR TABELA PERFIS
-- =================================================================

-- Adiciona campo de cache desnormalizado para performance
-- (evita JOINs em toda query que só precisa da role principal)
ALTER TABLE perfis
  ADD COLUMN IF NOT EXISTS role_principal varchar(50) DEFAULT 'aluno';

COMMENT ON COLUMN perfis.role_principal IS 'Cache da role de maior autoridade do usuário. Atualizado automaticamente por trigger.';


-- =================================================================
-- PARTE 7: TRIGGER — MANTER role_principal ATUALIZADO
-- =================================================================

CREATE OR REPLACE FUNCTION fn_atualizar_role_principal()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_perfil_id uuid;
BEGIN
  -- Em DELETE, NEW é NULL; usa OLD
  v_perfil_id := CASE WHEN TG_OP = 'DELETE' THEN OLD.perfil_id ELSE NEW.perfil_id END;

  UPDATE perfis
  SET role_principal = COALESCE(
    (
      SELECT r.nome
      FROM perfil_roles pr
      JOIN roles r ON r.id = pr.role_id
      WHERE pr.perfil_id = v_perfil_id
        AND r.ativo = true
      ORDER BY r.nivel ASC  -- menor nível = maior autoridade
      LIMIT 1
    ),
    'aluno'  -- fallback se não houver nenhuma role atribuída
  )
  WHERE id = v_perfil_id;

  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$;

DROP TRIGGER IF EXISTS trg_atualizar_role_principal ON perfil_roles;

CREATE TRIGGER trg_atualizar_role_principal
AFTER INSERT OR UPDATE OR DELETE ON perfil_roles
FOR EACH ROW EXECUTE FUNCTION fn_atualizar_role_principal();


-- =================================================================
-- PARTE 8: HABILITAR ROW LEVEL SECURITY
-- =================================================================

ALTER TABLE roles            ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissoes       ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissoes  ENABLE ROW LEVEL SECURITY;
ALTER TABLE perfil_roles     ENABLE ROW LEVEL SECURITY;


-- =================================================================
-- PARTE 9: POLÍTICAS RLS
-- =================================================================

-- -------------------------------------------------------
-- roles: leitura pública para autenticados; escrita apenas super_admin
-- -------------------------------------------------------
CREATE POLICY "roles_select"
ON roles FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "roles_insert"
ON roles FOR INSERT
TO authenticated
WITH CHECK (nivel_minimo_usuario() = 1);

CREATE POLICY "roles_update"
ON roles FOR UPDATE
TO authenticated
USING (nivel_minimo_usuario() = 1);

CREATE POLICY "roles_delete"
ON roles FOR DELETE
TO authenticated
USING (nivel_minimo_usuario() = 1);

-- -------------------------------------------------------
-- permissoes: leitura pública para autenticados; escrita apenas super_admin
-- -------------------------------------------------------
CREATE POLICY "permissoes_select"
ON permissoes FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "permissoes_insert"
ON permissoes FOR INSERT
TO authenticated
WITH CHECK (nivel_minimo_usuario() = 1);

CREATE POLICY "permissoes_delete"
ON permissoes FOR DELETE
TO authenticated
USING (nivel_minimo_usuario() = 1);

-- -------------------------------------------------------
-- role_permissoes: leitura pública; escrita apenas super_admin
-- -------------------------------------------------------
CREATE POLICY "role_permissoes_select"
ON role_permissoes FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "role_permissoes_insert"
ON role_permissoes FOR INSERT
TO authenticated
WITH CHECK (nivel_minimo_usuario() = 1);

CREATE POLICY "role_permissoes_delete"
ON role_permissoes FOR DELETE
TO authenticated
USING (nivel_minimo_usuario() = 1);

-- -------------------------------------------------------
-- perfil_roles: cada usuário vê as próprias; admins veem todas
-- Inserção/deleção exige: ter permissão + ser hierarquicamente superior
-- -------------------------------------------------------
CREATE POLICY "perfil_roles_select_proprio"
ON perfil_roles FOR SELECT
TO authenticated
USING (
  perfil_id = auth.uid()
  OR tem_permissao('usuarios.ver')
);

CREATE POLICY "perfil_roles_insert"
ON perfil_roles FOR INSERT
TO authenticated
WITH CHECK (
  -- Deve ter a permissão de gerenciar roles
  tem_permissao('usuarios.gerenciar_roles')
  AND
  -- Em RLS, a linha inserida é referenciada diretamente pelo nome da coluna (sem NEW.)
  nivel_minimo_usuario() < (
    SELECT nivel FROM roles WHERE id = role_id
  )
);

CREATE POLICY "perfil_roles_delete"
ON perfil_roles FOR DELETE
TO authenticated
USING (
  tem_permissao('usuarios.gerenciar_roles')
  AND
  -- Em RLS, a linha existente é referenciada diretamente pelo nome da coluna (sem OLD.)
  nivel_minimo_usuario() < (
    SELECT nivel FROM roles WHERE id = role_id
  )
);


-- =================================================================
-- PARTE 10: SEED — ROLES PADRÃO
-- =================================================================

INSERT INTO roles (nome, label, nivel, descricao) VALUES
  (
    'super_admin',
    'Super Admin',
    1,
    'Acesso total e irrestrito. Responsável pela infraestrutura, TI e configurações do sistema.'
  ),
  (
    'admin_institucional',
    'Administrador Institucional',
    2,
    'Coordenação / Direção. Gerencia usuários, visualiza todos os relatórios e ocorrências.'
  ),
  (
    'gestor_setor',
    'Gestor de Setor',
    3,
    'Responsável por um setor específico. Gerencia e acompanha ocorrências do seu setor.'
  ),
  (
    'tecnico',
    'Técnico / Funcionário',
    4,
    'Executor operacional. Atualiza o status das ocorrências designadas ao seu setor.'
  ),
  (
    'professor',
    'Professor',
    5,
    'Docente. Cria ocorrências e acompanha o andamento das suas.'
  ),
  (
    'aluno',
    'Aluno',
    6,
    'Estudante. Cria ocorrências e visualiza apenas as próprias.'
  )
ON CONFLICT (nome) DO NOTHING;


-- =================================================================
-- PARTE 11: SEED — PERMISSÕES
-- =================================================================

INSERT INTO permissoes (codigo, descricao, modulo) VALUES
  -- Módulo: ocorrencias
  ('ocorrencias.criar',             'Criar novas ocorrências',                          'ocorrencias'),
  ('ocorrencias.ver_proprias',      'Visualizar apenas as próprias ocorrências',         'ocorrencias'),
  ('ocorrencias.ver_setor',         'Visualizar ocorrências do setor vinculado',         'ocorrencias'),
  ('ocorrencias.ver_todas',         'Visualizar todas as ocorrências do sistema',        'ocorrencias'),
  ('ocorrencias.atualizar_status',  'Atualizar o status de ocorrências',                'ocorrencias'),
  ('ocorrencias.cancelar_qualquer', 'Cancelar qualquer ocorrência (não apenas as suas)','ocorrencias'),
  ('ocorrencias.deletar',           'Excluir ocorrências permanentemente',               'ocorrencias'),
  -- Módulo: usuarios
  ('usuarios.ver',             'Listar e visualizar perfis de usuários',   'usuarios'),
  ('usuarios.criar',           'Criar novos usuários no sistema',           'usuarios'),
  ('usuarios.editar',          'Editar dados de usuários',                  'usuarios'),
  ('usuarios.deletar',         'Excluir usuários do sistema',               'usuarios'),
  ('usuarios.gerenciar_roles', 'Atribuir e remover roles de usuários',      'usuarios'),
  -- Módulo: setores
  ('setores.ver',      'Visualizar setores',                        'setores'),
  ('setores.gerenciar','Criar, editar e excluir setores',            'setores'),
  -- Módulo: relatorios
  ('relatorios.ver',     'Visualizar relatórios e métricas',  'relatorios'),
  ('relatorios.exportar','Exportar relatórios em PDF/CSV',    'relatorios'),
  -- Módulo: sistema
  ('sistema.configurar','Acessar configurações globais do sistema', 'sistema')
ON CONFLICT (codigo) DO NOTHING;


-- =================================================================
-- PARTE 12: SEED — MAPEAMENTO ROLE → PERMISSÕES
-- =================================================================

-- super_admin: TODAS as permissões
INSERT INTO role_permissoes (role_id, permissao_id)
SELECT r.id, p.id
FROM roles r, permissoes p
WHERE r.nome = 'super_admin'
ON CONFLICT DO NOTHING;

-- admin_institucional: tudo exceto configurações do sistema e exclusão de ocorrências
INSERT INTO role_permissoes (role_id, permissao_id)
SELECT r.id, p.id
FROM roles r, permissoes p
WHERE r.nome = 'admin_institucional'
  AND p.codigo NOT IN (
    'sistema.configurar',
    'ocorrencias.deletar',
    'usuarios.deletar'
  )
ON CONFLICT DO NOTHING;

-- gestor_setor: gerencia ocorrências e equipe do setor; acessa relatórios
INSERT INTO role_permissoes (role_id, permissao_id)
SELECT r.id, p.id
FROM roles r, permissoes p
WHERE r.nome = 'gestor_setor'
  AND p.codigo IN (
    'ocorrencias.criar',
    'ocorrencias.ver_proprias',
    'ocorrencias.ver_setor',
    'ocorrencias.atualizar_status',
    'usuarios.ver',
    'setores.ver',
    'relatorios.ver'
  )
ON CONFLICT DO NOTHING;

-- tecnico: opera dentro do setor; atualiza status
INSERT INTO role_permissoes (role_id, permissao_id)
SELECT r.id, p.id
FROM roles r, permissoes p
WHERE r.nome = 'tecnico'
  AND p.codigo IN (
    'ocorrencias.criar',
    'ocorrencias.ver_proprias',
    'ocorrencias.ver_setor',
    'ocorrencias.atualizar_status',
    'setores.ver'
  )
ON CONFLICT DO NOTHING;

-- professor: cria e acompanha as próprias ocorrências
INSERT INTO role_permissoes (role_id, permissao_id)
SELECT r.id, p.id
FROM roles r, permissoes p
WHERE r.nome = 'professor'
  AND p.codigo IN (
    'ocorrencias.criar',
    'ocorrencias.ver_proprias'
  )
ON CONFLICT DO NOTHING;

-- aluno: cria e acompanha as próprias ocorrências
INSERT INTO role_permissoes (role_id, permissao_id)
SELECT r.id, p.id
FROM roles r, permissoes p
WHERE r.nome = 'aluno'
  AND p.codigo IN (
    'ocorrencias.criar',
    'ocorrencias.ver_proprias'
  )
ON CONFLICT DO NOTHING;


-- =================================================================
-- PARTE 13: MIGRAR DADOS EXISTENTES
-- Atribui a role 'aluno' a todos os perfis existentes que ainda
-- não possuem nenhuma role, preservando qualquer 'Admin' legado.
-- =================================================================

-- Usuários com tipo_usuario = 'Admin' → admin_institucional
INSERT INTO perfil_roles (perfil_id, role_id)
SELECT
  p.id,
  r.id
FROM perfis p
JOIN roles r ON r.nome = 'admin_institucional'
WHERE p.tipo_usuario ILIKE 'admin'
  AND NOT EXISTS (
    SELECT 1 FROM perfil_roles pr WHERE pr.perfil_id = p.id
  )
ON CONFLICT DO NOTHING;

-- Todos os outros (Usuário, NULL, etc.) → aluno
INSERT INTO perfil_roles (perfil_id, role_id)
SELECT
  p.id,
  r.id
FROM perfis p
JOIN roles r ON r.nome = 'aluno'
WHERE (p.tipo_usuario NOT ILIKE 'admin' OR p.tipo_usuario IS NULL)
  AND NOT EXISTS (
    SELECT 1 FROM perfil_roles pr WHERE pr.perfil_id = p.id
  )
ON CONFLICT DO NOTHING;

-- O trigger trg_atualizar_role_principal já preencheu role_principal.
-- Mas garantimos para qualquer perfil que ainda não foi atualizado:
UPDATE perfis
SET role_principal = 'aluno'
WHERE role_principal IS NULL;


-- =================================================================
-- PARTE 14: CONFIGURAÇÃO INICIAL — ATRIBUIR O PRIMEIRO SUPER ADMIN
-- =================================================================
-- O primeiro super_admin não pode ser atribuído via app (ninguém tem
-- a permissão ainda). Execute o bloco abaixo diretamente no
-- Supabase SQL Editor substituindo o e-mail pelo seu usuário.
--
-- PASSO 1: Descubra o UUID do seu usuário:
--   SELECT id FROM perfis WHERE nome_completo = 'Seu Nome Aqui';
--   -- ou via auth:
--   SELECT id FROM auth.users WHERE email = 'seu@email.com';
--
-- PASSO 2: Execute (substituindo o UUID):
--
--   INSERT INTO perfil_roles (perfil_id, role_id)
--   SELECT
--     'COLE-AQUI-O-UUID-DO-SEU-USUARIO',
--     r.id
--   FROM roles r
--   WHERE r.nome = 'super_admin';
--
-- O trigger atualizará automaticamente o campo role_principal.
-- =================================================================
