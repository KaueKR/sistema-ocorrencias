import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../services/supabase';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [sessao, setSessao] = useState(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSessao(session);
      setUsuario(session?.user ?? null);
      setCarregando(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSessao(session);
        setUsuario(session?.user ?? null);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function entrar(email, senha) {
    return await supabase.auth.signInWithPassword({
      email: email,
      password: senha,
    });
  }

  async function cadastrar(nome, email, senha) {
    return await supabase.auth.signUp({
      email: email,
      password: senha,
      options: {
        data: {
          nome_completo: nome,
        },
      },
    });
  }

  async function sair() {
    return await supabase.auth.signOut();
  }

  async function enviarCodigoRecuperacao(email) {
    return await supabase.auth.resetPasswordForEmail(email);
  }

  async function verificarCodigo(email, token) {
    return await supabase.auth.verifyOtp({
      email,
      token,
      type: 'recovery',
    });
  }

  async function atualizarSenha(novaSenha) {
    return await supabase.auth.updateUser({
      password: novaSenha,
    });
  }

  return (
    <AuthContext.Provider
      value={{
        usuario,
        sessao,
        carregando,
        entrar,
        cadastrar,
        sair,
        enviarCodigoRecuperacao,
        verificarCodigo,
        atualizarSenha,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}
