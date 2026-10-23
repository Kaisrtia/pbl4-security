import type { TelemetryPayload } from '@pbl4/shared';

const wsStatus = document.getElementById('wsStatus') as HTMLDivElement;
const wsStatusText = document.getElementById('wsStatusText') as HTMLSpanElement;
const logStream = document.getElementById('logStream') as HTMLDivElement;

const countTotal = document.getElementById('countTotal') as HTMLDivElement;
const countSqli = document.getElementById('countSqli') as HTMLDivElement;
const countDos = document.getElementById('countDos') as HTMLDivElement;
const countMitm = document.getElementById('countMitm') as HTMLDivElement;

let totalCount = 0;
let sqliCount = 0;
let dosCount = 0;
let mitmCount = 0;
let hasReceivedLogs = false;

function connectWebSocket() {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${protocol}//${window.location.host}`;

  const ws = new WebSocket(wsUrl);

  ws.onopen = () => {
    wsStatus.style.background = '#022c22';
    wsStatus.style.color = '#10b981';
    wsStatus.style.borderColor = '#065f46';
    wsStatusText.textContent = 'WebSocket: Đã kết nối';
  };

  ws.onclose = () => {
    wsStatus.style.background = '#450a0a';
    wsStatus.style.color = '#f87171';
    wsStatus.style.borderColor = '#991b1b';
    wsStatusText.textContent = 'WebSocket: Mất kết nối (Thử lại sau 3s...)';
    setTimeout(connectWebSocket, 3000);
  };

  ws.onerror = () => {
    ws.close();
  };

  ws.onmessage = (event) => {
    try {
      const payload = JSON.parse(event.data) as TelemetryPayload;
      if (!payload.source || !payload.eventType) return;
      handleTelemetryMessage(payload);
    } catch {
      // Bỏ qua message không phải JSON
    }
  };
}

function handleTelemetryMessage(payload: TelemetryPayload) {
  if (!hasReceivedLogs) {
    logStream.innerHTML = '';
    hasReceivedLogs = true;
  }

  totalCount++;
  countTotal.textContent = totalCount.toString();

  const dataStr = JSON.stringify(payload.data || {});
  if (dataStr.includes('SQL_INJECTION') || (payload.data as any)?.attackType === 'SQL_INJECTION') {
    sqliCount++;
    countSqli.textContent = sqliCount.toString();
  }
  if (dataStr.includes('DOS') || (payload.data as any)?.attackType === 'DOS') {
    dosCount++;
    countDos.textContent = dosCount.toString();
  }
  if (dataStr.includes('MITM') || (payload.data as any)?.attackType === 'MITM') {
    mitmCount++;
    countMitm.textContent = mitmCount.toString();
  }

  const entry = document.createElement('div');
  entry.className = `log-entry ${payload.severity || 'INFO'}`;
  entry.innerHTML = `
    <div class="log-meta">
      <span>
        <span class="tag tag-${payload.source}">${payload.source}</span>
        <strong>${payload.eventType}</strong>
      </span>
      <span>${new Date(payload.timestamp).toLocaleTimeString()}</span>
    </div>
    <div>${escapeHtml(JSON.stringify(payload.data, null, 2))}</div>
  `;

  logStream.prepend(entry);
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// Khởi chạy kết nối
connectWebSocket();
