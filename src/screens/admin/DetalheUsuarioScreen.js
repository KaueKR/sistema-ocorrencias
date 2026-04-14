import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  ActivityIndicator, Alert, StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { usePermissions } from '../../hooks/usePermissions';
import { buscarRoles, buscarSetores, atribuirRole } from '../../services/adminService';

const ROLE_META = {
  super_admin:         { label: 'Super Admin', color: '#7c3aed', bg: '#f3e8ff', icon: 'key' },
  admin_institucional: { label: 'Admin',       color: '#EF1D26', bg: '#FFF0F0', icon: 'shield-checkmark' },
  gestor_setor:        { label: 'Gestor',      color: '#ea580c', bg: '#fff7ed', icon: 'people' },
  tecnico:             { label: 'Técnico',     color: '#2563eb', bg: '#eff6ff', icon: 'construct' },
  professor:           { label: 'Professor',   color: '#16a34a', bg: '#f0fdf4', icon: 'book' },
  aluno:               { label: 'Aluno',       color: '#6b7280', bg: '#F3F4F6', icon: 'school' },
};

const ROLES_COM_SETOR = ['gestor_setor', 'tecnico'];

export default function DetalheUsuarioScreen({ navigation, route }) {
  const { usuario: usuarioAlvo } = route.params;
  const { usuario: usuarioAtual } = useAuth();
  const { canManageRole } = usePermissions();
  const insets = useSafeAreaInsets();

  const [roles, setRoles] = useState([]);
  const [setores, setSetores] = useState([]);
  const [selectedRoleId,   setSelectedRoleId]   = useState(null);
  const [selectedRoleNome, setSelectedRoleNome] = useState('');
  const [selectedSetorId,  setSelectedSetorId]  = useState(null);
  const [salvando, setSalvando] = useState(false);
  const [loading,  setLoading]  = useState(true);

  const roleAtual  = usuarioAlvo.role_principal;
  const metaAtual  = ROLE_META[roleAtual] || ROLE_META.aluno;
  const metaSelec  = ROLE_META[selectedRoleNome] || ROLE_META.aluno;
  const iniciais   = usuarioAlvo.nome_completo
    ?.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() || '?';

  const precisaSetor   = ROLES_COM_SETOR.includes(selectedRoleNome);
  const houveMudanca   = selectedRoleNome && selectedRoleNome !== roleAtual;
  const setorAtualNome = usuarioAlvo.perfil_roles
    ?.find(pr => pr.setores)?.setores?.nome;

  useEffect(() => {
    async function carregar() {
      try {
        const [rolesData, setoresData] = await Promise.all([buscarRoles(), buscarSetores()]);
        const rolesFiltradas = rolesData.filter(r => canManageRole(r.nivel));
        setRoles(rolesFiltradas);
        setSetores(setoresData);

        const current = rolesData.find(r => r.nome === roleAtual);
        if (current) { setSelectedRoleId(current.id); setSelectedRoleNome(current.nome); }

        const perfilRole = usuarioAlvo.perfil_roles?.find(pr => pr.setor_id);
        if (perfilRole?.setor_id) setSelectedSetorId(perfilRole.setor_id);
      } catch (e) {
        Alert.alert('Erro', 'Não foi possível carregar os dados.');
      } finally {
        setLoading(false);
      }
    }
    carregar();
  }, []);

  async function handleSalvar() {
    if (!selectedRoleId) return;
    if (precisaSetor && !selectedSetorId) {
      Alert.alert('Setor obrigatório', 'Selecione um setor para esta role.');
      return;
    }
    if (!houveMudanca && !(precisaSetor)) {
      Alert.alert('Sem alterações', 'Nenhuma alteração foi detectada.');
      return;
    }

    const roleNova = roles.find(r => r.id === selectedRoleId);
    const setorNovo = setores.find(s => s.id === selectedSetorId);

    Alert.alert(
      'Confirmar alteração',
      `Alterar o acesso de ${usuarioAlvo.nome_completo} para "${roleNova?.label}"${setorNovo ? ` · ${setorNovo.nome}` : ''}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async () => {
            setSalvando(true);
            try {
              await atribuirRole({
                perfilId: usuarioAlvo.id,
                roleId:   selectedRoleId,
                setorId:  precisaSetor ? selectedSetorId : null,
              });
              Alert.alert('Acesso atualizado', `${usuarioAlvo.nome_completo} agora é ${roleNova?.label}.`, [
                { text: 'OK', onPress: () => navigation.goBack() },
              ]);
            } catch (e) {
              Alert.alert('Erro ao salvar', e.message || 'Tente novamente.');
            } finally {
              setSalvando(false);
            }
          },
        },
      ]
    );
  }

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <StatusBar barStyle="light-content" backgroundColor="#1A1A1A" />
        <ActivityIndicator color="#EF1D26" size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1A1A1A" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerTextBlock}>
          <Text style={styles.headerTitle}>Editar Usuário</Text>
          <Text style={styles.headerSub}>Gerenciando nível de acesso</Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: 120 }]}
        showsVerticalScrollIndicator={false}
      >

        {/* ── Cartão do usuário com overlap no header ── */}
        <View style={styles.heroCard}>
          {/* Faixa de cor da role atual no topo do card */}
          <View style={[styles.heroStripe, { backgroundColor: metaAtual.color }]} />

          <View style={styles.heroBody}>
            {/* Avatar */}
            <View style={[styles.heroAvatarRing, { borderColor: metaAtual.color }]}>
              <View style={[styles.heroAvatar, { backgroundColor: metaAtual.bg }]}>
                <Text style={[styles.heroAvatarText, { color: metaAtual.color }]}>{iniciais}</Text>
              </View>
            </View>

            {/* Info */}
            <View style={styles.heroInfo}>
              <Text style={styles.heroName} numberOfLines={1}>
                {usuarioAlvo.nome_completo || 'Sem nome'}
              </Text>
              <View style={styles.heroTags}>
                <View style={[styles.heroRoleBadge, { backgroundColor: metaAtual.bg }]}>
                  <Ionicons name={metaAtual.icon} size={11} color={metaAtual.color} />
                  <Text style={[styles.heroRoleBadgeText, { color: metaAtual.color }]}>
                    {metaAtual.label}
                  </Text>
                </View>
                {setorAtualNome && (
                  <View style={styles.heroSetorBadge}>
                    <Ionicons name="business-outline" size={10} color="#888" />
                    <Text style={styles.heroSetorText}>{setorAtualNome}</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </View>

        {/* ── Preview da mudança ── */}
        {houveMudanca && (
          <View style={styles.changePreview}>
            <View style={[styles.changePill, { backgroundColor: metaAtual.bg }]}>
              <Text style={[styles.changePillText, { color: metaAtual.color }]}>
                {metaAtual.label}
              </Text>
            </View>
            <View style={styles.changeArrow}>
              <Ionicons name="arrow-forward" size={14} color="#999" />
            </View>
            <View style={[styles.changePill, { backgroundColor: metaSelec.bg }]}>
              <Ionicons name={metaSelec.icon} size={11} color={metaSelec.color} />
              <Text style={[styles.changePillText, { color: metaSelec.color }]}>
                {metaSelec.label}
              </Text>
            </View>
          </View>
        )}

        {/* ── Seleção de Role ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Nível de Acesso</Text>
          <Text style={styles.sectionDesc}>
            Selecione o tipo de acesso que este usuário terá no sistema.
          </Text>
        </View>

        {roles.length === 0 ? (
          <View style={styles.lockedCard}>
            <Ionicons name="lock-closed" size={22} color="#CCCCCC" />
            <Text style={styles.lockedText}>
              Você não tem autoridade para alterar este usuário.
            </Text>
          </View>
        ) : (
          <View style={styles.rolesGroup}>
            {roles.map((role, index) => {
              const isSelected    = selectedRoleId === role.id;
              const isCurrentRole = role.nome === roleAtual;
              const meta          = ROLE_META[role.nome] || ROLE_META.aluno;
              const isLast        = index === roles.length - 1;

              return (
                <TouchableOpacity
                  key={role.id}
                  style={[
                    styles.roleRow,
                    isSelected && styles.roleRowSelected,
                    isSelected && { borderLeftColor: meta.color },
                    !isLast && styles.roleRowBorder,
                  ]}
                  onPress={() => {
                    setSelectedRoleId(role.id);
                    setSelectedRoleNome(role.nome);
                    setSelectedSetorId(null);
                  }}
                  activeOpacity={0.7}
                >
                  {/* Radio button */}
                  <View style={[styles.radio, isSelected && { borderColor: meta.color }]}>
                    {isSelected && (
                      <View style={[styles.radioDot, { backgroundColor: meta.color }]} />
                    )}
                  </View>

                  {/* Ícone */}
                  <View style={[styles.roleIconBox, { backgroundColor: meta.bg }]}>
                    <Ionicons name={meta.icon} size={17} color={meta.color} />
                  </View>

                  {/* Texto */}
                  <View style={styles.roleTextBlock}>
                    <View style={styles.roleTitleRow}>
                      <Text style={[
                        styles.roleTitle,
                        isSelected && { color: meta.color },
                      ]}>
                        {role.label}
                      </Text>
                      {isCurrentRole && (
                        <View style={styles.currentBadge}>
                          <Text style={styles.currentBadgeText}>atual</Text>
                        </View>
                      )}
                    </View>
                    {role.descricao ? (
                      <Text style={styles.roleDesc} numberOfLines={1}>
                        {role.descricao}
                      </Text>
                    ) : null}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* ── Seleção de Setor (condicional) ── */}
        {precisaSetor && (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Setor Responsável</Text>
              <Text style={styles.sectionDesc}>
                Indique o setor ao qual este usuário ficará vinculado.
              </Text>
            </View>

            {setores.length === 0 ? (
              <View style={styles.lockedCard}>
                <Text style={styles.lockedText}>
                  Nenhum setor cadastrado. Crie setores antes de atribuir esta role.
                </Text>
              </View>
            ) : (
              <View style={styles.rolesGroup}>
                {setores.map((setor, index) => {
                  const isSelected = selectedSetorId === setor.id;
                  const isLast     = index === setores.length - 1;

                  return (
                    <TouchableOpacity
                      key={setor.id}
                      style={[
                        styles.roleRow,
                        isSelected && styles.roleRowSelected,
                        isSelected && { borderLeftColor: '#2563eb' },
                        !isLast && styles.roleRowBorder,
                      ]}
                      onPress={() => setSelectedSetorId(setor.id)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.radio, isSelected && { borderColor: '#2563eb' }]}>
                        {isSelected && (
                          <View style={[styles.radioDot, { backgroundColor: '#2563eb' }]} />
                        )}
                      </View>

                      <View style={[styles.roleIconBox, { backgroundColor: '#eff6ff' }]}>
                        <Ionicons name="business" size={17} color="#2563eb" />
                      </View>

                      <View style={styles.roleTextBlock}>
                        <Text style={[styles.roleTitle, isSelected && { color: '#2563eb' }]}>
                          {setor.nome}
                        </Text>
                        {setor.descricao ? (
                          <Text style={styles.roleDesc} numberOfLines={1}>
                            {setor.descricao}
                          </Text>
                        ) : null}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </>
        )}

      </ScrollView>

      {/* ── Barra de ação fixa no rodapé ── */}
      {roles.length > 0 && (
        <View style={[styles.bottomBar, { paddingBottom: insets.bottom || 20 }]}>
          <TouchableOpacity
            style={[
              styles.saveBtn,
              (!houveMudanca && !precisaSetor) && styles.saveBtnDim,
              salvando && { opacity: 0.65 },
            ]}
            onPress={handleSalvar}
            disabled={salvando}
            activeOpacity={0.85}
          >
            {salvando ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons
                  name={houveMudanca ? 'checkmark-circle' : 'save-outline'}
                  size={18}
                  color="#fff"
                />
                <Text style={styles.saveBtnText}>
                  {houveMudanca ? `Confirmar → ${metaSelec.label}` : 'Salvar Alterações'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
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
    paddingBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTextBlock: { alignItems: 'center' },
  headerTitle: { color: '#fff', fontSize: 17, fontWeight: '800' },
  headerSub:   { color: 'rgba(255,255,255,0.45)', fontSize: 11, marginTop: 2 },

  content: { padding: 16, gap: 16 },

  /* ── Hero card ── */
  heroCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08, shadowRadius: 10,
    marginTop: -4,
  },
  heroStripe: { height: 5 },
  heroBody: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16, gap: 14,
  },
  heroAvatarRing: {
    width: 66, height: 66, borderRadius: 33,
    borderWidth: 2.5,
    alignItems: 'center', justifyContent: 'center',
  },
  heroAvatar: {
    width: 56, height: 56, borderRadius: 28,
    alignItems: 'center', justifyContent: 'center',
  },
  heroAvatarText: { fontSize: 20, fontWeight: '800' },
  heroInfo: { flex: 1, gap: 6 },
  heroName: { fontSize: 16, fontWeight: '800', color: '#1A1A1A' },
  heroTags: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  heroRoleBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 9, paddingVertical: 4, borderRadius: 20,
  },
  heroRoleBadgeText: { fontSize: 11, fontWeight: '700' },
  heroSetorBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20,
  },
  heroSetorText: { fontSize: 11, color: '#777', fontWeight: '500' },

  /* ── Preview de mudança ── */
  changePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 9,
    gap: 8,
    elevation: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4,
  },
  changePill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
  },
  changePillText: { fontSize: 12, fontWeight: '700' },
  changeArrow: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: '#F5F5F5',
    alignItems: 'center', justifyContent: 'center',
  },

  /* ── Section labels ── */
  section: { gap: 3, marginBottom: -4 },
  sectionTitle: { fontSize: 13, fontWeight: '800', color: '#1A1A1A' },
  sectionDesc:  { fontSize: 12, color: '#999', lineHeight: 17 },

  /* ── Role list ── */
  rolesGroup: {
    backgroundColor: '#fff',
    borderRadius: 16, overflow: 'hidden',
    elevation: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4,
  },
  roleRow: {
    flexDirection: 'row', alignItems: 'center',
    padding: 14, gap: 12,
    borderLeftWidth: 3, borderLeftColor: 'transparent',
  },
  roleRowBorder:   { borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  roleRowSelected: { backgroundColor: '#FAFAFA' },

  radio: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 2, borderColor: '#CCCCCC',
    alignItems: 'center', justifyContent: 'center',
  },
  radioDot: { width: 9, height: 9, borderRadius: 5 },

  roleIconBox: {
    width: 38, height: 38, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  roleTextBlock: { flex: 1 },
  roleTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 2 },
  roleTitle: { fontSize: 14, fontWeight: '700', color: '#1A1A1A' },
  roleDesc:  { fontSize: 11, color: '#999', lineHeight: 15 },

  currentBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8,
  },
  currentBadgeText: { fontSize: 10, fontWeight: '700', color: '#16a34a' },

  /* ── Locked state ── */
  lockedCard: {
    backgroundColor: '#fff', borderRadius: 16,
    padding: 20, alignItems: 'center', gap: 10,
  },
  lockedText: {
    fontSize: 13, color: '#999', textAlign: 'center', lineHeight: 18,
  },

  /* ── Bottom bar ── */
  bottomBar: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1, borderTopColor: '#EEEEEE',
    elevation: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.06, shadowRadius: 10,
  },
  saveBtn: {
    backgroundColor: '#EF1D26',
    borderRadius: 14, paddingVertical: 15,
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 8,
    elevation: 2,
    shadowColor: '#EF1D26', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25, shadowRadius: 8,
  },
  saveBtnDim: { backgroundColor: '#232323' },
  saveBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
});
