import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [usuario, setUsuario]   = useState(null);
  const [sessao,  setSessao]    = useState(null);
  const [carregando, setCarregando] = useState(true);

  // Estado RBAC
  const [perfil,          setPerfil]          = useState(null);
  const [roles,           setRoles]           = useState([]);
  const [permissoes,      setPermissoes]      = useState([]);
  const [perfilCarregado, setPerfilCarregado] = useState(false);

  /**
   * Carrega o perfil do usuário junto com suas roles e permissões.
   * Usamos maybeSingle() para evitar erro de coerção JSON caso o perfil não exista.
   */
  const carregarPerfil = useCallback(async (userId) => {
    setPerfilCarregado(false);
    if (!userId) return;

    try {
      // 1. Dados básicos do perfil (Ajustado para evitar erro 42501/JSON)
      const { data: perfilData, error: perfilError } = await supabase
        .from('perfis')
        .select('id, nome_completo, role_principal')
        .eq('id', userId)
        .maybeSingle(); // Retorna null em vez de erro se não encontrar

      if (perfilError) throw perfilError;

      // Se o perfil não existe (ex: delay na trigger de criação), paramos aqui
      if (!perfilData) {
        console.warn('Perfil não encontrado para o usuário:', userId);
        setPerfil(null);
        return;
      }

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

      // Formata o array de roles com segurança (verificando se pr.roles existe)
      const rolesFormatadas = (perfilRoles || [])
        .filter(pr => pr.roles)
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
        if (pr.roles?.role_permissoes) {
          pr.roles.role_permissoes.forEach(rp => {
            if (rp.permissoes?.codigo) {
              permissoesSet.add(rp.permissoes.codigo);
            }
          });
        }
      });

      setPerfil(perfilData);
      setRoles(rolesFormatadas);
      setPermissoes([...permissoesSet]);
    } catch (error) {
      console.error('Erro ao carregar perfil:', error.message);
    } finally {
      setPerfilCarregado(true);
    }
  }, []);

  const limparPerfil = useCallback(() => {
    setPerfil(null);
    setRoles([]);
    setPermissoes([]);
    setPerfilCarregado(false);
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSessao(session);
        setUsuario(session?.user ?? null);

        if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
          if (session?.user) {
            carregarPerfil(session.user.id).finally(() => setCarregando(false));
          } else {
            setCarregando(false);
          }
        } else if (event === 'SIGNED_OUT') {
          limparPerfil();
          setCarregando(false);
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
    try {
      await supabase.auth.signOut();
    } catch {
      await supabase.auth.signOut({ scope: 'local' });
    }
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
        usuario,
        sessao,
        carregando,
        entrar,
        cadastrar,
        sair,
        enviarCodigoRecuperacao,
        verificarCodigo,
        atualizarSenha,
        perfil,
        roles,
        permissoes,
        perfilCarregado,
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