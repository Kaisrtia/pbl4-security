import type {
  TelemetryEnvelope,
  StateSnapshotPayload,
  PacketEventPayload,
  AppEventPayload
} from '@pbl4/shared';

// DOM Elements
const wsStatusBadge = document.getElementById('wsStatusBadge') as HTMLSpanElement;
const synCookieBadge = document.getElementById('synCookieBadge') as HTMLSpanElement;
const attackModeTag = document.getElementById('attackModeTag') as HTMLSpanElement;
const arpStatusTag = document.getElementById('arpStatusTag') as HTMLSpanElement;

// Topology elements
const lineNormal = document.getElementById('lineNormal') as unknown as SVGLineElement;
const pathArpSpoof = document.getElementById('pathArpSpoof') as unknown as SVGPathElement;
const lineHackerAttack = document.getElementById('lineHackerAttack') as unknown as SVGLineElement;
const nodeServer = document.getElementById('nodeServer') as HTMLDivElement;

// Stats
const countEstablished = document.getElementById('countEstablished') as HTMLDivElement;
const countSynRecv = document.getElementById('countSynRecv') as HTMLDivElement;
const countTimeWait = document.getElementById('countTimeWait') as HTMLDivElement;

// Tables
const arpTableBody = document.getElementById('arpTableBody') as HTMLTableSectionElement;
const tcpConnectionsBody = document.getElementById('tcpConnectionsBody') as HTMLTableSectionElement;
const terminalLogBox = document.getElementById('terminalLogBox') as HTMLDivElement;
const btnClearLogs = document.getElementById('btnClearLogs') as HTMLButtonElement;

// WebSocket connection
function connectWebSocket() {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${protocol}//${window.location.host}`;

  const ws = new WebSocket(wsUrl);

  ws.onopen = () => {
    wsStatusBadge.textContent = 'WEBSOCKET: CONNECTED';
    wsStatusBadge.className = 'badge badge-live';
  };

  ws.onclose = () => {
    wsStatusBadge.textContent = 'WEBSOCKET: DISCONNECTED';
    wsStatusBadge.style.background = '#7f1d1d';
    wsStatusBadge.style.color = '#fca5a5';
    setTimeout(connectWebSocket, 3000);
  };

  ws.onmessage = (event) => {
    try {
      const message = JSON.parse(event.data);
      // Hỗ trợ cả envelope bọc trong event "GOD_VIEW_UPDATE" hoặc bản tin trực tiếp
      const envelope: TelemetryEnvelope = message.data || message;
      handleTelemetry(envelope);
    } catch {
      // Ignore parse error
    }
  };
}

function handleTelemetry(envelope: TelemetryEnvelope) {
  if (!envelope || !envelope.event_type) return;

  switch (envelope.event_type) {
    case 'STATE_SNAPSHOT':
      handleStateSnapshot(envelope.payload as StateSnapshotPayload);
      break;
    case 'PACKET_EVENT':
    case 'ATTACK_STATUS':
      handlePacketEvent(envelope.payload as PacketEventPayload);
      break;
    case 'APP_EVENT':
      handleAppEvent(envelope.payload as AppEventPayload, envelope.source_node);
      break;
  }
}

// 1. Cập nhật Bảng ARP & Bảng TCP (Khu vực 2 & Khu vực 3)
function handleStateSnapshot(payload: StateSnapshotPayload) {
  if (!payload) return;

  // OS Config (syn_cookies)
  if (payload.os_config) {
    const isSynCookieOn = payload.os_config.syn_cookies === 1;
    synCookieBadge.textContent = `SYN COOKIES: ${isSynCookieOn ? 'ON (PROTECTED)' : 'OFF'}`;
    synCookieBadge.style.background = isSynCookieOn ? '#065f46' : '#374151';
    synCookieBadge.style.color = isSynCookieOn ? '#34d399' : '#d1d5db';
  }

  // TCP Summary
  if (payload.tcp_summary) {
    countEstablished.textContent = payload.tcp_summary.established_count.toString();
    countSynRecv.textContent = payload.tcp_summary.syn_recv_count.toString();
    countTimeWait.textContent = payload.tcp_summary.time_wait_count.toString();

    // Nếu SYN_RECV tăng vọt (> 10) -> báo động quá tải Server
    if (payload.tcp_summary.syn_recv_count > 10) {
      nodeServer.classList.add('node-danger-pulse');
    } else {
      nodeServer.classList.remove('node-danger-pulse');
    }
  }

  // TCP Connections Table
  if (payload.tcp_connections && Array.isArray(payload.tcp_connections)) {
    tcpConnectionsBody.innerHTML = payload.tcp_connections
      .map(
        (c) => `
      <tr>
        <td>${c.local}</td>
        <td>${c.remote}</td>
        <td><span style="color: ${c.state === 'ESTABLISHED' ? '#34d399' : c.state === 'SYN_RECV' ? '#ef4444' : '#94a3b8'}; font-weight: bold;">${c.state}</span></td>
      </tr>
    `
      )
      .join('');
  }

  // ARP Table
  if (payload.arp_table && Array.isArray(payload.arp_table)) {
    let hasSpoof = false;
    arpTableBody.innerHTML = payload.arp_table
      .map((entry) => {
        if (entry.is_spoofed) hasSpoof = true;
        return `
          <tr class="${entry.is_spoofed ? 'row-poisoned' : ''}">
            <td>${entry.ip}</td>
            <td>${entry.mac}</td>
            <td>${entry.is_spoofed ? '<span style="color:#ef4444;">⚠️ POISONED (Bị đầu độc)</span>' : '<span style="color:#10b981;">Hợp lệ</span>'}</td>
          </tr>
        `;
      })
      .join('');

    arpStatusTag.textContent = hasSpoof ? 'POISONED!' : 'CLEAN';
    arpStatusTag.style.color = hasSpoof ? '#ef4444' : '#10b981';
  }
}

// 2. Cập nhật Hiệu ứng Sơ đồ Topology (Khu vực 1) & Terminal Log từ Hacker
function handlePacketEvent(payload: PacketEventPayload) {
  if (!payload) return;

  if (payload.attack_mode === 'ARP_SPOOF') {
    attackModeTag.textContent = 'CẢNH BÁO: ĐANG BỊ ARP SPOOFING (ĐƯỜNG TRUYỀN BỊ BẺ CONG)';
    attackModeTag.style.color = '#f59e0b';
    lineNormal.style.opacity = '0.15';
    pathArpSpoof.style.opacity = '1';
    lineHackerAttack.style.opacity = '0';
  } else if (payload.attack_mode === 'SYN_FLOOD') {
    attackModeTag.textContent = 'NGUY HIỂM: ĐANG BỊ TẤN CÔNG TCP SYN FLOOD DỒN DẬP!';
    attackModeTag.style.color = '#ef4444';
    lineHackerAttack.style.opacity = '1';
    nodeServer.classList.add('node-danger-pulse');
  } else if (payload.attack_mode === 'TCP_RST') {
    attackModeTag.textContent = 'CẢNH BÁO: BỊ TIÊM GÓI TCP RST (CẮT ĐỨT KẾT NỐI)';
    attackModeTag.style.color = '#ef4444';
    lineNormal.style.stroke = '#ef4444';
    setTimeout(() => {
      lineNormal.style.stroke = '#10b981';
    }, 2000);
  }

  if (payload.terminal_log) {
    appendLog(payload.terminal_log, 'log-hacker');
  }
}

// 3. Cập nhật Sự Kiện Ứng Dụng (Khu vực 4 - Terminal Log)
function handleAppEvent(payload: AppEventPayload, source: string) {
  if (!payload) return;
  const logClass = source === 'CLIENT' ? 'log-client' : 'log-server';
  if (payload.terminal_log) {
    appendLog(payload.terminal_log, logClass);
  }
}

function appendLog(text: string, className: string) {
  const line = document.createElement('div');
  line.className = className;
  const timeStr = new Date().toLocaleTimeString();
  line.textContent = `[${timeStr}] ${text}`;
  terminalLogBox.appendChild(line);
  terminalLogBox.scrollTop = terminalLogBox.scrollHeight;
}

btnClearLogs?.addEventListener('click', () => {
  terminalLogBox.innerHTML = '';
});

// Khởi chạy WebSocket
connectWebSocket();
