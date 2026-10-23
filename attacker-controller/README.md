# Attacker Controller (Thành viên 2)

Trạm điều khiển các kịch bản tấn công thử nghiệm (Security Penetration Testing Platform) hướng tới Target App (Port 3000) và báo cáo dữ liệu về God-View Server (Port 4000).

- **Địa chỉ:** `http://localhost:5000` *(hoặc chạy qua CLI)*
- **Ngôn ngữ:** TypeScript (Node.js)

---

## 🎯 Các Endpoint Bắt Buộc

1. **`POST /attack/mitm`**:
   - Body: `{ "enable": true | false, "proxyPort": 8080 }`
   - Bật / tắt chế độ nghe lén / proxy trung gian bắt gói tin trên đường truyền.
2. **`POST /attack/sqli`**:
   - Body: `{ "targetUrl": "http://localhost:3000/api/login", "payload": "' OR '1'='1" }`
   - Kích hoạt bắn payload SQL Injection vào cổng 3000 để đánh cắp token hoặc bypass auth.
3. **`POST /attack/dos`**:
   - Body: `{ "targetUrl": "http://localhost:3000/api/login", "ratePerSec": 50, "durationSec": 10 }`
   - Kích hoạt bắn 50 requests/giây vào cổng 3000.

---

## 📁 Cấu Trúc Phân Hệ

```text
attacker-controller/
├── src/
│   ├── attacks/
│   │   ├── mitm.attack.ts       # Module nghe lén / bắt gói tin (MITM)
│   │   ├── sqli.attack.ts       # Module khai thác SQL Injection
│   │   └── dos.attack.ts        # Module bắn tải DoS (50 req/giây)
│   ├── routes/
│   │   └── attack.routes.ts     # Các API POST /attack/*
│   ├── services/
│   │   └── telemetry.service.ts # Gửi log hành động tấn công về God-View (Port 4000)
│   ├── cli.ts                   # Chạy tấn công trực tiếp bằng dòng lệnh CLI
│   └── index.ts                 # Express Server cổng 5000
├── package.json
└── tsconfig.json
```
