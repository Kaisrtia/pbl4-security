# Đóng gói phía server

- `target.Dockerfile`: build server và giao diện ứng dụng mục tiêu.
- `god-view.Dockerfile`: build API telemetry, WebSocket và dashboard.

Build context là thư mục gốc repository. Hiện các image này được dùng bởi
`deploy/local/compose.yaml` của lab cũ.

Chưa có cấu hình triển khai LAN hai máy. Việc bổ sung host-agent, cấu hình IP
và các biện pháp phòng thủ sẽ được làm sau khi chốt hệ điều hành máy server.
