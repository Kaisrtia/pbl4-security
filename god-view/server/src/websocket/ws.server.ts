import { WebSocketServer, WebSocket } from 'ws';
import type { Server } from 'http';
import type { TelemetryPayload } from '@pbl4/shared';

let wss: WebSocketServer | null = null;
const connectedClients = new Set<WebSocket>();

export function setupWebSocket(httpServer: Server): WebSocketServer {
  wss = new WebSocketServer({ server: httpServer });

  wss.on('connection', (ws) => {
    connectedClients.add(ws);
    console.log(`[God-View WS] Client kết nối mới. Tổng client: ${connectedClients.size}`);

    // Gửi message chào mừng
    ws.send(
      JSON.stringify({
        type: 'SYSTEM',
        message: 'Connected to God-View Realtime Telemetry Stream'
      })
    );

    ws.on('close', () => {
      connectedClients.delete(ws);
      console.log(`[God-View WS] Client ngắt kết nối. Còn lại: ${connectedClients.size}`);
    });

    ws.on('error', (err) => {
      console.error('[God-View WS] Lỗi socket:', err.message);
      connectedClients.delete(ws);
    });
  });

  return wss;
}

export function broadcastTelemetry(payload: TelemetryPayload): void {
  const message = JSON.stringify(payload);
  for (const client of connectedClients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  }
}
