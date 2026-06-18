# Sistema de Ocorrências — Guia Geral de Instalação e Execução

## Pré-requisitos

Antes de começar, certifique-se de que as ferramentas abaixo estão instaladas e nas versões recomendadas:

| Ferramenta | Versão Mínima | Verificação |
|---|---|---|
| Node.js | 18.x LTS | `node --version` |
| npm | 9.x | `npm --version` |
| Expo CLI | 0.22.x+ | `npx expo --version` |
| Git | 2.x | `git --version` |
| Expo Go (app) | Atual | Instalar via App Store / Google Play |

> Para builds nativos (APK/IPA), é necessário também o **EAS CLI**: `npm install -g eas-cli`

---

## 1. Clonar o Repositório

```bash
git clone https://github.com/KaueKR/sistema-ocorrencias.git
cd sistema-ocorrencias
```

---

## 2. Instalar Dependências

```bash
npm install
```

---

## 3. Configurar Variáveis de Ambiente

Copie o arquivo de exemplo e preencha com suas credenciais do Supabase:

```bash
cp .env.example .env
```

Abra o `.env` e preencha:

```env
EXPO_PUBLIC_SUPABASE_URL=https://SEU_PROJECT_ID.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=SUA_ANON_KEY_PUBLICA
```

> As credenciais são encontradas no painel do Supabase em **Project Settings → API**.

---

## 4. Configurar o Banco de Dados (Supabase)

Acesse o **SQL Editor** do seu projeto no Supabase e execute os scripts de criação
de tabelas e políticas RLS na seguinte ordem:

1. `[Inserir script de criação das tabelas: perfis, roles, perfil_roles, role_permissoes, permissoes]`
2. `[Inserir script de criação das políticas RLS]`
3. `[Inserir script de seed de roles padrão, se houver]`

Adicionalmente, a seguinte política de UPDATE deve estar ativa na tabela `perfis`
para que a tela "Meus Dados" funcione corretamente:

```sql
CREATE POLICY "Usuários podem atualizar seu próprio perfil"
ON public.perfis
FOR UPDATE
USING  (auth.uid() = id)
WITH CHECK (auth.uid() = id);
```

---

## 5. Executar o Projeto

### Desenvolvimento com Expo Go (mais rápido)

```bash
npx expo start
```

Escaneie o QR Code exibido no terminal com o aplicativo **Expo Go** no seu celular.
O celular e o computador devem estar na mesma rede Wi-Fi.

### Emulador Android

```bash
npx expo start --android
```

Requer Android Studio com um AVD (Android Virtual Device) configurado.

### Simulador iOS (apenas macOS)

```bash
npx expo start --ios
```

Requer Xcode instalado.

### Build de Desenvolvimento (acesso a APIs nativas)

```bash
npx expo run:android
# ou
npx expo run:ios
```

---

## 6. Estrutura de Diretórios Relevante

```
sistema-ocorrencias/
├── App.js                  — Ponto de entrada da aplicação
├── app.json                — Configuração do Expo (nome, ícone, splash, bundle ID)
├── .env                    — Variáveis de ambiente (NÃO versionar)
├── .env.example            — Template de variáveis de ambiente
├── package.json            — Dependências e scripts npm
├── src/
│   ├── contexts/           — Estado global (AuthContext)
│   ├── navigation/         — Configuração de rotas
│   ├── screens/            — Telas da aplicação
│   ├── services/           — Camada de acesso ao Supabase
│   ├── hooks/              — Hooks customizados (usePermissions)
│   ├── components/         — Componentes reutilizáveis
│   └── utils/              — Funções utilitárias
└── docs/                   — Documentação do projeto
```

---

## 7. Problemas Comuns

| Problema | Solução |
|---|---|
| `Unable to resolve module` | Execute `npm install` e reinicie o Metro com `npx expo start --clear` |
| QR Code não conecta | Confirme que celular e PC estão na mesma rede; tente modo `--tunnel` |
| Erro 401 do Supabase | Verifique se `EXPO_PUBLIC_SUPABASE_ANON_KEY` está correto no `.env` |
| Perfil não carrega após login | Confirme que as tabelas `perfis` e `perfil_roles` existem e têm dados |
| `Network request failed` | Verifique `EXPO_PUBLIC_SUPABASE_URL` — sem barra final na URL |
