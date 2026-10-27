# Target App

Ứng dụng mục tiêu của lab, gồm `server` (Express + SQLite) và `client`
(giao diện đăng nhập, xem tài nguyên). Server phục vụ cả API và giao diện
tại `http://localhost:8080`.

Từ thư mục gốc repository:

```sh
npm ci
npm run build
npm run dev:target
```

- `POST /api/login`: xác thực tài khoản và trả token.
- `GET /api/resources`: đọc tài nguyên bằng Bearer token.
- `GET /health`: kiểm tra dịch vụ.

Runtime hiện tại giữ các điểm yếu có chủ đích của lab cũ, bao gồm SQL nối
chuỗi. OS Agent và API SYN Cookies vẫn là mô phỏng. Các cơ chế phòng thủ
ứng dụng và host-agent thực tế chưa được triển khai trong bước refactor này.

Đặt `GOD_VIEW_URL` trong môi trường server để đổi địa chỉ nhận telemetry.
Dockerfile đã chuyển tới `deploy/server/target.Dockerfile` và build cả client
lẫn server. Xem [kiến trúc mới](../../docs/system-architecture.md).
