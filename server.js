import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { WebSocket, WebSocketServer } from 'ws';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = process.env.PORT || 3001;

function broadcast(payload) {
  const message = JSON.stringify(payload);
  for (const client of wss.clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  }
}

const server = http.createServer((req, res) => {
  const htmlPath = path.join(__dirname, 'public', 'index.html');

  fs.readFile(htmlPath, (err, data) => {
    if (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Failed to load chat UI');
      return;
    }

    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(data);
  });
});

const wss = new WebSocketServer({ server });

wss.on('connection', (socket, req) => {
  const username =
    new URL(req.url, 'http://localhost').searchParams.get('username') ||
    'Anonymous';

  broadcast({
    type: 'system',
    text: `${username} joined`,
  });

  socket.on('message', (rawData) => {
    try {
      const parsed = JSON.parse(rawData.toString());
      broadcast({
        type: 'chat',
        username: parsed.username ?? username,
        text: parsed.text,
      });
    } catch {
      // Ignore malformed JSON frames
    }
  });

  socket.on('close', () => {
    broadcast({
      type: 'system',
      text: `${username} left`,
    });
  });
});

server.listen(PORT, () => {
  console.log('Chat server running at http://localhost:3001');
});