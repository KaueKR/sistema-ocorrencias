import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  StatusBar, ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabase';

const ROLE_LABELS = {
  super_admin:         'Super Admin',
  admin_institucional: 'Administrador',
  gestor_setor:        'Gestor de Setor',
  tecnico:             'Técnico',
  professor:           'Professor',
  aluno:               'Aluno',
};

export default function MeusDadosScreen({ navigation }) {
  const { usuario, roles, carregarPerfil } = useAuth();
  const insets = useSafeAreaInsets();

  const nomeAtual   = usuario?.user_metadata?.nome_completo || '';
  const email       = usuario?.email || '';
  const roleAtual   = roles[0]?.nome || 'aluno';
  const tipoLabel   = ROLE_LABELS[roleAtual] || 'Usuário';
  const iniciais    = nomeAtual.split(' ').filter(Boolean).map(n => n[0]).slice(0, 2).join('').toUpperCase();

  const [nome, setNome]       = useState(nomeAtual);
  const [salvando, setSalvando] = useState(false);

  const nomeAlterado = nome.trim() !== nomeAtual.trim() && nome.trim().length > 0;

  async function handleSalvar() {
    if (!nome.trim()) {
      Alert.alert('Campo obrigatório', 'O nome não pode ficar em branco.');
      return;
    }

    setSalvando(true);
    try {
      const { error: authError } = await supabase.auth.updateUser({
        data: { nome_completo: nome.trim() },
      });
      if (authError) throw authError;

      const { error: perfilError } = await supabase
        .from('perfis')
        .update({ nome_completo: nome.trim() })
        .eq('id', usuario.id);
      if (perfilError) throw perfilError;

      await carregarPerfil(usuario.id);

      Alert.alert('Sucesso', 'Dados atualizados com sucesso!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      Alert.alert('Erro', err.message || 'Não foi possível salvar as alterações.');
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
        <View style={styles.avatarWrapper}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{iniciais || '?'}</Text>
          </View>
        </View>
        <Text style={styles.headerTitle}>{nomeAtual || 'Meus Dados'}</Text>
        <Text style={styles.headerSubtitle}>{email}</Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardIconWrapper}>
              <Ionicons name="person-outline" size={16} color="#EF1D26" />
            </View>
            <Text style={styles.cardTitle}>INFORMAÇÕES PESSOAIS</Text>
          </View>

          <View style={styles.cardDivider} />

          <View style={styles.fieldBlock}>
            <Text style={styles.fieldLabel}>Nome Completo</Text>
            <TextInput
              style={styles.fieldInput}
              value={nome}
              onChangeText={setNome}
              placeholder="Seu nome completo"
              placeholderTextColor="#BBBBBB"
              autoCapitalize="words"
              returnKeyType="done"
            />
          </View>

          <View style={styles.cardDivider} />

          <View style={styles.fieldBlock}>
            <Text style={styles.fieldLabel}>E-mail</Text>
            <View style={styles.readOnlyRow}>
              <Text style={styles.readOnlyText} numberOfLines={1}>{email}</Text>
              <View style={styles.lockBadge}>
                <Ionicons name="lock-closed" size={10} color="#999999" />
                <Text style={styles.lockBadgeText}>Fixo</Text>
              </View>
            </View>
            <Text style={styles.fieldHint}>Para alterar o e-mail, entre em contato com o suporte.</Text>
          </View>

          <View style={styles.cardDivider} />

          <View style={styles.fieldBlock}>
            <Text style={styles.fieldLabel}>Perfil de Acesso</Text>
            <View style={styles.readOnlyRow}>
              <Text style={styles.readOnlyText}>{tipoLabel}</Text>
              <View style={[styles.lockBadge, { backgroundColor: 'rgba(239,29,38,0.08)' }]}>
                <Ionicons name="shield-checkmark" size={10} color="#EF1D26" />
                <Text style={[styles.lockBadgeText, { color: '#EF1D26' }]}>Atribuído</Text>
              </View>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.btnPrimary, (!nomeAlterado || salvando) && styles.btnDisabled]}
          onPress={handleSalvar}
          activeOpacity={0.8}
          disabled={!nomeAlterado || salvando}
        >
          {salvando ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
              <Text style={styles.btnPrimaryText}>Salvar Alterações</Text>
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
  avatarWrapper: { alignItems: 'center', marginBottom: 12 },
  avatar: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: '#EF1D26',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: 'rgba(255,255,255,0.15)',
  },
  avatarText: { fontSize: 26, color: '#fff', fontWeight: '800' },
  headerTitle:    { color: '#fff', fontSize: 18, fontWeight: '800', textAlign: 'center', marginBottom: 4 },
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

  fieldBlock:    { paddingHorizontal: 16, paddingVertical: 14, gap: 6 },
  fieldLabel:    { fontSize: 11, fontWeight: '600', color: '#999999', textTransform: 'uppercase', letterSpacing: 0.5 },
  fieldInput:    {
    fontSize: 15, fontWeight: '500', color: '#232323',
    borderBottomWidth: 1.5, borderBottomColor: '#EF1D26',
    paddingVertical: 6, paddingHorizontal: 0,
  },
  readOnlyRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  readOnlyText:  { fontSize: 15, fontWeight: '500', color: '#444444', flex: 1 },
  lockBadge:     {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#F0F0F0', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, marginLeft: 8,
  },
  lockBadgeText: { fontSize: 10, fontWeight: '600', color: '#999999' },
  fieldHint:     { fontSize: 11, color: '#AAAAAA' },

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
