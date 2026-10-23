# Đặc Tả Chuẩn Bản Tin Telemetry (Chặng 0)

> Đây là hợp đồng dữ liệu (Data Contract) được thống nhất giữa cả 3 thành viên trước khi bắt đầu lập trình.
> - **TV1 (Target Server)** và **TV2 (Attacker)** sẽ gửi dữ liệu theo chuẩn này đến: `POST http://localhost:4000/api/telemetry`
> - **TV3 (God-View)** nhận dữ liệu này và phát tiếp qua WebSocket: `ws://localhost:4000` tới Dashboard.

---

## 1. Cấu Trúc Bản Tin JSON Chung

```json
{
  "timestamp": "2026-10-23T12:00:00.000Z",
  "source": "TARGET_SERVER" | "ATTACKER_CONTROLLER",
  "eventType": "HTTP_REQUEST" | "ATTACK_TRIGGERED" | "ATTACK_RESULT" | "SECURITY_ALERT" | "SYSTEM_METRIC",
  "severity": "INFO" | "WARNING" | "CRITICAL",
  "data": { ... }
}
```

---

## 2. Chi Tiết Theo Từng Loại Sự Kiện

### 2.1. Bản tin từ TV1 (Target Server - Logger Middleware)

Khi có request gửi tới Target Server (đặc biệt là `/api/login` và `/api/resources`):

```json
{
  "timestamp": "2026-10-23T12:00:01.120Z",
  "source": "TARGET_SERVER",
  "eventType": "HTTP_REQUEST",
  "severity": "INFO",
  "data": {
    "method": "POST",
    "endpoint": "/api/login",
    "clientIp": "127.0.0.1",
    "statusCode": 200,
    "durationMs": 15,
    "requestBody": {
      "username": "admin' OR '1'='1"
    },
    "isSuspectAttack": true,
    "attackType": "SQL_INJECTION",
    "details": "Phat hien ky tu dac biet trong username"
  }
}
```

### 2.2. Bản tin từ TV2 (Attacker Controller)

Khi Hacker kích hoạt một chiến dịch tấn công (`POST /attack/mitm`, `POST /attack/sqli`, `POST /attack/dos`):

```json
{
  "timestamp": "2026-10-23T12:00:02.000Z",
  "source": "ATTACKER_CONTROLLER",
  "eventType": "ATTACK_TRIGGERED",
  "severity": "WARNING",
  "data": {
    "attackType": "DOS",
    "target": "http://localhost:3000/api/login",
    "ratePerSecond": 50,
    "status": "STARTED",
    "payloadExample": "Request flood 50 req/s"
  }
}
```

Khi Hacker thu được kết quả (ví dụ đánh cắp được token qua MITM hoặc bypass đăng nhập qua SQLi):

```json
{
  "timestamp": "2026-10-23T12:00:03.500Z",
  "source": "ATTACKER_CONTROLLER",
  "eventType": "ATTACK_RESULT",
  "severity": "CRITICAL",
  "data": {
    "attackType": "SQL_INJECTION",
    "payload": "admin' OR '1'='1",
    "success": true,
    "capturedToken": "session-token-sample-xyz",
    "leakedData": {
      "userId": 1,
      "role": "admin"
    }
  }
}
```

---

## 3. Mã Hóa Trạng Thái & Phân Loại (Enums)

| Field | Giá Trị Cho Phép |
| :--- | :--- |
| `source` | `TARGET_SERVER`, `ATTACKER_CONTROLLER` |
| `eventType` | `HTTP_REQUEST`, `ATTACK_TRIGGERED`, `ATTACK_RESULT`, `SECURITY_ALERT`, `SYSTEM_METRIC` |
| `severity` | `INFO`, `WARNING`, `CRITICAL` |
| `attackType` | `SQL_INJECTION`, `DOS`, `MITM`, `BRUTE_FORCE`, `NONE` |
