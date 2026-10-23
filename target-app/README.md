# Target App & Server (Thành viên 1)

Phân hệ mục tiêu mô phỏng ứng dụng web thực tế có chứa các điểm yếu bảo mật để hacker khai thác và thượng đế giám sát.

- **Địa chỉ:** `http://localhost:3000`
- **Ngôn ngữ:** TypeScript (Node.js)

---

## 📋 Các Endpoint Bắt Buộc

1. **`POST /api/login`**:
   - Nhận: `{ "username": "...", "password": "..." }`
   - Trả về: Token / Session ID khi đăng nhập thành công.
   - **Lỗ hổng cố tình chừa:** Nối chuỗi SQL trực tiếp (`SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`).
2. **`GET /api/resources`**:
   - Nhận Header: `Authorization: Bearer <token>`
   - Trả về: Danh sách tài nguyên mật trong Database.

---

## 🛡️ Điểm Yếu Cần Cấu Hình

1. **Trên đường truyền:** Chạy qua HTTP thuần (không HTTPS) để Thành viên 2 nghe lén gói tin (MITM).
2. **Trên Server:** Truy vấn SQL dạng nối chuỗi không sanitize (lỗ hổng SQL Injection) và không giới hạn lượt thử sai (Brute-force).
3. **Logger Middleware:** Bắt toàn bộ request gửi đến, format đúng chuẩn JSON và gửi `POST` về `http://localhost:4000/api/telemetry`.

---

## 📁 Cấu Trúc Phân Hệ

```text
target-app/
├── server/
│   ├── src/
│   │   ├── database/         # Khởi tạo SQLite (users, resources)
│   │   ├── middlewares/      # telemetry.middleware.ts
│   │   ├── routes/           # auth.routes.ts & resource.routes.ts
│   │   └── index.ts          # Express Server port 3000
│   ├── package.json
│   └── tsconfig.json
└── client/
    ├── src/
    │   └── main.ts           # Xử lý logic gọi API login & hiển thị resources
    ├── index.html            # Form Đăng nhập & Bảng tài nguyên mật
    └── package.json
```
