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
    } catch (e) {
      setError(traduzirErroSupabase(e?.message));
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F8F8" />

      <View style={[styles.inner, { paddingTop: insets.top + 40 }]}>

        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Ionicons name="shield-checkmark" size={40} color="#EF1D26" />
          </View>
          <Text style={styles.title}>Sistema de{'\n'}Ocorrências</Text>
          <Text style={styles.subtitle}>Faça login para continuar</Text>
        </View>

        <View style={styles.form}>
          {error ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={16} color="#CC2229" style={{ marginRight: 8 }} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.inputWrapper}>
            <Ionicons name="mail-outline" size={20} color="#999999" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="E-mail"
              placeholderTextColor="#999999"
              value={email}
              onChangeText={(t) => { setEmail(t); setError(''); }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputWrapper}>
            <Ionicons name="lock-closed-outline" size={20} color="#999999" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Senha"
              placeholderTextColor="#999999"
              value={password}
              onChangeText={(t) => { setPassword(t); setError(''); }}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
              <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#999999" />
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
  container: { flex: 1, backgroundColor: '#F8F8F8' },
  inner: { flex: 1, justifyContent: 'center', paddingHorizontal: 28, paddingBottom: 40 },
  header: { marginBottom: 40, alignItems: 'center' },
  logoContainer: {
    width: 72, height: 72, borderRadius: 20, backgroundColor: '#FFEEEE',
    alignItems: 'center', justifyContent: 'center', marginBottom: 20,
  },
  title: { fontSize: 30, fontWeight: '800', color: '#232323', marginBottom: 8, textAlign: 'center', lineHeight: 36 },
  subtitle: { fontSize: 15, color: '#666666', textAlign: 'center' },
  form: { gap: 14 },
  errorContainer: {
    backgroundColor: '#FFF0F0', borderRadius: 10, padding: 12,
    borderLeftWidth: 4, borderLeftColor: '#EF1D26', flexDirection: 'row', alignItems: 'center',
  },
  errorText: { color: '#CC2229', fontSize: 13, flex: 1 },
  inputWrapper: {
    backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#DDDDDD', borderRadius: 12,
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, paddingVertical: 15, fontSize: 15, color: '#232323' },
  eyeIcon: { padding: 4 },
  forgotLink: { alignSelf: 'flex-end' },
  forgotLinkText: { color: '#EF1D26', fontSize: 13, fontWeight: '600' },
  button: {
    backgroundColor: '#EF1D26', borderRadius: 12, paddingVertical: 16,
    alignItems: 'center', marginTop: 4, flexDirection: 'row', justifyContent: 'center',
  },
  buttonDisabled: { backgroundColor: '#AAAAAA' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  registerLink: { alignItems: 'center', marginTop: 4 },
  registerLinkText: { color: '#666666', fontSize: 14 },
  registerLinkHighlight: { color: '#EF1D26', fontWeight: '700' },
});
