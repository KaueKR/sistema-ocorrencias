import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, Platform, StatusBar
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { traduzirErroSupabase } from '../utils/mensagensErro';

export default function LoginScreen({ navigation }) {
  const { entrar } = useAuth();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function validateFields() {
    if (!email) { setError('Por favor, informe seu e-mail.'); return false; }
    if (!email.includes('@')) { setError('Por favor, informe um e-mail válido.'); return false; }
    if (!password) { setError('Por favor, informe sua senha.'); return false; }
    if (password.length < 6) { setError('A senha deve ter no mínimo 6 caracteres.'); return false; }
    return true;
  }

  async function handleLogin() {
    setError('');
    if (!validateFields()) return;
    setLoading(true);
    try {
      const { error: erroAuth } = await entrar(email, password);
      if (erroAuth) setError(traduzirErroSupabase(erroAuth.message));
    } catch {
      setError('Ocorreu um erro inesperado. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8faff" />

      <View style={[styles.inner, { paddingTop: insets.top + 40 }]}>

        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Ionicons name="shield-checkmark" size={40} color="#4361ee" />
          </View>
          <Text style={styles.title}>Sistema de{'\n'}Ocorrências</Text>
          <Text style={styles.subtitle}>Faça login para continuar</Text>
        </View>

        <View style={styles.form}>
          {error ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={16} color="#c62828" style={{ marginRight: 8 }} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.inputWrapper}>
            <Ionicons name="mail-outline" size={20} color="#94a3b8" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="E-mail"
              placeholderTextColor="#94a3b8"
              value={email}
              onChangeText={(t) => { setEmail(t); setError(''); }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputWrapper}>
            <Ionicons name="lock-closed-outline" size={20} color="#94a3b8" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Senha"
              placeholderTextColor="#94a3b8"
              value={password}
              onChangeText={(t) => { setPassword(t); setError(''); }}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
              <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.forgotLink} onPress={() => navigation.navigate('ForgotPassword')}>
            <Text style={styles.forgotLinkText}>Esqueci minha senha</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.buttonText}>Entrar</Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" style={{ marginLeft: 8 }} />
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.registerLink} onPress={() => navigation.navigate('Register')}>
            <Text style={styles.registerLinkText}>
              Não tem uma conta?{' '}
              <Text style={styles.registerLinkHighlight}>Cadastre-se</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8faff' },
  inner: { flex: 1, justifyContent: 'center', paddingHorizontal: 28, paddingBottom: 40 },
  header: { marginBottom: 40, alignItems: 'center' },
  logoContainer: {
    width: 72, height: 72, borderRadius: 20, backgroundColor: '#eef0ff',
    alignItems: 'center', justifyContent: 'center', marginBottom: 20,
  },
  title: { fontSize: 30, fontWeight: '800', color: '#1a1a2e', marginBottom: 8, textAlign: 'center', lineHeight: 36 },
  subtitle: { fontSize: 15, color: '#64748b', textAlign: 'center' },
  form: { gap: 14 },
  errorContainer: {
    backgroundColor: '#fdecea', borderRadius: 10, padding: 12,
    borderLeftWidth: 4, borderLeftColor: '#e53935', flexDirection: 'row', alignItems: 'center',
  },
  errorText: { color: '#c62828', fontSize: 13, flex: 1 },
  inputWrapper: {
    backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 12,
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, paddingVertical: 15, fontSize: 15, color: '#1e293b' },
  eyeIcon: { padding: 4 },
  forgotLink: { alignSelf: 'flex-end' },
  forgotLinkText: { color: '#4361ee', fontSize: 13, fontWeight: '600' },
  button: {
    backgroundColor: '#4361ee', borderRadius: 12, paddingVertical: 16,
    alignItems: 'center', marginTop: 4, flexDirection: 'row', justifyContent: 'center',
  },
  buttonDisabled: { backgroundColor: '#a0aec0' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  registerLink: { alignItems: 'center', marginTop: 4 },
  registerLinkText: { color: '#64748b', fontSize: 14 },
  registerLinkHighlight: { color: '#4361ee', fontWeight: '700' },
});