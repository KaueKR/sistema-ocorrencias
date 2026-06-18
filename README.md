# Sistema de Ocorrências

Aplicativo mobile para registro, encaminhamento e acompanhamento de ocorrências em ambiente escolar/universitário, com back-end e banco de dados em **Supabase**.

---

## Sumário

1. [Visão Geral](#1-visão-geral)
2. [Funcionalidades](#2-funcionalidades)
3. [Stack Tecnológica](#3-stack-tecnológica)
4. [Back-end com Supabase](#4-back-end-com-supabase)
5. [Estrutura do Projeto](#5-estrutura-do-projeto)
6. [Pré-requisitos](#6-pré-requisitos)
7. [Instalação e Configuração](#7-instalação-e-configuração)
8. [Configuração do Banco de Dados](#8-configuração-do-banco-de-dados)
9. [Executando o Projeto](#9-executando-o-projeto)
10. [Navegação e Telas](#10-navegação-e-telas)
11. [Sistema de Roles e Permissões (RBAC)](#11-sistema-de-roles-e-permissões-rbac)
12. [Regras de Visibilidade de Ocorrências](#12-regras-de-visibilidade-de-ocorrências)
13. [Arquitetura e Padrões](#13-arquitetura-e-padrões)
14. [Padrão de Commits](#14-padrão-de-commits)

---

## 1. Visão Geral

O **Sistema de Ocorrências** é um aplicativo mobile desenvolvido com **React Native + Expo** para facilitar o registro e o gerenciamento de problemas em instituições de ensino. O back-end é inteiramente baseado no **Supabase**, responsável pela autenticação de usuários, banco de dados PostgreSQL e armazenamento de fotos.

O objetivo é criar um fluxo simples e eficiente onde o usuário registra um problema e o sistema o direciona automaticamente ao setor responsável — com controle de acesso hierárquico baseado em perfis (RBAC) e restrições de visibilidade por categoria de ocorrência.

### Fluxo de trabalho

```
Registrar → Encaminhar → Acompanhar → Resolver
```

O usuário abre uma ocorrência informando título, local, categoria, descrição, urgência e foto. O sistema encaminha automaticamente para o setor correspondente (Manutenção, TI, Limpeza etc.) e permite o acompanhamento em tempo real de todas as etapas.

---

## 2. Funcionalidades

### Autenticação (via Supabase Auth)
- Login com e-mail e senha
- Cadastro de novo usuário com validação de senha segura (mínimo 8 caracteres, letra maiúscula, minúscula e caractere especial)
- Indicador visual de força da senha em tempo real
- Recuperação de senha em 3 etapas: e-mail → código de verificação OTP → nova senha

### Ocorrências
- **Criar ocorrência** — título, local, categoria, descrição, grau de urgência (Baixa/Média/Alta) e foto (câmera ou galeria)
- **Listar ocorrências** — todas as ocorrências visíveis ao perfil do usuário (filtradas por RLS + frontend)
- **Visualizar detalhes** — informações completas com histórico de status e observações
- **Gerenciar status** — concluir, reabrir, cancelar (com motivo) ou excluir uma ocorrência

### Visibilidade restrita por categoria
A categoria **"Problema com Aluno"** é marcada como restrita (`restrito = true`) no banco de dados. Usuários com os perfis `aluno`, `tecnico` e `gestor_setor` **não conseguem visualizar** ocorrências dessa categoria em nenhuma tela nem acessá-las diretamente por ID. O bloqueio é aplicado em duas camadas:
- **Banco de dados:** políticas RLS na tabela `ocorrencias` e `categorias`
- **Frontend:** filtro via `!inner join` na função `buscarOcorrencias` antes da query chegar ao banco

### Ciclo de status

```
Aberta → Em Análise → Em Andamento → Resolvida → Encerrada
                                              ↘ Cancelada
```

### Dashboard
- Painel inicial com contadores de ocorrências abertas e resolvidas
- Lista das ocorrências mais recentes com miniatura da foto
- Atalho para criar nova ocorrência
- Atualização por gesto de pull-to-refresh

### Perfil
- Visualização dos dados do usuário com badge de role atual
- Acesso ao Painel Administrativo (visível apenas para admins)
- Logout com confirmação

### Painel Administrativo (acesso restrito)
- Listagem de todos os usuários com busca por nome e filtros por role
- Contagem de usuários por categoria exibida nos chips de filtro
- Gerenciamento de níveis de acesso com seleção hierárquica de roles
- Vinculação de usuário a setor específico (para Gestores e Técnicos)
- Preview da alteração antes de confirmar ("Aluno → Professor")
- Todas as operações validadas por políticas RLS no banco de dados

---

## 3. Stack Tecnológica

| Camada | Tecnologia | Versão |
|---|---|---|
| Runtime | Node.js | 24.14.1 |
| Framework mobile | Expo | ~54.0.33 |
| UI | React Native | 0.81.5 |
| Web (Expo Web) | react-native-web / react-dom | ^0.21.0 / 19.1.0 |
| Navegação | React Navigation (Native Stack + Bottom Tabs) | ^7.x |
| Backend / Banco de dados | Supabase | ^2.103.0 |
| Autenticação | Supabase Auth | — |
| Storage (fotos) | Supabase Storage | — |
| Armazenamento local | AsyncStorage | 2.2.0 |
| Seletor de imagem | expo-image-picker | ~17.0.10 |
| Acesso a arquivos | expo-file-system | ~19.0.21 |
| Polyfill de URL (Supabase) | react-native-url-polyfill | ^3.0.0 |
| Ícones | Ionicons (via Expo) | — |
| Safe Area | react-native-safe-area-context | ~5.6.0 |
| Conversão de imagem | base64-arraybuffer | ^1.0.2 |
| Túnel de desenvolvimento | @expo/ngrok | ^4.1.3 |

---

## 4. Back-end com Supabase

O back-end da aplicação é inteiramente baseado no **[Supabase](https://supabase.com/)**, uma plataforma open-source que oferece banco de dados, autenticação e armazenamento de arquivos como serviço. Nenhum servidor customizado foi necessário.

### Autenticação
O Supabase Auth gerencia o ciclo completo de autenticação: cadastro, login com e-mail e senha, recuperação de senha via OTP por e-mail e persistência de sessão local com AsyncStorage.

### Banco de dados
O banco de dados PostgreSQL do Supabase armazena todas as ocorrências, categorias, setores, histórico de status, perfis de usuário e o sistema completo de roles e permissões. As consultas são feitas diretamente pelo SDK do Supabase no cliente, com acesso controlado por políticas de **Row Level Security (RLS)**.

### Storage (armazenamento de fotos)
As fotos anexadas às ocorrências são enviadas em formato Base64 e armazenadas no **Supabase Storage**, dentro do bucket `fotos-ocorrencias`. A URL pública gerada é salva no banco de dados e usada para exibição no app.

### Funções PostgreSQL (RPC)
Todas as funções auxiliares são definidas com `SECURITY DEFINER` para operar com privilégios elevados sem expor dados sensíveis e evitar recursão infinita nas políticas RLS:

| Função | Descrição |
|---|---|
| `tem_permissao(codigo)` | Retorna `boolean` indicando se o usuário logado possui uma permissão |
| `nivel_minimo_usuario()` | Retorna o nível hierárquico mais alto do usuário (menor número = maior autoridade) |
| `categoria_e_restrita(categoria_id)` | Retorna `boolean` indicando se uma categoria tem `restrito = true`; usada nas políticas RLS de `ocorrencias` |
| `atribuir_role_usuario(perfil_id, role_id, setor_id)` | Troca de role atômica com validação de hierarquia |

### Triggers automáticos
| Trigger | Tabela | Ação |
|---|---|---|
| `trg_atualizar_role_principal` | `perfil_roles` | Atualiza o campo `role_principal` em `perfis` após qualquer mudança de role |
| `trg_atribuir_role_padrao` | `perfis` | Atribui automaticamente a role `aluno` a todo novo usuário cadastrado |

### Resumo dos recursos utilizados

| Recurso Supabase | Uso no projeto |
|---|---|
| **Auth** | Login, cadastro e recuperação de senha |
| **PostgreSQL** | Ocorrências, categorias, setores, histórico, perfis e RBAC |
| **Row Level Security (RLS)** | Controle de acesso por usuário, por role e por categoria restrita |
| **Storage** | Upload e exibição de fotos das ocorrências |
| **RPC (Funções)** | Operações atômicas e verificações de permissão |
| **Triggers** | Automação de role padrão e cache de role_principal |
| **SDK JavaScript** | Comunicação direta entre o app e o Supabase |

---

## 5. Estrutura do Projeto

```
sistema-ocorrencias/
├── src/
│   ├── contexts/
│   │   └── AuthContext.js              # Estado global de autenticação + RBAC + perfilCarregado
│   ├── hooks/
│   │   └── usePermissions.js           # Hook para verificação de permissões e roles
│   ├── components/
│   │   └── PermissionGuard.js          # Componente de guarda para renderização condicional
│   ├── navigation/
│   │   └── AppNavigator.js             # Rotas (autenticado vs. não autenticado)
│   ├── screens/
│   │   ├── LoginScreen.js              # Login com e-mail e senha
│   │   ├── RegisterScreen.js           # Cadastro com indicador de força de senha
│   │   ├── ForgotPasswordScreen.js     # Recuperação de senha (3 etapas)
│   │   ├── HomeScreen.js               # Dashboard com contadores e lista recente
│   │   ├── MinhasOcorrenciasScreen.js  # Mural de ocorrências com filtro
│   │   ├── NovaOcorrenciaScreen.js     # Formulário com date picker e image picker
│   │   ├── DetalheOcorrenciaScreen.js  # Detalhes, histórico e ações por status
│   │   ├── PerfilScreen.js             # Menu do usuário com navegação para sub-telas
│   │   ├── MeusDadosScreen.js          # Edição de nome; e-mail/role somente leitura
│   │   ├── AlterarSenhaScreen.js       # Troca de senha com reautenticação e validação
│   │   ├── SuporteScreen.js            # Chamado de suporte com dropdown customizado (Modal)
│   │   ├── CreditosScreen.js           # Créditos do projeto e equipe
│   │   └── admin/
│   │       ├── GestaoUsuariosScreen.js # Painel: listagem e busca de usuários
│   │       └── DetalheUsuarioScreen.js # Painel: edição de role e setor do usuário
│   ├── services/
│   │   ├── supabase.js                 # Inicialização do cliente Supabase
│   │   ├── ocorrenciasService.js       # CRUD de ocorrências, upload de fotos, filtro por permissão
│   │   ├── categoriasService.js        # Busca de categorias e setores
│   │   └── adminService.js             # Operações do painel administrativo
│   └── utils/
│       └── mensagensErro.js            # Tradução de erros do Supabase para PT-BR
├── sql/
│   ├── 03_permissoes_usuario.sql       # RLS: permissões do usuário sobre suas ocorrências
│   ├── 04_criar_bucket_fotos.sql       # Bucket de fotos no Supabase Storage
│   ├── 05_visibilidade_global.sql      # Visibilidade inicial de ocorrências (substituída pelo 13)
│   ├── 06_sistema_roles.sql            # Tabelas, funções, RLS e seed do sistema RBAC
│   ├── 07_trigger_role_padrao.sql      # Trigger de role padrão + RPC de troca atômica
│   ├── 08_rls_perfis_admin.sql         # RLS da tabela perfis para acesso de admins
│   ├── 09_rls_fotos_global.sql         # RLS da tabela fotos_ocorrencias
│   ├── 13_fix_definitivo.sql           # Fix completo: categoria restrita + RLS final (executar após 09)
│   ├── 14_diagnostico_rls.sql          # Queries de diagnóstico do estado das políticas RLS
│   └── 15_correcao_categoria_restrita.sql # Correção do nome e da política conflitante em categorias
├── assets/
│   ├── icon.png
│   ├── splash-icon.png
│   ├── adaptive-icon.png
│   └── favicon.png
├── App.js                              # Componente raiz com providers
├── app.json                            # Configurações do Expo (nome, ícone, splash)
├── index.js                            # Ponto de entrada do app
├── package.json                        # Dependências e scripts
├── .env                                # Variáveis de ambiente (não versionar)
├── .env.example                        # Template de variáveis de ambiente
└── docs/                               # Documentação técnica completa
    ├── 01_IDENTIFICACAO_DO_PROJETO/
    ├── 02_DOCUMENTACAO_DO_PROJETO/
    ├── 03_ORIENTACOES_DE_INSTALACAO_E_EXECUCAO/
    │   └── MOBILE/
    ├── 05_BIBLIOTECAS_DEPENDENCIAS_E_CONFIGURACOES/
    └── 10_RELATO_DE_EXPERIENCIA_DO_ESTUDANTE/
```

---

## 6. Pré-requisitos

Antes de começar, certifique-se de ter instalado:

- [Node.js](https://nodejs.org/) v18 ou superior
- [npm](https://www.npmjs.com/) (incluso no Node.js)
- [Expo CLI](https://docs.expo.dev/get-started/installation/) — `npm install -g expo-cli`
- Aplicativo **Expo Go** no celular (Android ou iOS) para testes físicos, ou um emulador configurado
- Conta no [Supabase](https://supabase.com/) com um projeto criado

---

## 7. Instalação e Configuração

### 1. Clone o repositório

```bash
git clone https://github.com/seu-usuario/sistema-ocorrencias.git
cd sistema-ocorrencias
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure as variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto com as credenciais do seu projeto no Supabase:

```env
EXPO_PUBLIC_SUPABASE_URL=https://SEU_PROJETO.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=SUA_CHAVE_ANONIMA
```

> As credenciais estão disponíveis em **Supabase → Project Settings → API**.

---

## 8. Configuração do Banco de Dados

Execute os scripts SQL localizados na pasta `sql/` no editor SQL do Supabase (**SQL Editor → New Query**), **na ordem indicada abaixo**. Cada arquivo deve ser executado em sua totalidade antes de prosseguir para o próximo.

| Ordem | Arquivo | Descrição |
|---|---|---|
| 1 | `03_permissoes_usuario.sql` | Políticas RLS para ações do usuário sobre suas ocorrências |
| 2 | `04_criar_bucket_fotos.sql` | Bucket de armazenamento para fotos |
| 3 | `05_visibilidade_global.sql` | Visibilidade inicial de ocorrências (será substituída pelo passo 6) |
| 4 | `06_sistema_roles.sql` | Sistema completo de RBAC (tabelas, funções, RLS, seed) |
| 5 | `07_trigger_role_padrao.sql` | Trigger de role padrão + função RPC de troca atômica |
| 6 | `08_rls_perfis_admin.sql` | Políticas RLS da tabela `perfis` para o painel admin |
| 7 | `09_rls_fotos_global.sql` | Políticas RLS da tabela `fotos_ocorrencias` |
| 8 | `13_fix_definitivo.sql` | **Obrigatório:** define a categoria restrita, permissão `ver_restrito`, funções e RLS definitivas |
| 9 | `15_correcao_categoria_restrita.sql` | Marca "Problema com Aluno" como `restrito = true` e remove política conflitante |

> **Nota:** os arquivos `10`, `11` e `12` foram substituídos pelo `13_fix_definitivo.sql`, que consolida todas as correções de forma idempotente. Os arquivos `14` e `15` são utilitários de diagnóstico e correção — não precisam ser executados em novos projetos, apenas em instâncias que passaram por tentativas de configuração anteriores.

### Verificando a configuração

Após executar todos os scripts, rode as queries do arquivo `14_diagnostico_rls.sql` para confirmar o estado correto do banco:

```sql
-- Deve retornar "Problema com Aluno" com restrito = true
SELECT nome, restrito FROM categorias ORDER BY restrito DESC, nome;

-- Deve listar apenas as políticas corretas em ocorrencias (sem "Permitir leitura global")
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'ocorrencias' ORDER BY cmd, policyname;

-- Deve retornar super_admin, admin_institucional e professor com ver_restrito
SELECT r.nome, p.codigo FROM role_permissoes rp
JOIN roles r ON r.id = rp.role_id
JOIN permissoes p ON p.id = rp.permissao_id
WHERE p.codigo = 'ocorrencias.ver_restrito';
```

### Atribuindo o primeiro Super Admin

Após executar todos os scripts, o primeiro Super Admin deve ser atribuído manualmente. Nenhum usuário tem essa autoridade inicialmente, por isso a operação é feita diretamente no SQL Editor:

```sql
-- Passo 1: descubra o UUID do seu usuário
SELECT id FROM auth.users WHERE email = 'seu@email.com';

-- Passo 2: atribua a role super_admin
INSERT INTO perfil_roles (perfil_id, role_id)
SELECT
  'COLE-AQUI-O-UUID-DO-SEU-USUARIO',
  (SELECT id FROM roles WHERE nome = 'super_admin');
```

O trigger `trg_atualizar_role_principal` atualizará o campo `role_principal` automaticamente após a inserção.

### Tabelas do banco de dados

| Tabela | Descrição |
|---|---|
| `perfis` | Dados complementares do usuário (nome, role_principal) |
| `roles` | Roles disponíveis com hierarquia numérica (1 = maior autoridade) |
| `permissoes` | Permissões atômicas no padrão `modulo.acao` |
| `role_permissoes` | Mapeamento de quais permissões cada role possui |
| `perfil_roles` | Associação usuário ↔ role com escopo de setor opcional |
| `setores` | Setores responsáveis (Manutenção, TI, Secretaria etc.) |
| `categorias` | Categorias de problemas; campo `restrito` controla visibilidade por perfil |
| `ocorrencias` | Registros de ocorrências |
| `fotos_ocorrencias` | Referências às fotos armazenadas no Storage |
| `historico_status` | Trilha de auditoria completa das mudanças de status |

---

## 9. Executando o Projeto

```bash
# Inicia o servidor de desenvolvimento com menu interativo
npm start

# Abre diretamente no emulador Android
npm run android

# Abre diretamente no simulador iOS
npm run ios

# Abre no navegador (versão web)
npm run web
```

Após executar `npm start`, escaneie o QR Code exibido no terminal com o aplicativo **Expo Go** para rodar no seu celular.

> **Dica:** use `npm start -- --tunnel` (requer `@expo/ngrok`) para testar em dispositivos físicos fora da mesma rede Wi-Fi.

---

## 10. Navegação e Telas

### Estrutura de navegação

```
App
├── Stack de Autenticação (usuário não logado)
│   ├── LoginScreen
│   ├── RegisterScreen
│   └── ForgotPasswordScreen
└── Stack Principal (usuário logado)
    ├── Tab Bar (4 abas — CustomTabBar)
    │   ├── Dashboard        (HomeScreen)
    │   ├── Ocorrências      (MinhasOcorrenciasScreen)
    │   ├── Nova Ocorrência  (NovaOcorrenciaScreen) — FAB central
    │   └── Perfil           (PerfilScreen)
    └── Telas em Stack (sobre as abas)
        ├── DetalheOcorrencia
        ├── MeusDados         ← acessado via menu do Perfil
        ├── AlterarSenha      ← acessado via menu do Perfil
        ├── Suporte           ← acessado via menu do Perfil
        ├── Creditos          ← acessado via menu do Perfil
        ├── GestaoUsuarios    ← apenas para admins
        └── DetalheUsuario    ← apenas para admins
```

### Telas

#### LoginScreen
- Campos de e-mail e senha com validação de formato
- Toggle de visibilidade da senha
- Tradução de erros do Supabase para português
- Links para cadastro e recuperação de senha

#### RegisterScreen
- Campos: nome completo, e-mail, senha e confirmação de senha
- Indicador visual de força da senha em tempo real (8+ chars, maiúscula, minúscula, especial)
- Validação de correspondência entre senha e confirmação

#### ForgotPasswordScreen
- Stepper visual de 3 etapas com ícones de progresso
- Etapa 1: informar e-mail cadastrado
- Etapa 2: inserir código de verificação OTP recebido por e-mail
- Etapa 3: definir nova senha com as mesmas regras de complexidade

#### HomeScreen (Dashboard)
- Saudação com o primeiro nome do usuário
- Cards clicáveis de resumo: **Em Aberto** e **Resolvidas**
- Botão de atalho para nova ocorrência
- Lista das ocorrências mais recentes com foto em miniatura e badge de status colorido
- Exibe apenas ocorrências visíveis ao perfil do usuário (filtra categorias restritas automaticamente)
- Pull-to-refresh

#### MinhasOcorrenciasScreen (Mural de Ocorrências)
- Lista completa com o total de ocorrências no título
- Toggle de filtro: **Todas** / **Minhas**
- Card com borda lateral colorida por status, badge de urgência e categoria
- Categorias restritas são ocultadas automaticamente para perfis sem permissão
- Pull-to-refresh

#### NovaOcorrenciaScreen
- Campos obrigatórios: título, local, categoria e descrição
- Seletor de categoria em chips horizontais com exibição do setor associado
- A categoria "Problema com Aluno" não aparece para usuários sem permissão `ocorrencias.ver_restrito`
- Seletor de urgência com cores: Baixa / Média / Alta
- Upload de foto via câmera ou galeria (armazenada no Supabase Storage)
- Prévia da foto com opção de remoção antes do envio

#### DetalheOcorrenciaScreen
- Exibição completa: título, categoria, setor, local, urgência, descrição e foto
- Linha do tempo de histórico de status com usuário responsável e observações
- Barra de ação com botões condicionais por status:
  - **Concluir** — disponível para o dono quando a ocorrência está em aberto
  - **Reabrir** — disponível quando status é `resolvida`
  - **Cancelar** — abre modal para inserção do motivo
  - **Excluir** — remove ocorrência e fotos (somente dono e somente se `aberta`)
- Acesso direto por ID bloqueado pelo RLS para categorias restritas

#### PerfilScreen
- Avatar com iniciais e indicador de online
- Badge com a role atual do usuário (label traduzido: Aluno, Professor etc.)
- Menu de navegação com rotas individuais: Meus Dados, Alterar Senha, Suporte, Créditos
- **Painel Administrativo** — item visível somente para usuários com `isAdmin = true`
- Logout com confirmação

#### MeusDadosScreen
- Header escuro com avatar e e-mail do usuário logado
- Campo editável de nome completo com underline vermelho; botão "Salvar" ativo apenas quando o valor muda
- E-mail e perfil de acesso somente leitura com badges visuais de bloqueio
- Salva em `supabase.auth.updateUser` (atualiza `user_metadata`) e na tabela `perfis`, depois chama `carregarPerfil` para refresco de contexto

#### AlterarSenhaScreen
- Três campos de senha com toggle de visibilidade individual
- Card de requisitos da nova senha renderizado dinamicamente (mínimo 8 caracteres, letra maiúscula, número)
- Banner de erro inline quando confirmação não coincide
- Reautentica o usuário com `signInWithPassword` antes de chamar `atualizarSenha` — evita alteração de senha por sessão roubada

#### SuporteScreen
- Banner informativo com o e-mail do usuário vinculado ao chamado
- Dropdown de categoria implementado com `Modal` nativo (sem biblioteca externa de Picker), com lista de opções e indicador de seleção ativa
- Campo de texto multilinha com contador de até 1000 caracteres
- Botão de envio desabilitado enquanto tipo e mínimo de texto não forem preenchidos
- Tela de confirmação de sucesso com ícone verde dedicado após envio
- Stub de API comentado pronto para integração com tabela `suporte` no Supabase

#### CreditosScreen
- Informações do Projeto de Extensão Fábrica de Software e sua finalidade
- Card de corpo docente com avatar colorido diferenciado por função (vermelho para coordenador, roxo para colaboradores)
- Card de equipe de desenvolvimento com iniciais geradas a partir do nome
- Botão de voltar no fluxo normal do layout (sem `position: 'absolute'`) garantindo hitbox correta

#### GestaoUsuariosScreen *(admin only)*
- Header escuro com campo de busca embutido e badge com total de usuários
- Chips de filtro horizontal com contagem por role (calculada no cliente sobre todos os usuários)
- Cards de usuário com: barra lateral colorida por role, avatar, nome, badge de role, tag de setor e data de cadastro
- Recarregamento automático ao retornar da tela de edição (`useFocusEffect`)

#### DetalheUsuarioScreen *(admin only)*
- Hero card com faixa colorida indicando a role atual e anel colorido no avatar
- Preview de transição quando a role muda: ex. `Aluno → Professor`
- Seletor de role com radio buttons, ícone por tipo e badge "atual" na role vigente
- Seletor de setor (condicional — aparece apenas para roles Gestor e Técnico)
- Barra de ação fixa no rodapé com botão contextual ("Confirmar → Professor")
- Hierarquia respeitada: apenas roles com nível inferior ao do admin logado são exibidas

### Paleta de cores por status

| Status | Cor |
|---|---|
| Aberta | Vermelho `#EF1D26` |
| Em Análise | Amarelo `#C78A00` |
| Em Andamento | Azul `#2563eb` |
| Resolvida | Verde `#16a34a` |
| Cancelada / Encerrada | Cinza `#666666` |

### Paleta de cores por role

| Role | Cor |
|---|---|
| Super Admin | Roxo `#7c3aed` |
| Administrador | Vermelho `#EF1D26` |
| Gestor de Setor | Laranja `#ea580c` |
| Técnico | Azul `#2563eb` |
| Professor | Verde `#16a34a` |
| Aluno | Cinza `#6b7280` |

---

## 11. Sistema de Roles e Permissões (RBAC)

O aplicativo implementa um controle de acesso baseado em roles (**Role-Based Access Control**) com hierarquia numérica. Quanto menor o nível, maior a autoridade.

### Hierarquia de roles

| Nível | Role | Label | Descrição |
|---|---|---|---|
| 1 | `super_admin` | Super Admin | Acesso total e irrestrito. Responsável pela TI e configurações do sistema. |
| 2 | `admin_institucional` | Administrador | Coordenação/Direção. Gerencia usuários e visualiza todos os relatórios. |
| 3 | `gestor_setor` | Gestor de Setor | Responsável por um setor. Gerencia ocorrências do seu setor. |
| 4 | `tecnico` | Técnico / Funcionário | Executor que atualiza status das ocorrências do seu setor. |
| 5 | `professor` | Professor | Docente. Cria, acompanha e visualiza ocorrências da categoria restrita. |
| 6 | `aluno` | Aluno | Estudante. Cria e visualiza apenas suas próprias ocorrências (sem acesso a categorias restritas). |

> **Regra de hierarquia:** um usuário só pode atribuir ou remover roles com nível **estritamente maior** que o seu. Um `admin_institucional` (nível 2) pode gerenciar roles de nível 3 a 6, mas nunca outro nível 2 ou o `super_admin`.

### Módulos e permissões

| Módulo | Permissões disponíveis |
|---|---|
| `ocorrencias` | `criar`, `ver_proprias`, `ver_setor`, `ver_todas`, `ver_restrito`, `atualizar_status`, `cancelar_qualquer`, `deletar` |
| `usuarios` | `ver`, `criar`, `editar`, `deletar`, `gerenciar_roles` |
| `setores` | `ver`, `gerenciar` |
| `relatorios` | `ver`, `exportar` |
| `sistema` | `configurar` |

> **`ocorrencias.ver_restrito`** — permissão especial que autoriza visualizar ocorrências da categoria "Problema com Aluno". Atribuída apenas a `super_admin`, `admin_institucional` e `professor`.

### Matriz de permissões por role

| Permissão | Super Admin | Admin | Gestor | Técnico | Professor | Aluno |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| `ocorrencias.criar` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `ocorrencias.ver_proprias` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `ocorrencias.ver_setor` | ✓ | ✓ | ✓ | ✓ | — | — |
| `ocorrencias.ver_todas` | ✓ | ✓ | — | — | — | — |
| `ocorrencias.ver_restrito` | ✓ | ✓ | — | — | ✓ | — |
| `ocorrencias.atualizar_status` | ✓ | ✓ | ✓ | ✓ | — | — |
| `ocorrencias.cancelar_qualquer` | ✓ | ✓ | — | — | — | — |
| `ocorrencias.deletar` | ✓ | — | — | — | — | — |
| `usuarios.ver` | ✓ | ✓ | ✓ | — | — | — |
| `usuarios.gerenciar_roles` | ✓ | ✓ | — | — | — | — |
| `setores.gerenciar` | ✓ | ✓ | — | — | — | — |
| `relatorios.ver` | ✓ | ✓ | ✓ | — | — | — |
| `sistema.configurar` | ✓ | — | — | — | — | — |

### Como o RBAC funciona no app

1. **No login**, o `AuthContext` inicia `carregarPerfil()` assincronamente, buscando perfil, roles e permissões em uma única query aninhada.
2. A flag `perfilCarregado` no contexto permanece `false` durante o carregamento e vira `true` apenas quando a query completa — garantindo que as telas nunca busquem dados com permissões vazias.
3. O hook `usePermissions()` expõe helpers reativos derivados do contexto.
4. O componente `<PermissionGuard>` usa esses helpers para renderizar ou omitir elementos da UI.
5. As políticas de **Row Level Security** no banco garantem a segurança real — as verificações no cliente são camada de UX e defesa secundária.

```jsx
// Exemplo de uso do PermissionGuard
<PermissionGuard permissao="ocorrencias.atualizar_status">
  <BotaoAlterarStatus />
</PermissionGuard>

// Exemplo de uso do hook
const { can, isAdmin, canManageRole } = usePermissions();
if (can('ocorrencias.ver_restrito')) { ... }
```

### Escopo por setor

Roles de nível 3 e 4 (`gestor_setor`, `tecnico`) podem ser vinculadas a um setor específico via o campo `setor_id` em `perfil_roles`. Quando preenchido, a role tem validade somente dentro daquele setor. Um usuário sem setor vinculado nessas roles tem escopo global por padrão.

---

## 12. Regras de Visibilidade de Ocorrências

### Categoria restrita: "Problema com Aluno"

A tabela `categorias` possui o campo `restrito (boolean)`. Quando `restrito = true`, a categoria e todas as ocorrências vinculadas ficam invisíveis para perfis sem a permissão `ocorrencias.ver_restrito`.

| Perfil | Vê categorias restritas? | Vê ocorrências restritas? |
|---|:---:|:---:|
| `super_admin` | ✓ | ✓ |
| `admin_institucional` | ✓ | ✓ |
| `professor` | ✓ | ✓ |
| `gestor_setor` | — | — |
| `tecnico` | — | — |
| `aluno` | — | — |

### Camadas de bloqueio

O bloqueio é aplicado em **duas camadas independentes**, de modo que uma falha em uma não compromete a outra:

#### Camada 1 — Banco de dados (RLS)

Políticas na tabela `ocorrencias`:

```sql
-- Todos os autenticados veem ocorrências de categorias não restritas
CREATE POLICY "ocorrencias_select_geral" ON ocorrencias FOR SELECT
TO authenticated USING (NOT categoria_e_restrita(categoria_id));

-- Somente quem tem ver_restrito vê ocorrências de qualquer categoria
CREATE POLICY "ocorrencias_select_restrito" ON ocorrencias FOR SELECT
TO authenticated USING (tem_permissao('ocorrencias.ver_restrito'));
```

Políticas na tabela `categorias`:

```sql
-- Todos os autenticados veem categorias não restritas
CREATE POLICY "categorias_select_geral" ON categorias FOR SELECT
TO authenticated USING (restrito = false);

-- Somente quem tem ver_restrito vê a categoria "Problema com Aluno"
CREATE POLICY "categorias_select_restrito" ON categorias FOR SELECT
TO authenticated USING (tem_permissao('ocorrencias.ver_restrito'));
```

A função `categoria_e_restrita(categoria_id)` é definida com `SECURITY DEFINER`, garantindo que ela sempre consulte o valor real de `restrito` independentemente das políticas RLS ativas na sessão do usuário.

#### Camada 2 — Frontend (service + INNER JOIN)

A função `buscarOcorrencias` aceita o parâmetro `podVerRestrito`. Quando `false`, a query usa `!inner join` combinado com filtro na coluna `restrito`, excluindo categorias restritas antes mesmo de a resposta chegar ao cliente:

```js
// ocorrenciasService.js
export async function buscarOcorrencias(userId = null, podVerRestrito = true) {
  const joinCategorias = podVerRestrito
    ? 'categorias (nome, icone)'
    : 'categorias!inner (nome, icone)';       // INNER JOIN exclui linhas sem categoria visível

  let query = supabase.from('ocorrencias').select(`..., ${joinCategorias}, ...`);

  if (!podVerRestrito) {
    query = query.eq('categorias.restrito', false); // filtro explícito na categoria
  }
  // ...
}
```

As telas `HomeScreen` e `MinhasOcorrenciasScreen` passam a permissão do usuário:

```js
const data = await buscarOcorrencias(null, can('ocorrencias.ver_restrito'));
```

### Sincronização de permissões no carregamento

Para evitar que o fetch ocorra antes de as permissões estarem disponíveis (race condition no login), o `AuthContext` expõe o estado `perfilCarregado`:

```
Login → carregarPerfil() inicia → perfilCarregado = false
                                 → carregarPerfil() completa → perfilCarregado = true
                                                              → useEffect dispara nas telas
                                                              → buscarOcorrencias() com can() correto
```

As telas usam um `useEffect` dedicado para reagir à mudança de `perfilCarregado`, garantindo que o dado correto seja exibido sem necessidade de reload manual:

```js
useEffect(() => {
  if (perfilCarregado && usuario) carregarOcorrencias();
}, [perfilCarregado]);
```

---

## 13. Arquitetura e Padrões

### Camadas da aplicação

```
┌─────────────────────────────────────────────────────┐
│                  TELAS (screens/)                    │
│         Lógica de estado local, UI, UX               │
├─────────────────────────────────────────────────────┤
│           CONTEXTO + HOOKS (contexts/, hooks/)       │
│     Estado global, autenticação, permissões          │
├─────────────────────────────────────────────────────┤
│              SERVIÇOS (services/)                    │
│     Comunicação com o Supabase (queries, RPCs)       │
├─────────────────────────────────────────────────────┤
│        SUPABASE (PostgreSQL + Auth + Storage)        │
│     RLS, Triggers, Funções — segurança real aqui     │
└─────────────────────────────────────────────────────┘
```

### Camadas de proteção

As verificações de acesso são aplicadas em três níveis complementares:

| Camada | Mecanismo | Onde age |
|---|---|---|
| **UI** | `PermissionGuard`, `usePermissions()` | Oculta botões e telas restritos |
| **Serviço** | `buscarOcorrencias(podVerRestrito)` | Filtro via `!inner join` antes da query |
| **Navegação** | Verificação de role em `AppNavigator` | Impede acesso a rotas admin |
| **Banco de dados** | Row Level Security (RLS) | Rejeita queries não autorizadas — barreira definitiva |

> A segurança real está no banco. As verificações de UI e serviço são defesa adicional e conforto visual.

### Convenções de código

| Elemento | Padrão | Exemplo |
|---|---|---|
| Telas | `PascalCase` + sufixo `Screen` | `LoginScreen`, `HomeScreen` |
| Serviços | `camelCase` + sufixo `Service` | `ocorrenciasService`, `adminService` |
| Hooks | `camelCase` + prefixo `use` | `usePermissions`, `useAuth` |
| Constantes | `UPPER_SNAKE_CASE` | `STATUS_CONFIG`, `ROLE_META` |
| Componentes | `PascalCase` | `PermissionGuard`, `CustomTabBar` |

### Decisões arquiteturais relevantes

- **`perfilCarregado` no AuthContext** — flag booleana que evita race condition: as telas não fazem fetch enquanto `carregarPerfil` estiver em andamento. Resolve o problema de ocorrências restritas não aparecerem no primeiro carregamento para admins e professores.
- **Filtro frontend com `!inner join`** — `buscarOcorrencias` usa INNER JOIN na tabela `categorias` quando `podVerRestrito = false`, excluindo automaticamente ocorrências cujas categorias estão ocultas pelo RLS, mesmo que a política `ocorrencias_select_geral` não esteja ativa.
- **`SECURITY DEFINER` em funções RLS** — `tem_permissao`, `nivel_minimo_usuario` e `categoria_e_restrita` rodam com privilégios de superusuário, evitando recursão infinita e garantindo leitura correta do valor `restrito` independente do contexto RLS do usuário.
- **`role_principal` desnormalizado** — campo cacheado em `perfis` atualizado por trigger, evitando JOINs custosos em queries simples de listagem.
- **RPC atômica para troca de role** — a função `atribuir_role_usuario` encapsula DELETE + INSERT em uma única transação, prevenindo estados inconsistentes.
- **`useFocusEffect` + `useEffect`** — telas de listagem recarregam ao receber foco (para dados atualizados ao voltar de edições) e também ao detectar mudança em `perfilCarregado` (para dados corretos no carregamento inicial).
- **Filtro de role no cliente** — a listagem de usuários carrega todos e filtra localmente, garantindo que as contagens dos chips de filtro sejam sempre corretas sem múltiplas requisições ao banco.

---

## 14. Padrão de Commits

Este projeto adota o padrão [Conventional Commits](https://www.conventionalcommits.org/):

| Prefixo | Quando usar |
|---|---|
| `feat:` | Nova funcionalidade |
| `fix:` | Correção de bug |
| `style:` | Ajuste visual sem alteração de lógica |
| `refactor:` | Reorganização de código sem mudança de comportamento |
| `docs:` | Documentação |
| `chore:` | Configuração, dependências ou tarefas de manutenção |

**Exemplo:**

```
feat: adiciona upload de foto na tela de nova ocorrência
fix: corrige validação de e-mail no login
docs: atualiza README com regras de visibilidade por perfil
```
