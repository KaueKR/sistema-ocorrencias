import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, StatusBar, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { usePermissions } from '../hooks/usePermissions';

const MENU_ITEMS = [
  { icon: 'person-outline',      label: 'Meus Dados',    route: 'MeusDados'    },
  { icon: 'lock-closed-outline', label: 'Alterar Senha', route: 'AlterarSenha' },
  { icon: 'help-circle-outline', label: 'Suporte',       route: 'Suporte'      },
];

const ROLE_LABELS = {
  super_admin:         'Super Admin',
  admin_institucional: 'Administrador',
  gestor_setor:        'Gestor de Setor',
  tecnico:             'Técnico',
  professor:           'Professor',
  aluno:               'Aluno',
};

export default function PerfilScreen({ navigation }) {
  const { usuario, sair, roles } = useAuth();
  const { isAdmin } = usePermissions();
  const insets = useSafeAreaInsets();

  const nomeCompleto = usuario?.user_metadata?.nome_completo || 'Usuário';
  const email = usuario?.email || '';
  const roleAtual = roles[0]?.nome || 'aluno';
  const tipoLabel = ROLE_LABELS[roleAtual] || 'Usuário';
  const iniciais = nomeCompleto.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();

  const handleSair = () => {
    Alert.alert('Sair', 'Tem certeza que deseja desconectar?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: sair },
    ]);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#232323" />

      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <View style={styles.avatarWrapper}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{iniciais}</Text>
          </View>
          <View style={styles.onlineDot} />
        </View>
        <Text style={styles.name}>{nomeCompleto}</Text>
        <Text style={styles.email}>{email}</Text>
        <View style={styles.badge}>
          <Ionicons name="shield-checkmark" size={12} color="#EF1D26" style={{ marginRight: 4 }} />
          <Text style={styles.badgeText}>{tipoLabel}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.menuGroup}>
          {MENU_ITEMS.map((item, i) => (
            <TouchableOpacity key={i} style={styles.menuItem} activeOpacity={0.7} onPress={() => navigation.navigate(item.route)}>
              <View style={styles.menuIconWrapper}>
                <Ionicons name={item.icon} size={20} color="#EF1D26" />
              </View>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={18} color="#CCCCCC" />
            </TouchableOpacity>
          ))}
        </View>

        {isAdmin && (
          <View style={[styles.menuGroup, { marginTop: 16 }]}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => navigation.navigate('GestaoUsuarios')}
              activeOpacity={0.7}
            >
              <View style={[styles.menuIconWrapper, { backgroundColor: '#f3e8ff' }]}>
                <Ionicons name="shield-outline" size={20} color="#7c3aed" />
              </View>
              <Text style={styles.menuLabel}>Painel Administrativo</Text>
              <Ionicons name="chevron-forward" size={18} color="#CCCCCC" />
            </TouchableOpacity>
          </View>
        )}

        <View style={[styles.menuGroup, { marginTop: 16 }]}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('Creditos')}
            activeOpacity={0.7}
          >
            <View style={[styles.menuIconWrapper, { backgroundColor: '#FFF8E7' }]}>
              <Ionicons name="star-outline" size={20} color="#C47A00" />
            </View>
            <Text style={styles.menuLabel}>Créditos</Text>
            <Ionicons name="chevron-forward" size={18} color="#CCCCCC" />
          </TouchableOpacity>
        </View>

        <View style={[styles.menuGroup, { marginTop: 16 }]}>
          <TouchableOpacity style={styles.menuItem} onPress={handleSair} activeOpacity={0.7}>
            <View style={[styles.menuIconWrapper, { backgroundColor: '#FFF0F0' }]}>
              <Ionicons name="log-out-outline" size={20} color="#EF1D26" />
            </View>
            <Text style={[styles.menuLabel, { color: '#EF1D26' }]}>Sair da Conta</Text>
            <Ionicons name="chevron-forward" size={18} color="#FFBBBB" />
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Sistema de Ocorrências • v1.0.0</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F8F8' },
  header: {
    backgroundColor: '#232323', alignItems: 'center',
    paddingBottom: 32, paddingHorizontal: 20,
  },
  avatarWrapper: { position: 'relative', marginBottom: 14 },
  avatar: {
    width: 84, height: 84, borderRadius: 42, backgroundColor: '#EF1D26',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: 'rgba(255,255,255,0.15)',
  },
  avatarText: { fontSize: 30, color: '#fff', fontWeight: '800' },
  onlineDot: {
    position: 'absolute', bottom: 2, right: 2,
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: '#22c55e', borderWidth: 2, borderColor: '#232323',
  },
  name: { color: '#fff', fontSize: 20, fontWeight: '800', marginBottom: 4 },
  email: { color: '#666666', fontSize: 13, marginBottom: 12 },
  badge: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(239,29,38,0.15)', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
  },
  badgeText: { color: '#EF1D26', fontSize: 12, fontWeight: '600' },
  content: { padding: 20, paddingBottom: 40 },
  menuGroup: {
    backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden',
    elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4,
  },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', padding: 16,
    borderBottomWidth: 1, borderBottomColor: '#F8F8F8', gap: 14,
  },
  menuIconWrapper: {
    width: 38, height: 38, borderRadius: 10, backgroundColor: '#FFEEEE',
    alignItems: 'center', justifyContent: 'center',
  },
  menuLabel: { flex: 1, fontSize: 15, fontWeight: '600', color: '#232323' },
  footer: { alignItems: 'center', marginTop: 32 },
  footerText: { fontSize: 12, color: '#999999' },
});
