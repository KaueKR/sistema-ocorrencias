import React, { useState, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  FlatList, ActivityIndicator, StatusBar, ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { buscarUsuarios } from '../../services/adminService';

// 1. Metadados com as descrições completas (Demanda do Kauê para não cortar texto)
const ROLE_META = {
  super_admin: { 
    label: 'Super Admin', color: '#7c3aed', bg: '#f3e8ff', icon: 'key',
    desc: 'Acesso total ao sistema. Pode gerenciar permissões críticas, configurar setores e visualizar logs de auditoria global.'
  },
  admin_institucional: { 
    label: 'Admin', color: '#EF1D26', bg: '#FFF0F0', icon: 'shield-checkmark',
    desc: 'Gestão administrativa da unidade. Pode criar usuários, visualizar relatórios e monitorar o status de todas as ocorrências.'
  },
  gestor_setor: { 
    label: 'Gestor', color: '#ea580c', bg: '#fff7ed', icon: 'people',
    desc: 'Responsável por um setor específico. Valida ocorrências enviadas por professores e alunos antes de encaminhar aos técnicos.'
  },
  tecnico: { 
    label: 'Técnico', color: '#2563eb', bg: '#eff6ff', icon: 'construct',
    desc: 'Profissional de campo. Recebe ordens de serviço, atualiza o status de reparo e anexa fotos da resolução do problema.'
  },
  professor: { 
    label: 'Professor', color: '#16a34a', bg: '#f0fdf4', icon: 'book',
    desc: 'Pode abrir ocorrências com prioridade e acompanhar o histórico de manutenção das salas e laboratórios sob sua responsabilidade.'
  },
  aluno: { 
    label: 'Aluno', color: '#6b7280', bg: '#F3F4F6', icon: 'school',
    desc: 'Usuário padrão. Pode reportar problemas de infraestrutura e acompanhar o progresso das suas solicitações abertas.'
  },
};

const FILTROS = [
  { key: null, label: 'Todos' },
  { key: 'aluno', label: 'Alunos' },
  { key: 'professor', label: 'Professores' },
  { key: 'tecnico', label: 'Técnicos' },
  { key: 'gestor_setor', label: 'Gestores' },
  { key: 'admin_institucional', label: 'Admins' },
  { key: 'super_admin', label: 'Super Admins' },
];

function UserCard({ item, onPress }) {
  const iniciais = item.nome_completo?.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() || '?';
  const meta = ROLE_META[item.role_principal] || ROLE_META.aluno;
  const setor = item.perfil_roles?.find(pr => pr.setores)?.setores?.nome;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.72}>
      <View style={[styles.cardAccent, { backgroundColor: meta.color }]} />
      <View style={[styles.cardAvatar, { backgroundColor: meta.bg }]}>
        <Text style={[styles.cardAvatarText, { color: meta.color }]}>{iniciais}</Text>
      </View>
      <View style={styles.cardInfo}>
        <Text style={styles.cardName} numberOfLines={1}>{item.nome_completo || 'Sem nome'}</Text>
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
      <View style={styles.cardRight}><Ionicons name="chevron-forward" size={15} color="#CCCCCC" /></View>
    </TouchableOpacity>
  );
}

export default function GestaoUsuariosScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [todosUsuarios, setTodosUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [filtroRole, setFiltroRole] = useState(null);

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const data = await buscarUsuarios({ busca });
      setTodosUsuarios(data || []);
    } catch (e) {
      console.error('Erro ao buscar usuários:', e);
    } finally {
      setLoading(false);
    }
  }, [busca]);

  useFocusEffect(useCallback(() => {
    const timer = setTimeout(carregar, 350);
    return () => clearTimeout(timer);
  }, [carregar]));

  const usuarios = useMemo(() => {
    if (!filtroRole) return todosUsuarios;
    return todosUsuarios.filter(u => u.role_principal === filtroRole);
  }, [todosUsuarios, filtroRole]);

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

      {/* Header Fixo */}
      <View style={[styles.header, { paddingTop: insets.top + 14 }]}>
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Gestão de Usuários</Text>
            <View style={styles.countBadge}><Text style={styles.countBadgeText}>{contagem.total}</Text></View>
          </View>
          <View style={{ width: 36 }} />
        </View>

        <View style={styles.searchBar}>
          <Ionicons name="search" size={16} color="#888" />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por nome..."
            placeholderTextColor="#888"
            value={busca}
            onChangeText={setBusca}
          />
        </View>
      </View>

      {/* 2. Filtros Redesenhados (Scroll Horizontal) */}
      <View style={styles.filtersContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersRow}>
          {FILTROS.map(f => {
            const isActive = filtroRole === f.key;
            const meta = f.key ? ROLE_META[f.key] : null;
            return (
              <TouchableOpacity
                key={String(f.key)}
                style={[styles.chip, isActive && { backgroundColor: meta?.color || '#EF1D26', borderColor: 'transparent' }]}
                onPress={() => setFiltroRole(f.key)}
              >
                <Text style={[styles.chipLabel, isActive && styles.chipLabelActive]}>{f.label}</Text>
                <View style={[styles.chipCount, isActive && styles.chipCountActive]}>
                  <Text style={[styles.chipCountText, isActive && styles.chipCountTextActive]}>
                    {f.key === null ? contagem.total : (contagem[f.key] || 0)}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* 3. Caixa de Orientação Dinâmica (Resolve o problema do texto cortado) */}
      {filtroRole && (
        <View style={styles.infoWrapper}>
          <View style={[styles.infoCard, { borderLeftColor: ROLE_META[filtroRole].color }]}>
            <View style={styles.infoTextColumn}>
              <Text style={[styles.infoTitle, { color: ROLE_META[filtroRole].color }]}>
                Nível: {ROLE_META[filtroRole].label}
              </Text>
              <Text style={styles.infoBody}>{ROLE_META[filtroRole].desc}</Text>
            </View>
            <View style={[styles.infoIconCircle, { backgroundColor: ROLE_META[filtroRole].bg }]}>
                <Ionicons name={ROLE_META[filtroRole].icon} size={18} color={ROLE_META[filtroRole].color} />
            </View>
          </View>
        </View>
      )}

      {loading ? (
        <View style={styles.loadingState}><ActivityIndicator color="#EF1D26" size="large" /></View>
      ) : (
        <FlatList
          data={usuarios}
          keyExtractor={item => item.id}
          renderItem={({ item }) => <UserCard item={item} onPress={() => navigation.navigate('DetalheUsuario', { usuario: item })} />}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F6F8' },
  header: { backgroundColor: '#1A1A1A', paddingHorizontal: 16, paddingBottom: 20 },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 15 },
  backBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: '800' },
  countBadge: { backgroundColor: '#EF1D26', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 },
  countBadgeText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  searchBar: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#262626', borderRadius: 12, paddingHorizontal: 15, paddingVertical: 12 },
  searchInput: { flex: 1, color: '#fff', fontSize: 15 },

  // Estilos dos Filtros
  filtersContainer: { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#EEEEEE' },
  filtersRow: { paddingHorizontal: 16, paddingVertical: 14, gap: 10 },
  chip: { 
    flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, 
    paddingVertical: 8, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E0E0E0' 
  },
  chipLabel: { fontSize: 13, fontWeight: '700', color: '#666' },
  chipLabelActive: { color: '#fff' },
  chipCount: { backgroundColor: '#F0F0F0', borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2 },
  chipCountActive: { backgroundColor: 'rgba(255,255,255,0.25)' },
  chipCountText: { fontSize: 11, fontWeight: 'bold', color: '#888' },
  chipCountTextActive: { color: '#fff' },

  // Estilos da Caixa de Orientação
  infoWrapper: { paddingHorizontal: 16, marginTop: 15, marginBottom: 5 },
  infoCard: { 
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', 
    padding: 16, borderRadius: 15, borderLeftWidth: 6,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 5, elevation: 3
  },
  infoTextColumn: { flex: 1, paddingRight: 10 },
  infoTitle: { fontSize: 12, fontWeight: '900', textTransform: 'uppercase', marginBottom: 4, letterSpacing: 0.5 },
  infoBody: { fontSize: 13, color: '#4A5568', lineHeight: 19 },
  infoIconCircle: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },

  listContent: { padding: 16, paddingTop: 10, paddingBottom: 40 },
  card: { backgroundColor: '#fff', borderRadius: 16, flexDirection: 'row', alignItems: 'center', elevation: 2, overflow: 'hidden' },
  cardAccent: { width: 5, alignSelf: 'stretch' },
  cardAvatar: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', margin: 12 },
  cardAvatarText: { fontSize: 16, fontWeight: 'bold' },
  cardInfo: { flex: 1, paddingVertical: 15 },
  cardName: { fontSize: 15, fontWeight: '700', color: '#1A1A1A', marginBottom: 6 },
  cardTags: { flexDirection: 'row', gap: 6 },
  roleTag: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  roleDot: { width: 6, height: 6, borderRadius: 3 },
  roleTagText: { fontSize: 11, fontWeight: '800' },
  setorTag: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#F1F3F5', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  setorTagText: { fontSize: 11, color: '#666', fontWeight: '600' },
  cardRight: { paddingRight: 15 },
  loadingState: { flex: 1, justifyContent: 'center' },
});