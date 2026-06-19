# README do Código-Fonte — Sistema de Ocorrências

Projeto de Extensão **Fábrica de Software** — 1º Semestre de 2026
Aplicativo Mobile (Android / iOS) desenvolvido em React Native + Expo.

---

## 1. Visão geral

O **Sistema de Ocorrências** é um aplicativo mobile multiplataforma para registro,
acompanhamento e resolução de ocorrências institucionais. O back-end é inteiramente
baseado no **Supabase** (PostgreSQL + Auth + Storage), sem servidor próprio. O controle
de acesso é feito por **RBAC** (Role-Based Access Control) com seis níveis hierárquicos
e reforçado por políticas de **Row Level Security (RLS)** no banco de dados.

---

## 2. Onde está o código-fonte

A pasta `projeto/` contém o projeto completo. Por exigência do guia de entrega, esta é
a **única** pasta que pode ser entregue compactada. Ao descompactar, a raiz do projeto
contém:

```
sistema-ocorrencias/
├── App.js                  # Componente raiz (envolve o app no AuthProvider)
├── index.js                # Ponto de entrada do Expo (registerRootComponent)
├── app.json                # Configuração do Expo (nome, ícone, splash, plugins)
├── package.json            # Dependências e scripts npm
├── package-lock.json       # Versões exatas das dependências (não remover)
├── .env.example            # Modelo das variáveis de ambiente (Supabase)
├── assets/                 # Ícones, splash e imagens do app
├── sql/                    # Scripts SQL do banco (criação, RLS, RBAC, correções)
└── src/                    # Código-fonte da aplicação
```

> **Importante:** o arquivo `.env` real **não** é versionado. É necessário criar um
> `.env` na raiz a partir do `.env.example` com as credenciais do Supabase antes de
> executar. Consulte `05_BIBLIOTECAS_DEPENDENCIAS_E_CONFIGURACOES/configuracoes_do_ambiente.txt`.

---

## 3. Estrutura da pasta `src/`

```
src/
├── contexts/
│   └── AuthContext.js          # Estado global de autenticação, sessão, perfil e RBAC
├── navigation/
│   └── AppNavigator.js         # Rotas: Stack raiz → Bottom Tabs → Stacks internas
├── screens/
│   ├── LoginScreen.js          # Login (e-mail/senha)
│   ├── RegisterScreen.js       # Cadastro de novo usuário
│   ├── ForgotPasswordScreen.js # Recuperação de senha (OTP + redefinição)
│   ├── HomeScreen.js           # Dashboard com contadores e últimas ocorrências
│   ├── MinhasOcorrenciasScreen.js  # Listagem de ocorrências do usuário
│   ├── NovaOcorrenciaScreen.js     # Formulário de abertura de ocorrência
│   ├── DetalheOcorrenciaScreen.js  # Detalhe + histórico de status
│   ├── PerfilScreen.js         # Menu de perfil
│   ├── MeusDadosScreen.js      # Edição de nome (e-mail e role somente leitura)
│   ├── AlterarSenhaScreen.js   # Troca de senha com reautenticação
│   ├── SuporteScreen.js        # Abertura de chamado de suporte
│   ├── CreditosScreen.js       # Tela de créditos (obrigatória na entrega)
│   └── admin/
│       ├── GestaoUsuariosScreen.js   # Listagem de usuários (restrito a admin)
│       └── DetalheUsuarioScreen.js   # Atribuição/remoção de roles
├── services/
│   ├── supabase.js             # Inicialização do cliente Supabase
│   ├── ocorrenciasService.js   # CRUD de ocorrências, fotos e histórico
│   ├── categoriasService.js    # Consulta de categorias e setores
│   └── adminService.js         # Operações administrativas (usuários e roles)
├── hooks/
│   └── usePermissions.js       # Hook de verificação de permissões (can, hasRole...)
├── components/
│   └── PermissionGuard.js      # Renderização condicional por permissão
└── utils/
    └── mensagensErro.js        # Tradução/formatação de mensagens de erro
```

---

## 4. Como executar (resumo)

O passo a passo completo está em `03_ORIENTACOES_DE_INSTALACAO_E_EXECUCAO/`. Em resumo:

```bash
# 1. Instalar as dependências
npm install

# 2. Criar o arquivo .env a partir do modelo e preencher as credenciais do Supabase
#    (EXPO_PUBLIC_SUPABASE_URL e EXPO_PUBLIC_SUPABASE_ANON_KEY)

# 3. Iniciar o servidor de desenvolvimento
npm start

# 4. Ler o QR Code com o app Expo Go (Android/iOS) ou abrir em um emulador
npm run android   # emulador Android
npm run ios       # simulador iOS
```

Antes de rodar, o banco de dados precisa estar configurado no Supabase. Os scripts e a
ordem de execução estão documentados em `06_BANCO_DE_DADOS/instrucoes_banco_de_dados.md`.

---

## 5. Arquitetura e padrões adotados

- **Estado global:** Context API (`AuthContext`) — sem Redux/Zustand.
- **Navegação:** Stack raiz → Bottom Tabs (com FAB central de "Nova Ocorrência") → Stacks internas.
- **Segurança em camadas:** RLS no PostgreSQL é a barreira definitiva; as verificações no
  cliente (`usePermissions`, `PermissionGuard`) são camada de UX e defesa secundária.
- **Estilização:** `StyleSheet.create()` puro, sem biblioteca de UI de terceiros.
- **Paleta:** vermelho `#EF1D26`, escuro `#232323`, superfície clara `#F8F8F8`.

---

## 6. Observações

Consulte `observacoes_importantes.txt` (nesta mesma pasta) para pontos de atenção
específicos sobre a execução, credenciais e dependências externas.
