# Apollo 0.5.23 — correção de package.json

A versão 0.5.22 foi empacotada com `package.json` e `package-lock.json` vazios, causando o erro da Vercel `Unexpected end of JSON input`. Os dois arquivos foram restaurados a partir da versão íntegra 0.5.20 e versionados novamente como 0.5.23.

Este ZIP preserva as alterações de cadastro antes da assinatura da 0.5.22. Antes de publicar, confirme que a raiz do repositório contém `package.json` e `package-lock.json` completos (não os arquivos vazios). A integridade JSON e do ZIP foi verificada.
