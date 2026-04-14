import React, { useState, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  FlatList, ActivityIndicator, StatusBar, ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { buscarUsuarios } from '../../services/adminService';

const ROLE_META = {
  super_admin:         { label: 'Super Admin', color: '#7c3aed', bg: '#f3e8ff', icon: 'key' },
  admin_institucional: { label: 'Admin',       color: '#EF1D26', bg: '#FFF0F0', icon: 'shield-checkmark' },
  gestor_setor:        { label: 'Gestor',      color: '#ea580c', bg: '#fff7ed', icon: 'people' },
  tecnico:             { label: 'Técnico',     color: '#2563eb', bg: '#eff6ff', icon: 'construct' },
  professor:           { label: 'Professor',   color: '#16a34a', bg: '#f0fdf4', icon: 'book' },
  aluno:               { label: 'Aluno',       color: '#6b7280', bg: '#F3F4F6', icon: 'school' },
};

const FILTROS = [
  { key: null,                  label: 'Todos' },
  { key: 'aluno',               label: 'Alunos' },
  { key: 'professor',           label: 'Professores' },
  { key: 'tecnico',             label: 'Técnicos' },
  { key: 'gestor_setor',        label: 'Gestores' },
  { key: 'admin_institucional', label: 'Admins' },
  { key: 'super_admin',         label: 'Super Admins' },
];

function UserCard({ item, onPress }) {
  const iniciais = item.nome_completo
    ?.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() || '?';
  const meta = ROLE_META[item.role_principal] || ROLE_META.aluno;
  const setor = item.perfil_roles?.find(pr => pr.setores)?.setores?.nome;
  const dataCadastro = item.criado_em
    ? new Date(item.criado_em).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })
    : null;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.72}>
      {/* Barra de cor lateral indicando a role */}
      <View style={[styles.cardAccent, { backgroundColor: meta.color }]} />

      {/* Avatar */}
      <View style={[styles.cardAvatar, { backgroundColor: meta.bg }]}>
        <Text style={[styles.cardAvatarText, { color: meta.color }]}>{iniciais}</Text>
      </View>

      {/* Informações */}
      <View style={styles.cardInfo}>
        <Text style={styles.cardName} numberOfLines={1}>
          {item.nome_completo || 'Sem nome'}
        </Text>
        <View style={styles.cardTags}>
          <View style={[styles.roleTag, { backgroundColor: meta.bg }]}>
            <View style={[styles.roleDot, { backgroundColor: meta.color }]} />
            <Text style={[styles.roleTagText, { color: meta.color }]}>{meta.label}</Text>
          </View>
          {setor && (
            <View style={styles.setorTag}>
              <Ionicons name="business-outline" size={10} color="#999" />
              <Text style={styles.setorTagText} numberOfLines={1}>{setor}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Data + chevron */}
      <View style={styles.cardRight}>
        {dataCadastro && <Text style={styles.cardDate}>{dataCadastro}</Text>}
        <Ionicons name="chevron-forward" size={15} color="#CCCCCC" />
      </View>
    </TouchableOpacity>
  );
}

export default function GestaoUsuariosScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  // Todos os usuários sem filtro de role (fonte de verdade para contagens)
  const [todosUsuarios, setTodosUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [filtroRole, setFiltroRole] = useState(null);

  // Busca sempre sem filtro de role — o filtro é aplicado no cliente
  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const data = await buscarUsuarios({ busca });
      setTodosUsuarios(data);
    } catch (e) {
      console.error('Erro ao buscar usuários:', e);
    } finally {
      setLoading(false);
    }
  }, [busca]);

  useFocusEffect(
    useCallback(() => {
      const timer = setTimeout(carregar, 350);
      return () => clearTimeout(timer);
    }, [carregar])
  );

  // Filtro de role aplicado localmente — não dispara nova requisição
  const usuarios = useMemo(() => {
    if (!filtroRole) return todosUsuarios;
    return todosUsuarios.filter(u => u.role_principal === filtroRole);
  }, [todosUsuarios, filtroRole]);

  // Contagem sempre calculada sobre TODOS os usuários, independente do filtro ativo
  const contagem = useMemo(() => {
    const map = { total: todosUsuarios.length };
    todosUsuarios.forEach(u => {
      const k = u.role_principal || 'aluno';
      map[k] = (map[k] || 0) + 1;
    });
    return map;
  }, [todosUsuarios]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1A1A1A" />

      {/* Header com busca embutida */}
      <View style={[styles.header, { paddingTop: insets.top + 14 }]}>
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Usuários</Text>
            {!loading && (
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>{contagem.total}</Text>
              </View>
            )}
          </View>

          <View style={{ width: 36 }} />
        </View>

        {/* Search bar dentro do header */}
        <View style={styles.searchBar}>
          <Ionicons name="search" size={15} color="#888" />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por nome..."
            placeholderTextColor="#888"
            value={busca}
            onChangeText={setBusca}
            returnKeyType="search"
            selectionColor="#EF1D26"
          />
          {busca.length > 0 && (
            <TouchableOpacity onPress={() => setBusca('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-circle" size={16} color="#888" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Chips de filtro com contagem */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtersRow}
      >
        {FILTROS.map(f => {
          const isActive = filtroRole === f.key;
          const count = f.key === null ? contagem.total : (contagem[f.key] || 0);
          const meta = f.key ? ROLE_META[f.key] : null;

          return (
            <TouchableOpacity
              key={String(f.key)}
              style={[
                styles.chip,
                isActive && { backgroundColor: meta?.color || '#EF1D26', borderColor: 'transparent' },
              ]}
              onPress={() => setFiltroRole(f.key)}
              activeOpacity={0.7}
            >
              {meta && !isActive && (
                <View style={[styles.chipDot, { backgroundColor: meta.color }]} />
              )}
              <Text style={[styles.chipLabel, isActive && styles.chipLabelActive]}>
                {f.label}
              </Text>
              <View style={[styles.chipCount, isActive && styles.chipCountActive]}>
                <Text style={[styles.chipCountText, isActive && styles.chipCountTextActive]}>
                  {count}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Lista */}
      {loading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator color="#EF1D26" size="large" />
          <Text style={styles.loadingText}>Carregando usuários...</Text>
        </View>
      ) : (
        <FlatList
          data={usuarios}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <UserCard
              item={item}
              onPress={() => navigation.navigate('DetalheUsuario', { usuario: item })}
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View style={styles.emptyIconWrapper}>
                <Ionicons name="people-outline" size={30} color="#BBBBBB" />
              </View>
              <Text style={styles.emptyTitle}>Nenhum usuário encontrado</Text>
              <Text style={styles.emptySubtitle}>
                {busca
                  ? `Sem resultados para "${busca}"`
                  : 'Tente mudar o filtro selecionado'}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F2' },

  /* ── Header ── */
  header: {
    backgroundColor: '#1A1A1A',
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '800' },
  countBadge: {
    backgroundColor: '#EF1D26',
    borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2,
    minWidth: 26, alignItems: 'center',
  },
  countBadgeText: { color: '#fff', fontSize: 11, fontWeight: '800' },

  /* ── Search ── */
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  searchInput: { flex: 1, fontSize: 14, color: '#fff', padding: 0 },

  /* ── Filter chips ── */
  filtersRow: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 11, paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1.5, borderColor: '#E5E5E5',
  },
  chipDot: { width: 6, height: 6, borderRadius: 3 },
  chipLabel: { fontSize: 12, fontWeight: '600', color: '#444' },
  chipLabelActive: { color: '#fff' },
  chipCount: {
    backgroundColor: '#EFEFEF',
    borderRadius: 8, paddingHorizontal: 6, paddingVertical: 1,
    minWidth: 18, alignItems: 'center',
  },
  chipCountActive: { backgroundColor: 'rgba(255,255,255,0.22)' },
  chipCountText: { fontSize: 10, fontWeight: '700', color: '#777' },
  chipCountTextActive: { color: '#fff' },

  /* ── States ── */
  loadingState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { fontSize: 13, color: '#999', fontWeight: '500' },

  listContent: { padding: 16, paddingTop: 4, paddingBottom: 32 },

  emptyState: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyIconWrapper: {
    width: 68, height: 68, borderRadius: 34,
    backgroundColor: '#EBEBEB',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#1A1A1A' },
  emptySubtitle: { fontSize: 13, color: '#999', textAlign: 'center', lineHeight: 20 },

  /* ── User Card ── */
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    elevation: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4,
  },
  cardAccent: { width: 4, alignSelf: 'stretch' },
  cardAvatar: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
    margin: 12, marginRight: 10,
  },
  cardAvatarText: { fontSize: 15, fontWeight: '800' },
  cardInfo: { flex: 1, paddingVertical: 13 },
  cardName: { fontSize: 14, fontWeight: '700', color: '#1A1A1A', marginBottom: 5 },
  cardTags: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  roleTag: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20,
  },
  roleDot: { width: 5, height: 5, borderRadius: 3 },
  roleTagText: { fontSize: 11, fontWeight: '700' },
  setorTag: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 7, paddingVertical: 3, borderRadius: 20,
  },
  setorTagText: { fontSize: 11, color: '#777', fontWeight: '500', maxWidth: 90 },
  cardRight: {
    paddingRight: 14, alignItems: 'flex-end', gap: 4,
  },
  cardDate: { fontSize: 10, color: '#C0C0C0', fontWeight: '500' },
});
