// Tiny dependency-free static server to simulate GitHub Pages hosting under /hero-message-day/.
const http = require('http');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..', 'ghpages-sim');
const port = 8090;
const logFile = path.join(__dirname, '..', 'ghpages-sim', 'requests.log');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ttf': 'font/ttf',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain',
};

function log(line) {
  try {
    fs.appendFileSync(logFile, new Date().toISOString() + ' ' + line + '\n');
  } catch (e) {
    /* ignore */
  }
}

http
  .createServer((req, res) => {
    let urlPath = decodeURIComponent(req.url.split('?')[0]);
    if (urlPath.endsWith('/')) urlPath += 'index.html';
    const filePath = path.join(root, urlPath);
    const resolved = path.resolve(filePath);
    if (!resolved.startsWith(path.resolve(root))) {
      res.writeHead(403, { 'Content-Type': 'text/plain' });
      res.end('Forbidden');
      log('403 ' + req.url);
      return;
    }
    fs.readFile(resolved, (err, data) => {
      if (err) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found: ' + urlPath);
        log('404 ' + req.url);
        return;
      }
      const ext = path.extname(filePath).toLowerCase();
      res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
      res.end(data);
    });
  })
  .listen(port, () => {
    console.log('Serving ' + root + ' on http://localhost:' + port + '/hero-message-day/');
  });
