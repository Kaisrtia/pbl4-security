# PBL4 - Hệ Thống Mô Phỏng & Giám Sát Tấn Công Mạng (Cyber Attack Simulation & Monitoring System)

**Mã hạng mục:** T1-ALL (Milestone 1 - Tuần 1)  
**Nhóm sinh viên thực hiện:**
- **Trung (T1-TV1):** Phụ trách `client_node` (172.20.0.10) & `target_server` (172.20.0.20)
- **Trí (T1-TV2):** Phụ trách `hacker_node` (172.20.0.66)
- **Nguyên (T1-TV3):** Phụ trách `god_view` (172.20.0.99)

---

## 📌 1. Kiến Trúc Mạng Docker (4 Containers - `cyber_net: 172.20.0.0/24`)

| Tên Container | Vai trò | IP tĩnh | Port nội bộ | Port Host | Phụ trách chính |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`client_node`** | Giả lập người dùng (Gửi HTTP Login & giữ TCP) | `172.20.0.10` | 3000 | 3000 | Trung (T1-TV1) |
| **`target_server`** | App Server + Database (SQLite) + OS Agent đọc bảng mạng | `172.20.0.20` | 8080 (HTTP)<br>9000 (TCP) | 8080 | Trung (T1-TV1) |
| **`hacker_node`** | Máy tấn công (Chứa script ARP, SYN Flood, TCP RST) | `172.20.0.66` | 5000 (Control API) | *Không mở* | Trí (T1-TV2) |
| **`god_view`** | WebSocket Server thu thập log & Giao diện Thượng đế | `172.20.0.99` | 4000 (WS/API)<br>5173 (Web UI) | 4000<br>5173 | Nguyên (T1-TV3) |

---

## ⚔️ 2. Ba Kịch Bản Tấn Công Chính (L2 & L4)
1. **Kịch bản 1: ARP Spoofing + Sniffing (Lớp 2 - Data Link)**
   - Lệnh: `arpspoof -i eth0 -t 172.20.0.10 -r 172.20.0.20`
   - Bảng ARP bị ghi đè, bẻ cong gói tin đăng nhập đi qua Hacker, Scapy giải mã mật khẩu.
2. **Kịch bản 2: TCP SYN Flood bằng `hping3` (Lớp 4 - Transport)**
   - Lệnh: `hping3 -S -p 8080 --rand-source --interval u1000 172.20.0.20`
   - Gây nghẽn hàng đợi `SYN_RECV`, Client bị Timeout. Phòng thủ bằng `sysctl -w net.ipv4.tcp_syncookies=1`.
3. **Kịch bản 3: TCP RST Injection bằng `tcpkill` / Scapy (Lớp 4 - Cắt đứt kết nối)**
   - Lệnh: `tcpkill -i eth0 host 172.20.0.10 and port 8080`
   - Bơm gói TCP RST giả mạo, ngắt kết nối `ESTABLISHED` ngay lập tức.
*(Kịch bản mở rộng: Tấn công Web SQL Injection `' OR 1=1 --`).*

---

## 👁️ 3. Giao Diện God-View Dashboard (4 Khu Vực Trực Quan)
1. **Khu vực 1 (Giữa màn hình):** Sơ đồ Topology Mạng (3 node: Client ↔ Server và Hacker; vẽ hiệu ứng hạt dữ liệu bay & đổi màu theo trạng thái tấn công).
2. **Khu vực 2 (Góc trái dưới):** Bảng ARP Cache (tự động báo đỏ `POISONED!` khi bị ARP Spoofing).
3. **Khu vực 3 (Góc phải trên):** Bảng trạng thái TCP & OS Config (thanh `syn_cookies: OFF/ON`, bộ đếm `SYN_RECV`, danh sách `ESTABLISHED`).
4. **Khu vực 4 (Góc dưới cùng):** Live Terminal Log (nối chuỗi `terminal_log` từ cả 3 node theo thời gian: Xanh dương = Client, Xanh lá = Server, Đỏ = Hacker).

---

## 📡 4. Chuẩn Hóa Bản Tin Telemetry JSON (Chặng 0)
- **Endpoint nhận sự kiện:** `POST http://172.20.0.99:4000/api/telemetry`
- **Kênh WebSocket đẩy lên UI:** `ws://localhost:4000` (event: `"GOD_VIEW_UPDATE"`)
- **Chi tiết Envelope & Payloads:** Xem tại [`docs/telemetry-spec.md`](./docs/telemetry-spec.md).

---

## 🚀 5. Khởi Chạy Hệ Thống

```bash
# Khởi chạy toàn bộ 4 containers trong mạng cyber_net
docker compose up -d

# Xem log God-View
docker logs -f god_view
```
