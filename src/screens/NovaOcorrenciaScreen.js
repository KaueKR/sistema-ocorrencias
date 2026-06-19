import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView,
  ActivityIndicator, Image, Alert, KeyboardAvoidingView, Platform, StatusBar
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { buscarCategorias } from '../services/categoriasService';
import { criarOcorrencia } from '../services/ocorrenciasService';
import * as ImagePicker from 'expo-image-picker';

const URGENCY_OPTIONS = [
  { key: 'baixa', label: 'Baixa', icon: 'chevron-down-circle', color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
  { key: 'media', label: 'Média', icon: 'remove-circle',       color: '#C78A00', bg: '#FFF8E7', border: '#FFE4A0' },
  { key: 'alta',  label: 'Alta',  icon: 'arrow-up-circle',     color: '#EF1D26', bg: '#FFF0F0', border: '#FFBBBB' },
];

const ICON_MAP = {
  water: 'water', zap: 'flash', chair: 'bed', monitor: 'desktop',
  printer: 'print', wifi: 'wifi', trash: 'trash', user: 'person',
  'file-text': 'document-text', 'alert-circle': 'alert-circle',
};

export default function NovaOcorrenciaScreen({ navigation }) {
  const { usuario } = useAuth();
  const insets = useSafeAreaInsets();

  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [local, setLocal] = useState('');
  const [urgencia, setUrgencia] = useState('media');
  const [categorias, setCategorias] = useState([]);
  const [categoriaSelecionada, setCategoriaSelecionada] = useState(null);
  const [foto, setFoto] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetchingConfig, setFetchingConfig] = useState(true);
  const [erroInline, setErroInline] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        const catData = await buscarCategorias();
        setCategorias(catData || []);
      } catch {
        Alert.alert('Erro', 'Falha ao carregar categorias.');
      } finally {
        setFetchingConfig(false);
      }
    }
    loadData();
  }, []);

  const selecionarFoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permissão negada', 'Precisamos de acesso à galeria.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, quality: 0.7, base64: true });
    if (!result.canceled) setFoto({ uri: result.assets[0].uri, base64: result.assets[0].base64 });
  };

  const tirarFoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permissão negada', 'Precisamos de acesso à câmera.'); return; }
    const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 0.7, base64: true });
    if (!result.canceled) setFoto({ uri: result.assets[0].uri, base64: result.assets[0].base64 });
  };

  const handleSubmit = async () => {
    setErroInline('');
    if (!titulo || !descricao || !local || !categoriaSelecionada) {
      setErroInline('Preencha todos os campos obrigatórios e selecione uma categoria.');
      return;
    }
    setLoading(true);
    try {
      await criarOcorrencia(
        { titulo, descricao, local, urgencia, categoria_id: categoriaSelecionada.id },
        usuario.id,
        foto?.base64
      );
      // Navega primeiro — garante que funciona em qualquer plataforma.
      // No mobile exibe o Alert de confirmação após a navegação.
      if (Platform.OS === 'web') {
        navigation.goBack();
      } else {
        Alert.alert(
          'Sucesso!',
          'Sua ocorrência foi registrada e encaminhada ao setor responsável.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      }
    } catch (err) {
      const msg = err?.message || 'Erro desconhecido. Verifique sua conexão e tente novamente.';
      setErroInline(msg);
    } finally {
      setLoading(false);
    }
  };

  if (fetchingConfig) return <ActivityIndicator style={{ flex: 1 }} size="large" color="#EF1D26" />;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle="light-content" backgroundColor="#232323" />

      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.headerTitle}>Nova Ocorrência</Text>
        <Text style={styles.headerSub}>Preencha os dados do problema</Text>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>

        <View style={styles.section}>
          <View style={styles.labelRow}>
            <Ionicons name="alert-circle-outline" size={16} color="#EF1D26" style={{ marginRight: 6 }} />
            <Text style={styles.label}>O que aconteceu? <Text style={styles.required}>*</Text></Text>
          </View>
          <TextInput
            style={styles.input}
            placeholder="Ex: Vazamento no teto, Ar-condicionado quebrado..."
            placeholderTextColor="#999999"
            value={titulo}
            onChangeText={setTitulo}
          />
        </View>

        <View style={styles.section}>
          <View style={styles.labelRow}>
            <Ionicons name="location-outline" size={16} color="#EF1D26" style={{ marginRight: 6 }} />
            <Text style={styles.label}>Local do Problema <Text style={styles.required}>*</Text></Text>
          </View>
          <TextInput
            style={styles.input}
            placeholder="Ex: Laboratório 2, Banheiro Térreo..."
            placeholderTextColor="#999999"
            value={local}
            onChangeText={setLocal}
          />
        </View>

        <View style={styles.section}>
          <View style={styles.labelRow}>
            <Ionicons name="pricetag-outline" size={16} color="#EF1D26" style={{ marginRight: 6 }} />
            <Text style={styles.label}>Categoria e Setor <Text style={styles.required}>*</Text></Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingVertical: 4 }}>
            {categorias.map(cat => {
              const isSelected = categoriaSelecionada?.id === cat.id;
              const iconName = ICON_MAP[cat.icone] || 'alert-circle';
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.chip, isSelected && styles.chipSelected]}
                  onPress={() => setCategoriaSelecionada(cat)}
                >
                  <Ionicons name={iconName} size={14} color={isSelected ? '#fff' : '#666666'} style={{ marginRight: 6 }} />
                  <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>{cat.nome}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          {categoriaSelecionada && (
            <View style={styles.sectorInfo}>
              <Ionicons name="business-outline" size={14} color="#EF1D26" style={{ marginRight: 6 }} />
              <Text style={styles.sectorText}>Encaminhar para: <Text style={{ fontWeight: '700' }}>{categoriaSelecionada.setores?.nome}</Text></Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.labelRow}>
            <Ionicons name="flame-outline" size={16} color="#EF1D26" style={{ marginRight: 6 }} />
            <Text style={styles.label}>Nível de Urgência</Text>
          </View>
          <View style={styles.urgencyRow}>
            {URGENCY_OPTIONS.map(opt => {
              const isSelected = urgencia === opt.key;
              return (
                <TouchableOpacity
                  key={opt.key}
                  style={[
                    styles.urgencyBtn,
                    { borderColor: isSelected ? opt.color : '#DDDDDD' },
                    isSelected && { backgroundColor: opt.bg },
                  ]}
                  onPress={() => setUrgencia(opt.key)}
                >
                  <Ionicons name={opt.icon} size={20} color={isSelected ? opt.color : '#999999'} />
                  <Text style={[styles.urgencyText, isSelected && { color: opt.color, fontWeight: '700' }]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.labelRow}>
            <Ionicons name="document-text-outline" size={16} color="#EF1D26" style={{ marginRight: 6 }} />
            <Text style={styles.label}>Descrição Detalhada <Text style={styles.required}>*</Text></Text>
          </View>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Descreva com detalhes o que está acontecendo..."
            placeholderTextColor="#999999"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            value={descricao}
            onChangeText={setDescricao}
          />
        </View>

        <View style={styles.section}>
          <View style={styles.labelRow}>
            <Ionicons name="camera-outline" size={16} color="#EF1D26" style={{ marginRight: 6 }} />
            <Text style={styles.label}>Foto / Evidência <Text style={styles.optional}>(opcional)</Text></Text>
          </View>
          {foto ? (
            <View style={styles.fotoContainer}>
              <Image source={{ uri: foto.uri }} style={styles.fotoPreview} />
              <TouchableOpacity style={styles.removerFotoBtn} onPress={() => setFoto(null)}>
                <Ionicons name="close-circle" size={22} color="#fff" />
                <Text style={styles.removerFotoText}>Remover</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.fotoActions}>
              <TouchableOpacity style={styles.fotoBtn} onPress={tirarFoto}>
                <Ionicons name="camera" size={22} color="#EF1D26" />
                <Text style={styles.fotoBtnText}>Câmera</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.fotoBtn} onPress={selecionarFoto}>
                <Ionicons name="images" size={22} color="#EF1D26" />
                <Text style={styles.fotoBtnText}>Galeria</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {erroInline ? (
          <View style={styles.erroBanner}>
            <Ionicons name="alert-circle-outline" size={18} color="#EF1D26" />
            <Text style={styles.erroText}>{erroInline}</Text>
          </View>
        ) : null}

        <TouchableOpacity
          style={[styles.submitBtn, loading && { opacity: 0.7 }]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="#fff" /> : (
            <>
              <Ionicons name="send" size={18} color="#fff" style={{ marginRight: 10 }} />
              <Text style={styles.submitBtnText}>Abrir Ocorrência</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#232323', paddingHorizontal: 24, paddingBottom: 24,
  },
  headerTitle: { color: '#fff', fontSize: 22, fontWeight: '800', marginBottom: 4 },
  headerSub: { color: '#999999', fontSize: 13 },
  container: { flex: 1, backgroundColor: '#F8F8F8' },
  section: { paddingHorizontal: 20, marginTop: 24 },
  labelRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  label: { fontSize: 14, fontWeight: '600', color: '#232323' },
  required: { color: '#EF1D26' },
  optional: { color: '#999999', fontWeight: '400' },
  input: {
    backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#DDDDDD',
    borderRadius: 12, padding: 14, fontSize: 15, color: '#232323',
  },
  textArea: { height: 110 },
  chip: {
    backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#DDDDDD',
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20,
    flexDirection: 'row', alignItems: 'center',
  },
  chipSelected: { backgroundColor: '#EF1D26', borderColor: '#EF1D26' },
  chipText: { color: '#666666', fontSize: 13, fontWeight: '500' },
  chipTextSelected: { color: '#fff', fontWeight: '700' },
  sectorInfo: {
    flexDirection: 'row', alignItems: 'center', marginTop: 10,
    backgroundColor: '#FFEEEE', padding: 10, borderRadius: 10,
  },
  sectorText: { color: '#EF1D26', fontSize: 13 },
  urgencyRow: { flexDirection: 'row', gap: 10 },
  urgencyBtn: {
    flex: 1, backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#DDDDDD',
    padding: 14, borderRadius: 12, alignItems: 'center', gap: 6,
  },
  urgencyText: { fontSize: 13, color: '#999999', fontWeight: '500' },
  fotoActions: { flexDirection: 'row', gap: 12 },
  fotoBtn: {
    flex: 1, backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#DDDDDD',
    borderRadius: 12, padding: 18, alignItems: 'center', gap: 8, borderStyle: 'dashed',
  },
  fotoBtnText: { color: '#EF1D26', fontWeight: '600', fontSize: 14 },
  fotoContainer: { position: 'relative', width: '100%', height: 200, borderRadius: 12, overflow: 'hidden' },
  fotoPreview: { width: '100%', height: '100%', resizeMode: 'cover' },
  removerFotoBtn: {
    position: 'absolute', bottom: 12, right: 12,
    backgroundColor: 'rgba(0,0,0,0.65)', paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 6,
  },
  removerFotoText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  erroBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#FFF0F0', borderRadius: 12, padding: 14,
    marginHorizontal: 20, marginTop: 24,
    borderLeftWidth: 3, borderLeftColor: '#EF1D26',
  },
  erroText: { flex: 1, fontSize: 13, color: '#EF1D26', fontWeight: '500', lineHeight: 18 },
  submitBtn: {
    backgroundColor: '#EF1D26', margin: 20, marginTop: 16,
    padding: 18, borderRadius: 14, alignItems: 'center',
    flexDirection: 'row', justifyContent: 'center',
    elevation: 4, shadowColor: '#EF1D26', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8,
  },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
