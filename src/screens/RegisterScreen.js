import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StatusBar
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { traduzirErroSupabase } from '../utils/mensagensErro';

export default function RegisterScreen({ navigation }) {
  const { cadastrar } = useAuth();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasSpecialChar = /[@$!%*?&._-]/.test(password);
  const isPasswordValid = hasMinLength && hasUppercase && hasLowercase && hasSpecialChar;

  function validateFields() {
    if (!name) { setError('Por favor, informe seu nome completo.'); return false; }
    if (!email || !email.includes('@')) { setError('Por favor, informe um e-mail válido.'); return false; }
    if (!isPasswordValid) { setError('A senha não atende a todos os requisitos de segurança.'); return false; }
    if (password !== confirmPassword) { setError('As senhas não coincidem.'); return false; }
    return true;
  }

  async function handleRegister() {
    setError('');
    if (!validateFields()) return;
    setLoading(true);
    try {
      const { error: erroAuth } = await cadastrar(name, email, password);
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
      <ScrollView contentContainerStyle={[styles.inner, { paddingTop: insets.top + 20 }]} keyboardShouldPersistTaps="handled">

        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1e293b" />
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.title}>Criar conta</Text>
          <Text style={styles.subtitle}>Preencha os dados para se cadastrar</Text>
        </View>

        <View style={styles.form}>
          {error ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={16} color="#c62828" style={{ marginRight: 8 }} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.inputWrapper}>
            <Ionicons name="person-outline" size={20} color="#94a3b8" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Nome completo"
              placeholderTextColor="#94a3b8"
              value={name}
              onChangeText={(t) => { setName(t); setError(''); }}
              autoCapitalize="words"
            />
          </View>

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

          {password.length > 0 && (
            <View style={styles.passwordRulesContainer}>
              {[
                { ok: hasMinLength, label: 'Pelo menos 8 caracteres' },
                { ok: hasUppercase, label: 'Letra maiúscula' },
                { ok: hasLowercase, label: 'Letra minúscula' },
                { ok: hasSpecialChar, label: 'Caractere especial (@$!%*?&...)' },
              ].map((rule, i) => (
                <View key={i} style={styles.ruleRow}>
                  <Ionicons
                    name={rule.ok ? 'checkmark-circle' : 'ellipse-outline'}
                    size={16}
                    color={rule.ok ? '#16a34a' : '#94a3b8'}
                    style={{ marginRight: 8 }}
                  />
                  <Text style={[styles.ruleText, rule.ok ? styles.ruleMet : styles.ruleUnmet]}>
                    {rule.label}
                  </Text>
                </View>
              ))}
            </View>
          )}

          <View style={[
            styles.inputWrapper,
            confirmPassword.length > 0 && password !== confirmPassword && styles.inputWrapperError
          ]}>
            <Ionicons name="lock-closed-outline" size={20} color="#94a3b8" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Confirmar senha"
              placeholderTextColor="#94a3b8"
              value={confirmPassword}
              onChangeText={(t) => { setConfirmPassword(t); setError(''); }}
              secureTextEntry={!showConfirm}
            />
            <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)} style={styles.eyeIcon}>
              <Ionicons name={showConfirm ? 'eye-off-outline' : 'eye-outline'} size={20} color="#94a3b8" />
            </TouchableOpacity>
          </View>
          {confirmPassword.length > 0 && password !== confirmPassword && (
            <View style={styles.matchErrorRow}>
              <Ionicons name="close-circle" size={14} color="#e53935" style={{ marginRight: 4 }} />
              <Text style={styles.matchErrorText}>As senhas não coincidem</Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#fff" /> : (
              <>
                <Text style={styles.buttonText}>Criar conta</Text>
                <Ionicons name="checkmark" size={18} color="#fff" style={{ marginLeft: 8 }} />
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.loginLink} onPress={() => navigation.goBack()}>
            <Text style={styles.loginLinkText}>
              Já tem uma conta? <Text style={styles.loginLinkHighlight}>Faça login</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8faff' },
  inner: { flexGrow: 1, paddingHorizontal: 28, paddingBottom: 40 },
  backBtn: { marginBottom: 16, alignSelf: 'flex-start', padding: 4 },
  header: { marginBottom: 32 },
  title: { fontSize: 30, fontWeight: '800', color: '#1a1a2e', marginBottom: 6 },
  subtitle: { fontSize: 15, color: '#64748b' },
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
  inputWrapperError: { borderColor: '#e53935' },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, paddingVertical: 15, fontSize: 15, color: '#1e293b' },
  eyeIcon: { padding: 4 },
  passwordRulesContainer: {
    backgroundColor: '#f0fdf4', borderRadius: 10, padding: 14,
    borderWidth: 1, borderColor: '#bbf7d0', gap: 8,
  },
  ruleRow: { flexDirection: 'row', alignItems: 'center' },
  ruleText: { fontSize: 13 },
  ruleMet: { color: '#15803d', fontWeight: '500' },
  ruleUnmet: { color: '#64748b' },
  matchErrorRow: { flexDirection: 'row', alignItems: 'center', marginTop: -6 },
  matchErrorText: { color: '#e53935', fontSize: 13 },
  button: {
    backgroundColor: '#4361ee', borderRadius: 12, paddingVertical: 16,
    alignItems: 'center', marginTop: 4, flexDirection: 'row', justifyContent: 'center',
  },
  buttonDisabled: { backgroundColor: '#a0aec0' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  loginLink: { alignItems: 'center', marginTop: 4 },
  loginLinkText: { color: '#64748b', fontSize: 14 },
  loginLinkHighlight: { color: '#4361ee', fontWeight: '700' },
});