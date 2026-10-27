# Telemetry hiện tại

Nguồn định nghĩa kiểu dữ liệu là
[`packages/shared/src/telemetry.types.ts`](../packages/shared/src/telemetry.types.ts).
Refactor thư mục giữ nguyên schema và hành vi runtime hiện tại.

## Luồng truyền

1. Producer gửi JSON tới `POST /api/telemetry` trên God-View.
2. God-View lưu tối đa 200 sự kiện gần nhất trong bộ nhớ.
3. WebSocket phát `{ "event": "GOD_VIEW_UPDATE", "data": envelope }`.
4. Dashboard tải lịch sử từ `GET /api/telemetry/history` và nhận cập nhật live.

## Envelope

```json
{
  "timestamp": 1761143705000,
  "source_node": "SERVER",
  "source_ip": "172.20.0.20",
  "event_type": "APP_EVENT",
  "severity": "NORMAL",
  "payload": {
    "action": "LOGIN_ATTEMPT",
    "target_ip": "172.20.0.20",
    "http_status": 200,
    "terminal_log": "Login request completed"
  }
}
```

- `timestamp`: Unix timestamp theo mili giây.
- `source_node`: `CLIENT`, `SERVER` hoặc `HACKER`.
- `event_type`: `STATE_SNAPSHOT`, `PACKET_EVENT`, `ATTACK_STATUS`, `APP_EVENT`.
- `severity`: `NORMAL`, `WARNING`, `DANGER`.
- `payload`: dữ liệu tương ứng với loại sự kiện; xem kiểu và producer thực tế.

API hiện kiểm tra `source_node`, `event_type` và bổ sung timestamp nếu thiếu;
chưa xác thực đầy đủ các giá trị và payload ở runtime. Snapshot của OS Agent
hiện vẫn là dữ liệu mô phỏng, không phải phép đo trạng thái host thực tế.

Schema cho mô hình mới sẽ cần bổ sung phiên thực nghiệm, nguồn quan sát,
lớp phòng thủ, hành động và bằng chứng kết quả. Các trường đó chưa được thêm
trong refactor này. Bản thiết kế telemetry trước đây, có định dạng khác mã
hiện tại, được lưu tại [legacy/telemetry-spec.md](legacy/telemetry-spec.md).
