-- =================================================================
-- SCRIPT DE CRIAÇÃO DO BANCO DE DADOS — SISTEMA DE OCORRÊNCIAS
-- Projeto de Extensão Fábrica de Software — 1º Sem. 2026
-- SGBD: PostgreSQL (Supabase)
-- =================================================================
--
-- Este script reflete o schema real do banco (ver o diagrama
-- modelagem_do_banco/schema_banco_de_dados.png).
--
-- COMO USAR:
--   Execute no Supabase → SQL Editor.
--   A autenticação é gerenciada pelo Supabase Auth (auth.users já
--   existe). A tabela "perfis" complementa cada usuário (1:1).
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
  nome_completo  text,
  email          text,
  telefone       text,
  tipo_usuario   text,                              -- legado (migrado para o RBAC)
  avatar_url     text,
  ativo          boolean     DEFAULT true,
  criado_em      timestamptz DEFAULT now(),
  atualizado_em  timestamptz DEFAULT now(),
  role_principal varchar(50) DEFAULT 'aluno'        -- cache da role de maior autoridade
);

COMMENT ON TABLE  perfis IS 'Dados complementares do usuário, vinculados ao Supabase Auth';
COMMENT ON COLUMN perfis.role_principal IS 'Cache da role de maior autoridade; atualizado por trigger';


-- =================================================================
-- TABELA: setores
-- Setores responsáveis (Manutenção, TI, Secretaria, etc.)
-- =================================================================
CREATE TABLE IF NOT EXISTS setores (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome              text NOT NULL,
  descricao         text,
  email_responsavel text,
  ativo             boolean DEFAULT true,
  criado_em         timestamptz DEFAULT now()
);

COMMENT ON TABLE setores IS 'Setores institucionais responsáveis pelas ocorrências';


-- =================================================================
-- TABELA: categorias
-- Categorias de problemas; "restrito" controla visibilidade por perfil
-- =================================================================
CREATE TABLE IF NOT EXISTS categorias (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setor_id  uuid REFERENCES setores(id) ON DELETE SET NULL,
  nome      text NOT NULL,
  descricao text,
  icone     text,                                   -- nome do ícone (Ionicons)
  ativo     boolean DEFAULT true,
  criado_em timestamptz DEFAULT now(),
  restrito  boolean NOT NULL DEFAULT false          -- true = visível só p/ roles privilegiadas
);

COMMENT ON COLUMN categorias.restrito IS
  'true = somente professor, admin_institucional e super_admin podem ver ocorrências desta categoria';


-- =================================================================
-- TABELA: ocorrencias
-- Registro central de ocorrências
-- =================================================================
CREATE TABLE IF NOT EXISTS ocorrencias (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id         uuid NOT NULL REFERENCES perfis(id) ON DELETE CASCADE,
  categoria_id       uuid REFERENCES categorias(id) ON DELETE SET NULL,
  setor_id           uuid REFERENCES setores(id)   ON DELETE SET NULL,
  titulo             text NOT NULL,
  descricao          text,
  local              text,
  urgencia           text DEFAULT 'media',          -- baixa | media | alta
  status             text NOT NULL DEFAULT 'aberta',-- aberta | em_analise | em_andamento |
                                                     -- resolvida | cancelada | encerrada
  responsavel_id     uuid REFERENCES perfis(id) ON DELETE SET NULL,
  observacao_interna text,
  criado_em          timestamptz DEFAULT now(),
  atualizado_em      timestamptz DEFAULT now()
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
  alterado_por    uuid REFERENCES perfis(id) ON DELETE SET NULL,
  status_anterior text,
  status_novo     text NOT NULL,
  observacao      text,
  criado_em       timestamptz DEFAULT now()
);

COMMENT ON TABLE historico_status IS 'Auditoria das transições de status das ocorrências';

CREATE INDEX IF NOT EXISTS idx_historico_ocorrencia_id ON historico_status (ocorrencia_id);


-- =================================================================
-- TABELA: suporte
-- Chamados de suporte abertos pelos usuários (tela "Suporte")
-- =================================================================
CREATE TABLE IF NOT EXISTS suporte (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  perfil_id uuid REFERENCES perfis(id) ON DELETE CASCADE,
  tipo      text,                                    -- tipo de problema
  descricao text,
  status    text DEFAULT 'aberto',
  criado_em timestamptz DEFAULT now()
);

COMMENT ON TABLE suporte IS 'Chamados de suporte abertos pelos usuários';


-- =================================================================
-- SISTEMA RBAC (roles, permissoes, role_permissoes, perfil_roles),
-- funções auxiliares, trigger de role_principal e políticas RLS.
--
-- O DDL completo e comentado está no arquivo:
--   sql/06_sistema_roles.sql   (acompanha o código-fonte)
--
-- Execute aquele arquivo na íntegra após criar as tabelas acima.
-- Ele cria as 4 tabelas do RBAC:
--   roles            (id, nome, label, nivel, descricao, ativo, criado_em)
--   permissoes       (id, codigo, descricao, modulo, criado_em)
--   role_permissoes  (role_id, permissao_id)  — PK composta
--   perfil_roles     (id, perfil_id, role_id, setor_id, concedido_por, criado_em)
-- além das funções tem_permissao() e nivel_minimo_usuario(), o trigger
-- trg_atualizar_role_principal e todas as políticas RLS.
-- =================================================================


-- =================================================================
-- STORAGE: bucket de fotos
-- O bucket "fotos-ocorrencias" e suas políticas são criados pelo
-- arquivo sql/04_criar_bucket_fotos.sql (acompanha o código-fonte).
-- =================================================================

-- Fim do script de criação. Prossiga para os scripts de RLS e, por
-- fim, para script_insercao_dados.sql.
