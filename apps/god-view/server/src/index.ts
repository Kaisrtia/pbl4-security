import express from 'express';
import cors from 'cors';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { telemetryRouter } from './routes/telemetry.routes.js';
import { setupWebSocket } from './websocket/ws.server.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Telemetry API routes
app.use('/api', telemetryRouter);

// Serve Static Web Dashboard (Client)
const clientPath = path.resolve(__dirname, '../../client');
app.use(express.static(clientPath));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'God-View Server & UI', port: PORT });
});

// Tạo HTTP Server và gắn WebSocket Server
const httpServer = http.createServer(app);
setupWebSocket(httpServer);

httpServer.listen(PORT, () => {
  console.log(`[God-View Server & UI] Đang chạy tại http://localhost:${PORT}`);
  console.log(`[God-View WebSocket] ws://localhost:${PORT}`);
  console.log(`[God-View Telemetry Ingest] POST http://localhost:${PORT}/api/telemetry`);
});
