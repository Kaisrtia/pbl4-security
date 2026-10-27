import { WebSocketServer, WebSocket } from 'ws';
import type { Server } from 'http';
import type { TelemetryEnvelope } from '@pbl4/shared';

let wss: WebSocketServer | null = null;
const connectedClients = new Set<WebSocket>();

export function setupWebSocket(httpServer: Server): WebSocketServer {
  wss = new WebSocketServer({ server: httpServer });

  wss.on('connection', (ws) => {
    connectedClients.add(ws);
    console.log(`[God-View WS] Client kết nối mới. Tổng client: ${connectedClients.size}`);

    // Gửi event chào mừng
    ws.send(
      JSON.stringify({
        event: 'GOD_VIEW_UPDATE',
        data: {
          event_type: 'APP_EVENT',
          source_node: 'SERVER',
          payload: {
            action: 'LOGIN_ATTEMPT',
            terminal_log: '[GOD-VIEW] Sẵn sàng nhận luồng dữ liệu từ cyber_net (172.20.0.0/24)'
          }
        }
      })
    );

    ws.on('close', () => {
      connectedClients.delete(ws);
    });

    ws.on('error', () => {
      connectedClients.delete(ws);
    });
  });

  return wss;
}

export function broadcastTelemetry(envelope: TelemetryEnvelope): void {
  const message = JSON.stringify({
    event: 'GOD_VIEW_UPDATE',
    data: envelope
  });

  for (const client of connectedClients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  }
}
