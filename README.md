# PBL4 — Phòng thủ đa lớp và trực quan hóa sự kiện thời gian thực

**Nghiên cứu và triển khai mô hình phòng thủ đa lớp kết hợp trực quan hóa
sự kiện thời gian thực cho kiến trúc Client–Server.**

Mô hình đích sử dụng hai máy trong cùng LAN:

- Máy server chạy ứng dụng mục tiêu, các cơ chế phòng thủ ở phạm vi mạng,
  hệ điều hành và ứng dụng, cùng God-View để quan sát sự kiện.
- Máy thực nghiệm chạy các kịch bản tấn công và client kiểm tra khả năng
  phục vụ người dùng hợp lệ. Địa chỉ IP sẽ được cấu hình theo môi trường demo.

Mục tiêu là so sánh hoạt động trước/sau khi bật từng lớp phòng thủ và khi
kết hợp các lớp, dựa trên sự kiện và số liệu quan sát được.

## Trạng thái hiện tại

Repository đã được tổ chức lại cho định hướng mới. Runtime hiện tại vẫn là
prototype của lab Docker một máy: IP còn cố định, OS Agent còn dùng số liệu
mô phỏng và API SYN Cookies chưa thay đổi cấu hình kernel. **Chưa có bản triển
khai LAN hai máy hoặc host-agent thực tế.**

ARP MITM và TCP RST vẫn còn trong mã của lab cũ, nhưng không thuộc phạm vi bắt
buộc của mô hình mới. Việc chuyển thư mục không thay đổi hành vi các kịch bản.

## Cấu trúc repository

```text
apps/
  target-app/       Ứng dụng mục tiêu: server và giao diện người dùng
  god-view/         API telemetry, WebSocket và dashboard
attacker/          Bộ điều khiển và worker thực nghiệm
agents/
  host-agent/      Đặc tả trách nhiệm agent mạng/hệ điều hành (chưa triển khai)
packages/
  shared/          Kiểu dữ liệu và helper dùng chung
deploy/
  server/          Dockerfile của ứng dụng và God-View
  attacker/        Dockerfile của bộ điều khiển
  local/           Compose và client của lab Docker cũ
experiments/       Quy ước kịch bản và kết quả thực nghiệm
docs/              Kiến trúc mới, hướng dẫn chuyển cấu trúc và tài liệu
  legacy/          Báo cáo và thiết kế mô hình cũ để tham khảo
```

Các package được quản lý bằng npm workspaces. `packages/shared` được build
trước các workspace sử dụng nó. Tên package `@pbl4/*` được giữ ổn định để
không phải thay các import chỉ vì di chuyển thư mục.

## Phát triển trên máy cá nhân

Giữ Node.js 20 như runtime Docker hiện tại; phiên bản nằm trong `.nvmrc`.
Nếu dùng nvm, chạy `nvm use` trước khi cài dependencies.

```sh
npm ci
npm run build
```

Mở các terminal riêng từ thư mục gốc:

```sh
npm run dev:godview
npm run dev:target
npm run dev:attacker
```

- God-View: `http://localhost:4000`
- Target App và API: `http://localhost:8080`
- Attacker API khi chạy trực tiếp: `http://localhost:5000`
- Menu điều khiển: `npm run attack:cli`

Build trước khi mở giao diện vì server phục vụ JavaScript trong thư mục
`dist` của client. `npm run dev:*` chỉ theo dõi mã server/controller.
Các lệnh trên phục vụ phát triển; tấn công packet-level vẫn phụ thuộc lab
Docker cũ. Để Target Server gửi telemetry khi chạy trực tiếp, đặt
`GOD_VIEW_URL=http://localhost:4000/api/telemetry` trong môi trường của nó.

## Lab Docker hiện có

```sh
npm run lab:up
npm run lab:logs
npm run lab:down
```

Các lệnh dùng [`deploy/local/compose.yaml`](deploy/local/compose.yaml).
Lab này vẫn có bốn container và dải IP cũ; đây là cấu hình tương thích để
tiếp tục phát triển, không phải cấu hình LAN hai máy cuối cùng.

## Tài liệu

- [Kiến trúc và phạm vi mới](docs/system-architecture.md)
- [Hướng dẫn sau khi chuyển thư mục](docs/migration.md)
- [Hợp đồng telemetry hiện tại](docs/telemetry-spec.md)
- [Quy ước thực nghiệm](experiments/README.md)
- [Tài liệu mô hình cũ](docs/legacy/README.md)
