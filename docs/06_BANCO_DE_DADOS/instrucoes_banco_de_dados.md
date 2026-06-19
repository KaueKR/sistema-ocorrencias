# Instruções do Banco de Dados — Sistema de Ocorrências

Projeto de Extensão **Fábrica de Software** — 1º Semestre de 2026
SGBD: **PostgreSQL**, hospedado no **Supabase** (Backend as a Service).

---

## 1. Visão geral

O back-end é inteiramente baseado no **Supabase**, que fornece:

- **PostgreSQL** — banco relacional onde ficam todas as tabelas do sistema.
- **Auth** — autenticação de usuários (e-mail/senha, OTP de recuperação). O esquema
  `auth.users` é gerenciado pelo próprio Supabase; a tabela `perfis` complementa cada usuário.
- **Storage** — armazenamento das fotos das ocorrências, no bucket `fotos-ocorrencias`.

A segurança dos dados é garantida por **Row Level Security (RLS)**: cada query é avaliada
pelo banco contra políticas que decidem quais linhas o usuário autenticado pode ler/escrever.
As funções auxiliares são definidas como `SECURITY DEFINER` para evitar recursão infinita
nas políticas.

---

## 2. Pré-requisitos

1. Conta no [Supabase](https://supabase.com/) e um projeto criado.
2. Acesso ao **SQL Editor** do projeto (menu lateral do painel do Supabase).
3. As credenciais do projeto (URL e chave `anon`) configuradas no `.env` do app —
   ver `05_BIBLIOTECAS_DEPENDENCIAS_E_CONFIGURACOES/configuracoes_do_ambiente.txt`.

---

## 3. Ordem de execução dos scripts

Execute **na ordem abaixo**, no SQL Editor do Supabase. Os scripts originais separados por
etapa acompanham o código-fonte na pasta `sql/`. Os scripts consolidados desta pasta
(`script_criacao_banco.sql` e `script_insercao_dados.sql`) reúnem o essencial.

| Ordem | Arquivo | O que faz |
|------:|---------|-----------|
| 1 | `script_criacao_banco.sql` (esta pasta) | Cria as tabelas base: `perfis`, `setores`, `categorias`, `ocorrencias`, `fotos_ocorrencias`, `historico_status` |
| 2 | `sql/06_sistema_roles.sql` | Cria o RBAC completo: tabelas `roles`, `permissoes`, `role_permissoes`, `perfil_roles`, funções, trigger, RLS e seed das roles/permissões |
| 3 | `sql/04_criar_bucket_fotos.sql` | Cria o bucket `fotos-ocorrencias` no Storage e suas políticas |
| 4 | `sql/03_permissoes_usuario.sql` | Políticas RLS para o usuário agir sobre as próprias ocorrências |
| 5 | `sql/07_trigger_role_padrao.sql` | Trigger de role padrão (novo usuário vira `aluno`) + RPC de troca atômica |
| 6 | `sql/08_rls_perfis_admin.sql` | Políticas RLS da tabela `perfis` para o painel administrativo |
| 7 | `sql/09_rls_fotos_global.sql` | Políticas RLS da tabela `fotos_ocorrencias` |
| 8 | `sql/10_rls_categoria_restrita.sql` | Coluna `restrito`, permissão `ocorrencias.ver_restrito` e RLS da categoria restrita |
| 9 | `sql/11_fix_rls_ocorrencias.sql` | Ajustes nas políticas de `ocorrencias` |
| 10 | `sql/12_restricao_aluno.sql` | Restrições adicionais para o perfil aluno |
| 11 | `sql/13_fix_definitivo.sql` | Correção definitiva de visibilidade/RLS |
| 12 | `sql/15_correcao_categoria_restrita.sql` | Correção final da categoria restrita |
| 13 | `script_insercao_dados.sql` (esta pasta) | Insere dados iniciais: setores e categorias |
| — | `sql/14_diagnostico_rls.sql` | (Opcional) Queries de diagnóstico para conferir o estado das políticas |

> **Observação:** o `sql/05_visibilidade_global.sql` foi substituído pelo `13_fix_definitivo.sql`
> e não precisa ser executado na configuração atual.

---

## 4. Configuração inicial obrigatória — primeiro Super Admin

Nenhum usuário possui autoridade de super admin no início. Após criar seu usuário pelo
**cadastro do aplicativo**, promova-o manualmente no SQL Editor (troque o e-mail):

```sql
INSERT INTO perfil_roles (perfil_id, role_id)
SELECT
  (SELECT id FROM auth.users WHERE email = 'seu@email.com'),
  (SELECT id FROM roles WHERE nome = 'super_admin')
ON CONFLICT DO NOTHING;
```

O trigger `trg_atualizar_role_principal` atualiza o campo `perfis.role_principal`
automaticamente após a inserção. A partir daí, novas promoções podem ser feitas pelo
**Painel Administrativo** do app.

---

## 5. Tabelas do banco

| Tabela | Descrição |
|---|---|
| `perfis` | Dados complementares do usuário (nome, role_principal); 1:1 com `auth.users` |
| `roles` | Roles disponíveis com hierarquia numérica (1 = maior autoridade) |
| `permissoes` | Permissões atômicas no padrão `modulo.acao` |
| `role_permissoes` | Mapeamento de quais permissões cada role possui |
| `perfil_roles` | Associação usuário ↔ role, com escopo de setor opcional |
| `setores` | Setores responsáveis (Manutenção, TI, Secretaria, etc.) |
| `categorias` | Categorias de problemas; campo `restrito` controla a visibilidade |
| `ocorrencias` | Registros de ocorrências |
| `fotos_ocorrencias` | Referências às fotos no Storage |
| `historico_status` | Trilha de auditoria das mudanças de status |
| `suporte` | Chamados de suporte abertos pelos usuários |

O diagrama de relacionamentos está em `modelagem_do_banco/modelo_de_dados.txt`
e o diagrama visual completo em `modelagem_do_banco/schema_banco_de_dados.png`.

---

## 6. Backup do banco

As instruções para gerar e restaurar um backup estão em `backup_do_banco/LEIA-ME.txt`.

---

## 7. Observações importantes

- A modelagem em `script_criacao_banco.sql` e `modelagem_do_banco/modelo_de_dados.txt`
  reflete o schema real do banco, documentado no diagrama
  `modelagem_do_banco/schema_banco_de_dados.png`.
- Os **dados de setores e categorias** em `script_insercao_dados.sql` são um conjunto
  inicial de exemplo. Ajuste nomes, ícones e a marcação `restrito` conforme a realidade
  da instituição. A categoria `Problema com aluno` deve permanecer com `restrito = true`.
- **Não exponha** a chave `service_role` nem senhas pessoais em repositórios públicos.
  O app utiliza apenas a chave pública `anon`, protegida pelas políticas RLS.
