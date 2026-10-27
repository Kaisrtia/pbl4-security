# Lab Docker một máy — tương thích mô hình cũ

Chạy từ thư mục gốc bằng `npm run lab:up`; dừng bằng `npm run lab:down`.
File `compose.yaml` giữ bốn container, IP và quyền mạng của lab cũ.
Đường dẫn build được cập nhật theo cấu trúc mới.

- Target App và API: `http://localhost:8080`.
- God-View: `http://localhost:4000`.
- `client_node` ở cổng 3000 phục vụ giao diện tĩnh cũ, chưa có API proxy.
  Để thao tác đăng nhập bằng trình duyệt, dùng Target App tại cổng 8080.
- Attacker API ở cổng 5000 chỉ có trong mạng container.

`client.Dockerfile` build JavaScript và cài static server khi build image,
không tải static server bằng `npx` lúc container khởi động.

Mô hình này chưa đáp ứng demo LAN hai máy. Các cổng 9000 và 5173 trong Compose
được giữ từ cấu hình cũ; hiện server chưa có TCP listener 9000 và God-View
phục vụ giao diện cùng API ở cổng 4000.
