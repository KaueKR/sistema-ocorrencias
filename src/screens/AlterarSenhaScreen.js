import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  StatusBar, ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabase';

function CampoSenha({ label, value, onChangeText, visivel, onToggleVisivel, placeholder, editable = true }) {
  return (
    <View style={styles.fieldBlock}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={[styles.passwordRow, !editable && styles.passwordRowDisabled]}>
        <TextInput
          style={styles.passwordInput}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#BBBBBB"
          secureTextEntry={!visivel}
          autoCapitalize="none"
          autoCorrect={false}
          editable={editable}
        />
        {editable && (
          <TouchableOpacity onPress={onToggleVisivel} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name={visivel ? 'eye-off-outline' : 'eye-outline'} size={20} color="#999999" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const REQUISITOS = [
  { label: 'Mínimo 8 caracteres',  check: v => v.length >= 8 },
  { label: 'Letra maiúscula (A–Z)', check: v => /[A-Z]/.test(v) },
  { label: 'Número (0–9)',          check: v => /[0-9]/.test(v) },
];

export default function AlterarSenhaScreen({ navigation }) {
  const { usuario, atualizarSenha } = useAuth();
  const insets = useSafeAreaInsets();

  const [senhaAtual, setSenhaAtual]     = useState('');
  const [novaSenha, setNovaSenha]       = useState('');
  const [confirmar, setConfirmar]       = useState('');
  const [verAtual, setVerAtual]         = useState(false);
  const [verNova, setVerNova]           = useState(false);
  const [verConf, setVerConf]           = useState(false);
  const [salvando, setSalvando]         = useState(false);

  const senhasIguais   = novaSenha === confirmar;
  const confirmarErro  = confirmar.length > 0 && !senhasIguais;
  const requisitosOk   = REQUISITOS.every(r => r.check(novaSenha));

  async function handleAtualizar() {
    if (!senhaAtual || !novaSenha || !confirmar) {
      Alert.alert('Campos obrigatórios', 'Preencha todos os campos para continuar.');
      return;
    }
    if (!senhasIguais) {
      Alert.alert('Senhas diferentes', 'A nova senha e a confirmação não coincidem.');
      return;
    }
    if (!requisitosOk) {
      Alert.alert('Senha fraca', 'A nova senha não atende aos requisitos mínimos de segurança.');
      return;
    }

    setSalvando(true);
    try {
      const { error: reAuthError } = await supabase.auth.signInWithPassword({
        email: usuario.email,
        password: senhaAtual,
      });
      if (reAuthError) {
        Alert.alert('Senha atual incorreta', 'Verifique a senha atual e tente novamente.');
        return;
      }

      const { error } = await atualizarSenha(novaSenha);
      if (error) throw error;

      Alert.alert('Senha atualizada!', 'Sua senha foi alterada com sucesso.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      Alert.alert('Erro', err.message || 'Não foi possível alterar a senha.');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#232323" />

      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerIconWrapper}>
          <Ionicons name="lock-closed-outline" size={28} color="#EF1D26" />
        </View>
        <Text style={styles.headerTitle}>Alterar Senha</Text>
        <Text style={styles.headerSubtitle}>Escolha uma senha segura e única</Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardIconWrapper}>
              <Ionicons name="key-outline" size={16} color="#EF1D26" />
            </View>
            <Text style={styles.cardTitle}>ALTERAR CREDENCIAL</Text>
          </View>
          <View style={styles.cardDivider} />

          <CampoSenha
            label="Senha Atual"
            value={senhaAtual}
            onChangeText={setSenhaAtual}
            visivel={verAtual}
            onToggleVisivel={() => setVerAtual(v => !v)}
            placeholder="••••••••"
          />
          <View style={styles.cardDivider} />
          <CampoSenha
            label="Nova Senha"
            value={novaSenha}
            onChangeText={setNovaSenha}
            visivel={verNova}
            onToggleVisivel={() => setVerNova(v => !v)}
            placeholder="••••••••"
          />
          <View style={styles.cardDivider} />
          <CampoSenha
            label="Confirmar Nova Senha"
            value={confirmar}
            onChangeText={setConfirmar}
            visivel={verConf}
            onToggleVisivel={() => setVerConf(v => !v)}
            placeholder="••••••••"
          />
        </View>

        {novaSenha.length > 0 && (
          <View style={styles.strengthCard}>
            <Text style={styles.strengthTitle}>Requisitos da nova senha</Text>
            {REQUISITOS.map((item, i) => {
              const ok = item.check(novaSenha);
              return (
                <View key={i} style={styles.strengthRow}>
                  <Ionicons
                    name={ok ? 'checkmark-circle' : 'ellipse-outline'}
                    size={16}
                    color={ok ? '#16a34a' : '#CCCCCC'}
                  />
                  <Text style={[styles.strengthText, ok && styles.strengthTextOk]}>
                    {item.label}
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        {confirmarErro && (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle-outline" size={16} color="#EF1D26" />
            <Text style={styles.errorText}>As senhas não coincidem.</Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.btnPrimary, salvando && styles.btnDisabled]}
          onPress={handleAtualizar}
          activeOpacity={0.8}
          disabled={salvando}
        >
          {salvando ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Ionicons name="shield-checkmark-outline" size={18} color="#fff" />
              <Text style={styles.btnPrimaryText}>Atualizar Senha</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.btnSecondary} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <Text style={styles.btnSecondaryText}>Cancelar</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F8F8' },

  header: {
    backgroundColor: '#232323',
    paddingHorizontal: 20,
    paddingBottom: 28,
  },
  backButton: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 20,
  },
  headerIconWrapper: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: 'rgba(239,29,38,0.12)',
    alignItems: 'center', justifyContent: 'center',
    alignSelf: 'center', marginBottom: 12,
  },
  headerTitle:    { color: '#fff', fontSize: 20, fontWeight: '800', textAlign: 'center', marginBottom: 4 },
  headerSubtitle: { color: '#666666', fontSize: 13, textAlign: 'center' },

  content: { padding: 20, gap: 12 },

  card: {
    backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden',
    elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingVertical: 14,
  },
  cardIconWrapper: {
    width: 28, height: 28, borderRadius: 8, backgroundColor: '#FFEEEE',
    alignItems: 'center', justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 11, fontWeight: '700', color: '#232323',
    textTransform: 'uppercase', letterSpacing: 0.6,
  },
  cardDivider: { height: 1, backgroundColor: '#F8F8F8' },

  fieldBlock:          { paddingHorizontal: 16, paddingVertical: 14, gap: 6 },
  fieldLabel:          { fontSize: 11, fontWeight: '600', color: '#999999', textTransform: 'uppercase', letterSpacing: 0.5 },
  passwordRow:         {
    flexDirection: 'row', alignItems: 'center',
    borderBottomWidth: 1.5, borderBottomColor: '#EF1D26', paddingVertical: 4,
  },
  passwordRowDisabled: { borderBottomColor: '#EEEEEE' },
  passwordInput:       { flex: 1, fontSize: 15, fontWeight: '500', color: '#232323', paddingVertical: 2 },

  strengthCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16, gap: 10,
    elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4,
  },
  strengthTitle: { fontSize: 12, fontWeight: '700', color: '#232323', marginBottom: 2 },
  strengthRow:   { flexDirection: 'row', alignItems: 'center', gap: 8 },
  strengthText:  { fontSize: 13, color: '#AAAAAA' },
  strengthTextOk:{ color: '#16a34a', fontWeight: '500' },

  errorBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#FFF0F0', borderRadius: 12, padding: 12,
    borderLeftWidth: 3, borderLeftColor: '#EF1D26',
  },
  errorText: { fontSize: 13, color: '#EF1D26', fontWeight: '500' },

  btnPrimary: {
    backgroundColor: '#EF1D26', borderRadius: 14, paddingVertical: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    elevation: 3, shadowColor: '#EF1D26', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25, shadowRadius: 8, marginTop: 4,
  },
  btnDisabled:     { backgroundColor: '#CCCCCC', elevation: 0, shadowColor: 'transparent' },
  btnPrimaryText:  { fontSize: 15, fontWeight: '700', color: '#fff' },
  btnSecondary:    { alignItems: 'center', paddingVertical: 14 },
  btnSecondaryText:{ fontSize: 14, fontWeight: '600', color: '#999999' },
});
