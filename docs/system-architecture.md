# Kiến Trúc Hệ Thống (System Architecture)

## 1. Bản Đồ Phân Hệ & Cổng Dịch Vụ

```
+--------------------------------------------------------------------------------+
|                                  TRÌNH DUYỆT WEB                               |
|                                                                                |
|   +--------------------------+                 +---------------------------+   |
|   |  Target App Web Client   |                 |   God-View Dashboard UI   |   |
|   |  (http://localhost:3000) |                 |   (http://localhost:4000) |   |
|   +------------+-------------+                 +-------------^-------------+   |
+----------------|---------------------------------------------|-----------------+
                 |                                             |
                 | HTTP Requests                               | WebSocket
                 v                                             | (ws://localhost:4000)
+--------------------------------+               +-------------+-----------------+
|      TARGET APP & SERVER       |               |      GOD-VIEW SERVER          |
|      (Thành viên 1 - 3000)     |               |      (Thành viên 3 - 4000)    |
|                                |               |                               |
|  - POST /api/login             |               |  - POST /api/telemetry        |
|  - GET /api/resources          |               |  - WebSocket Broadcast        |
|  - SQLite (Users, Resources)   |               |  - Realtime Event Ingestion   |
|  - Logger Telemetry Middleware |               +-------------^-----------------+
+----------------+---------------+                             |
                 ^                                             |
                 | Attacks (SQLi, DoS, MITM)                   |
                 |                                             |
+----------------+---------------+                             |
|      ATTACKER CONTROLLER       |                             |
|      (Thành viên 2 - 5000)     |                             |
|                                |                             |
|  - POST /attack/mitm           |                             |
|  - POST /attack/sqli           +-----------------------------+
|  - POST /attack/dos            | Telemetry (Attack Triggers & Results)
|  - Attack Engine & CLI         |
+--------------------------------+
```

---

## 2. Nhiệm Vụ Chi Tiết Từng Thành Viên

### Thành viên 1: Target App & Server (`target-app/`)
- Xây dựng Backend Node.js / Express (TypeScript) cổng `3000`.
- Khởi tạo Database SQLite:
  - Bảng `users`: `id`, `username`, `password`, `role`.
  - Bảng `resources`: `id`, `title`, `secret_content`, `classification`.
- Cố tình để hở các lỗ hổng theo yêu cầu:
  - **SQL Injection**: API `/api/login` thực hiện nối chuỗi SQL trực tiếp thay vì parameterized query.
  - **Cleartext Transmission**: Gửi request qua HTTP không có TLS/SSL (hoặc proxy trung gian) để TV2 thực hiện MITM bắt gói.
  - **Brute Force**: Không giới hạn rate limit hay khóa tài khoản khi nhập sai nhiều lần.
- Cài đặt `telemetry.middleware.ts`: Bất kỳ request nào gửi đến đều được trích xuất thông tin và bắn `POST` về `http://localhost:4000/api/telemetry`.

### Thành viên 2: Attacker Controller (`attacker-controller/`)
- Xây dựng Controller Server cổng `5000` (hoặc CLI):
  - `POST /attack/sqli`: Bắn payload như `' OR 1=1 --` để vượt qua xác thực đăng nhập cổng 3000.
  - `POST /attack/dos`: Gửi liên tục 50 req/giây vào cổng 3000 để đo độ trễ và làm nghẽn dịch vụ.
  - `POST /attack/mitm`: Khởi chạy proxy trung gian hoặc lắng nghe gói tin để đánh cắp mật khẩu/token.
- Gửi báo cáo tấn công (Attack Event) về `http://localhost:4000/api/telemetry`.

### Thành viên 3: God-View Server & UI (`god-view/`)
- Xây dựng Server cổng `4000`:
  - `POST /api/telemetry`: Nhận bản tin JSON từ TV1 và TV2.
  - WebSocket Server: Đẩy bản tin realtime đến tất cả Dashboard Client đang kết nối.
- Xây dựng Dashboard UI:
  - Hiển thị luồng request trực tiếp giữa Client, Target và Attacker.
  - Cảnh báo khi có SQL Injection, DoS (biểu đồ request/s), MITM.
