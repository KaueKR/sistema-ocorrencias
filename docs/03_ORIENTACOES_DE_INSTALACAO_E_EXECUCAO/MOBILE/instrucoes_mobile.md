# Instruções Específicas — Ambiente Mobile

## Visão Geral

O projeto mobile é construído com **React Native 0.81.5** gerenciado pelo **Expo SDK 54**.
Existem três formas de executar o app, em ordem crescente de complexidade:

1. **Expo Go** — desenvolvimento rápido, sem build nativo
2. **Development Build** — build nativo com acesso a todas as APIs
3. **EAS Build** — build de produção para distribuição (APK/AAB/IPA)

---

## Opção 1 — Expo Go (Recomendado para desenvolvimento)

### Passo a passo

1. Instale o app **Expo Go** no celular:
   - Android: [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)
   - iOS: [Apple App Store](https://apps.apple.com/app/expo-go/id982107779)

2. Na raiz do projeto, execute:
   ```bash
   npx expo start
   ```

3. Um QR Code aparecerá no terminal. Escaneie com:
   - **Android**: câmera do Expo Go
   - **iOS**: câmera nativa do iPhone

4. O app carregará com hot reload ativo.

> **Limitação:** O Expo Go não suporta módulos nativos customizados. Para este projeto,
> o Expo Go é suficiente pois o supabase-js é uma biblioteca JS pura.

---

## Opção 2 — Emuladores Locais

### Android (Android Studio)

**Pré-requisitos:**
- Android Studio instalado (versão Hedgehog ou superior recomendada)
- Android SDK configurado (API Level 26+ recomendado)
- AVD criado (Pixel 6 com Android 13 é uma boa escolha)

**Executar:**
```bash
# Inicie o AVD pelo Android Studio (Device Manager) e então:
npx expo start --android
```

### iOS (Xcode — somente macOS)

**Pré-requisitos:**
- Xcode 15+ instalado via App Store
- Simulador iOS configurado (iPhone 15 / iOS 17 recomendado)

**Executar:**
```bash
npx expo start --ios
```

---

## Opção 3 — Development Build (build nativo local)

Use quando precisar de bibliotecas nativas não suportadas pelo Expo Go.

```bash
# Android
npx expo run:android

# iOS (macOS necessário)
npx expo run:ios
```

> Isso compila o app localmente. Requer Android SDK / Xcode instalados.

---

## Opção 4 — EAS Build (build de produção)

Para gerar APK (Android) ou IPA (iOS) para distribuição:

**Instalação do EAS CLI:**
```bash
npm install -g eas-cli
eas login
```

**Configurar o projeto (primeira vez):**
```bash
eas build:configure
```

**Gerar build:**
```bash
# APK Android (para teste direto no celular)
eas build --platform android --profile preview

# AAB Android (para Google Play)
eas build --platform android --profile production

# IPA iOS (para App Store / TestFlight)
eas build --platform ios --profile production
```

---

## Configurações do app.json

O arquivo `app.json` na raiz contém as configurações de identidade do app.
Campos importantes a verificar/atualizar antes de um build de produção:

```json
{
  "expo": {
    "name": "Sistema de Ocorrências",
    "slug": "sistema-ocorrencias",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "splash": {
      "image": "./assets/splash.png",
      "backgroundColor": "#232323"
    },
    "android": {
      "package": "br.edu.fabricadesoftware.ocorrencias",
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#232323"
      }
    },
    "ios": {
      "bundleIdentifier": "br.edu.fabricadesoftware.ocorrencias"
    }
  }
}
```

---

## Variáveis de Ambiente no Mobile

O Expo lê variáveis de ambiente do arquivo `.env` na raiz do projeto.
**Somente variáveis prefixadas com `EXPO_PUBLIC_` são expostas ao código do app.**

```env
EXPO_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

No código, são acessadas via:
```js
process.env.EXPO_PUBLIC_SUPABASE_URL
process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
```

> **Segurança:** A `ANON_KEY` é uma chave pública (segura para o client-side).
> NUNCA inclua a `SERVICE_ROLE_KEY` no app mobile.

---

## Limpeza de Cache

Se o Metro bundler apresentar comportamento inesperado:

```bash
# Limpa cache do Metro e reinstala
npx expo start --clear

# Limpeza completa (caso o anterior não resolva)
rm -rf node_modules
npm install
npx expo start --clear
```

---

## Testando em Dispositivo Físico via USB

```bash
# Android — habilitar "Depuração USB" nas opções de desenvolvedor do celular
npx expo run:android --device

# iOS — requer conta Apple Developer
npx expo run:ios --device
```
