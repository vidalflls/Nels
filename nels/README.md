# Nels

Chamadas de até 4 pessoas com compartilhamento de tela e chat, em um site com link direto
(ninguém precisa de conta). Feito com Next.js + LiveKit.

## O que tem
- Criar chamada (código de 6 letras/números) ou entrar com um código ou link
- Até 4 pessoas por chamada; a 5ª recebe "Esta chamada já tem 4 pessoas"
- Nome opcional (vira "Convidado 42" se ficar em branco)
- Áudio de todos, microfone liga/desliga
- Compartilhar tela em 720p/30, 1080p/30 ou 1080p/60, com modo "Texto e detalhes" ou "Movimento"
- Várias telas ao mesmo tempo, cada uma em seu quadro, com resolução, fps e Mbps ao vivo
- Chat da chamada
- Visual liquid glass, preto e amarelo neon

## 1. Chaves do LiveKit (grátis)
1. Crie uma conta em https://cloud.livekit.io e um projeto.
2. Em Settings > Keys, crie uma chave. Copie a URL (`wss://...`), a API Key e o API Secret.

## 2. Rodar no seu computador
```bash
cp .env.example .env.local     # preencha os 3 valores
npm install
npm run dev
```
Abra http://localhost:3000. Para testar sozinho, abra a mesma chamada em duas abas.

## 3. Colocar no ar (Vercel, grátis)
1. Suba a pasta para um repositório no GitHub (o `.gitignore` já protege seus segredos).
2. Em https://vercel.com, clique em "Add New > Project" e escolha o repositório.
3. Em "Environment Variables", adicione `LIVEKIT_URL`, `LIVEKIT_API_KEY` e `LIVEKIT_API_SECRET`.
4. Clique em Deploy. Você recebe um endereço como `nels.vercel.app`.
5. Para entrar na chamada, seu amigo abre `https://SEU-ENDERECO/call/CODIGO` ou digita o código na página inicial.

Sem GitHub: `npx vercel` dentro da pasta faz o deploy direto (ele pergunta as variáveis no painel depois).

## Observações
- A página precisa de HTTPS para usar microfone e tela (a Vercel já entrega; no localhost também funciona).
- O LiveKit Cloud gratuito tem uma cota mensal de minutos de conexão. Veja o plano atual no site deles.
- Se algum navegador reclamar do compartilhamento em 1080p/60, use 1080p/30.
- O codec padrão é VP8. Para trocar (por exemplo VP9, que costuma ficar mais nítido em tela), adicione
  `videoCodec: 'vp9'` nas opções de publicação dentro de `components/CallRoom.tsx`.
