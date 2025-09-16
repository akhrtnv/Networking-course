import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
const __dirname = path.dirname(fileURLToPath(import.meta.url))

const port = 8080;

const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8'
};

http.createServer((req, res) => {
  const url = (req.url || '/').split('?')[0];
  const file = url === '/' ? 'index.html' : url.slice(1);
  const p = path.join(__dirname, file);
  fs.readFile(p, (err, data) => {
    if (err) { res.statusCode = 404; return res.end('404'); }
    const ext = path.extname(p).toLowerCase();
    if (types[ext]) res.setHeader('Content-Type', types[ext]);
    res.end(data);
  });
}).listen(port, () => console.log(`http://localhost:${port}`));
