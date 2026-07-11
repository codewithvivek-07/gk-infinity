/**
 * GK Infinity Production Node.js Server & API Proxy
 * Runs on standard Node.js without external dependencies.
 * Serves static assets and proxies Firestore API to keep credentials private.
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 5174;
const FIRESTORE_HOST = 'firestore.googleapis.com';
const FIRESTORE_PATH_PREFIX = '/v1/projects/edufinity-26856/databases/(default)/documents';

// Helper to serve files with correct MIME types
function serveStaticFile(res, filePath, contentType) {
  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        // Fallback to index.html for SPA router support
        const indexHtmlPath = path.join(__dirname, 'dist', 'index.html');
        fs.readFile(indexHtmlPath, (indexErr, indexContent) => {
          if (indexErr) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('404 Not Found');
          } else {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(indexContent, 'utf-8');
          }
        });
      } else {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end(`500 Internal Error: ${err.code}`);
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
}

const server = http.createServer((req, res) => {
  // CORS Configuration
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // 1. API Route Proxying
  if (req.url === '/api/batches' || req.url === '/api/pages') {
    const endpoint = req.url.split('/').pop();
    const targetPath = `${FIRESTORE_PATH_PREFIX}/${endpoint}`;
    
    console.log(`[Proxy] Forwarding /api/${endpoint} to HTTPS://${FIRESTORE_HOST}${targetPath}`);

    const options = {
      hostname: FIRESTORE_HOST,
      path: targetPath,
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'GKInfinity-Node-Proxy'
      }
    };

    const proxyReq = https.request(options, (proxyRes) => {
      res.writeHead(proxyRes.statusCode, {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store'
      });
      proxyRes.pipe(res);
    });

    proxyReq.on('error', (err) => {
      console.error(`[Proxy Error] Upstream call for /api/${endpoint} failed:`, err);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Gateway Proxy Error', details: err.message }));
    });

    proxyReq.end();
    return;
  }

  // 2. Production Static Files Server
  let reqUrl = req.url === '/' ? '/index.html' : req.url;
  reqUrl = reqUrl.split('?')[0]; // strip query parameters
  
  const distDir = path.join(__dirname, 'dist');
  const filePath = path.join(distDir, reqUrl);
  const extname = path.extname(filePath);
  
  let contentType = 'text/html';
  switch (extname) {
    case '.js':
      contentType = 'text/javascript';
      break;
    case '.css':
      contentType = 'text/css';
      break;
    case '.json':
      contentType = 'application/json';
      break;
    case '.png':
      contentType = 'image/png';
      break;
    case '.jpg':
    case '.jpeg':
      contentType = 'image/jpeg';
      break;
    case '.svg':
      contentType = 'image/svg+xml';
      break;
    case '.ico':
      contentType = 'image/x-icon';
      break;
  }

  serveStaticFile(res, filePath, contentType);
});

server.listen(PORT, () => {
  console.log(`GK Infinity backend proxy server running at http://localhost:${PORT}/`);
  console.log(`Frontend Directory: ${path.join(__dirname, 'dist')}`);
  console.log(`Local APIs proxying requests to Google Firestore API securely.`);
});
