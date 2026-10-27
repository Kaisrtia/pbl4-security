> Thiết kế cũ, giữ để tham khảo. Xem [kiến trúc mới](../system-architecture.md).

# Tài Liệu Thiết Kế Kiến Trúc Hệ Thống & Giao Thức Truyền Tin - PBL4

**Mã hạng mục:** T1-ALL (Milestone 1 - Tuần 1)
**Thành viên thực hiện:**
- **Trung (T1-TV1):** Phụ trách `client_node` & `target_server` (Docker network, Linux capabilities, Vulnerable App, OS Agent đọc bảng mạng)
- **Trí (T1-TV2):** Phụ trách `hacker_node` (Kịch bản tấn công L2/L4: ARP Spoofing, SYN Flood, TCP RST Injection)
- **Nguyên (T1-TV3):** Phụ trách `god_view` (WebSocket Server thu thập log, Mockup UI 4 khu vực thời gian thực)

---

## 1. Kiến Trúc Mạng Docker (Docker Network Topology)

### 1.1. Quy hoạch Subnet & Địa chỉ IP tĩnh (Static IP)
Toàn bộ 4 container nằm trong một mạng Bridge tự định nghĩa tên là **`cyber_net`** với dải mạng **`172.20.0.0/24`** (Gateway: `172.20.0.1`).

| Tên Container | Vai trò | Địa chỉ IP tĩnh | Port nội bộ | Port Host | Phụ trách chính |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`client_node`** | Giả lập người dùng (Gửi HTTP Login & giữ kết nối TCP) | `172.20.0.10` | 3000 | 3000 | Trung (T1-TV1) |
| **`target_server`** | App Server + Database (SQLite) + OS Agent đọc bảng mạng | `172.20.0.20` | 8080 (HTTP)<br>9000 (TCP) | 8080 | Trung (T1-TV1) |
| **`hacker_node`** | Máy tấn công (Chứa script ARP, SYN Flood, TCP RST) | `172.20.0.66` | 5000 (Control API) | *Không mở* | Trí (T1-TV2) |
| **`god_view`** | WebSocket Server thu thập log & Giao diện Thượng đế | `172.20.0.99` | 4000 (WS/API)<br>5173 (Web UI) | 4000<br>5173 | Nguyên (T1-TV3) |

---

## 2. Hai Luồng Mạng Tách Biệt

1. **Luồng 1 — Luồng Đời thực (Real Traffic):**
   - Giữa `client_node` (172.20.0.10) và `target_server` (172.20.0.20): Gửi yêu cầu HTTP Login, tải tài nguyên, duy trì phiên kết nối TCP.
   - `hacker_node` (172.20.0.66) can thiệp vào giữa luồng này để nghe lén gói tin (ARP Spoof), bơm gói RST cắt đứt kết nối hoặc flood gói tin SYN.

2. **Luồng 2 — Luồng Báo Cáo (Telemetry Traffic):**
   - Cả 3 máy (`client_node`, `target_server`, `hacker_node`) định kỳ và theo sự kiện gửi bản tin JSON về cho `god_view` (`http://172.20.0.99:4000/api/telemetry`).
   - `god_view` đẩy dữ liệu thời gian thực lên Dashboard qua WebSocket `ws://localhost:4000`.

---

## 3. Đặc Tả 3 Kịch Bản Tấn Công Mạng (T1-TV2 - Trí)

### Kịch bản 1: ARP Spoofing + Sniffing (Tấn công Lớp 2 - Data Link)
- **Lệnh thực thi:** `arpspoof -i eth0 -t 172.20.0.10 -r 172.20.0.20`
- **Hiện tượng & Dữ liệu:**
  - Bảng ARP của Client và Server bị ghi đè: cả hai đều trỏ về địa chỉ MAC của Hacker (`MAC_HACKER`).
  - Khi Client gửi `POST /api/login` (chứa username/password), gói tin bị bẻ cong đi qua Hacker (`172.20.0.66`). Script Scapy của Trí bắt được gói tin HTTP và trích xuất thông tin gửi về God-View.

### Kịch bản 2: TCP SYN Flood bằng `hping3` (Tấn công Lớp 4 - Transport)
- **Lệnh thực thi:** `hping3 -S -p 8080 --rand-source --interval u1000 172.20.0.20`
- **Hiện tượng & Dữ liệu:**
  - Hàng trăm cờ SYN từ IP giả mạo gửi đến Server làm số lượng kết nối `SYN_RECV` tăng vọt lấp đầy hàng đợi backlog.
  - Client thử gửi request thì bị Timeout.
  - **Phòng thủ:** Server bật `sysctl -w net.ipv4.tcp_syncookies=1` $\rightarrow$ Server kích hoạt SYN Cookies và Client truy cập lại bình thường.

### Kịch bản 3: TCP RST Injection bằng `tcpkill` / Scapy (Tấn công Lớp 4 - Cắt đứt kết nối)
- **Lệnh thực thi:** `tcpkill -i eth0 host 172.20.0.10 and port 8080` (hoặc script Scapy đọc seq/ack rồi bơm gói TCP RST giả mạo).
- **Hiện tượng & Dữ liệu:**
  - Kết nối `ESTABLISHED` trên bảng TCP của Server biến mất ngay lập tức.
  - Client nhận lỗi `Connection reset by peer` (Mất kết nối đột ngột).

---

## 4. Quy Tắc Thiết Kế Giao Diện Mockup God-View (T1-TV3 - Nguyên)

Giao diện Dashboard của God-View được chia làm **4 khu vực trực quan**:

1. **Khu vực 1 - Sơ đồ Topology Mạng (Giữa màn hình):**
   - 3 Node chính: Client (`172.20.0.10`), Server (`172.20.0.20`), Hacker (`172.20.0.66`).
   - Bình thường: Đường nối xanh lá thẳng Client ↔ Server.
   - Khi `attack_mode == "ARP_SPOOF"`: Đường nối thẳng bị mờ đi, xuất hiện đường màu cam đi vòng: Client → Hacker → Server.
   - Khi `attack_mode == "SYN_FLOOD"`: Hàng loạt chấm đỏ bắn liên tục từ Hacker → Server, Node Server nhấp nháy cảnh báo quá tải.
   - Khi `attack_mode == "TCP_RST"`: Tia sét màu đỏ từ Hacker đánh vào đường nối Client - Server làm đứt đôi kết nối.
2. **Khu vực 2 - Bảng ARP Cache (Góc trái dưới):**
   - Ánh xạ IP $\rightarrow$ MAC của Client và Server. Khi bị ARP Spoofing, dòng bị giả mạo chuyển sang nền đỏ (`POISONED!`).
3. **Khu vực 3 - Bảng Trạng thái TCP & OS Config (Góc phải trên):**
   - Thanh trạng thái `syn_cookies: OFF/ON`.
   - Bộ đếm `SYN_RECV` (tăng vọt khi bị SYN Flood).
   - Danh sách các kết nối `ESTABLISHED` (biến mất khi bị TCP RST Injection).
4. **Khu vực 4 - Live Terminal Log (Góc dưới cùng):**
   - Nối chuỗi trường `payload.terminal_log` từ cả 3 node theo thứ tự thời gian.
   - Phân biệt màu chữ: Xanh dương (CLIENT), Xanh lá (SERVER), Đỏ (HACKER).
