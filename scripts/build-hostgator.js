const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const appApiDir = path.join(rootDir, 'app', 'api');
const tempApiDir = path.join(rootDir, 'app', '_api_temp');
const outDir = path.join(rootDir, 'out');
const zipFile = path.join(rootDir, 'hostgator_deploy.zip');

console.log('🚀 Iniciando compilação do sistema para hospedagem compartilhada HostGator (Apache + PHP)...');

// 1. Mover temporariamente a rota de servidor app/api para que o Next.js faça a exportação 100% estática
let apiMoved = false;
if (fs.existsSync(tempApiDir)) {
  fs.rmSync(tempApiDir, { recursive: true, force: true });
}
if (fs.existsSync(appApiDir)) {
  console.log('📦 Isolando rotas dinâmicas do Node para exportação estática...');
  fs.renameSync(appApiDir, tempApiDir);
  apiMoved = true;
}

try {
  // Limpar cache anterior do .next para evitar conflitos de chunks
  const nextCacheDir = path.join(rootDir, '.next');
  if (fs.existsSync(nextCacheDir)) {
    fs.rmSync(nextCacheDir, { recursive: true, force: true });
  }

  // 2. Executar o build estático do Next.js
  console.log('⚙️ Gerando arquivos HTML, CSS e JavaScript otimizados (Next.js static export)...');
  execSync('npx next build', {
    cwd: rootDir,
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'production', NEXT_EXPORT: 'true' }
  });

  // 3. Injetar o CSS diretamente no index.html e tornar os links relativos
  // Isso resolve 100% o problema de CSS não carregado na HostGator por caminho absoluto ou bloqueio do _next
  console.log('🎨 Injetando folhas de estilo (Tailwind CSS) diretamente no index.html...');
  const cssDir = path.join(outDir, '_next', 'static', 'css');
  let inlineCss = '';
  if (fs.existsSync(cssDir)) {
    const cssFiles = fs.readdirSync(cssDir).filter(f => f.endsWith('.css'));
    for (const cssFile of cssFiles) {
      inlineCss += fs.readFileSync(path.join(cssDir, cssFile), 'utf-8') + '\n';
    }
  }

  const indexPath = path.join(outDir, 'index.html');
  if (fs.existsSync(indexPath)) {
    let htmlContent = fs.readFileSync(indexPath, 'utf-8');

    // Injetar CSS no <head> se encontrado
    if (inlineCss) {
      const styleTag = `<style id="periciamed-styles">\n${inlineCss}\n</style>`;
      if (htmlContent.includes('</head>')) {
        htmlContent = htmlContent.replace('</head>', `${styleTag}\n</head>`);
      } else {
        htmlContent = htmlContent.replace('<head>', `<head>\n${styleTag}`);
      }
    }

    // Tornar caminhos de scripts e links relativos (./_next) para funcionar tanto na raiz quanto em subpastas
    htmlContent = htmlContent.replace(/href="\/_next\//g, 'href="./_next/');
    htmlContent = htmlContent.replace(/src="\/_next\//g, 'src="./_next/');
    htmlContent = htmlContent.replace(/\"\/_next\//g, '"./_next/');

    fs.writeFileSync(indexPath, htmlContent, 'utf-8');
    console.log('✨ index.html atualizado com CSS embutido e caminhos relativos seguros!');
  }

  // Atualizar também 404.html se existir
  const notFoundPath = path.join(outDir, '404.html');
  if (fs.existsSync(notFoundPath)) {
    let notFoundHtml = fs.readFileSync(notFoundPath, 'utf-8');
    if (inlineCss) {
      const styleTag = `<style id="periciamed-styles">\n${inlineCss}\n</style>`;
      notFoundHtml = notFoundHtml.replace('</head>', `${styleTag}\n</head>`);
    }
    notFoundHtml = notFoundHtml.replace(/href="\/_next\//g, 'href="./_next/');
    notFoundHtml = notFoundHtml.replace(/src="\/_next\//g, 'src="./_next/');
    notFoundHtml = notFoundHtml.replace(/\"\/_next\//g, '"./_next/');
    fs.writeFileSync(notFoundPath, notFoundHtml, 'utf-8');
  }

  // 4. Garantir que os arquivos PHP e .htaccess estejam na pasta de saída out
  console.log('📄 Copiando .htaccess e backend PHP para a pasta de distribuição (out/)...');
  
  const publicDir = path.join(rootDir, 'public');
  const outApiDir = path.join(outDir, 'api');
  
  if (!fs.existsSync(outApiDir)) {
    fs.mkdirSync(outApiDir, { recursive: true });
  }

  // Copiar .htaccess
  if (fs.existsSync(path.join(publicDir, '.htaccess'))) {
    fs.copyFileSync(path.join(publicDir, '.htaccess'), path.join(outDir, '.htaccess'));
  }

  // Copiar todos os arquivos da pasta public/api (gemini.php, pericias.php, db.php, config.php, schema.sql)
  const apiFiles = fs.readdirSync(path.join(publicDir, 'api'));
  for (const f of apiFiles) {
    fs.copyFileSync(path.join(publicDir, 'api', f), path.join(outApiDir, f));
  }

  // 5. Gerar o arquivo hostgator_deploy.zip pronto para upload via python3
  console.log('📦 Empacotando hostgator_deploy.zip...');
  const zipScriptPath = path.join(rootDir, 'scripts', 'zip.py');
  execSync(`python3 "${zipScriptPath}" "${outDir}" "${zipFile}"`, { stdio: 'inherit' });

  console.log('\n✅ SUCESSO! Pacote de deploy da HostGator gerado com sucesso:');
  console.log(`📁 Arquivo ZIP: ${zipFile}`);
  console.log('👉 Você só precisa enviar esse arquivo hostgator_deploy.zip para a pasta public_html da HostGator e descompactar lá!');

} catch (error) {
  console.error('❌ Erro durante o processo de build para HostGator:', error);
  process.exit(1);
} finally {
  // Restaurar a pasta app/api para manter o ambiente local/AI Studio 100% funcional
  if (apiMoved && fs.existsSync(tempApiDir)) {
    console.log('🔄 Restaurando rotas do servidor local (app/api)...');
    fs.renameSync(tempApiDir, appApiDir);
  }
}
