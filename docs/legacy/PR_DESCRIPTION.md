## 📌 Summary
This Pull Request aligns the monorepo architecture, Docker network topology, and telemetry schemas with the official specification defined in **Báo cáo - PBL4 (Milestone 1 - Tuần 1)**.

The system establishes a 4-container virtualized infrastructure on the custom Docker bridge network `cyber_net` (`172.20.0.0/24`), enabling Layer 2 and Layer 4 attack simulations and real-time SIEM observation.

---

## 🏗️ 4-Container Topology & Static IP Allocation

| Container | Role | Static IP | Internal Port | Host Port | Assignee |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`client_node`** | Simulated user (HTTP Login, active TCP sessions) | `172.20.0.10` | 3000 | 3000 | Trung (T1-TV1) |
| **`target_server`** | Vulnerable App + SQLite DB + OS Network Agent | `172.20.0.20` | 8080 (HTTP)<br>9000 (TCP) | 8080 | Trung (T1-TV1) |
| **`hacker_node`** | Attack orchestration (ARP, SYN Flood, TCP RST) | `172.20.0.66` | 5000 (Control API) | *Internal* | Trí (T1-TV2) |
| **`god_view`** | Telemetry ingestion hub & 4-Quadrant Live Dashboard | `172.20.0.99` | 4000 (WS/API)<br>5173 (Web UI) | 4000<br>5173 | Nguyên (T1-TV3) |

---

## ⚔️ 3 Layer 2 / Layer 4 Attack Scenarios
1. **Scenario 1: ARP Spoofing + Sniffing (Layer 2 - Data Link)**
   - Mechanism: `arpspoof -i eth0 -t 172.20.0.10 -r 172.20.0.20`
   - Bends client-server route through hacker node; Scapy extracts unencrypted HTTP credentials.
2. **Scenario 2: TCP SYN Flood via `hping3` (Layer 4 - Transport)**
   - Mechanism: `hping3 -S -p 8080 --rand-source --interval u1000 172.20.0.20`
   - Saturates server `SYN_RECV` backlog queue, timing out legitimate client connections.
   - Defense: Server activates `sysctl -w net.ipv4.tcp_syncookies=1`.
3. **Scenario 3: TCP RST Injection via `tcpkill` / Scapy (Layer 4 - Connection Termination)**
   - Mechanism: Injects forged TCP RST packets matching active sequence numbers to instantly drop `ESTABLISHED` sessions.

---

## 👁️ 4-Quadrant God-View Dashboard
1. **Quadrant 1 (Center):** Network Topology Map with live animated packets (Normal green link, orange detour for ARP Spoof, red flood for SYN Flood, red break for TCP RST).
2. **Quadrant 2 (Bottom-Left):** Real-time ARP Cache table highlighting poisoned entries (`POISONED!`).
3. **Quadrant 3 (Top-Right):** TCP State & OS Config inspector (`syn_cookies` switch, `SYN_RECV` backlog counter, active `ESTABLISHED` sockets).
4. **Quadrant 4 (Bottom-Right):** Synchronized multi-node live terminal log color-coded by source (Blue: Client, Green: Server, Red: Hacker).

---

## 📡 Standardized Telemetry Schema (Phase 0 Contract)
- **Ingestion:** `POST http://172.20.0.99:4000/api/telemetry`
- **Streaming:** `ws://localhost:4000` (`event: "GOD_VIEW_UPDATE"`)
- **Event Types:** `STATE_SNAPSHOT` (1-2s periodic sync), `PACKET_EVENT` (attack triggers/results), `APP_EVENT` (user interactions).
