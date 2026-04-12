# Sistema de Reporte de Ocorrências

Aplicativo mobile para registro, encaminhamento e acompanhamento de ocorrências em ambiente escolar/universitário.

---

## 1. Resumo do Projeto

O **Sistema de Reporte de Ocorrências** é um aplicativo mobile desenvolvido para facilitar o registro e o gerenciamento de problemas em instituições de ensino. O objetivo principal é criar um fluxo simples onde o usuário registra um problema e o sistema o direciona automaticamente ao setor responsável.

### Funcionalidades previstas

- **Login de usuários** — acesso personalizado para registro e acompanhamento
- **Registro de ocorrências** — envio de título, foto, descrição, local, categoria e grau de urgência (Baixa, Média, Alta)
- **Encaminhamento automático** — direcionamento da ocorrência para setores como Manutenção, TI, Limpeza, Coordenação ou Secretaria
- **Gestão de status** — acompanhamento das etapas: Aberta → Em Análise → Em Andamento → Resolvida → Encerrada
- **Painel administrativo** — visualização centralizada com filtros por setor, data e recorrência de problemas

### Fluxo de trabalho

```
Registrar → Direcionar → Acompanhar → Resolver
```

---

## 2. Stack Tecnológica

| Camada | Tecnologia | Versão | Função |
|---|---|---|---|
| Runtime | Node.js | 24.14.1 | Motor de execução JavaScript |
| App mobile | Expo | Latest | Framework para React Native |
| Interface | React Native | Latest | Componentes nativos mobile |
| Backend | Supabase | Latest | Banco de dados, autenticação e storage |
| Versionamento | Git | — | Controle de versão local |
| Repositório | GitHub | — | Hospedagem e colaboração |
| Editor | VS Code | — | Ambiente de desenvolvimento |

### Publicação nas lojas

O app será publicado...

---

## 3. Estrutura de Pastas

```
sistema-ocorrencias/
├── src/
│   ├── screens/          # Telas do aplicativo
│   │   ├── LoginScreen.js
│   │   └── RegisterScreen.js
│   ├── components/       # Componentes reutilizáveis (botões, inputs)
│   ├── navigation/       # Configuração de rotas entre telas
│   └── services/         # Comunicação com o Supabase
├── assets/               # Imagens, ícones e fontes
├── .expo/                # Configurações internas do Expo (não versionar)
├── node_modules/         # Dependências instaladas (não versionar)
├── .gitattributes        # Normalização de quebras de linha para o time
├── .gitignore            # Arquivos ignorados pelo Git
├── App.js                # Ponto de entrada e configuração de navegação
├── app.json              # Configurações do app (nome, ícone, splash)
├── index.js              # Registro do componente raiz
├── package.json          # Dependências e scripts do projeto
└── package-lock.json     # Versões exatas das dependências
```

---

## 4. Configurações Realizadas

### 4.1 Ambiente de desenvolvimento

- **Node.js v24.14.1** instalado e configurado no Windows
- **VS Code** com as seguintes extensões instaladas:
  - ES7+ React/Redux/React-Native snippets
  - Prettier - Code Formatter (formatação automática ao salvar)
  - Color Highlight
  - GitLens
- **Prettier** configurado para formatar ao salvar (`editor.formatOnSave: true`)

- Branch principal definida como `main`

### 4.2 Arquivo `.gitignore`

Configurado para ignorar automaticamente:

```
node_modules/     # Dependências (geradas via npm install)
.expo/            # Configurações internas do Expo
.env              # Variáveis de ambiente
.env.local        # Chaves secretas do Supabase
```

### 4.3 Arquivo `.gitattributes`

Configurado para normalizar quebras de linha e evitar conflitos entre membros do time que usam Windows, Mac ou Linux:

```
* text=auto eol=lf
*.js    text eol=lf
*.jsx   text eol=lf
*.json  text eol=lf
*.md    text eol=lf
*.png   binary
*.jpg   binary
```

### 4.4 Padrão de commits (Conventional Commits)

| Prefixo | Quando usar |
|---|---|
| `feat:` | Nova funcionalidade |
| `fix:` | Correção de bug |
| `chore:` | Tarefa de configuração ou manutenção |
| `style:` | Ajuste visual sem alteração de lógica |
| `docs:` | Documentação |
| `refactor:` | Reorganização de código |

### 4.5 Navegação

Biblioteca **React Navigation** configurada com **Native Stack Navigator**:

- `LoginScreen` — tela inicial do app
- `RegisterScreen` — tela de cadastro de novo usuário

---

## 5. Telas Implementadas

### LoginScreen

- Campos: e-mail e senha
- Validação de campos obrigatórios e formato de e-mail
- Indicador de carregamento durante o login
- Link "Esqueci minha senha"
- Link de navegação para a tela de cadastro
- Tratamento de erros com mensagem visual

### RegisterScreen

- Campos: nome completo, e-mail, senha e confirmar senha
- Validação de todos os campos
- Verificação se as senhas coincidem
- Indicador de carregamento durante o cadastro
- Link de navegação de volta para o login

---


