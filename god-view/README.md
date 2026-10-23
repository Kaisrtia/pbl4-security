# God-View Server & UI (Thành viên 3)

Trạm quan sát trung tâm ("Mắt thần" / SIEM Dashboard thu nhỏ) nhận toàn bộ tín hiệu telemetry từ Target Server (TV1) và Attacker Controller (TV2) theo thời gian thực và trực quan hóa lên Web UI.

- **Địa chỉ:** `http://localhost:4000`
- **WebSocket:** `ws://localhost:4000`
- **Ngôn ngữ:** TypeScript (Node.js)

---

## 📡 Các Endpoint & Giao Thức Bắt Buộc

1. **`POST /api/telemetry`**:
   - Nhận toàn bộ bản tin JSON từ TV1 và TV2 gửi về.
   - Kiểm tra định dạng JSON hợp lệ theo thỏa thuận tại `docs/telemetry-spec.md`.
   - Đẩy (broadcast) bản tin đến các client đang kết nối WebSocket.
2. **`ws://localhost:4000`**:
   - Luồng WebSocket đẩy dữ liệu realtime trực tiếp lên giao diện Web.

---

## 📁 Cấu Trúc Phân Hệ

```text
god-view/
├── server/
│   ├── src/
│   │   ├── routes/
│   │   │   └── telemetry.routes.ts # Nhận POST /api/telemetry
│   │   ├── websocket/
│   │   │   └── ws.server.ts        # WebSocket broadcast server
│   │   └── index.ts                # Server cổng 4000 (HTTP + WebSocket)
│   ├── package.json
│   └── tsconfig.json
└── client/
    ├── src/
    │   └── main.ts                 # Kết nối ws://localhost:4000 & render UI
    ├── index.html                  # Giao diện Web Dashboard thời gian thực
    └── package.json
```
