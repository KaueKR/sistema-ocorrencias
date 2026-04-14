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
12. [Arquitetura e Padrões](#12-arquitetura-e-padrões)
13. [Padrão de Commits](#13-padrão-de-commits)

---

## 1. Visão Geral

O **Sistema de Ocorrências** é um aplicativo mobile desenvolvido com **React Native + Expo** para facilitar o registro e o gerenciamento de problemas em instituições de ensino. O back-end é inteiramente baseado no **Supabase**, responsável pela autenticação de usuários, banco de dados PostgreSQL e armazenamento de fotos.

O objetivo é criar um fluxo simples e eficiente onde o usuário registra um problema e o sistema o direciona automaticamente ao setor responsável — com controle de acesso hierárquico baseado em perfis (RBAC).

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
- **Listar ocorrências** — todas as ocorrências ou somente as do usuário logado
- **Visualizar detalhes** — informações completas com histórico de status e observações
- **Gerenciar status** — concluir, reabrir, cancelar (com motivo) ou excluir uma ocorrência

### Ciclo de status

```
Aberta → Em Análise → Em Andamento → Resolvida → Encerrada
                                              ↘ Cancelada
```

### Dashboard
- Painel inicial com contadores de ocorrências abertas e resolvidas
- Lista das 5 ocorrências mais recentes com miniatura da foto
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
| Navegação | React Navigation (Native Stack + Bottom Tabs) | ^7.x |
| Backend / Banco de dados | Supabase | ^2.103.0 |
| Autenticação | Supabase Auth | — |
| Storage (fotos) | Supabase Storage | — |
| Armazenamento local | AsyncStorage | 2.2.0 |
| Seletor de imagem | expo-image-picker | ~17.0.10 |
| Acesso a arquivos | expo-file-system | ~19.0.21 |
| Ícones | Ionicons (via Expo) | — |
| Safe Area | react-native-safe-area-context | ~5.6.0 |
| Conversão de imagem | base64-arraybuffer | ^1.0.2 |

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
Duas funções auxiliares são definidas com `SECURITY DEFINER` para operar com privilégios elevados sem expor dados sensíveis:

| Função | Descrição |
|---|---|
| `tem_permissao(codigo)` | Retorna `boolean` indicando se o usuário logado possui uma permissão |
| `nivel_minimo_usuario()` | Retorna o nível hierárquico mais alto do usuário (menor número = maior autoridade) |
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
| **Row Level Security (RLS)** | Controle de acesso por usuário e por role |
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
│   │   └── AuthContext.js              # Estado global de autenticação + RBAC
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
│   │   ├── NovaOcorrenciaScreen.js     # Formulário de criação de ocorrência
│   │   ├── DetalheOcorrenciaScreen.js  # Detalhes, histórico e ações por status
│   │   ├── PerfilScreen.js             # Perfil, role atual e acesso admin
│   │   └── admin/
│   │       ├── GestaoUsuariosScreen.js # Painel: listagem e busca de usuários
│   │       └── DetalheUsuarioScreen.js # Painel: edição de role e setor do usuário
│   ├── services/
│   │   ├── supabase.js                 # Inicialização do cliente Supabase
│   │   ├── ocorrenciasService.js       # CRUD de ocorrências e upload de fotos
│   │   ├── categoriasService.js        # Busca de categorias e setores
│   │   └── adminService.js             # Operações do painel administrativo
│   └── utils/
│       └── mensagensErro.js            # Tradução de erros do Supabase para PT-BR
├── sql/
│   ├── 03_permissoes_usuario.sql       # RLS: permissões do usuário sobre suas ocorrências
│   ├── 04_criar_bucket_fotos.sql       # Bucket de fotos no Supabase Storage
│   ├── 05_visibilidade_global.sql      # Visibilidade pública de ocorrências
│   ├── 06_sistema_roles.sql            # Tabelas, funções, RLS e seed do sistema RBAC
│   ├── 07_trigger_role_padrao.sql      # Trigger de role padrão + RPC de troca atômica
│   └── 08_rls_perfis_admin.sql         # RLS da tabela perfis para acesso de admins
├── assets/
│   ├── icon.png
│   ├── splash-icon.png
│   ├── adaptive-icon.png
│   └── favicon.png
├── App.js                              # Componente raiz com providers
├── app.json                            # Configurações do Expo (nome, ícone, splash)
├── index.js                            # Ponto de entrada do app
├── package.json                        # Dependências e scripts
└── .env                                # Variáveis de ambiente (não versionar)
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
| 3 | `05_visibilidade_global.sql` | Visibilidade global de ocorrências para autenticados |
| 4 | `06_sistema_roles.sql` | Sistema completo de RBAC (tabelas, funções, RLS, seed) |
| 5 | `07_trigger_role_padrao.sql` | Trigger de role padrão + função RPC de troca atômica |
| 6 | `08_rls_perfis_admin.sql` | Políticas RLS da tabela `perfis` para o painel admin |

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
| `categorias` | Categorias de problemas vinculadas a setores |
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
- Lista das 5 ocorrências mais recentes com foto em miniatura e badge de status colorido
- Pull-to-refresh

#### MinhasOcorrenciasScreen (Mural de Ocorrências)
- Lista completa com o total de ocorrências no título
- Toggle de filtro: **Todas** / **Minhas**
- Card com borda lateral colorida por status, badge de urgência e categoria
- Pull-to-refresh

#### NovaOcorrenciaScreen
- Campos obrigatórios: título, local, categoria e descrição
- Seletor de categoria em chips horizontais com exibição do setor associado
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

#### PerfilScreen
- Avatar com iniciais e indicador de online
- Badge com a role atual do usuário (label traduzido: Aluno, Professor etc.)
- Menu de navegação: Meus Dados, Alterar Senha, Suporte
- **Painel Administrativo** — item visível somente para usuários com `isAdmin = true`
- Logout com confirmação

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
| 5 | `professor` | Professor | Docente. Cria e acompanha suas próprias ocorrências. |
| 6 | `aluno` | Aluno | Estudante. Cria e visualiza apenas suas próprias ocorrências. |

> **Regra de hierarquia:** um usuário só pode atribuir ou remover roles com nível **estritamente maior** que o seu. Um `admin_institucional` (nível 2) pode gerenciar roles de nível 3 a 6, mas nunca outro nível 2 ou o `super_admin`.

### Módulos e permissões

| Módulo | Permissões disponíveis |
|---|---|
| `ocorrencias` | `criar`, `ver_proprias`, `ver_setor`, `ver_todas`, `atualizar_status`, `cancelar_qualquer`, `deletar` |
| `usuarios` | `ver`, `criar`, `editar`, `deletar`, `gerenciar_roles` |
| `setores` | `ver`, `gerenciar` |
| `relatorios` | `ver`, `exportar` |
| `sistema` | `configurar` |

### Matriz de permissões por role

| Permissão | Super Admin | Admin | Gestor | Técnico | Professor | Aluno |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| `ocorrencias.criar` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `ocorrencias.ver_proprias` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `ocorrencias.ver_setor` | ✓ | ✓ | ✓ | ✓ | — | — |
| `ocorrencias.ver_todas` | ✓ | ✓ | — | — | — | — |
| `ocorrencias.atualizar_status` | ✓ | ✓ | ✓ | ✓ | — | — |
| `ocorrencias.cancelar_qualquer` | ✓ | ✓ | — | — | — | — |
| `ocorrencias.deletar` | ✓ | — | — | — | — | — |
| `usuarios.ver` | ✓ | ✓ | ✓ | — | — | — |
| `usuarios.gerenciar_roles` | ✓ | ✓ | — | — | — | — |
| `setores.gerenciar` | ✓ | ✓ | — | — | — | — |
| `relatorios.ver` | ✓ | ✓ | ✓ | — | — | — |
| `sistema.configurar` | ✓ | — | — | — | — | — |

### Como o RBAC funciona no app

1. **No login**, o `AuthContext` carrega do banco: perfil do usuário, array de roles e array de códigos de permissão — tudo em uma única query aninhada.
2. O hook `usePermissions()` expõe helpers reativos derivados desse contexto.
3. O componente `<PermissionGuard>` usa esses helpers para renderizar ou omitir elementos da UI.
4. As políticas de **Row Level Security** no banco garantem a segurança real — as verificações no cliente são apenas otimizações de UX.

```jsx
// Exemplo de uso do PermissionGuard
<PermissionGuard permissao="ocorrencias.atualizar_status">
  <BotaoAlterarStatus />
</PermissionGuard>

// Exemplo de uso do hook
const { can, isAdmin, canManageRole } = usePermissions();
if (can('relatorios.exportar')) { ... }
```

### Escopo por setor

Roles de nível 3 e 4 (`gestor_setor`, `tecnico`) podem ser vinculadas a um setor específico via o campo `setor_id` em `perfil_roles`. Quando preenchido, a role tem validade somente dentro daquele setor. Um usuário sem setor vinculado nessas roles tem escopo global por padrão.

---

## 12. Arquitetura e Padrões

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
| **Navegação** | Verificação de role em `AppNavigator` | Impede acesso a rotas admin |
| **Banco de dados** | Row Level Security (RLS) | Rejeita queries não autorizadas |

> A segurança real está no banco. As verificações de UI são apenas conforto visual.

### Convenções de código

| Elemento | Padrão | Exemplo |
|---|---|---|
| Telas | `PascalCase` + sufixo `Screen` | `LoginScreen`, `HomeScreen` |
| Serviços | `camelCase` + sufixo `Service` | `ocorrenciasService`, `adminService` |
| Hooks | `camelCase` + prefixo `use` | `usePermissions`, `useAuth` |
| Constantes | `UPPER_SNAKE_CASE` | `STATUS_CONFIG`, `ROLE_META` |
| Componentes | `PascalCase` | `PermissionGuard`, `CustomTabBar` |

### Decisões arquiteturais relevantes

- **Filtro de role no cliente** — a listagem de usuários carrega todos e filtra localmente, garantindo que as contagens dos chips de filtro sejam sempre corretas sem múltiplas requisições ao banco.
- **`role_principal` desnormalizado** — campo cacheado em `perfis` atualizado por trigger, evitando JOINs custosos em queries simples de listagem.
- **RPC atômica para troca de role** — a função `atribuir_role_usuario` encapsula DELETE + INSERT em uma única transação, prevenindo estados inconsistentes.
- **`useFocusEffect` nas listas** — telas de listagem recarregam ao receber foco, garantindo dados atualizados ao retornar de telas de edição.
- **Funções `SECURITY DEFINER`** — `tem_permissao` e `nivel_minimo_usuario` rodam com privilégios elevados para evitar recursão infinita nas políticas RLS que precisam consultar as próprias tabelas de roles.

---

## 13. Padrão de Commits

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
docs: atualiza README com sistema de roles e permissões
```
