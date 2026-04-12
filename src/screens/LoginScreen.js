import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useState } from 'react';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');

  function validarCampos() {
    if (!email) {
      setErro('Por favor, informe seu e-mail.');
      return false;
    }
    if (!email.includes('@')) {
      setErro('Por favor, informe um e-mail válido.');
      return false;
    }
    if (!senha) {
      setErro('Por favor, informe sua senha.');
      return false;
    }
    if (senha.length < 6) {
      setErro('A senha deve ter no mínimo 6 caracteres.');
      return false;
    }
    return true;
  }

  async function handleLogin() {
    setErro('');
    if (!validarCampos()) return;
    setCarregando(true);
    setTimeout(() => {
      setCarregando(false);
      console.log('Login com:', email);
    }, 2000);
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.inner}>

        <View style={styles.header}>
          <Text style={styles.titulo}>Sistema de{'\n'}Ocorrências</Text>
          <Text style={styles.subtitulo}>Faça login para continuar</Text>
        </View>

        <View style={styles.formulario}>

          {erro ? (
            <View style={styles.erroContainer}>
              <Text style={styles.erroTexto}>{erro}</Text>
            </View>
          ) : null}

          <TextInput
            style={styles.input}
            placeholder="E-mail"
            placeholderTextColor="#999"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              setErro('');
            }}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <TextInput
            style={styles.input}
            placeholder="Senha"
            placeholderTextColor="#999"
            value={senha}
            onChangeText={(text) => {
              setSenha(text);
              setErro('');
            }}
            secureTextEntry
          />

          <TouchableOpacity
            style={styles.linkEsqueci}
            onPress={() => console.log('Esqueci minha senha')}
          >
            <Text style={styles.linkEsqueciTexto}>Esqueci minha senha</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.botao, carregando && styles.botaoDesabilitado]}
            onPress={handleLogin}
            disabled={carregando}
          >
            {carregando ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.botaoTexto}>Entrar</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkCadastro}
            onPress={() => console.log('Ir para cadastro')}
          >
            <Text style={styles.linkCadastroTexto}>
              Não tem conta?{' '}
              <Text style={styles.linkCadastroDestaque}>Cadastre-se</Text>
            </Text>
          </TouchableOpacity>

        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  inner: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    marginBottom: 40,
    alignItems: 'center',
  },
  titulo: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1a1a2e',
    marginBottom: 8,
    textAlign: 'center',
    lineHeight: 40,
  },
  subtitulo: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
  },
  formulario: {
    gap: 12,
  },
  erroContainer: {
    backgroundColor: '#fdecea',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#e53935',
  },
  erroTexto: {
    color: '#c62828',
    fontSize: 14,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 16,
    fontSize: 15,
    color: '#333',
  },
  linkEsqueci: {
    alignSelf: 'flex-end',
  },
  linkEsqueciTexto: {
    color: '#4361ee',
    fontSize: 13,
  },
  botao: {
    backgroundColor: '#4361ee',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  botaoDesabilitado: {
    backgroundColor: '#a0aec0',
  },
  botaoTexto: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  linkCadastro: {
    alignItems: 'center',
    marginTop: 8,
  },
  linkCadastroTexto: {
    color: '#666',
    fontSize: 14,
  },
  linkCadastroDestaque: {
    color: '#4361ee',
    fontWeight: 'bold',
  },
});