import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, 
  Alert, ActivityIndicator, StatusBar
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { atribuirRole } from '../../services/adminService';

const ROLE_OPTIONS = [
  { key: 'aluno', label: 'Aluno', color: '#6b7280', bg: '#F3F4F6', icon: 'school', desc: 'Acesso padrão. Pode reportar problemas de infraestrutura e acompanhar suas solicitações.' },
  { key: 'professor', label: 'Professor', color: '#16a34a', bg: '#f0fdf4', icon: 'book', desc: 'Pode abrir ocorrências com prioridade e acompanhar a manutenção de salas e laboratórios.' },
  { key: 'tecnico', label: 'Técnico', color: '#2563eb', bg: '#eff6ff', icon: 'construct', desc: 'Profissional de campo. Recebe ordens, atualiza status e anexa fotos da resolução.' },
  { key: 'gestor_setor', label: 'Gestor', color: '#ea580c', bg: '#fff7ed', icon: 'people', desc: 'Responsável por validar ocorrências e gerenciar a equipe técnica de um setor.' },
  { key: 'admin_institucional', label: 'Admin', color: '#EF1D26', bg: '#FFF0F0', icon: 'shield-checkmark', desc: 'Gestão administrativa. Pode criar usuários e monitorar todas as ocorrências da unidade.' },
  { key: 'super_admin', label: 'Super Admin', color: '#7c3aed', bg: '#f3e8ff', icon: 'key', desc: 'Acesso total. Controle de permissões críticas e configurações globais do sistema.' },
];

export default function DetalheUsuarioScreen({ route, navigation }) {
  const { usuario } = route.params;
  const insets = useSafeAreaInsets();
  
  const [roleSelecionada, setRoleSelecionada] = useState(usuario.role_principal || 'aluno');
  const [salvando, setSalvando] = useState(false);

  // Encontra os metadados da role atual para aplicar cores e descrições
  const metaAtual = ROLE_OPTIONS.find(r => r.key === roleSelecionada) || ROLE_OPTIONS[0];

  const handleSalvar = async () => {
    setSalvando(true);
    try {
      // Chamada para o adminService passando o ID e o NOME da role (string)
      await atribuirRole({ 
        perfilId: usuario.id, 
        roleNome: roleSelecionada 
      });
      
      Alert.alert("Sucesso", `O cargo de ${usuario.nome_completo} foi atualizado para ${metaAtual.label}.`);
      navigation.goBack();
    } catch (error) {
      console.error(error);
      Alert.alert("Erro", "Não foi possível atualizar o cargo. Verifique se você possui permissões de Super Admin.");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1A1A1A" />
      
      {/* Header Personalizado */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Perfil do Usuário</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
      >
        
        {/* Card Principal de Identificação */}
        <View style={styles.profileCard}>
          <View style={[styles.avatar, { backgroundColor: metaAtual.bg }]}>
            <Text style={[styles.avatarText, { color: metaAtual.color }]}>
              {usuario.nome_completo?.charAt(0).toUpperCase() || '?'}
            </Text>
          </View>
          <Text style={styles.userName}>{usuario.nome_completo}</Text>
          <Text style={styles.userEmail}>{usuario.email}</Text>
          
          <View style={[styles.currentBadge, { backgroundColor: metaAtual.bg }]}>
             <Text style={[styles.currentBadgeText, { color: metaAtual.color }]}>
                Nível Atual: {ROLE_OPTIONS.find(r => r.key === (usuario.role_principal || 'aluno'))?.label}
             </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Selecione o Novo Nível de Acesso</Text>
        
        {/* Grade de Seleção (Grid) */}
        <View style={styles.rolesGrid}>
          {ROLE_OPTIONS.map((role) => {
            const isSelected = roleSelecionada === role.key;
            return (
              <TouchableOpacity
                key={role.key}
                onPress={() => setRoleSelecionada(role.key)}
                activeOpacity={0.8}
                style={[
                  styles.roleItem,
                  isSelected && { borderColor: role.color, backgroundColor: role.bg }
                ]}
              >
                <Ionicons 
                  name={role.icon} 
                  size={22} 
                  color={isSelected ? role.color : '#94A3B8'} 
                />
                <Text style={[
                  styles.roleLabel, 
                  isSelected && { color: role.color }
                ]}>
                  {role.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Caixa de Orientação Dinâmica (Resolve o problema do texto cortado) */}
        <View style={[styles.descCard, { borderLeftColor: metaAtual.color }]}>
          <View style={styles.descHeader}>
            <Ionicons name="information-circle" size={20} color={metaAtual.color} />
            <Text style={[styles.descTitle, { color: metaAtual.color }]}>Responsabilidades do Nível</Text>
          </View>
          <Text style={styles.descText}>{metaAtual.desc}</Text>
        </View>

        {/* Espaçador para o teclado/botão fixo */}
        <View style={{ height: 120 }} />

      </ScrollView>

      {/* Botão de Ação Fixo */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity 
          style={[
            styles.saveBtn, 
            { backgroundColor: metaAtual.color },
            roleSelecionada === usuario.role_principal && styles.saveBtnDisabled
          ]} 
          onPress={handleSalvar}
          disabled={salvando || roleSelecionada === usuario.role_principal}
        >
          {salvando ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="save-outline" size={20} color="#fff" />
              <Text style={styles.saveBtnText}>Salvar Alterações</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { 
    backgroundColor: '#1A1A1A', 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 16, 
    paddingBottom: 20 
  },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  backBtn: { 
    width: 40, 
    height: 40, 
    borderRadius: 12, 
    alignItems: 'center', 
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)'
  },

  scrollContent: { padding: 20 },

  profileCard: { 
    alignItems: 'center', 
    backgroundColor: '#fff', 
    borderRadius: 24, 
    padding: 24, 
    marginBottom: 25,
    elevation: 4,
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10
  },
  avatar: { width: 90, height: 90, borderRadius: 45, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  avatarText: { fontSize: 36, fontWeight: '800' },
  userName: { fontSize: 22, fontWeight: '800', color: '#1A1A1A', marginBottom: 4 },
  userEmail: { fontSize: 14, color: '#64748B', marginBottom: 16 },
  currentBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  currentBadgeText: { fontSize: 12, fontWeight: '700' },

  sectionTitle: { fontSize: 15, fontWeight: '800', color: '#1E293B', marginBottom: 16, marginLeft: 4, textTransform: 'uppercase', letterSpacing: 0.5 },

  rolesGrid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    justifyContent: 'space-between',
    marginBottom: 20 
  },
  roleItem: { 
    width: '48%', 
    backgroundColor: '#fff', 
    paddingVertical: 20, 
    paddingHorizontal: 10,
    borderRadius: 16, 
    alignItems: 'center', 
    borderWidth: 2, 
    borderColor: '#F1F5F9',
    marginBottom: 12,
    gap: 8
  },
  roleLabel: { fontSize: 14, fontWeight: '700', color: '#64748B' },

  descCard: { 
    backgroundColor: '#fff', 
    padding: 20, 
    borderRadius: 18, 
    borderLeftWidth: 6,
    elevation: 3,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5
  },
  descHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  descTitle: { fontSize: 12, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5 },
  descText: { fontSize: 14, color: '#475569', lineHeight: 22 },

  footer: { 
    position: 'absolute', 
    bottom: 0, 
    left: 0, 
    right: 0, 
    backgroundColor: '#fff', 
    padding: 16, 
    borderTopWidth: 1, 
    borderTopColor: '#F1F5F9',
    elevation: 10
  },
  saveBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    height: 58, 
    borderRadius: 18, 
    gap: 10 
  },
  saveBtnDisabled: { opacity: 0.4 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});