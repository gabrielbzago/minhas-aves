export function friendlySupabaseError(error: any, fallback = "Não foi possível concluir a operação. Verifique os dados e tente novamente.") {
  const message = String(error?.message || "").toLowerCase();
  const code = String(error?.code || "");

  if (message.includes("limite_de_aves_atingido")) {
    return "Você atingiu o limite de aves do plano Grátis. Para cadastrar mais aves, escolha um plano pago.";
  }
  if (message.includes("row-level security") || code === "42501") {
    return "Não foi possível salvar a ave. Sua sessão pode ter expirado. Atualize a página e tente novamente.";
  }
  if (code === "23505" || message.includes("duplicate key") || message.includes("already exists")) {
    if (message.includes("ring") || message.includes("anilha")) {
      return "Este número de anilha já está cadastrado no sistema. Cada anilha é única e não pode ser reutilizada, mesmo se a ave estiver arquivada, falecida ou transferida.";
    }
    return "Já existe um cadastro com esses dados. Verifique as informações e tente novamente.";
  }
  if (code === "23503" || message.includes("foreign key")) {
    return "Um dos vínculos selecionados não é válido. Confira a espécie, o pai ou a mãe e tente novamente.";
  }
  if (code === "23502" || message.includes("not-null")) {
    return "Preencha todos os campos obrigatórios antes de salvar.";
  }
  if (code === "23514" || message.includes("check constraint")) {
    return "Um dos dados informados não é válido. Revise o cadastro da ave.";
  }
  if (message.includes("invalid input syntax for type date")) {
    return "Uma das datas informadas é inválida. Use uma data válida ou deixe o campo em branco.";
  }
  if (message.includes("database error saving new user") || message.includes("error saving new user")) {
    return "O Supabase recusou a criação do perfil. Isso normalmente indica uma migration pendente ou erro na função handle_new_user. Confira o SQL Editor do Supabase e a tabela public.profiles; o detalhe técnico foi registrado no console do navegador.";
  }
  if (message.includes("captcha") || message.includes("security check") || message.includes("verification failed")) {
    return "A verificação de segurança falhou ou expirou. Marque novamente a caixa de verificação e tente de novo.";
  }
  if (message.includes("signup is disabled") || message.includes("signups not allowed")) {
    return "O cadastro está desativado nas configurações de autenticação do Supabase. Habilite novos usuários em Authentication → Settings.";
  }
  if (message.includes("email not confirmed") || message.includes("email not verified")) {
    return "Seu e-mail ainda não foi confirmado. Verifique sua caixa de entrada e a pasta de spam.";
  }
  if (message.includes("invalid login credentials") || message.includes("invalid credentials")) {
    return "E-mail ou senha incorretos. Confira os dados e tente novamente.";
  }
  if (message.includes("user already registered") || message.includes("already been registered")) {
    return "Este e-mail já possui uma conta. Tente entrar ou use outro e-mail.";
  }
  if (message.includes("password should be at least") || message.includes("password must")) {
    return "A senha não atende aos requisitos mínimos. Escolha uma senha mais forte.";
  }
  if (message.includes("jwt") || message.includes("auth session missing") || message.includes("not authenticated")) {
    return "Sua sessão não está mais ativa. Entre novamente na sua conta e tente novamente.";
  }

  return fallback;
}
