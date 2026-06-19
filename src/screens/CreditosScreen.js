import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function SectionCard({ children }) {
  return <View style={styles.card}>{children}</View>;
}

function SectionTitle({ icon, label }) {
  return (
    <View style={styles.sectionTitleRow}>
      <View style={styles.sectionIconWrapper}>
        <Ionicons name={icon} size={16} color="#EF1D26" />
      </View>
      <Text style={styles.sectionTitle}>{label}</Text>
    </View>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

function InfoRow({ label, value, isLast }) {
  return (
    <>
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
      {!isLast && <Divider />}
    </>
  );
}

function PersonRow({ name, detail, isLast }) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <>
      <View style={styles.personRow}>
        <View style={styles.personAvatar}>
          <Text style={styles.personAvatarText}>{initials}</Text>
        </View>
        <View style={styles.personInfo}>
          <Text style={styles.personName}>{name}</Text>
          <Text style={styles.personDetail}>{detail}</Text>
        </View>
      </View>
      {!isLast && <Divider />}
    </>
  );
}

const DOCENTES = [
  {
    name: 'Prof. Dr. Elvio Gilberto da Silva',
    detail: 'Coordenador do Projeto',
    accent: '#EF1D26',
    bg: '#FFEEEE',
  },
  {
    name: 'Prof. Me. Luis Felipe Grael Tinós',
    detail: 'Professor Colaborador',
    accent: '#7c3aed',
    bg: '#f3e8ff',
  },
  {
    name: 'Profª. Esp. Camila Pellizon Floret',
    detail: 'Professora Colaboradora',
    accent: '#7c3aed',
    bg: '#f3e8ff',
  },
];

const ALUNOS = [
  { name: 'Kauê Kanagusko Ruiz', detail: 'Ciência da Computação' },
  { name: 'Gerson de Oliveira Lopes Jr.', detail: 'Ciência da Computação' },
];

export default function CreditosScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#232323" />

      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <View style={styles.headerIconWrapper}>
            <Ionicons name="star" size={32} color="#EF1D26" />
          </View>
          <Text style={styles.headerTitle}>Créditos</Text>
          <Text style={styles.headerSubtitle}>Equipe e reconhecimentos</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Informações do Projeto */}
        <SectionCard>
          <SectionTitle icon="folder-open-outline" label="Sobre o Projeto" />
          <Divider />
          <InfoRow label="Nome" value="Projeto de Extensão Fábrica de Software" />
          <Divider />
          <View style={styles.descriptionBlock}>
            <Text style={styles.infoLabel}>Finalidade</Text>
            <Text style={styles.descriptionText}>
              A Fábrica de Software é um projeto de extensão universitária que aproxima o ambiente
              acadêmico da prática profissional de desenvolvimento de software. Por meio de
              metodologias ágeis e trabalho colaborativo, alunos e docentes desenvolvem soluções
              reais para demandas institucionais, consolidando competências técnicas e promovendo
              o impacto social da universidade na comunidade.
            </Text>
          </View>
        </SectionCard>

        {/* Corpo Docente */}
        <SectionCard>
          <SectionTitle icon="school-outline" label="Corpo Docente" />
          <Divider />
          {DOCENTES.map((doc, i) => {
            const initials = doc.name
              .split(' ')
              .filter(Boolean)
              .map((n) => n[0])
              .slice(0, 2)
              .join('')
              .toUpperCase();
            return (
              <React.Fragment key={i}>
                <View style={styles.personRow}>
                  <View style={[styles.personAvatar, { backgroundColor: doc.bg }]}>
                    <Text style={[styles.personAvatarText, { color: doc.accent }]}>{initials}</Text>
                  </View>
                  <View style={styles.personInfo}>
                    <Text style={styles.personName}>{doc.name}</Text>
                    <Text style={[styles.personDetail, { color: doc.accent }]}>{doc.detail}</Text>
                  </View>
                </View>
                {i < DOCENTES.length - 1 && <Divider />}
              </React.Fragment>
            );
          })}
        </SectionCard>

        {/* Equipe de Desenvolvimento */}
        <SectionCard>
          <SectionTitle icon="code-slash-outline" label="Equipe de Desenvolvimento" />
          <Divider />
          {ALUNOS.map((aluno, i) => (
            <PersonRow
              key={i}
              name={aluno.name}
              detail={aluno.detail}
              isLast={i === ALUNOS.length - 1}
            />
          ))}
        </SectionCard>

        {/* Instituição — Desenvolvimento e Apoio */}
        <SectionCard>
          <SectionTitle icon="business-outline" label="Instituição" />
          <Divider />
          <View style={styles.logoBlock}>
            <Text style={styles.logoLabel}>Desenvolvimento:</Text>
            <Image
              source={require('../../assets/logo-unisagrado.png')}
              style={styles.logoUnisagrado}
              resizeMode="contain"
            />
          </View>
          <Divider />
          <View style={styles.logoBlock}>
            <Text style={styles.logoLabel}>Apoio:</Text>
            <Image
              source={require('../../assets/logo-coordenadoria-extensao.jpg')}
              style={styles.logoCoordenadoria}
              resizeMode="contain"
            />
          </View>
        </SectionCard>

        <View style={styles.footer}>
          <Ionicons name="heart" size={14} color="#EF1D26" />
          <Text style={styles.footerText}>  Desenvolvido com dedicação — {new Date().getFullYear()}</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F8F8' },

  header: {
    backgroundColor: '#232323',
    paddingBottom: 28,
    paddingHorizontal: 20,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerIconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(239,29,38,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    marginTop: 8,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 4,
  },
  headerSubtitle: {
    color: '#666666',
    fontSize: 13,
  },

  content: { padding: 20, gap: 16 },

  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },

  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 10,
  },
  sectionIconWrapper: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: '#FFEEEE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#232323',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },

  divider: { height: 1, backgroundColor: '#F8F8F8', marginHorizontal: 16 },

  infoRow: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 4,
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#999999',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#232323',
  },

  descriptionBlock: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 6,
  },
  descriptionText: {
    fontSize: 14,
    color: '#444444',
    lineHeight: 22,
  },

  personRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  personAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFEEEE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  personAvatarText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#EF1D26',
  },
  personInfo: { flex: 1, gap: 2 },
  personName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#232323',
  },
  personDetail: {
    fontSize: 12,
    color: '#666666',
  },

  logoBlock: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  logoLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#999999',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  logoUnisagrado: {
    width: 200,
    height: 72,
    alignSelf: 'center',
  },
  logoCoordenadoria: {
    width: 250,
    height: 64,
    alignSelf: 'center',
  },

  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  footerText: {
    fontSize: 12,
    color: '#999999',
  },
});
