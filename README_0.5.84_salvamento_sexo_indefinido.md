Apollo 0.5.84

- O salvamento do lote por foto agora é enviado ao endpoint autenticado do servidor, que executa a gravação no Supabase.
- A tela só confirma sucesso quando o servidor confirma exatamente a quantidade de anilhas solicitadas.
- Erros reais do banco são devolvidos à tela para diagnóstico, sem mostrar sucesso falso.
- Toda nova anilha entra como sexo `indeterminado` e status `disponivel`.
- Anilhas disponíveis no estoque não podem ter sexo alterado. O sexo é definido ao aplicar a anilha ao filhote; após aplicada, pode ser corrigido na ficha.
- Nenhuma migração SQL adicional.
