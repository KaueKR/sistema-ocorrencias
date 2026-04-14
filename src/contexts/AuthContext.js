import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [usuario, setUsuario]   = useState(null);
  const [sessao,  setSessao]    = useState(null);
  const [carregando, setCarregando] = useState(true);

  // Estado RBAC
  const [perfil,     setPerfil]     = useState(null);
  const [roles,      setRoles]      = useState([]);
  const [permissoes, setPermissoes] = useState([]);

  /**
   * Carrega o perfil do usuário junto com suas roles e permissões.
   * Chamado automaticamente no login e na inicialização da sessão.
   */
  const carregarPerfil = useCallback(async (userId) => {
    if (!userId) return;
    try {
      // 1. Dados básicos do perfil
      const { data: perfilData, error: perfilError } = await supabase
        .from('perfis')
        .select('id, nome_completo, role_principal')
        .eq('id', userId)
        .single();

      if (perfilError) throw perfilError;

      // 2. Roles do usuário + permissões aninhadas em uma única query
      const { data: perfilRoles, error: rolesError } = await supabase
        .from('perfil_roles')
        .select(`
          setor_id,
          roles (
            id, nome, label, nivel,
            role_permissoes (
              permissoes ( codigo )
            )
          )
        `)
        .eq('perfil_id', userId);

      if (rolesError) throw rolesError;

      // Formata o array de roles
      const rolesFormatadas = (perfilRoles || [])
        .filter(pr => pr.roles?.id)
        .map(pr => ({
          id:       pr.roles.id,
          nome:     pr.roles.nome,
          label:    pr.roles.label,
          nivel:    pr.roles.nivel,
          setor_id: pr.setor_id,
        }));

      // Extrai permissões únicas de todas as roles do usuário
      const permissoesSet = new Set();
      (perfilRoles || []).forEach(pr => {
        (pr.roles?.role_permissoes || []).forEach(rp => {
          if (rp.permissoes?.codigo) {
            permissoesSet.add(rp.permissoes.codigo);
          }
        });
      });

      setPerfil(perfilData);
      setRoles(rolesFormatadas);
      setPermissoes([...permissoesSet]);
    } catch (error) {
      console.error('Erro ao carregar perfil:', error.message);
    }
  }, []);

  const limparPerfil = useCallback(() => {
    setPerfil(null);
    setRoles([]);
    setPermissoes([]);
  }, []);

  useEffect(() => {
    // Inicializa a sessão atual
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSessao(session);
      setUsuario(session?.user ?? null);

      if (session?.user) {
        carregarPerfil(session.user.id).finally(() => setCarregando(false));
      } else {
        setCarregando(false);
      }
    });

    // Escuta mudanças de auth (login, logout, refresh de token)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSessao(session);
        setUsuario(session?.user ?? null);

        if (session?.user) {
          carregarPerfil(session.user.id);
        } else {
          limparPerfil();
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [carregarPerfil, limparPerfil]);

  async function entrar(email, senha) {
    return await supabase.auth.signInWithPassword({ email, password: senha });
  }

  async function cadastrar(nome, email, senha) {
    return await supabase.auth.signUp({
      email,
      password: senha,
      options: { data: { nome_completo: nome } },
    });
  }

  async function sair() {
    return await supabase.auth.signOut();
  }

  async function enviarCodigoRecuperacao(email) {
    return await supabase.auth.resetPasswordForEmail(email);
  }

  async function verificarCodigo(email, token) {
    return await supabase.auth.verifyOtp({ email, token, type: 'recovery' });
  }

  async function atualizarSenha(novaSenha) {
    return await supabase.auth.updateUser({ password: novaSenha });
  }

  return (
    <AuthContext.Provider
      value={{
        // Auth básico
        usuario,
        sessao,
        carregando,
        entrar,
        cadastrar,
        sair,
        enviarCodigoRecuperacao,
        verificarCodigo,
        atualizarSenha,
        // RBAC
        perfil,
        roles,
        permissoes,
        carregarPerfil,
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
