import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, ActivityIndicator,
  TouchableOpacity, RefreshControl, StatusBar
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { buscarOcorrencias } from '../services/ocorrenciasService';
import { useFocusEffect } from '@react-navigation/native';

const STATUS_CONFIG = {
  aberta:       { label: 'Aberta',       color: '#EF1D26', bg: '#FFF0F0', icon: 'alert-circle' },
  em_analise:   { label: 'Em Análise',   color: '#C78A00', bg: '#FFF8E7', icon: 'time' },
  em_andamento: { label: 'Em Andamento', color: '#2563eb', bg: '#eff6ff', icon: 'construct' },
  resolvida:    { label: 'Resolvida',    color: '#16a34a', bg: '#f0fdf4', icon: 'checkmark-circle' },
  cancelada:    { label: 'Cancelada',    color: '#666666', bg: '#F8F8F8', icon: 'close-circle' },
  encerrada:    { label: 'Encerrada',    color: '#666666', bg: '#F8F8F8', icon: 'archive' },
};

const URGENCY_CONFIG = {
  baixa: { color: '#16a34a', bg: '#f0fdf4', label: 'Baixa' },
  media: { color: '#C78A00', bg: '#FFF8E7', label: 'Média' },
  alta:  { color: '#EF1D26', bg: '#FFF0F0', label: 'Alta' },
};

export default function MinhasOcorrenciasScreen({ navigation }) {
  const { usuario } = useAuth();
  const insets = useSafeAreaInsets();
  const [ocorrencias, setOcorrencias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filtro, setFiltro] = useState('todas');

  const carregarOcorrencias = async () => {
    try {
      if (!usuario) return;
      const data = await buscarOcorrencias();
      setOcorrencias(data || []);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { carregarOcorrencias(); }, [usuario]));

  const renderItem = ({ item }) => {
    const status = STATUS_CONFIG[item.status] || STATUS_CONFIG.aberta;
    const urgency = URGENCY_CONFIG[item.urgencia] || URGENCY_CONFIG.media;

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('DetalheOcorrencia', { ocorrenciaId: item.id })}
        activeOpacity={0.7}
      >
        <View style={[styles.strip, { backgroundColor: status.color }]} />

        <View style={styles.cardBody}>
          <View style={styles.cardTop}>
            <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
              <Ionicons name={status.icon} size={12} color={status.color} style={{ marginRight: 4 }} />
              <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
            </View>
            <Text style={styles.date}>{new Date(item.criado_em).toLocaleDateString('pt-BR')}</Text>
          </View>

          <Text style={styles.title} numberOfLines={2}>{item.titulo}</Text>

          <View style={styles.cardBottom}>
            <View style={styles.categoryRow}>
              <Ionicons name="pricetag-outline" size={12} color="#666666" style={{ marginRight: 4 }} />
              <Text style={styles.category}>{item.categorias?.nome || 'Sem categoria'}</Text>
            </View>
            <View style={[styles.urgencyBadge, { backgroundColor: urgency.bg }]}>
              <Text style={[styles.urgencyText, { color: urgency.color }]}>{urgency.label}</Text>
            </View>
          </View>
        </View>

        <Ionicons name="chevron-forward" size={18} color="#CCCCCC" style={styles.chevron} />
      </TouchableOpacity>
    );
  };

  const ocorrenciasFiltradas = filtro === 'minhas'
    ? ocorrencias.filter(o => o.usuario_id === usuario.id)
    : ocorrencias;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#232323" />

      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.headerTitle}>Mural de Ocorrências</Text>
        <Text style={styles.headerSub}>{ocorrenciasFiltradas.length} registros</Text>
        <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={[styles.toggleBtn, filtro === 'todas' && styles.toggleBtnActive]}
            onPress={() => setFiltro('todas')}
          >
            <Text style={[styles.toggleText, filtro === 'todas' && styles.toggleTextActive]}>Todas</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, filtro === 'minhas' && styles.toggleBtnActive]}
            onPress={() => setFiltro('minhas')}
          >
            <Text style={[styles.toggleText, filtro === 'minhas' && styles.toggleTextActive]}>Minhas</Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator style={{ flex: 1 }} size="large" color="#EF1D26" />
      ) : (
        <FlatList
          data={ocorrenciasFiltradas}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); carregarOcorrencias(); }}
              tintColor="#EF1D26"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="clipboard-outline" size={72} color="#DDDDDD" style={{ marginBottom: 16 }} />
              <Text style={styles.emptyTitle}>Nenhuma ocorrência ainda</Text>
              <Text style={styles.emptyText}>Suas ocorrências registradas aparecerão aqui.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F8F8' },
  header: {
    backgroundColor: '#232323', paddingHorizontal: 24, paddingBottom: 24,
  },
  headerTitle: { color: '#fff', fontSize: 22, fontWeight: '800', marginBottom: 4 },
  headerSub: { color: '#666666', fontSize: 13, marginBottom: 16 },
  toggleContainer: {
    flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 10, padding: 4,
  },
  toggleBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  toggleBtnActive: { backgroundColor: '#EF1D26' },
  toggleText: { color: '#999999', fontSize: 13, fontWeight: '600' },
  toggleTextActive: { color: '#fff', fontWeight: '800' },
  listContainer: { padding: 16, gap: 12 },
  card: {
    backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden',
    flexDirection: 'row', alignItems: 'center',
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 6,
  },
  strip: { width: 4, alignSelf: 'stretch' },
  cardBody: { flex: 1, padding: 16, gap: 8 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
  },
  statusText: { fontSize: 11, fontWeight: '700' },
  date: { fontSize: 12, color: '#999999' },
  title: { fontSize: 15, fontWeight: '700', color: '#232323' },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  categoryRow: { flexDirection: 'row', alignItems: 'center' },
  category: { fontSize: 12, color: '#666666' },
  urgencyBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  urgencyText: { fontSize: 11, fontWeight: '700' },
  chevron: { marginRight: 12 },
  emptyContainer: { flex: 1, paddingVertical: 80, alignItems: 'center', paddingHorizontal: 40 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#232323', marginBottom: 8 },
  emptyText: { textAlign: 'center', color: '#999999', fontSize: 14, lineHeight: 22 },
});
