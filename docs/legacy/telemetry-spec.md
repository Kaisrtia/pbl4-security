# Quy Trình Nối Tiếp (Pipeline) & Chuẩn Bản Tin Telemetry - PBL4

> Tài liệu chính thức được trích xuất và chuẩn hóa từ **Báo cáo Kế hoạch Tuần 1 - PBL4**.

---

## 1. Chặng 0: Cả nhóm thống nhất quy ước

### 1.1. Bảng phân chia phân hệ & Endpoint bắt buộc

| Phân hệ | Người phụ trách | Địa chỉ / Cổng (Port) | Các Endpoint bắt buộc phải mở |
| :--- | :--- | :--- | :--- |
| **Target App & Server** *(Client + Backend)* | Thành viên 1 | `http://localhost:3000` | • `POST /api/login`: Nhận `{ username, password }` trả về Token/Session.<br>• `GET /api/resources`: Trả về danh sách tài nguyên mật (khi đã đăng nhập). |
| **Attacker Controller** *(Trạm điều khiển Hacker)* | Thành viên 2 | `http://localhost:5000`<br>*(hoặc chạy qua CLI)* | • `POST /attack/mitm`: Bật/tắt chế độ nghe lén trên đường truyền.<br>• `POST /attack/sqli`: Kích hoạt bắn payload SQL Injection vào cổng 3000.<br>• `POST /attack/dos`: Kích hoạt bắn 50 requests/giây vào cổng 3000. |
| **God-View Server & UI** *(Trạm quan sát Thượng Đế)* | Thành viên 3 | `http://localhost:4000` | • `POST /api/telemetry`: Nhận toàn bộ bản tin JSON từ TV1 và TV2 bắn về.<br>• `ws://localhost:4000`: Luồng WebSocket đẩy dữ liệu thẳng lên giao diện Web. |

---

### 1.2. Cấu Trúc JSON Chuẩn

```json
{
  "event_id": "evt_001",
  "timestamp": "2026-10-23T08:30:00.000Z",
  "scenario": "NORMAL_LOGIN | MITM_SNIFF | SQL_INJECTION | DOS_FLOOD",
  "actor": "CLIENT | NETWORK | SERVER | HACKER",
  "direction": "CLIENT_TO_SERVER | SERVER_TO_CLIENT | NETWORK_TO_HACKER | HACKER_TO_SERVER",
  "status": "INFO | COMPROMISED | DANGER | BLOCKED",
  "summary": "Mô tả ngắn gọn 1 dòng để hiện lên thanh trạng thái trên UI",
  "technical_details": {
    "http_method": "POST",
    "endpoint": "/api/login",
    "raw_payload": "Nội dung gói tin hoặc dữ liệu truyền đi",
    "server_internal_execution": "Câu lệnh SQL thực tế hoặc trạng thái xử lý bên trong Server"
  }
}
```

---

### 1.3. Quy ước ý nghĩa các giá trị (Để Thành viên 3 lập trình hiệu ứng hình ảnh):

- **`direction` (Hướng bay của hạt dữ liệu trên sơ đồ Topology):**
  - `CLIENT_TO_SERVER`: Vẽ hạt dữ liệu chạy từ cục Client sang cục Server.
  - `NETWORK_TO_HACKER`: Vẽ hạt dữ liệu rẽ nhánh từ giữa đường truyền rơi xuống cục Hacker (biểu diễn gói tin bị đánh cắp).
  - `HACKER_TO_SERVER`: Vẽ hạt dữ liệu màu đỏ bắn thẳng từ cục Hacker vào cục Server.

- **`status` (Quyết định màu sắc trên màn hình Thượng Đế):**
  - `INFO` (Màu Xanh dương / Xanh lá): Giao tiếp bình thường của người dùng.
  - `COMPROMISED` (Màu Vàng cam): Dữ liệu đã bị lộ hoặc bị chỉnh sửa trên đường truyền.
  - `DANGER` (Màu Đỏ nhấp nháy): Hệ thống đang bị tấn công trực diện hoặc bị vượt quyền thành công.

---

### 1.4. Hàm Log Mẫu (Dùng chung cho TV1 và TV2)

```javascript
async function reportToGodView(actor, direction, status, summary, details = {}) {
  const payload = {
    event_id: "evt_" + Date.now(),
    timestamp: new Date().toISOString(),
    actor: actor,             // "CLIENT" | "SERVER" | "HACKER"
    direction: direction,     // "CLIENT_TO_SERVER" | "NETWORK_TO_HACKER" | "HACKER_TO_SERVER"
    status: status,           // "INFO" | "COMPROMISED" | "DANGER"
    summary: summary,
    technical_details: details
  };

  try {
    await fetch("http://localhost:4000/api/telemetry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
  } catch (err) {
    console.error("Chưa bật God-View Server ở cổng 4000:", err.message);
  }
}
```

---

## 2. Các Chặng Thực Thi & Điểm Bàn Giao (Pipeline)

### 2.1. Chặng 1: TV1 xây dựng Target App & Server
- **Đầu vào:** Bản đặc tả yêu cầu | **Đầu ra:** App chạy được + API có lỗ hổng.
- **Bước 1.1:** Khởi tạo DB cơ bản (bảng `users` và `resources`) cùng Backend Server.
- **Bước 1.2:** Xây dựng giao diện Client đơn giản (Form Đăng nhập & Trang hiển thị tài nguyên mật sau khi đăng nhập thành công).
- **Bước 1.3:** Cố tình để lộ 2 điểm yếu kỹ thuật:
  1. *Trên đường truyền:* Gửi login qua giao thức không mã hóa HTTP (hoặc cổng Proxy trung gian) để lộ thông tin nhạy cảm.
  2. *Trên Server:* Câu lệnh truy vấn SQL dạng cộng chuỗi trực tiếp (lỗ hổng SQL Injection) và không giới hạn số lần thử sai (Brute-force).
- **Bước 1.4:** Viết Logger Middleware tại Server ghi nhận request và xuất ra đúng chuẩn JSON ở Chặng 0.
- 📦 **Điểm bàn giao 1 (Handover cho TV2):** TV1 đóng gói source code, cung cấp danh sách API (`POST /api/login`, `GET /api/resources`) và tài liệu mô tả vị trí lỗ hổng cho TV2.

### 2.2. Chặng 2: TV2 xây dựng Kịch bản Tấn công & Bắt gói tin (Ngày 3 - Ngày 4)
- **Đầu vào:** App/Server của TV1 | **Đầu ra:** Bộ Script Hack + Luồng log tấn công.
- **Bước 2.1:** Khảo sát hệ thống của TV1, gửi request bình thường kiểm tra phản hồi.
- **Bước 2.2:** Viết kịch bản Network Sniffing / MitM: Bắt gói tin chứa username/password khi người dùng bấm đăng nhập.
- **Bước 2.3:** Viết kịch bản tấn công App/Server:
  - Bơm mã độc SQL Injection vào API `POST /api/login` để chiếm quyền không cần mật khẩu.
  - Bắn request liên tục DoS 50 req/s gây nghẽn dịch vụ.
- **Bước 2.4:** Gắn bộ phát tín hiệu vào các script tấn công, xuất ra bản tin JSON báo cáo hành vi Hacker.
- 📦 **Điểm bàn giao 2 (Handover cho TV3):** TV2 bàn giao toàn bộ hệ thống gồm cả TV1 và các script tấn công của TV2.

### 2.3. Chặng 3: TV3 xây dựng Website "Góc nhìn Thượng Đế" (Ngày 5 - Ngày 6)
- **Đầu vào:** Luồng sự kiện từ TV1 & TV2 | **Đầu ra:** Website trực quan hóa toàn cảnh.
- **Bước 3.1:** Dựng God-View Server (WebSocket) làm trạm thu phát trung tâm lắng nghe JSON từ TV1 và TV2.
- **Bước 3.2:** Thiết kế giao diện Website "Góc nhìn Thượng Đế" gồm 2 khu vực:
  1. *Sơ đồ kiến trúc trực quan (Topology Map):* Hiển thị 3 thực thể Client ↔ Server và Hacker kèm hiệu ứng hạt di chuyển tương ứng theo `direction` và `status`.
  2. *Bảng đối chiếu sự kiện (Split-View Inspector):* Hiển thị song song Client/Server đang xử lý vs Hacker đang thu thập được.
- **Bước 3.3:** Bảng nút bấm điều khiển (Trigger Panel) ngay trên Web để kích hoạt luồng chạy của TV1 và TV2 phục vụ demo báo cáo.
- 📦 **Điểm bàn giao 3:** Hoàn tất luồng Tuần 1, chạy nghiệm thu từ đầu đến cuối.
