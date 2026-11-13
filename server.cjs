const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const root = __dirname;
const port = Number(process.env.PORT || 8000);
const mime = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.cjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.glb': 'model/gltf-binary',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg'
};

const server = http.createServer((req, res) => {
  let pathname;
  try { pathname = decodeURIComponent(new URL(req.url, `http://${req.headers.host}`).pathname); }
  catch { res.writeHead(400).end('Solicitud no válida'); return; }
  if (pathname === '/') pathname = '/index.html';
  const filename = path.resolve(root, `.${pathname}`);
  if (!filename.startsWith(root + path.sep) && filename !== path.join(root, 'index.html')) {
    res.writeHead(403).end('Acceso denegado'); return;
  }
  fs.stat(filename, (statError, stat) => {
    if (statError || !stat.isFile()) { res.writeHead(404).end('No se encontró el archivo'); return; }
    res.writeHead(200, { 'Content-Type': mime[path.extname(filename).toLowerCase()] || 'application/octet-stream' });
    fs.createReadStream(filename).pipe(res);
  });
});

server.on('error', error => {
  if (error.code === 'EADDRINUSE') console.error(`El puerto ${port} ya está ocupado. Cierra otro servidor o prueba PORT=8001.`);
  else console.error(error);
  process.exitCode = 1;
});
server.listen(port, '127.0.0.1', () => {
  const url = `http://127.0.0.1:${port}/`;
  console.log(`Operación Extracción está disponible en ${url}. Abre esa dirección en el navegador; detén el servidor con Ctrl+C.`);
});
