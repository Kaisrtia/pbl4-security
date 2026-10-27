# God-View

Trạm quan sát gồm `server` (Express + WebSocket) và `client` (dashboard).
Server phục vụ giao diện, API và WebSocket cùng cổng 4000.

Từ thư mục gốc repository:

```sh
npm ci
npm run build
npm run dev:godview
```

- Giao diện: `http://localhost:4000`.
- `POST /api/telemetry`: tiếp nhận sự kiện.
- `GET /api/telemetry/history`: tối đa 200 sự kiện gần nhất trong bộ nhớ.
- WebSocket: `ws://localhost:4000`, sự kiện `GOD_VIEW_UPDATE`.
- `GET /health`: kiểm tra dịch vụ.

Schema đang dùng nằm tại `packages/shared/src/telemetry.types.ts`; tham khảo
[hợp đồng hiện tại](../../docs/telemetry-spec.md). API hiện chỉ kiểm tra một
số trường bắt buộc, chưa có xác thực đầy đủ toàn bộ schema ở runtime.

Dashboard vẫn hiển thị mô hình cũ. Lưu trữ kết quả theo phiên và giao diện
phòng thủ đa lớp là các bước triển khai tiếp theo. Dockerfile đã chuyển tới
`deploy/server/god-view.Dockerfile`.
