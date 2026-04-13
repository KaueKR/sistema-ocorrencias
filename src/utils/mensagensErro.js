export const MENSAGENS_ERRO = {
  'Invalid login credentials': 'E-mail ou senha incorretos.',
  'Email not confirmed': 'Você precisa confirmar seu e-mail antes de fazer login.',
  'User already registered': 'Este e-mail já está cadastrado.',
  'Password should be at least 6 characters': 'A senha deve ter no mínimo 6 caracteres.',
  'Unable to validate email address: invalid format': 'Formato de e-mail inválido.',
  'Email rate limit exceeded': 'Muitas tentativas. Aguarde um momento e tente novamente.',
  'For security purposes, you can only request this after 60 seconds': 'Por segurança, aguarde 60 segundos antes de tentar novamente.',
};

export function traduzirErroSupabase(erroMensagem) {
  return MENSAGENS_ERRO[erroMensagem] || 'Ocorreu um erro inesperado. Tente novamente.';
}
