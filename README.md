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
11. [Padrão de Commits](#11-padrão-de-commits)

---

## 1. Visão Geral

O **Sistema de Ocorrências** é um aplicativo mobile desenvolvido com **React Native + Expo** para facilitar o registro e o gerenciamento de problemas em instituições de ensino. O back-end é inteiramente baseado no **Supabase**, responsável pela autenticação de usuários, banco de dados PostgreSQL e armazenamento de fotos. O objetivo é criar um fluxo simples e eficiente onde o usuário registra um problema e o sistema o direciona automaticamente ao setor responsável.

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
- Recuperação de senha em 3 etapas: e-mail → código de verificação → nova senha

### Ocorrências
- **Criar ocorrência** — título, local, categoria, descrição, grau de urgência (Baixa/Média/Alta) e foto (câmera ou galeria)
- **Listar ocorrências** — todas as ocorrências ou somente as do usuário logado
- **Visualizar detalhes** — informações completas com histórico de status e observações
- **Gerenciar status** — concluir, reabrir, cancelar (com motivo) ou excluir uma ocorrência

### Ciclo de status

```
Aberta → Em Análise → Em Andamento → Resolvida → Encerrada
```

### Dashboard
- Painel inicial com contadores de ocorrências abertas e resolvidas (dados em tempo real via Supabase)
- Lista das 5 ocorrências mais recentes com miniatura da foto
- Atalho para criar nova ocorrência
- Atualização por gesto de pull-to-refresh

### Perfil
- Visualização dos dados do usuário
- Logout com confirmação

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
| Ícones | Ionicons (via Expo) | — |
| Safe Area | react-native-safe-area-context | ~5.6.0 |

---

## 4. Back-end com Supabase

O back-end da aplicação é inteiramente baseado no **[Supabase](https://supabase.com/)**, uma plataforma open-source que oferece banco de dados, autenticação e armazenamento de arquivos como serviço. Nenhum servidor customizado foi necessário.

### Autenticação
O Supabase Auth gerencia o ciclo completo de autenticação: cadastro, login com e-mail e senha, recuperação de senha via OTP por e-mail e persistência de sessão local com AsyncStorage.

### Banco de dados
O banco de dados PostgreSQL do Supabase armazena todas as ocorrências, categorias, setores, histórico de status e perfis de usuário. As consultas são feitas diretamente pelo SDK do Supabase no cliente, com acesso controlado por políticas de **Row Level Security (RLS)** — garantindo que cada usuário só acesse os dados que lhe pertencem.

### Storage (armazenamento de fotos)
As fotos anexadas às ocorrências são enviadas em formato Base64 e armazenadas no **Supabase Storage**, dentro do bucket `fotos-ocorrencias`. A URL pública gerada é salva no banco de dados e usada para exibição no app.

### Resumo dos recursos utilizados

| Recurso Supabase | Uso no projeto |
|---|---|
| **Auth** | Login, cadastro e recuperação de senha |
| **PostgreSQL** | Armazenamento de ocorrências, categorias, setores e histórico |
| **Row Level Security (RLS)** | Controle de acesso por usuário |
| **Storage** | Upload e exibição de fotos das ocorrências |
| **SDK JavaScript** | Comunicação direta entre o app e o Supabase |

---

## 5. Estrutura do Projeto

```
sistema-ocorrencias/
├── src/
│   ├── contexts/
│   │   └── AuthContext.js              # Gerenciamento global de autenticação
│   ├── navigation/
│   │   └── AppNavigator.js             # Rotas (autenticado vs. não autenticado)
│   ├── screens/
│   │   ├── LoginScreen.js              # Login com e-mail e senha
│   │   ├── RegisterScreen.js           # Cadastro de usuário
│   │   ├── ForgotPasswordScreen.js     # Recuperação de senha (3 etapas)
│   │   ├── HomeScreen.js               # Dashboard com contadores e lista recente
│   │   ├── MinhasOcorrenciasScreen.js  # Lista de ocorrências com filtro
│   │   ├── NovaOcorrenciaScreen.js     # Formulário de criação de ocorrência
│   │   ├── DetalheOcorrenciaScreen.js  # Detalhes e histórico de status
│   │   └── PerfilScreen.js             # Perfil do usuário e logout
│   ├── services/
│   │   ├── supabase.js                 # Inicialização do cliente Supabase
│   │   ├── ocorrenciasService.js       # CRUD de ocorrências e upload de fotos
│   │   └── categoriasService.js        # Busca de categorias e setores
│   └── utils/
│       └── mensagensErro.js            # Tradução de erros do Supabase para PT-BR
├── sql/
│   ├── 03_permissoes_usuario.sql       # Políticas de permissão e RLS
│   ├── 04_criar_bucket_fotos.sql       # Criação do bucket de fotos no Storage
│   └── 05_visibilidade_global.sql      # Configurações de visibilidade global
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

Execute os scripts SQL localizados na pasta `sql/` no editor SQL do Supabase (**SQL Editor → New Query**), na ordem abaixo:

| Ordem | Arquivo | Descrição |
|---|---|---|
| 1 | `03_permissoes_usuario.sql` | Políticas de Row Level Security (RLS) |
| 2 | `04_criar_bucket_fotos.sql` | Bucket de armazenamento para fotos |
| 3 | `05_visibilidade_global.sql` | Configurações de visibilidade global |

### Tabelas necessárias

O banco de dados deve conter as seguintes tabelas:

| Tabela | Descrição |
|---|---|
| `ocorrencias` | Registros de ocorrências |
| `categorias` | Categorias de problemas (Elétrica, TI, Limpeza etc.) |
| `setores` | Setores responsáveis (Manutenção, TI, Secretaria etc.) |
| `fotos_ocorrencias` | Referências às fotos armazenadas no Storage |
| `historico_status` | Trilha de auditoria das mudanças de status |
| `perfis` | Dados complementares do usuário |

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
    ├── Tab Bar (4 abas)
    │   ├── Dashboard (HomeScreen)
    │   ├── Ocorrências (MinhasOcorrenciasScreen)
    │   ├── Nova Ocorrência (NovaOcorrenciaScreen) — FAB central
    │   └── Perfil (PerfilScreen)
    └── DetalheOcorrenciaScreen (tela de detalhe via stack)
```

### Telas

#### LoginScreen
- Campos de e-mail e senha com validação
- Link para recuperação de senha e para cadastro
- Indicador de carregamento durante autenticação

#### RegisterScreen
- Campos: nome completo, e-mail, senha e confirmação de senha
- Regras de senha: mínimo 8 caracteres, 1 maiúscula, 1 minúscula, 1 caractere especial
- Navegação de volta para o login

#### ForgotPasswordScreen
- Etapa 1: informar e-mail cadastrado
- Etapa 2: inserir código de verificação recebido por e-mail
- Etapa 3: definir nova senha

#### HomeScreen (Dashboard)
- Saudação com nome do usuário
- Cards clicáveis com total de ocorrências abertas e resolvidas
- Botão de atalho para nova ocorrência
- Lista das 5 ocorrências mais recentes com foto em miniatura e badge de status colorido
- Pull-to-refresh

#### MinhasOcorrenciasScreen
- Lista completa de ocorrências com filtro "Todas" / "Minhas"
- Cada card exibe: status, título, categoria, urgência e data
- Borda lateral colorida indicando o status
- Pull-to-refresh

#### NovaOcorrenciaScreen
- Campos obrigatórios: título, local, categoria e descrição
- Seletor de categoria com chip horizontal mostrando o setor associado
- Seletor de urgência: Baixa / Média / Alta
- Upload de foto via câmera ou galeria (armazenada no Supabase Storage)
- Validação antes do envio

#### DetalheOcorrenciaScreen
- Exibição completa da ocorrência (título, categoria, setor, local, urgência, descrição, foto)
- Histórico de status com linha do tempo
- Botões de ação condicionais:
  - **Concluir** — marca a ocorrência como resolvida (se estiver aberta)
  - **Reabrir** — reabre uma ocorrência resolvida
  - **Cancelar** — abre modal para inserir motivo do cancelamento
  - **Excluir** — remove a ocorrência e suas fotos (somente o criador)

#### PerfilScreen
- Avatar com iniciais do usuário
- Nome, e-mail e tipo de usuário
- Botão de logout com confirmação

### Paleta de cores por status

| Status | Cor |
|---|---|
| Aberta | Vermelho `#EF1D26` |
| Em Análise | Amarelo `#C78A00` |
| Em Andamento | Azul `#2563eb` |
| Resolvida | Verde `#16a34a` |
| Cancelada / Encerrada | Cinza `#666666` |

---

## 11. Padrão de Commits

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
docs: atualiza README com instruções de instalação
```
