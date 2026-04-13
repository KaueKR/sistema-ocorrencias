import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator,
  ScrollView, RefreshControl, StatusBar, Image
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { buscarOcorrencias } from '../services/ocorrenciasService';
import { useFocusEffect } from '@react-navigation/native';

const STATUS_CONFIG = {
  aberta:      { color: '#dc2626', bg: '#fef2f2', icon: 'alert-circle' },
  em_analise:  { color: '#d97706', bg: '#fffbeb', icon: 'time' },
  em_andamento:{ color: '#2563eb', bg: '#eff6ff', icon: 'construct' },
  resolvida:   { color: '#16a34a', bg: '#f0fdf4', icon: 'checkmark-circle' },
  cancelada:   { color: '#64748b', bg: '#f8fafc', icon: 'close-circle' },
  encerrada:   { color: '#64748b', bg: '#f8fafc', icon: 'archive' },
};

export default function HomeScreen({ navigation }) {
  const { usuario } = useAuth();
  const insets = useSafeAreaInsets();
  const [ocorrencias, setOcorrencias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filtroAtivo, setFiltroAtivo] = useState('abertas');

  const carregarOcorrencias = async () => {
    try {
      if (!usuario) return;
      const data = await buscarOcorrencias();
      setOcorrencias(data || []);
    } catch (error) {
      console.log('Erro ao buscar dashboard:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { carregarOcorrencias(); }, [usuario]));

  const onRefresh = () => { setRefreshing(true); carregarOcorrencias(); };

  const abertas = ocorrencias.filter(o => ['aberta', 'em_analise', 'em_andamento'].includes(o.status));
  const resolvidas = ocorrencias.filter(o => ['resolvida', 'encerrada'].includes(o.status));
  const firstName = usuario?.user_metadata?.nome_completo?.split(' ')[0] || 'Usuário';

  let ocorrenciasList = abertas;
  if (filtroAtivo === 'resolvidas') ocorrenciasList = resolvidas;

  const sectionTitle = filtroAtivo === 'abertas' ? 'Em Andamento' : 'Concluídas';

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />

      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View>
          <Text style={styles.greetingSmall}>Bem-vindo de volta 👋</Text>
          <Text style={styles.greetingName}>{firstName}</Text>
        </View>
        <View style={styles.avatarSmall}>
          <Text style={styles.avatarSmallText}>{firstName.substring(0, 1).toUpperCase()}</Text>
        </View>
      </View>

      <View style={styles.cardsRow}>
        <TouchableOpacity 
          style={[styles.card, filtroAtivo === 'abertas' ? styles.cardBlue : styles.cardWhite]} 
          onPress={() => setFiltroAtivo('abertas')} 
          activeOpacity={0.8}
        >
          <Ionicons name="time" size={22} color={filtroAtivo === 'abertas' ? '#fff' : '#d97706'} style={{ marginBottom: 8 }} />
          <Text style={[styles.cardNumber, filtroAtivo === 'abertas' ? { color: '#fff' } : { color: '#d97706' }]}>{abertas.length}</Text>
          <Text style={filtroAtivo === 'abertas' ? styles.cardLabelWhite : styles.cardLabelGray}>Em Aberto</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.card, filtroAtivo === 'resolvidas' ? styles.cardBlue : styles.cardWhite]} 
          onPress={() => setFiltroAtivo('resolvidas')} 
          activeOpacity={0.8}
        >
          <Ionicons name="checkmark-circle" size={22} color={filtroAtivo === 'resolvidas' ? '#fff' : '#16a34a'} style={{ marginBottom: 8 }} />
          <Text style={[styles.cardNumber, filtroAtivo === 'resolvidas' ? { color: '#fff' } : { color: '#16a34a' }]}>{resolvidas.length}</Text>
          <Text style={filtroAtivo === 'resolvidas' ? styles.cardLabelWhite : styles.cardLabelGray}>Resolvidas</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4361ee" />}
      >
        <TouchableOpacity
          style={styles.ctaButton}
          onPress={() => navigation.navigate('Nova Ocorrência')}
          activeOpacity={0.85}
        >
          <View style={styles.ctaLeft}>
            <View style={styles.ctaIcon}>
              <Ionicons name="add-circle" size={28} color="#4361ee" />
            </View>
            <View>
              <Text style={styles.ctaTitle}>Registrar Ocorrência</Text>
              <Text style={styles.ctaSubtitle}>Relate um problema rapidamente</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#4361ee" />
        </TouchableOpacity>

        {loading ? (
          <ActivityIndicator style={{ marginTop: 40 }} color="#4361ee" />
        ) : ocorrenciasList.length > 0 ? (
          <View style={styles.listSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{sectionTitle}</Text>
              <TouchableOpacity onPress={() => navigation.navigate('MinhasOcorrencias')}>
                <Text style={styles.sectionLink}>Ver todas</Text>
              </TouchableOpacity>
            </View>
            {ocorrenciasList.slice(0, 5).map((item) => {
              const cfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.aberta;
              const hasPhoto = item.fotos_ocorrencias && item.fotos_ocorrencias.length > 0;
              const photoUrl = hasPhoto ? item.fotos_ocorrencias[0].url : null;

              return (
                <TouchableOpacity
                  key={item.id}
                  style={styles.listItem}
                  onPress={() => navigation.navigate('DetalheOcorrencia', { ocorrenciaId: item.id })}
                  activeOpacity={0.7}
                >
                  {hasPhoto ? (
                    <Image source={{ uri: photoUrl }} style={[styles.listItemIcon, { backgroundColor: '#f1f5f9' }]} />
                  ) : (
                    <View style={[styles.listItemIcon, { backgroundColor: cfg.bg }]}>
                      <Ionicons name={cfg.icon} size={18} color={cfg.color} />
                    </View>
                  )}
                  <View style={styles.listItemContent}>
                    <Text style={styles.itemTitle} numberOfLines={1}>{item.titulo}</Text>
                    <Text style={styles.itemSub} numberOfLines={1}>
                      {item.categorias?.nome || 'Sem categoria'} · {new Date(item.criado_em).toLocaleDateString('pt-BR')}
                    </Text>
                  </View>
                  <View style={[styles.statusDot, { backgroundColor: cfg.color }]} />
                </TouchableOpacity>
              );
            })}
          </View>
        ) : !loading && (
          <View style={styles.emptyState}>
            <Ionicons name="checkmark-done-circle" size={64} color="#d1fae5" />
            <Text style={styles.emptyTitle}>Tudo calmo por aqui!</Text>
            <Text style={styles.emptySubtitle}>Não há ocorrências neste filtro.</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: {
    backgroundColor: '#1a1a2e', paddingHorizontal: 24, paddingBottom: 56,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
  },
  greetingSmall: { color: '#94a3b8', fontSize: 13, marginBottom: 4 },
  greetingName: { color: '#fff', fontSize: 22, fontWeight: '800' },
  avatarSmall: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: '#4361ee',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarSmallText: { color: '#fff', fontWeight: '800', fontSize: 18 },
  cardsRow: {
    flexDirection: 'row', gap: 12, paddingHorizontal: 20,
    marginTop: -36, marginBottom: 20,
  },
  card: {
    flex: 1, borderRadius: 16, padding: 16, alignItems: 'center',
    elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 8,
  },
  cardBlue: { backgroundColor: '#4361ee' },
  cardWhite: { backgroundColor: '#fff' },
  cardNumber: { fontSize: 22, fontWeight: '800', color: '#fff', marginBottom: 2 },
  cardLabelWhite: { fontSize: 11, color: 'rgba(255,255,255,0.8)', fontWeight: '500' },
  cardLabelGray: { fontSize: 11, color: '#64748b', fontWeight: '500' },
  content: { paddingHorizontal: 20, paddingBottom: 30 },
  ctaButton: {
    backgroundColor: '#fff', borderRadius: 16, padding: 18, marginBottom: 28,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    elevation: 2, shadowColor: '#4361ee', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 8, borderWidth: 1.5, borderColor: '#eef0ff',
  },
  ctaLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  ctaIcon: {
    width: 48, height: 48, borderRadius: 14, backgroundColor: '#eef0ff',
    alignItems: 'center', justifyContent: 'center',
  },
  ctaTitle: { fontSize: 15, fontWeight: '700', color: '#1e293b', marginBottom: 2 },
  ctaSubtitle: { fontSize: 12, color: '#64748b' },
  listSection: {},
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#1a1a2e' },
  sectionLink: { fontSize: 13, color: '#4361ee', fontWeight: '600' },
  listItem: {
    backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 10,
    flexDirection: 'row', alignItems: 'center', gap: 14,
    elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4,
  },
  listItemIcon: {
    width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
  },
  listItemContent: { flex: 1 },
  itemTitle: { fontSize: 14, fontWeight: '700', color: '#1e293b', marginBottom: 3 },
  itemSub: { fontSize: 12, color: '#64748b' },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  emptyState: { alignItems: 'center', paddingVertical: 40, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#1e293b' },
  emptySubtitle: { fontSize: 14, color: '#64748b', textAlign: 'center', paddingHorizontal: 20 },
});
