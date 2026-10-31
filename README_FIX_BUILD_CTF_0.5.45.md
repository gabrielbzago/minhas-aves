# Apollo 0.5.45 — Correção TypeScript no cartão individual

## Causa
`ensureAmadorTrialOnFirstUse` retorna um perfil parcial que não declara `ctf_number`. A rota do cartão individual substituía o perfil completo por esse objeto parcial, embora o tipo inferido do perfil completo exija `ctf_number`.

## Correção
A rota agora mescla os dados retornados pelo trial sobre o perfil completo (`{ ...profile, ...trial.profile }`), preservando `ctf_number` e os demais campos já carregados, sem perder atualizações do estado do trial.

## SQL
Nenhum SQL necessário.

## Validação
Correção pontual de tipagem identificada no log da Vercel. O build não foi executado neste ambiente; confirmar com novo deploy.
