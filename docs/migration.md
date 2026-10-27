# Chuyển cấu trúc repository

## Đường dẫn thay đổi

| Trước | Sau |
| --- | --- |
| `target-app/` | `apps/target-app/` |
| `god-view/` | `apps/god-view/` |
| `attacker-controller/` | `attacker/` |
| `shared/` | `packages/shared/` |
| `docker-compose.yml` | `deploy/local/compose.yaml` |
| `target-app/server/Dockerfile` | `deploy/server/target.Dockerfile` |
| `god-view/server/Dockerfile` | `deploy/server/god-view.Dockerfile` |
| `attacker-controller/Dockerfile` | `deploy/attacker/Dockerfile` |
| `target-app/client/Dockerfile` | `deploy/local/client.Dockerfile` |
| Báo cáo PDF, README và kiến trúc cũ | `docs/legacy/` |

Tên các package `@pbl4/*` và các endpoint hiện tại không đổi. Các import tới
`@pbl4/shared` tiếp tục sử dụng cùng tên package.

## Sau khi checkout nhánh mới

```sh
npm ci
npm run build
```

`npm ci` tạo lại liên kết workspace theo đường dẫn mới. Các thư mục `dist`
không còn được theo dõi bằng Git; luôn build sau khi cài dependencies hoặc
đổi nhánh. `package-lock.json` được commit để dùng cùng tập dependency.

Từ thư mục gốc, thay `docker compose up --build -d` bằng `npm run lab:up`,
hoặc chỉ định file:

```sh
docker compose -f deploy/local/compose.yaml up --build -d
```

Compose giữ tên project `pbl4-security`, tên container và mạng lab hiện tại.
Build context vẫn là thư mục gốc repository. Các Dockerfile cài dependency
bằng `npm ci` và build mã nguồn thay vì dựa vào `dist` có sẵn trên máy.

## Giới hạn của thay đổi này

Đây là refactor cấu trúc, không phải bản triển khai phòng thủ đa lớp hoàn
chỉnh. Chưa thay IP cố định, schema telemetry, thuật toán tấn công, cấu hình
kernel hoặc giao diện dashboard. Các thư mục dự kiến có README mô tả trách
nhiệm, chưa được đưa vào npm workspaces khi chưa có code chạy được.
