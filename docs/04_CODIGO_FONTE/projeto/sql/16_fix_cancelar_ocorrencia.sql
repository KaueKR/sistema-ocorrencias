-- =================================================================
-- Fix: cancelar/concluir ocorrências
--
-- PROBLEMA 1: O CHECK constraint da tabela ocorrencias não inclui
--   'cancelada' como valor válido — o banco foi criado com uma versão
--   anterior do script antes desse status existir.
--
-- PROBLEMA 2: A política de UPDATE (ocorrencias_update_staff) exige
--   a permissão 'ocorrencias.atualizar_status'. Roles como 'professor'
--   não possuem essa permissão, então o dono da ocorrência fica
--   impedido de cancelar ou concluir o próprio chamado, mesmo que a
--   UI mostre os botões.
--
-- Execute no Supabase → SQL Editor
-- É seguro executar mais de uma vez (idempotente).
-- =================================================================


-- =================================================================
-- CORREÇÃO 1: CHECK CONSTRAINT
-- Recria o constraint incluindo todos os valores válidos.
-- =================================================================

ALTER TABLE ocorrencias
  DROP CONSTRAINT IF EXISTS ocorrencias_status_check;

ALTER TABLE ocorrencias
  ADD CONSTRAINT ocorrencias_status_check
  CHECK (status IN (
    'aberta',
    'em_analise',
    'em_andamento',
    'resolvida',
    'cancelada',
    'encerrada'
  ));


-- =================================================================
-- CORREÇÃO 2: POLÍTICA DE UPDATE PARA O DONO DA OCORRÊNCIA
--
-- Permite que o próprio criador da ocorrência atualize o status,
-- desde que NÃO seja aluno (nível 6). Alunos continuam sem poder
-- alterar status — restrição mantida em nível de banco.
--
-- A função nivel_minimo_usuario() já existe (criada em 06_sistema_roles.sql).
-- Nível < 6 = professor, gestor, tecnico, admin, super_admin.
-- =================================================================

DROP POLICY IF EXISTS "ocorrencias_update_owner" ON ocorrencias;

CREATE POLICY "ocorrencias_update_owner"
ON ocorrencias FOR UPDATE
TO authenticated
USING (
  usuario_id = auth.uid()
  AND nivel_minimo_usuario() < 6
)
WITH CHECK (
  usuario_id = auth.uid()
  AND nivel_minimo_usuario() < 6
);


-- =================================================================
-- VERIFICAÇÃO (opcional — rode para confirmar)
-- =================================================================

-- Deve mostrar o constraint com os 6 valores válidos:
-- SELECT conname, pg_get_constraintdef(oid)
-- FROM pg_constraint
-- WHERE conrelid = 'ocorrencias'::regclass
--   AND contype = 'c';

-- Deve listar as políticas UPDATE ativas:
-- SELECT policyname, cmd, qual, with_check
-- FROM pg_policies
-- WHERE tablename = 'ocorrencias' AND cmd = 'UPDATE';
