// server.js - Startup file para HostGator (Node.js App / Phusion Passenger) e Produção
const express = require('express');
const next = require('next');
const { parse } = require('url');

const dev = process.env.NODE_ENV !== 'production';
const port = parseInt(process.env.PORT || '3000', 10);
const hostname = '0.0.0.0';

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = express();

  // Desativa header x-powered-by para segurança
  server.disable('x-powered-by');

  // Middleware básico de segurança de headers HTTP
  server.use((req, res, nextMiddleware) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    nextMiddleware();
  });

  // Health-check para monitoramento de hospedagem
  server.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Em Express 5, use /.*/ em vez de '*' para capturar todas as rotas
  server.all(/.*/, (req, res) => {
    const parsedUrl = parse(req.url, true);
    return handle(req, res, parsedUrl);
  });

  server.listen(port, (err) => {
    if (err) throw err;
    console.log(`> Servidor PeríciaMed pronto em http://localhost:${port} [NODE_ENV=${process.env.NODE_ENV || 'development'}]`);
  });
}).catch((ex) => {
  console.error('> Erro ao inicializar o servidor:', ex.stack);
  process.exit(1);
});
