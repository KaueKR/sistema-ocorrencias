-- =================================================================
-- SCRIPT DE INSERÇÃO DE DADOS INICIAIS — SISTEMA DE OCORRÊNCIAS
-- Projeto de Extensão Fábrica de Software — 1º Sem. 2026
-- SGBD: PostgreSQL (Supabase)
-- =================================================================
--
-- Execute DEPOIS de script_criacao_banco.sql e dos scripts de RLS.
-- Os comandos usam ON CONFLICT DO NOTHING e podem ser reexecutados
-- com segurança (idempotentes).
-- =================================================================


-- =================================================================
-- 1. SETORES
-- =================================================================
INSERT INTO setores (nome, descricao) VALUES
  ('Manutenção',  'Infraestrutura, reparos e conservação predial'),
  ('TI',          'Suporte de tecnologia, redes e equipamentos'),
  ('Secretaria',  'Atendimento administrativo e documentação'),
  ('Limpeza',     'Higienização e conservação dos ambientes'),
  ('Segurança',   'Segurança patrimonial e controle de acesso')
ON CONFLICT DO NOTHING;


-- =================================================================
-- 2. CATEGORIAS
-- O campo "restrito" controla a visibilidade por perfil de acesso.
-- "Problema com aluno" é restrita (só professor/admin/super_admin).
-- O ícone usa nomes da biblioteca Ionicons (@expo/vector-icons).
-- =================================================================
INSERT INTO categorias (nome, icone, restrito, setor_id) VALUES
  ('Infraestrutura',     'construct-outline',    false,
     (SELECT id FROM setores WHERE nome = 'Manutenção' LIMIT 1)),
  ('Equipamento de TI',  'desktop-outline',      false,
     (SELECT id FROM setores WHERE nome = 'TI' LIMIT 1)),
  ('Limpeza',            'sparkles-outline',     false,
     (SELECT id FROM setores WHERE nome = 'Limpeza' LIMIT 1)),
  ('Segurança',          'shield-outline',       false,
     (SELECT id FROM setores WHERE nome = 'Segurança' LIMIT 1)),
  ('Atendimento',        'people-outline',       false,
     (SELECT id FROM setores WHERE nome = 'Secretaria' LIMIT 1)),
  ('Problema com aluno', 'alert-circle-outline', true,  NULL)
ON CONFLICT DO NOTHING;


-- =================================================================
-- 3. ROLES, PERMISSÕES E MAPEAMENTOS (RBAC)
-- O seed completo do RBAC já está no arquivo sql/06_sistema_roles.sql
-- (PARTES 10, 11 e 12). Ao executar aquele arquivo, são criadas:
--
--   ROLES (6):  super_admin (1), admin_institucional (2),
--               gestor_setor (3), tecnico (4), professor (5), aluno (6)
--
--   PERMISSÕES: módulos ocorrencias, usuarios, setores,
--               relatorios e sistema (padrão modulo.acao)
--
--   MAPEAMENTO role → permissões para cada perfil.
--
-- A permissão "ocorrencias.ver_restrito" é adicionada por
-- sql/10_rls_categoria_restrita.sql.
--
-- Não é necessário repetir esses INSERTs aqui.
-- =================================================================


-- =================================================================
-- 4. PRIMEIRO SUPER ADMIN (passo manual)
-- O primeiro super_admin não pode ser promovido pelo app. Após criar
-- seu usuário pelo cadastro do app, execute (trocando o e-mail):
--
--   INSERT INTO perfil_roles (perfil_id, role_id)
--   SELECT
--     (SELECT id FROM auth.users WHERE email = 'seu@email.com'),
--     (SELECT id FROM roles WHERE nome = 'super_admin')
--   ON CONFLICT DO NOTHING;
--
-- O trigger trg_atualizar_role_principal ajusta role_principal sozinho.
-- =================================================================

-- Fim do script de inserção de dados iniciais.
