import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StatusBar
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { traduzirErroSupabase } from '../utils/mensagensErro';

export default function ForgotPasswordScreen({ navigation }) {
  const { enviarCodigoRecuperacao, verificarCodigo, atualizarSenha } = useAuth();
  const insets = useSafeAreaInsets();

  const [step, setStep] = useState('EMAIL');
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
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

  const steps = [
    { key: 'EMAIL', label: 'E-mail', icon: 'mail' },
    { key: 'TOKEN', label: 'Código', icon: 'key' },
    { key: 'NEW_PASSWORD', label: 'Nova Senha', icon: 'lock-closed' },
  ];
  const currentStepIndex = steps.findIndex(s => s.key === step);

  async function handleSendEmail() {
    if (!email || !email.includes('@')) { setError('Por favor, informe um e-mail válido.'); return; }
    setError(''); setLoading(true);
    try {
      const { error: reqErr } = await enviarCodigoRecuperacao(email);
      if (reqErr) throw reqErr;
      setStep('TOKEN');
    } catch (err) {
      setError(traduzirErroSupabase(err.message));
    } finally { setLoading(false); }
  }

  async function handleVerifyToken() {
    if (!token || token.length === 0) { setError('Informe o código de verificação recebido.'); return; }
    setError(''); setLoading(true);
    try {
      const { error: reqErr } = await verificarCodigo(email, token);
      if (reqErr) throw reqErr;
      setStep('NEW_PASSWORD');
    } catch {
      setError('Código inválido ou expirado.');
    } finally { setLoading(false); }
  }

  async function handleUpdatePassword() {
    if (!isPasswordValid) { setError('A senha não atende aos requisitos.'); return; }
    if (password !== confirmPassword) { setError('As senhas não coincidem.'); return; }
    setError(''); setLoading(true);
    try {
      const { error: reqErr } = await atualizarSenha(password);
      if (reqErr) throw reqErr;
    } catch (err) {
      setError(traduzirErroSupabase(err.message));
    } finally { setLoading(false); }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8faff" />
      <ScrollView contentContainerStyle={[styles.inner, { paddingTop: insets.top + 16 }]} keyboardShouldPersistTaps="handled">

        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1e293b" />
        </TouchableOpacity>

        <Text style={styles.title}>Recuperar Senha</Text>

        <View style={styles.stepper}>
          {steps.map((s, i) => {
            const isDone = i < currentStepIndex;
            const isActive = i === currentStepIndex;
            return (
              <React.Fragment key={s.key}>
                <View style={styles.stepItem}>
                  <View style={[
                    styles.stepCircle,
                    isDone && styles.stepCircleDone,
                    isActive && styles.stepCircleActive,
                  ]}>
                    {isDone
                      ? <Ionicons name="checkmark" size={14} color="#fff" />
                      : <Ionicons name={s.icon} size={14} color={isActive ? '#fff' : '#94a3b8'} />
                    }
                  </View>
                  <Text style={[styles.stepLabel, isActive && styles.stepLabelActive]}>{s.label}</Text>
                </View>
                {i < steps.length - 1 && (
                  <View style={[styles.stepLine, i < currentStepIndex && styles.stepLineDone]} />
                )}
              </React.Fragment>
            );
          })}
        </View>

        <Text style={styles.subtitle}>
          {step === 'EMAIL' && 'Informe seu e-mail para receber o código'}
          {step === 'TOKEN' && 'Digite o código enviado para seu e-mail'}
          {step === 'NEW_PASSWORD' && 'Crie uma nova senha segura'}
        </Text>

        <View style={styles.form}>
          {error ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={16} color="#c62828" style={{ marginRight: 8 }} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {step === 'EMAIL' && (
            <>
              <View style={styles.inputWrapper}>
                <Ionicons name="mail-outline" size={20} color="#94a3b8" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="E-mail cadastrado"
                  placeholderTextColor="#94a3b8"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={(t) => { setEmail(t); setError(''); }}
                />
              </View>
              <TouchableOpacity style={styles.button} onPress={handleSendEmail} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : (
                  <>
                    <Text style={styles.buttonText}>Enviar Código</Text>
                    <Ionicons name="send" size={16} color="#fff" style={{ marginLeft: 8 }} />
                  </>
                )}
              </TouchableOpacity>
            </>
          )}

          {step === 'TOKEN' && (
            <>
              <View style={styles.tokenInfo}>
                <Ionicons name="information-circle" size={18} color="#4361ee" style={{ marginRight: 8 }} />
                <Text style={styles.tokenInfoText}>Verifique seu e-mail: <Text style={{ fontWeight: '700' }}>{email}</Text></Text>
              </View>
              <View style={styles.inputWrapper}>
                <Ionicons name="key-outline" size={20} color="#94a3b8" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Cole o código aqui"
                  placeholderTextColor="#94a3b8"
                  value={token}
                  onChangeText={(t) => { setToken(t); setError(''); }}
                  autoCapitalize="none"
                />
              </View>
              <TouchableOpacity style={styles.button} onPress={handleVerifyToken} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : (
                  <>
                    <Text style={styles.buttonText}>Validar Código</Text>
                    <Ionicons name="checkmark" size={18} color="#fff" style={{ marginLeft: 8 }} />
                  </>
                )}
              </TouchableOpacity>
            </>
          )}

          {step === 'NEW_PASSWORD' && (
            <>
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={20} color="#94a3b8" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Nova Senha"
                  placeholderTextColor="#94a3b8"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={(t) => { setPassword(t); setError(''); }}
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
                    { ok: hasSpecialChar, label: 'Caractere especial' },
                  ].map((rule, i) => (
                    <View key={i} style={styles.ruleRow}>
                      <Ionicons name={rule.ok ? 'checkmark-circle' : 'ellipse-outline'} size={15} color={rule.ok ? '#16a34a' : '#94a3b8'} style={{ marginRight: 8 }} />
                      <Text style={[styles.ruleText, rule.ok ? styles.ruleMet : styles.ruleUnmet]}>{rule.label}</Text>
                    </View>
                  ))}
                </View>
              )}
              <View style={[styles.inputWrapper, confirmPassword.length > 0 && password !== confirmPassword && styles.inputWrapperError]}>
                <Ionicons name="lock-closed-outline" size={20} color="#94a3b8" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Confirmar Nova Senha"
                  placeholderTextColor="#94a3b8"
                  secureTextEntry={!showConfirm}
                  value={confirmPassword}
                  onChangeText={(t) => { setConfirmPassword(t); setError(''); }}
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
              <TouchableOpacity style={styles.button} onPress={handleUpdatePassword} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : (
                  <>
                    <Text style={styles.buttonText}>Salvar e Entrar</Text>
                    <Ionicons name="arrow-forward" size={18} color="#fff" style={{ marginLeft: 8 }} />
                  </>
                )}
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity style={styles.loginLink} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={14} color="#4361ee" style={{ marginRight: 4 }} />
            <Text style={styles.loginLinkText}>Voltar para o <Text style={styles.loginLinkHighlight}>Login</Text></Text>
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
  title: { fontSize: 28, fontWeight: '800', color: '#1a1a2e', marginBottom: 24 },
  stepper: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  stepItem: { alignItems: 'center' },
  stepCircle: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: '#e2e8f0',
    alignItems: 'center', justifyContent: 'center', marginBottom: 6,
  },
  stepCircleActive: { backgroundColor: '#4361ee' },
  stepCircleDone: { backgroundColor: '#16a34a' },
  stepLabel: { fontSize: 11, color: '#94a3b8', fontWeight: '500' },
  stepLabelActive: { color: '#4361ee', fontWeight: '700' },
  stepLine: { flex: 1, height: 2, backgroundColor: '#e2e8f0', marginBottom: 20, marginHorizontal: 4 },
  stepLineDone: { backgroundColor: '#16a34a' },
  subtitle: { fontSize: 14, color: '#64748b', marginBottom: 20 },
  form: { gap: 14 },
  errorContainer: {
    backgroundColor: '#fdecea', borderRadius: 10, padding: 12,
    borderLeftWidth: 4, borderLeftColor: '#e53935', flexDirection: 'row', alignItems: 'center',
  },
  errorText: { color: '#c62828', fontSize: 13, flex: 1 },
  tokenInfo: {
    backgroundColor: '#eef0ff', borderRadius: 10, padding: 12,
    flexDirection: 'row', alignItems: 'center',
  },
  tokenInfoText: { color: '#4361ee', fontSize: 13, flex: 1 },
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
    alignItems: 'center', flexDirection: 'row', justifyContent: 'center',
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  loginLink: { alignItems: 'center', marginTop: 4, flexDirection: 'row', justifyContent: 'center' },
  loginLinkText: { color: '#64748b', fontSize: 14 },
  loginLinkHighlight: { color: '#4361ee', fontWeight: '700' },
});
