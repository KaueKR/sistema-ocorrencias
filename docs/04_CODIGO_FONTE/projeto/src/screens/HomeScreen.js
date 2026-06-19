import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator,
  ScrollView, RefreshControl, StatusBar, Image
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import { buscarOcorrencias } from '../services/ocorrenciasService';
import { useFocusEffect } from '@react-navigation/native';

const STATUS_CONFIG = {
  aberta:      { color: '#EF1D26', bg: '#FFF0F0', icon: 'alert-circle' },
  em_analise:  { color: '#C78A00', bg: '#FFF8E7', icon: 'time' },
  em_andamento:{ color: '#2563eb', bg: '#eff6ff', icon: 'construct' },
  resolvida:   { color: '#16a34a', bg: '#f0fdf4', icon: 'checkmark-circle' },
  cancelada:   { color: '#666666', bg: '#F8F8F8', icon: 'close-circle' },
  encerrada:   { color: '#666666', bg: '#F8F8F8', icon: 'archive' },
};

export default function HomeScreen({ navigation }) {
  const { usuario, perfilCarregado } = useAuth();
  const { can } = usePermissions();
  const insets = useSafeAreaInsets();
  const [ocorrencias, setOcorrencias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filtroAtivo, setFiltroAtivo] = useState('abertas');

  const carregarOcorrencias = async () => {
    try {
      if (!usuario || !perfilCarregado) return;
      const data = await buscarOcorrencias(null, can('ocorrencias.ver_restrito'));
      setOcorrencias(data || []);
    } catch (error) {
      console.log('Erro ao buscar dashboard:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Dispara assim que o perfil e as permissões terminam de carregar
  useEffect(() => {
    if (perfilCarregado && usuario) carregarOcorrencias();
  }, [perfilCarregado]);

  // Re-executa quando o usuário navega de volta para a tela
  useFocusEffect(useCallback(() => { carregarOcorrencias(); }, [perfilCarregado]));

  const onRefresh = () => { setRefreshing(true); carregarOcorrencias(); };

  const abertas = ocorrencias.filter(o => ['aberta', 'em_analise', 'em_andamento'].includes(o.status));
  const resolvidas = ocorrencias.filter(o => ['resolvida', 'encerrada'].includes(o.status));
  const firstName = usuario?.user_metadata?.nome_completo?.split(' ')[0] || 'Usuário';

  let ocorrenciasList = abertas;
  if (filtroAtivo === 'resolvidas') ocorrenciasList = resolvidas;

  const sectionTitle = filtroAtivo === 'abertas' ? 'Em Andamento' : 'Concluídas';

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#232323" />

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
          style={[styles.card, filtroAtivo === 'abertas' ? styles.cardRed : styles.cardWhite]}
          onPress={() => setFiltroAtivo('abertas')}
          activeOpacity={0.8}
        >
          <Ionicons name="time" size={22} color={filtroAtivo === 'abertas' ? '#fff' : '#C78A00'} style={{ marginBottom: 8 }} />
          <Text style={[styles.cardNumber, filtroAtivo === 'abertas' ? { color: '#fff' } : { color: '#C78A00' }]}>{abertas.length}</Text>
          <Text style={filtroAtivo === 'abertas' ? styles.cardLabelWhite : styles.cardLabelGray}>Em Aberto</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.card, filtroAtivo === 'resolvidas' ? styles.cardRed : styles.cardWhite]}
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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#EF1D26" />}
      >
        <TouchableOpacity
          style={styles.ctaButton}
          onPress={() => navigation.navigate('Nova Ocorrência')}
          activeOpacity={0.85}
        >
          <View style={styles.ctaLeft}>
            <View style={styles.ctaIcon}>
              <Ionicons name="add-circle" size={28} color="#EF1D26" />
            </View>
            <View>
              <Text style={styles.ctaTitle}>Registrar Ocorrência</Text>
              <Text style={styles.ctaSubtitle}>Relate um problema rapidamente</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#EF1D26" />
        </TouchableOpacity>

        {loading ? (
          <ActivityIndicator style={{ marginTop: 40 }} color="#EF1D26" />
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
                    <Image source={{ uri: photoUrl }} style={[styles.listItemIcon, { backgroundColor: '#EEEEEE' }]} />
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
  container: { flex: 1, backgroundColor: '#F8F8F8' },
  header: {
    backgroundColor: '#232323', paddingHorizontal: 24, paddingBottom: 56,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
  },
  greetingSmall: { color: '#999999', fontSize: 13, marginBottom: 4 },
  greetingName: { color: '#fff', fontSize: 22, fontWeight: '800' },
  avatarSmall: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: '#EF1D26',
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
  cardRed: { backgroundColor: '#EF1D26' },
  cardWhite: { backgroundColor: '#fff' },
  cardNumber: { fontSize: 22, fontWeight: '800', color: '#fff', marginBottom: 2 },
  cardLabelWhite: { fontSize: 11, color: 'rgba(255,255,255,0.8)', fontWeight: '500' },
  cardLabelGray: { fontSize: 11, color: '#666666', fontWeight: '500' },
  content: { paddingHorizontal: 20, paddingBottom: 30 },
  ctaButton: {
    backgroundColor: '#fff', borderRadius: 16, padding: 18, marginBottom: 28,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    elevation: 2, shadowColor: '#EF1D26', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 8, borderWidth: 1.5, borderColor: '#FFEEEE',
  },
  ctaLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  ctaIcon: {
    width: 48, height: 48, borderRadius: 14, backgroundColor: '#FFEEEE',
    alignItems: 'center', justifyContent: 'center',
  },
  ctaTitle: { fontSize: 15, fontWeight: '700', color: '#232323', marginBottom: 2 },
  ctaSubtitle: { fontSize: 12, color: '#666666' },
  listSection: {},
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#232323' },
  sectionLink: { fontSize: 13, color: '#EF1D26', fontWeight: '600' },
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
  itemTitle: { fontSize: 14, fontWeight: '700', color: '#232323', marginBottom: 3 },
  itemSub: { fontSize: 12, color: '#666666' },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  emptyState: { alignItems: 'center', paddingVertical: 40, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#232323' },
  emptySubtitle: { fontSize: 14, color: '#666666', textAlign: 'center', paddingHorizontal: 20 },
});
