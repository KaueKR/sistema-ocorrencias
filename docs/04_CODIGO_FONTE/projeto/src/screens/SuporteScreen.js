import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  StatusBar, ScrollView, Alert, ActivityIndicator, Modal,
  FlatList, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';

const TIPOS_PROBLEMA = [
  { value: 'bug',      label: 'Reportar um bug',               icon: 'bug-outline' },
  { value: 'duvida',   label: 'Dúvida sobre funcionalidade',   icon: 'help-circle-outline' },
  { value: 'acesso',   label: 'Problema de acesso ou permissão', icon: 'lock-open-outline' },
  { value: 'melhoria', label: 'Sugestão de melhoria',          icon: 'bulb-outline' },
  { value: 'outro',    label: 'Outro assunto',                  icon: 'chatbox-ellipses-outline' },
];

function DropdownModal({ visivel, opcoes, selecionado, onSelecionar, onFechar }) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visivel} transparent animationType="slide" onRequestClose={onFechar}>
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onFechar} />
      <View style={[styles.modalSheet, { paddingBottom: insets.bottom + 8 }]}>
        <View style={styles.modalHandle} />
        <Text style={styles.modalTitle}>Tipo de problema</Text>
        <FlatList
          data={opcoes}
          keyExtractor={item => item.value}
          renderItem={({ item }) => {
            const ativo = selecionado?.value === item.value;
            return (
              <TouchableOpacity
                style={[styles.modalItem, ativo && styles.modalItemActive]}
                onPress={() => { onSelecionar(item); onFechar(); }}
                activeOpacity={0.7}
              >
                <View style={[styles.modalItemIcon, ativo && styles.modalItemIconActive]}>
                  <Ionicons name={item.icon} size={18} color={ativo ? '#EF1D26' : '#666666'} />
                </View>
                <Text style={[styles.modalItemLabel, ativo && styles.modalItemLabelActive]}>
                  {item.label}
                </Text>
                {ativo && <Ionicons name="checkmark-circle" size={18} color="#EF1D26" />}
              </TouchableOpacity>
            );
          }}
          ItemSeparatorComponent={() => <View style={styles.modalSep} />}
        />
      </View>
    </Modal>
  );
}

export default function SuporteScreen({ navigation }) {
  const { usuario } = useAuth();
  const insets = useSafeAreaInsets();

  const [tipo, setTipo]             = useState(null);
  const [descricao, setDescricao]   = useState('');
  const [dropdownOpen, setDropdown] = useState(false);
  const [enviando, setEnviando]     = useState(false);
  const [enviado, setEnviado]       = useState(false);

  const podeEnviar = tipo && descricao.trim().length >= 10;

  async function handleEnviar() {
    if (!podeEnviar) return;
    setEnviando(true);
    try {
      // TODO: conectar ao backend (ex: tabela "suporte" no Supabase ou envio por e-mail)
      // await supabase.from('suporte').insert({
      //   perfil_id: usuario?.id,
      //   tipo: tipo.value,
      //   descricao: descricao.trim(),
      // });

      await new Promise(r => setTimeout(r, 1000)); // simula latência de rede
      setEnviado(true);
    } catch (err) {
      Alert.alert('Erro', err.message || 'Não foi possível enviar a mensagem. Tente novamente.');
    } finally {
      setEnviando(false);
    }
  }

  if (enviado) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#232323" />
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerIconWrapper}>
            <Ionicons name="headset-outline" size={28} color="#EF1D26" />
          </View>
          <Text style={styles.headerTitle}>Suporte</Text>
          <Text style={styles.headerSubtitle}>Atendimento e Ajuda</Text>
        </View>
        <View style={styles.successContainer}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark-circle" size={64} color="#16a34a" />
          </View>
          <Text style={styles.successTitle}>Mensagem enviada!</Text>
          <Text style={styles.successText}>
            Recebemos seu chamado e nossa equipe entrará em contato em breve.
          </Text>
          <TouchableOpacity
            style={styles.btnPrimary}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-back-outline" size={18} color="#fff" />
            <Text style={styles.btnPrimaryText}>Voltar ao Perfil</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#232323" />

      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerIconWrapper}>
          <Ionicons name="headset-outline" size={28} color="#EF1D26" />
        </View>
        <Text style={styles.headerTitle}>Suporte</Text>
        <Text style={styles.headerSubtitle}>Atendimento e Ajuda</Text>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {usuario && (
            <View style={styles.infoCard}>
              <Ionicons name="information-circle-outline" size={16} color="#2563eb" />
              <Text style={styles.infoText}>
                Chamado vinculado à conta <Text style={styles.infoEmail}>{usuario.email}</Text>
              </Text>
            </View>
          )}

          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardIconWrapper}>
                <Ionicons name="create-outline" size={16} color="#EF1D26" />
              </View>
              <Text style={styles.cardTitle}>NOVO CHAMADO</Text>
            </View>

            <View style={styles.cardDivider} />

            {/* Dropdown tipo */}
            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>Tipo de problema</Text>
              <TouchableOpacity
                style={styles.dropdownTrigger}
                onPress={() => setDropdown(true)}
                activeOpacity={0.7}
              >
                {tipo ? (
                  <View style={styles.dropdownSelected}>
                    <Ionicons name={tipo.icon} size={18} color="#EF1D26" />
                    <Text style={styles.dropdownSelectedText}>{tipo.label}</Text>
                  </View>
                ) : (
                  <Text style={styles.dropdownPlaceholder}>Selecione uma categoria...</Text>
                )}
                <Ionicons name="chevron-down" size={18} color="#999999" />
              </TouchableOpacity>
            </View>

            <View style={styles.cardDivider} />

            {/* Textarea descrição */}
            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>Descreva seu problema</Text>
              <TextInput
                style={styles.textarea}
                value={descricao}
                onChangeText={setDescricao}
                placeholder="Descreva detalhadamente sua dúvida, problema ou sugestão. Quanto mais detalhes, mais rápido conseguimos ajudar."
                placeholderTextColor="#BBBBBB"
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                maxLength={1000}
              />
              <Text style={styles.charCount}>{descricao.length}/1000 caracteres</Text>
              {descricao.length > 0 && descricao.trim().length < 10 && (
                <Text style={styles.fieldHint}>Mínimo de 10 caracteres para enviar.</Text>
              )}
            </View>
          </View>

          <TouchableOpacity
            style={[styles.btnPrimary, (!podeEnviar || enviando) && styles.btnDisabled]}
            onPress={handleEnviar}
            activeOpacity={0.8}
            disabled={!podeEnviar || enviando}
          >
            {enviando ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="send-outline" size={18} color="#fff" />
                <Text style={styles.btnPrimaryText}>Enviar Mensagem</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.btnSecondary} onPress={() => navigation.goBack()} activeOpacity={0.7}>
            <Text style={styles.btnSecondaryText}>Cancelar</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      <DropdownModal
        visivel={dropdownOpen}
        opcoes={TIPOS_PROBLEMA}
        selecionado={tipo}
        onSelecionar={setTipo}
        onFechar={() => setDropdown(false)}
      />
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

  infoCard: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#EFF6FF', borderRadius: 12, padding: 12,
    borderLeftWidth: 3, borderLeftColor: '#2563eb',
  },
  infoText:  { fontSize: 12, color: '#1d4ed8', flex: 1, lineHeight: 18 },
  infoEmail: { fontWeight: '700' },

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

  fieldBlock: { paddingHorizontal: 16, paddingVertical: 14, gap: 8 },
  fieldLabel: { fontSize: 11, fontWeight: '600', color: '#999999', textTransform: 'uppercase', letterSpacing: 0.5 },
  fieldHint:  { fontSize: 11, color: '#EF1D26' },

  dropdownTrigger: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1.5, borderColor: '#EEEEEE', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12, backgroundColor: '#FAFAFA',
  },
  dropdownSelected:     { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  dropdownSelectedText: { fontSize: 14, fontWeight: '500', color: '#232323' },
  dropdownPlaceholder:  { fontSize: 14, color: '#BBBBBB', flex: 1 },

  textarea: {
    borderWidth: 1.5, borderColor: '#EEEEEE', borderRadius: 10,
    padding: 12, fontSize: 14, color: '#232323', lineHeight: 22,
    minHeight: 130, backgroundColor: '#FAFAFA',
  },
  charCount: { fontSize: 11, color: '#BBBBBB', textAlign: 'right' },

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

  // Modal dropdown
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  modalSheet: {
    backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingTop: 12, paddingHorizontal: 20, paddingBottom: 20,
    elevation: 24, shadowColor: '#000', shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12, shadowRadius: 16,
  },
  modalHandle: {
    width: 40, height: 4, borderRadius: 2, backgroundColor: '#DDDDDD',
    alignSelf: 'center', marginBottom: 20,
  },
  modalTitle:           { fontSize: 16, fontWeight: '800', color: '#232323', marginBottom: 16 },
  modalSep:             { height: 1, backgroundColor: '#F8F8F8' },
  modalItem:            { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, gap: 12 },
  modalItemActive:      { /* sem background para manter limpo */ },
  modalItemIcon:        {
    width: 36, height: 36, borderRadius: 10, backgroundColor: '#F8F8F8',
    alignItems: 'center', justifyContent: 'center',
  },
  modalItemIconActive:  { backgroundColor: '#FFEEEE' },
  modalItemLabel:       { flex: 1, fontSize: 14, fontWeight: '500', color: '#444444' },
  modalItemLabelActive: { fontWeight: '700', color: '#232323' },

  // Estado de sucesso
  successContainer: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    padding: 32, gap: 16,
  },
  successIcon:  {
    width: 100, height: 100, borderRadius: 50, backgroundColor: '#F0FDF4',
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  successTitle: { fontSize: 22, fontWeight: '800', color: '#232323', textAlign: 'center' },
  successText:  { fontSize: 14, color: '#666666', textAlign: 'center', lineHeight: 22 },
});
