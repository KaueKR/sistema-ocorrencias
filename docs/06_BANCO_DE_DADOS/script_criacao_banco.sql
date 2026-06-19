-- =================================================================
-- SCRIPT DE CRIAÇÃO DO BANCO DE DADOS — SISTEMA DE OCORRÊNCIAS
-- Projeto de Extensão Fábrica de Software — 1º Sem. 2026
-- SGBD: PostgreSQL (Supabase)
-- =================================================================
--
-- COMO USAR:
--   Execute este arquivo no Supabase → SQL Editor.
--   A autenticação de usuários é gerenciada pelo Supabase Auth
--   (esquema auth.users já existe). A tabela "perfis" complementa
--   cada usuário e referencia auth.users(id).
--
--   Depois deste script, execute os scripts de RLS / correções que
--   acompanham o código-fonte na pasta sql/ (ver ordem em
--   instrucoes_banco_de_dados.md) e, por fim,
--   script_insercao_dados.sql para os dados iniciais.
-- =================================================================


-- =================================================================
-- TABELA: perfis
-- Dados complementares de cada usuário autenticado (1:1 com auth.users)
-- =================================================================
CREATE TABLE IF NOT EXISTS perfis (
  id             uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome_completo  varchar(150),
  tipo_usuario   varchar(50),                       -- legado (migrado para o RBAC)
  role_principal varchar(50) DEFAULT 'aluno',       -- cache da role de maior autoridade
  criado_em      timestamptz DEFAULT now()
);

COMMENT ON TABLE  perfis IS 'Dados complementares do usuário, vinculados ao Supabase Auth';
COMMENT ON COLUMN perfis.role_principal IS 'Cache da role de maior autoridade; atualizado por trigger';


-- =================================================================
-- TABELA: setores
-- Setores responsáveis (Manutenção, TI, Secretaria, etc.)
-- =================================================================
CREATE TABLE IF NOT EXISTS setores (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome      varchar(100) NOT NULL,
  descricao text,
  ativo     boolean DEFAULT true,
  criado_em timestamptz DEFAULT now()
);

COMMENT ON TABLE setores IS 'Setores institucionais responsáveis pelas ocorrências';


-- =================================================================
-- TABELA: categorias
-- Categorias de problemas; "restrito" controla visibilidade por perfil
-- =================================================================
CREATE TABLE IF NOT EXISTS categorias (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome      varchar(100) NOT NULL,
  icone     varchar(50),                            -- nome do ícone (Ionicons)
  setor_id  uuid REFERENCES setores(id) ON DELETE SET NULL,
  restrito  boolean NOT NULL DEFAULT false,         -- true = visível só p/ roles privilegiadas
  ativo     boolean DEFAULT true,
  criado_em timestamptz DEFAULT now()
);

COMMENT ON COLUMN categorias.restrito IS
  'true = somente professor, admin_institucional e super_admin podem ver ocorrências desta categoria';


-- =================================================================
-- TABELA: ocorrencias
-- Registro central de ocorrências
-- =================================================================
CREATE TABLE IF NOT EXISTS ocorrencias (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id   uuid NOT NULL REFERENCES perfis(id) ON DELETE CASCADE,
  titulo       varchar(150) NOT NULL,
  descricao    text,
  categoria_id uuid REFERENCES categorias(id) ON DELETE SET NULL,
  setor_id     uuid REFERENCES setores(id)   ON DELETE SET NULL,
  local        varchar(150),
  urgencia     varchar(20)  DEFAULT 'media',        -- baixa | media | alta
  status       varchar(20)  NOT NULL DEFAULT 'aberta'
               CHECK (status IN ('aberta','em_analise','em_andamento',
                                 'resolvida','cancelada','encerrada')),
  criado_em    timestamptz DEFAULT now()
);

COMMENT ON TABLE  ocorrencias IS 'Ocorrências registradas pelos usuários';
COMMENT ON COLUMN ocorrencias.status IS 'Ciclo: aberta → em_analise → em_andamento → resolvida/cancelada → encerrada';

CREATE INDEX IF NOT EXISTS idx_ocorrencias_usuario_id ON ocorrencias (usuario_id);
CREATE INDEX IF NOT EXISTS idx_ocorrencias_status     ON ocorrencias (status);


-- =================================================================
-- TABELA: fotos_ocorrencias
-- Referências às fotos armazenadas no Supabase Storage
-- =================================================================
CREATE TABLE IF NOT EXISTS fotos_ocorrencias (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ocorrencia_id uuid NOT NULL REFERENCES ocorrencias(id) ON DELETE CASCADE,
  url           text NOT NULL,                       -- URL pública gerada pelo Storage
  storage_path  text NOT NULL,                       -- caminho do arquivo no bucket
  criado_em     timestamptz DEFAULT now()
);

COMMENT ON TABLE fotos_ocorrencias IS 'Fotos anexadas às ocorrências (bucket fotos-ocorrencias)';

CREATE INDEX IF NOT EXISTS idx_fotos_ocorrencia_id ON fotos_ocorrencias (ocorrencia_id);


-- =================================================================
-- TABELA: historico_status
-- Trilha de auditoria das mudanças de status de cada ocorrência
-- =================================================================
CREATE TABLE IF NOT EXISTS historico_status (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ocorrencia_id   uuid NOT NULL REFERENCES ocorrencias(id) ON DELETE CASCADE,
  status_anterior varchar(20),
  status_novo     varchar(20) NOT NULL,
  observacao      text,
  alterado_por    uuid REFERENCES perfis(id) ON DELETE SET NULL,
  criado_em       timestamptz DEFAULT now()
);

COMMENT ON TABLE historico_status IS 'Auditoria das transições de status das ocorrências';

CREATE INDEX IF NOT EXISTS idx_historico_ocorrencia_id ON historico_status (ocorrencia_id);


-- =================================================================
-- SISTEMA RBAC (roles, permissoes, role_permissoes, perfil_roles),
-- funções auxiliares, trigger de role_principal e políticas RLS.
--
-- O DDL completo e comentado está no arquivo:
--   sql/06_sistema_roles.sql   (acompanha o código-fonte)
--
-- Execute aquele arquivo na íntegra após criar as tabelas acima.
-- Ele cria as 4 tabelas do RBAC, as funções tem_permissao() e
-- nivel_minimo_usuario(), o trigger trg_atualizar_role_principal e
-- todas as políticas RLS.
-- =================================================================


-- =================================================================
-- STORAGE: bucket de fotos
-- O bucket "fotos-ocorrencias" e suas políticas são criados pelo
-- arquivo sql/04_criar_bucket_fotos.sql (acompanha o código-fonte).
-- =================================================================

-- Fim do script de criação. Prossiga para os scripts de RLS e, por
-- fim, para script_insercao_dados.sql.
