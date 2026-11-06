# Configuração segura Vercel + HostGator

## Vercel
Em Project Settings → Environment Variables, configure para Production (e Preview, se usar):
- `SERPERITO_LOGIN_PASSWORD`: senha de acesso ao painel (a senha que você já cadastrou).
- `SERPERITO_SESSION_SECRET`: segredo aleatório exclusivo para assinar sessões.
- `HOSTGATOR_API_TOKEN`: token aleatório exclusivo compartilhado apenas entre Vercel e HostGator.
- `HOSTGATOR_API_URL`: URL HTTPS completa do endpoint PHP, por exemplo `https://SEU-DOMINIO/api/pericias.php`.

Não use prefixo `NEXT_PUBLIC_` nessas variáveis. Após configurar, faça novo deploy para Production.

## HostGator
No arquivo `public_html/api/config.php`, mantenha as quatro constantes de banco já existentes e acrescente:
```php
define('SERPERITO_API_TOKEN', 'O_MESMO_TOKEN_CONFIGURADO_EM_HOSTGATOR_API_TOKEN');
```
O valor deve ser idêntico ao da Vercel, sem espaços extras. Não coloque esse arquivo no GitHub nem compartilhe o conteúdo.

## Publicação e teste
1. Faça merge desta solicitação somente depois de revisar as alterações.
2. Configure as variáveis nos ambientes necessários e publique o novo deploy.
3. Confirme que abrir o domínio redireciona para /login.
4. Entre com a senha cadastrada e confirme que o painel abre.
5. A tela de conexão deve indicar conexão com MySQL. O primeiro acesso autorizado cria a tabela `pericias` automaticamente.
6. Teste primeiro com um registro fictício, nunca com dados pessoais reais.

A API PHP não deve ser chamada diretamente pelo navegador; a rota Next.js autenticada faz o encaminhamento server-side. O token de integração nunca deve ser exposto em código cliente.
