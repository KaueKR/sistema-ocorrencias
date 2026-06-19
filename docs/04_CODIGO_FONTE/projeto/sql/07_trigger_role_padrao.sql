-- =================================================================
-- Trigger: auto-atribuir role 'aluno' em novos cadastros
-- + Função RPC para troca atômica de role (evita estado inconsistente)
-- Execute no Supabase → SQL Editor
-- IMPORTANTE: Execute APÓS o arquivo 06_sistema_roles.sql
-- =================================================================


-- =================================================================
-- PARTE 1: TRIGGER — ATRIBUIÇÃO AUTOMÁTICA AO CADASTRAR
-- Sempre que um novo registro é inserido em `perfis` (via trigger
-- do Supabase Auth), este trigger atribui automaticamente a role
-- 'aluno' ao novo usuário, sem intervenção manual.
-- =================================================================

CREATE OR REPLACE FUNCTION fn_atribuir_role_padrao()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO perfil_roles (perfil_id, role_id)
  SELECT NEW.id, r.id
  FROM roles r
  WHERE r.nome = 'aluno'
    AND r.ativo = true;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_atribuir_role_padrao ON perfis;

CREATE TRIGGER trg_atribuir_role_padrao
AFTER INSERT ON perfis
FOR EACH ROW
EXECUTE FUNCTION fn_atribuir_role_padrao();


-- =================================================================
-- PARTE 2: FUNÇÃO RPC — atribuir_role_usuario
-- Chamada pelo app via supabase.rpc('atribuir_role_usuario', {...})
-- Garante atomicidade: troca de role ocorre em uma única transação.
-- Valida hierarquia: um admin só pode gerenciar roles abaixo do seu nível.
-- =================================================================

CREATE OR REPLACE FUNCTION atribuir_role_usuario(
  p_perfil_id uuid,
  p_role_id   uuid,
  p_setor_id  uuid DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_role_nivel integer;
  v_meu_nivel  integer;
BEGIN
  -- Busca o nível da role que está sendo atribuída
  SELECT nivel INTO v_role_nivel
  FROM roles
  WHERE id = p_role_id AND ativo = true;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Role não encontrada ou inativa.';
  END IF;

  -- Busca o nível mínimo do usuário logado (= maior autoridade)
  v_meu_nivel := nivel_minimo_usuario();

  -- Valida permissão de gerenciar roles
  IF NOT tem_permissao('usuarios.gerenciar_roles') THEN
    RAISE EXCEPTION 'Sem permissão para gerenciar roles de usuários.';
  END IF;

  -- Valida hierarquia: só pode atribuir roles de nível MAIOR (menor autoridade) que o seu
  IF v_meu_nivel >= v_role_nivel THEN
    RAISE EXCEPTION 'Você não pode atribuir uma role de nível igual ou superior ao seu.';
  END IF;

  -- Remove apenas as roles sobre as quais o usuário tem autoridade
  -- (não remove roles de nível igual ou acima do admin)
  DELETE FROM perfil_roles pr
  USING roles r
  WHERE pr.role_id    = r.id
    AND pr.perfil_id  = p_perfil_id
    AND r.nivel       > v_meu_nivel;

  -- Insere a nova role de forma atômica
  INSERT INTO perfil_roles (perfil_id, role_id, setor_id, concedido_por)
  VALUES (p_perfil_id, p_role_id, p_setor_id, auth.uid());
END;
$$;
