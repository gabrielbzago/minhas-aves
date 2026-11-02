# Apollo 0.5.95 — Atalho discreto para planos no celular

- Adicionado botão flutuante compacto **“Ver planos e valores”** na página pública inicial.
- O botão aparece apenas em telas de celular (até 700 px), sem alterar a navegação desktop.
- O clique leva diretamente à seção `#planos`, onde ficam os valores e links para assinatura.
- O botão desaparece enquanto a seção de planos estiver visível e reaparece ao sair dela.
- Respeita a área segura inferior do celular (`safe-area-inset-bottom`).
- Não altera checkout, preços, cadastro, autenticação ou banco de dados. Não exige SQL.
