# Host Agent — dự kiến

Thành phần sẽ chạy trên máy server, tách khỏi ứng dụng mục tiêu.

Trách nhiệm dự kiến:

- Đọc trạng thái mạng, TCP, tài nguyên và cấu hình phòng thủ thực tế.
- Phát telemetry theo hợp đồng trong `packages/shared`.
- Áp dụng các thao tác phòng thủ được cho phép, xác minh kết quả và khôi phục.

Chưa có runtime trong thư mục này. OS Agent mô phỏng vẫn nằm tại
`apps/target-app/server/src/services/os-agent.service.ts` để giữ hành vi lab cũ.
Việc thay thế sẽ thực hiện sau khi chốt hệ điều hành máy server.
