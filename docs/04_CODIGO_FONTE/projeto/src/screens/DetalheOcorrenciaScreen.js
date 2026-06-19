import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator, Image,
  TouchableOpacity, TextInput, Modal, Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import {
  buscarOcorrenciaId,
  atualizarStatusOcorrencia,
  excluirOcorrencia,
} from '../services/ocorrenciasService';

const STATUS_CONFIG = {
  aberta:       { label: 'Aberta',       color: '#EF1D26', bg: '#FFF0F0', icon: 'alert-circle' },
  em_analise:   { label: 'Em Análise',   color: '#C78A00', bg: '#FFF8E7', icon: 'time' },
  em_andamento: { label: 'Em Andamento', color: '#2563eb', bg: '#eff6ff', icon: 'construct' },
  resolvida:    { label: 'Resolvida',    color: '#16a34a', bg: '#f0fdf4', icon: 'checkmark-circle' },
  cancelada:    { label: 'Cancelada',    color: '#666666', bg: '#F8F8F8', icon: 'close-circle' },
  encerrada:    { label: 'Encerrada',    color: '#666666', bg: '#F8F8F8', icon: 'archive' },
};

const URGENCY_CONFIG = {
  baixa: { color: '#16a34a', bg: '#f0fdf4', icon: 'chevron-down-circle', label: 'Baixa' },
  media: { color: '#C78A00', bg: '#FFF8E7', icon: 'remove-circle',       label: 'Média' },
  alta:  { color: '#EF1D26', bg: '#FFF0F0', icon: 'arrow-up-circle',     label: 'Alta' },
};

export default function DetalheOcorrenciaScreen({ route, navigation }) {
  const { usuario } = useAuth();
  const { can, hasRole } = usePermissions();
  const { ocorrenciaId } = route.params;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [cancelMotivo, setCancelMotivo] = useState('');
  const [feedback, setFeedback] = useState(null); // { tipo: 'sucesso'|'erro', texto: string }
  const [confirmDialog, setConfirmDialog] = useState({
    visible: false, titulo: '', mensagem: '', confirmLabel: 'Confirmar',
    tipo: 'neutro', // 'neutro' | 'destrutivo'
    onConfirm: null,
  });

  const fetchData = async () => {
    try {
      const result = await buscarOcorrenciaId(ocorrenciaId);
      setData(result);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [ocorrenciaId]);


  const mostrarFeedback = (tipo, texto) => {
    setFeedback({ tipo, texto });
    setTimeout(() => setFeedback(null), 3500);
  };

  const pedirConfirmacao = ({ titulo, mensagem, confirmLabel = 'Confirmar', tipo = 'neutro', onConfirm }) => {
    setConfirmDialog({ visible: true, titulo, mensagem, confirmLabel, tipo, onConfirm });
  };

  const fecharConfirmacao = () => {
    setConfirmDialog(prev => ({ ...prev, visible: false, onConfirm: null }));
  };

  const handleCancelar = async () => {
    if (!cancelMotivo.trim()) {
      mostrarFeedback('erro', 'Por favor, informe o motivo do cancelamento.');
      return;
    }
    setActionLoading(true);
    try {
      await atualizarStatusOcorrencia(ocorrenciaId, 'cancelada', usuario.id, cancelMotivo, data.status);
      setCancelModalVisible(false);
      setCancelMotivo('');
      await fetchData();
      mostrarFeedback('sucesso', 'Ocorrência cancelada com sucesso.');
    } catch (err) {
      mostrarFeedback('erro', 'Não foi possível cancelar: ' + (err?.message || 'Erro desconhecido'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleConcluir = () => {
    pedirConfirmacao({
      titulo: 'Concluir Ocorrência',
      mensagem: 'Você confirma que este problema foi resolvido satisfatoriamente?',
      confirmLabel: 'Sim, encerrar',
      tipo: 'neutro',
      onConfirm: async () => {
        fecharConfirmacao();
        setActionLoading(true);
        try {
          await atualizarStatusOcorrencia(ocorrenciaId, 'encerrada', usuario.id, 'Encerrada pelo usuário.', data.status);
          await fetchData();
          mostrarFeedback('sucesso', 'Ocorrência encerrada com sucesso.');
        } catch (err) {
          mostrarFeedback('erro', err?.message || 'Não foi possível concluir a ocorrência.');
        } finally {
          setActionLoading(false);
        }
      },
    });
  };

  const handleReabrir = () => {
    pedirConfirmacao({
      titulo: 'Reabrir Ocorrência',
      mensagem: 'O problema não foi resolvido? Deseja reabrir este chamado para reavaliação?',
      confirmLabel: 'Sim, reabrir',
      tipo: 'neutro',
      onConfirm: async () => {
        fecharConfirmacao();
        setActionLoading(true);
        try {
          await atualizarStatusOcorrencia(ocorrenciaId, 'aberta', usuario.id, 'Reaberta pelo usuário: problema persiste.', data.status);
          await fetchData();
          mostrarFeedback('sucesso', 'Ocorrência reaberta. Ela será reavaliada pela equipe.');
        } catch (err) {
          mostrarFeedback('erro', err?.message || 'Não foi possível reabrir a ocorrência.');
        } finally {
          setActionLoading(false);
        }
      },
    });
  };

  const handleMarcarResolvida = () => {
    pedirConfirmacao({
      titulo: 'Marcar como Resolvida',
      mensagem: 'Confirma que esta ocorrência foi tratada e o problema foi resolvido?',
      confirmLabel: 'Sim, resolver',
      tipo: 'neutro',
      onConfirm: async () => {
        fecharConfirmacao();
        setActionLoading(true);
        try {
          await atualizarStatusOcorrencia(ocorrenciaId, 'resolvida', usuario.id, 'Marcada como resolvida pela equipe.', data.status);
          await fetchData();
          mostrarFeedback('sucesso', 'Ocorrência marcada como resolvida.');
        } catch (err) {
          mostrarFeedback('erro', err?.message || 'Não foi possível atualizar o status.');
        } finally {
          setActionLoading(false);
        }
      },
    });
  };

  const handleExcluir = () => {
    pedirConfirmacao({
      titulo: 'Excluir Ocorrência',
      mensagem: 'Esta ação é irreversível. Todos os dados e anexos desta ocorrência serão removidos permanentemente.',
      confirmLabel: 'Excluir',
      tipo: 'destrutivo',
      onConfirm: async () => {
        fecharConfirmacao();
        setActionLoading(true);
        try {
          await excluirOcorrencia(ocorrenciaId, usuario.id);
          navigation.goBack();
        } catch (err) {
          mostrarFeedback('erro', 'Não foi possível excluir: ' + (err?.message || 'Erro desconhecido'));
          setActionLoading(false);
        }
      },
    });
  };

  if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" color="#EF1D26" />;
  if (!data) return (
    <View style={styles.errorContainer}>
      <Ionicons name="alert-circle" size={48} color="#DDDDDD" />
      <Text style={styles.errorText}>Ocorrência não encontrada.</Text>
    </View>
  );

  const foto = data.fotos_ocorrencias?.[0]?.url || null;
  const status = STATUS_CONFIG[data.status] || STATUS_CONFIG.aberta;
  const urgency = URGENCY_CONFIG[data.urgencia] || URGENCY_CONFIG.media;

  const isOwner = data.usuario_id === usuario?.id;
  const isClosed = ['encerrada', 'cancelada'].includes(data.status);
  const isAluno = hasRole('aluno');

  const podeAtualizarStatus = can('ocorrencias.atualizar_status');
  const podeCancelarQualquer = can('ocorrencias.cancelar_qualquer');
  const podeDeletar = can('ocorrencias.deletar');

  // Aluno é somente-leitura: pode criar e ver, nunca alterar status ou excluir
  const canConclude = !isAluno && isOwner && !isClosed;
  const canMarcarResolvida = !isAluno && !isOwner && podeAtualizarStatus && !isClosed && data.status !== 'resolvida';
  const canReopen = !isAluno && isOwner && data.status === 'resolvida';
  const canCancel = !isAluno && (isOwner || podeCancelarQualquer) && ['aberta', 'em_analise', 'em_andamento'].includes(data.status);
  const canDelete = !isAluno && ((isOwner && data.status === 'aberta') || (podeDeletar && !isOwner));
  const showActionBar = canConclude || canMarcarResolvida || canReopen || canCancel || canDelete;

  return (
    <View style={{ flex: 1, backgroundColor: '#F8F8F8'}}>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: showActionBar ? 160 : 40 }}>

        <View style={[styles.statusBanner, { backgroundColor: status.bg }]}>
          <Ionicons name={status.icon} size={20} color={status.color} style={{ marginRight: 8 }} />
          <Text style={[styles.statusBannerText, { color: status.color }]}>{status.label}</Text>
          <Text style={styles.dateText}>{new Date(data.criado_em).toLocaleString('pt-BR')}</Text>
        </View>

        <View style={styles.content}>
          <Text style={styles.title}>{data.titulo}</Text>

          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <View style={styles.infoIconRow}>
                <Ionicons name="pricetag-outline" size={14} color="#666666" style={{ marginRight: 4 }} />
                <Text style={styles.infoLabel}>Categoria</Text>
              </View>
              <Text style={styles.infoValue}>{data.categorias?.nome || '—'}</Text>
            </View>
            <View style={styles.infoItem}>
              <View style={styles.infoIconRow}>
                <Ionicons name="business-outline" size={14} color="#666666" style={{ marginRight: 4 }} />
                <Text style={styles.infoLabel}>Setor</Text>
              </View>
              <Text style={styles.infoValue}>{data.setores?.nome || '—'}</Text>
            </View>
            <View style={styles.infoItem}>
              <View style={styles.infoIconRow}>
                <Ionicons name="location-outline" size={14} color="#666666" style={{ marginRight: 4 }} />
                <Text style={styles.infoLabel}>Local</Text>
              </View>
              <Text style={styles.infoValue}>{data.local || '—'}</Text>
            </View>
            <View style={styles.infoItem}>
              <View style={[styles.urgencyBadge, { backgroundColor: urgency.bg }]}>
                <Ionicons name={urgency.icon} size={14} color={urgency.color} style={{ marginRight: 4 }} />
                <Text style={[styles.urgencyText, { color: urgency.color }]}>{urgency.label}</Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Descrição</Text>
            <View style={styles.descriptionBox}>
              <Text style={styles.description}>{data.descricao}</Text>
            </View>
          </View>

          {foto && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Evidência Fotográfica</Text>
              <Image source={{ uri: foto }} style={styles.image} />
            </View>
          )}

          {data.historico_status && data.historico_status.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Histórico de Atualizações</Text>
              <View style={styles.timeline}>
                {data.historico_status.map((hist, idx) => {
                  const s = STATUS_CONFIG[hist.status_novo] || STATUS_CONFIG.aberta;
                  const isLast = idx === data.historico_status.length - 1;
                  return (
                    <View key={idx} style={styles.timelineItem}>
                      <View style={styles.timelineLeft}>
                        <View style={[styles.timelineDot, { backgroundColor: s.color }]}>
                          <Ionicons name={s.icon} size={12} color="#fff" />
                        </View>
                        {!isLast && <View style={styles.timelineConnector} />}
                      </View>
                      <View style={[styles.timelineContent, isLast && { paddingBottom: 0 }]}>
                        <Text style={styles.timelineStatus}>{s.label}</Text>
                        <Text style={styles.timelineUser}>
                          {hist.perfis?.nome_completo || 'Sistema'} · {new Date(hist.criado_em).toLocaleDateString('pt-BR')}
                        </Text>
                        {hist.observacao && (
                          <View style={styles.timelineObs}>
                            <Text style={styles.timelineObsText}>{hist.observacao}</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {showActionBar && (
        <View style={styles.actionBar}>
          {canConclude && (
            <TouchableOpacity
              style={[styles.actionBtn, styles.actionConfirm]}
              onPress={handleConcluir}
              disabled={actionLoading}
              activeOpacity={0.8}
            >
              <Ionicons name="checkmark-circle" size={20} color="#fff" />
              <Text style={styles.actionBtnTextWhite}>Concluir Chamado</Text>
            </TouchableOpacity>
          )}

          {canMarcarResolvida && (
            <TouchableOpacity
              style={[styles.actionBtn, styles.actionConfirm]}
              onPress={handleMarcarResolvida}
              disabled={actionLoading}
              activeOpacity={0.8}
            >
              <Ionicons name="checkmark-circle" size={20} color="#fff" />
              <Text style={styles.actionBtnTextWhite}>Marcar Resolvida</Text>
            </TouchableOpacity>
          )}

          {canReopen && (
            <TouchableOpacity
              style={[styles.actionBtn, styles.actionReopen]}
              onPress={handleReabrir}
              disabled={actionLoading}
              activeOpacity={0.8}
            >
              <Ionicons name="refresh" size={18} color="#C78A00" />
              <Text style={styles.actionBtnTextOrange}>Reabrir</Text>
            </TouchableOpacity>
          )}

          {canCancel && (
            <TouchableOpacity
              style={[styles.actionBtn, styles.actionCancel]}
              onPress={() => setCancelModalVisible(true)}
              disabled={actionLoading}
              activeOpacity={0.8}
            >
              <Ionicons name="close-circle-outline" size={18} color="#666666" />
              <Text style={styles.actionBtnTextGray}>Cancelar</Text>
            </TouchableOpacity>
          )}

          {canDelete && (
            <TouchableOpacity
              style={[styles.actionBtn, styles.actionDelete]}
              onPress={handleExcluir}
              disabled={actionLoading}
              activeOpacity={0.8}
            >
              <Ionicons name="trash-outline" size={18} color="#EF1D26" />
            </TouchableOpacity>
          )}
        </View>
      )}

      {feedback && (
        <View style={[
          styles.feedbackBanner,
          feedback.tipo === 'sucesso' ? styles.feedbackSucesso : styles.feedbackErro,
          { bottom: showActionBar ? 110 : 28 },
        ]}>
          <Ionicons
            name={feedback.tipo === 'sucesso' ? 'checkmark-circle' : 'alert-circle'}
            size={20}
            color={feedback.tipo === 'sucesso' ? '#16a34a' : '#EF1D26'}
          />
          <Text style={[
            styles.feedbackText,
            { color: feedback.tipo === 'sucesso' ? '#16a34a' : '#EF1D26' },
          ]}>
            {feedback.texto}
          </Text>
        </View>
      )}

      <Modal
        visible={cancelModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setCancelModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Ionicons name="close-circle" size={32} color="#666666" />
              <Text style={styles.modalTitle}>Cancelar Ocorrência</Text>
              <Text style={styles.modalSubtitle}>Por que você deseja cancelar este chamado?</Text>
            </View>

            <TextInput
              style={styles.modalInput}
              placeholder="Ex: Problema já foi resolvido internamente..."
              placeholderTextColor="#999999"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              value={cancelMotivo}
              onChangeText={setCancelMotivo}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalBtnSecondary}
                onPress={() => { setCancelModalVisible(false); setCancelMotivo(''); }}
              >
                <Text style={styles.modalBtnSecondaryText}>Voltar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtnPrimary, actionLoading && { opacity: 0.6 }]}
                onPress={handleCancelar}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.modalBtnPrimaryText}>Confirmar Cancelamento</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de confirmação genérico */}
      <Modal
        visible={confirmDialog.visible}
        animationType="fade"
        transparent
        onRequestClose={fecharConfirmacao}
      >
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmCard}>
            <View style={[
              styles.confirmIconWrapper,
              confirmDialog.tipo === 'destrutivo' ? styles.confirmIconDestrutivo : styles.confirmIconNeutro,
            ]}>
              <Ionicons
                name={confirmDialog.tipo === 'destrutivo' ? 'trash-outline' : 'help-circle-outline'}
                size={32}
                color={confirmDialog.tipo === 'destrutivo' ? '#EF1D26' : '#2563eb'}
              />
            </View>

            <Text style={styles.confirmTitulo}>{confirmDialog.titulo}</Text>
            <Text style={styles.confirmMensagem}>{confirmDialog.mensagem}</Text>

            <View style={styles.confirmActions}>
              <TouchableOpacity style={styles.confirmBtnSecundario} onPress={fecharConfirmacao}>
                <Text style={styles.confirmBtnSecundarioText}>Voltar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.confirmBtnPrimario,
                  confirmDialog.tipo === 'destrutivo' && styles.confirmBtnDestrutivo,
                ]}
                onPress={confirmDialog.onConfirm}
              >
                <Text style={styles.confirmBtnPrimarioText}>{confirmDialog.confirmLabel}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F8F8' },
  errorContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  errorText: { color: '#999999', fontSize: 16 },
  statusBanner: {
    flexDirection: 'row', alignItems: 'center', padding: 16, paddingHorizontal: 20,
  },
  statusBannerText: { fontSize: 14, fontWeight: '700', flex: 1 },
  dateText: { fontSize: 12, color: '#999999' },
  content: { padding: 20 },
  title: { fontSize: 22, fontWeight: '800', color: '#232323', marginBottom: 20, lineHeight: 30 },
  infoGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 12,
    backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 24,
    elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4,
  },
  infoItem: { width: '47%' },
  infoIconRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  infoLabel: { fontSize: 12, color: '#666666' },
  infoValue: { fontSize: 14, fontWeight: '700', color: '#232323' },
  urgencyBadge: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-start',
  },
  urgencyText: { fontSize: 12, fontWeight: '700' },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#232323', marginBottom: 12 },
  descriptionBox: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16,
    borderWidth: 1, borderColor: '#EEEEEE',
  },
  description: { fontSize: 15, color: '#555555', lineHeight: 24 },
  image: { width: '100%', height: 250, borderRadius: 16, resizeMode: 'cover' },
  timeline: {},
  timelineItem: { flexDirection: 'row' },
  timelineLeft: { alignItems: 'center', marginRight: 16 },
  timelineDot: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  timelineConnector: { width: 2, flex: 1, backgroundColor: '#DDDDDD', marginVertical: 4 },
  timelineContent: { flex: 1, paddingBottom: 20 },
  timelineStatus: { fontSize: 14, fontWeight: '700', color: '#232323', marginBottom: 2 },
  timelineUser: { fontSize: 12, color: '#666666', marginBottom: 6 },
  timelineObs: {
    backgroundColor: '#F8F8F8', borderRadius: 8, padding: 10,
    borderLeftWidth: 3, borderLeftColor: '#DDDDDD',
  },
  timelineObsText: { fontSize: 13, color: '#555555', fontStyle: 'italic' },

  // --- Action Bar ---
  actionBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#EEEEEE',
    paddingHorizontal: 20, paddingTop: 14, paddingBottom: 34,
    flexDirection: 'row', gap: 10, alignItems: 'center',
    elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08, shadowRadius: 10,
  },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12,
  },
  actionConfirm: {
    flex: 1, backgroundColor: '#16a34a', justifyContent: 'center',
  },
  actionReopen: {
    backgroundColor: '#FFF8E7', borderWidth: 1.5, borderColor: '#FFE4A0',
  },
  actionCancel: {
    backgroundColor: '#F8F8F8', borderWidth: 1.5, borderColor: '#DDDDDD',
  },
  actionDelete: {
    backgroundColor: '#FFF0F0', borderWidth: 1.5, borderColor: '#FFBBBB',
    paddingHorizontal: 14,
  },
  actionBtnTextWhite: { color: '#fff', fontWeight: '700', fontSize: 14 },
  actionBtnTextOrange: { color: '#C78A00', fontWeight: '700', fontSize: 13 },
  actionBtnTextGray: { color: '#666666', fontWeight: '600', fontSize: 13 },

  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 28, paddingBottom: 40,
  },
  modalHeader: { alignItems: 'center', marginBottom: 24, gap: 8 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#232323' },
  modalSubtitle: { fontSize: 14, color: '#666666', textAlign: 'center' },
  modalInput: {
    backgroundColor: '#F8F8F8', borderWidth: 1.5, borderColor: '#DDDDDD',
    borderRadius: 12, padding: 16, fontSize: 15, color: '#232323',
    height: 100, marginBottom: 20,
  },
  modalActions: { flexDirection: 'row', gap: 12 },
  modalBtnSecondary: {
    flex: 1, paddingVertical: 14, borderRadius: 12,
    alignItems: 'center', backgroundColor: '#EEEEEE',
  },
  modalBtnSecondaryText: { color: '#666666', fontWeight: '700', fontSize: 15 },
  modalBtnPrimary: {
    flex: 2, paddingVertical: 14, borderRadius: 12,
    alignItems: 'center', backgroundColor: '#666666',
  },
  modalBtnPrimaryText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  feedbackBanner: {
    position: 'absolute', left: 20, right: 20,
    borderRadius: 14, padding: 14,
    flexDirection: 'row', alignItems: 'center', gap: 10,
    elevation: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12, shadowRadius: 10,
    zIndex: 100,
  },
  feedbackSucesso: {
    backgroundColor: '#f0fdf4', borderWidth: 1.5, borderColor: '#86efac',
  },
  feedbackErro: {
    backgroundColor: '#FFF0F0', borderWidth: 1.5, borderColor: '#FFBBBB',
  },
  feedbackText: { flex: 1, fontSize: 14, fontWeight: '600', lineHeight: 20 },

  confirmOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 28,
  },
  confirmCard: {
    backgroundColor: '#fff', borderRadius: 24,
    padding: 28, alignItems: 'center', width: '100%',
    elevation: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18, shadowRadius: 20,
  },
  confirmIconWrapper: {
    width: 72, height: 72, borderRadius: 36,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 20,
  },
  confirmIconNeutro:   { backgroundColor: '#eff6ff' },
  confirmIconDestrutivo: { backgroundColor: '#FFF0F0' },
  confirmTitulo: {
    fontSize: 20, fontWeight: '800', color: '#232323',
    textAlign: 'center', marginBottom: 10,
  },
  confirmMensagem: {
    fontSize: 14, color: '#555555', textAlign: 'center',
    lineHeight: 22, marginBottom: 28,
  },
  confirmActions: { flexDirection: 'row', gap: 12, width: '100%' },
  confirmBtnSecundario: {
    flex: 1, paddingVertical: 14, borderRadius: 14,
    alignItems: 'center', backgroundColor: '#F0F0F0',
  },
  confirmBtnSecundarioText: { color: '#555555', fontWeight: '700', fontSize: 15 },
  confirmBtnPrimario: {
    flex: 1, paddingVertical: 14, borderRadius: 14,
    alignItems: 'center', backgroundColor: '#2563eb',
  },
  confirmBtnDestrutivo: { backgroundColor: '#EF1D26' },
  confirmBtnPrimarioText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
