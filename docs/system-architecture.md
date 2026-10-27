# Kiến trúc đích: phòng thủ đa lớp trên LAN hai máy

Tài liệu mô tả hướng phát triển mới, không khẳng định các thành phần dự kiến
đã được triển khai. Runtime hiện tại vẫn sử dụng lab Docker cũ.

## Vai trò triển khai

| Máy | Thành phần | Trách nhiệm |
| --- | --- | --- |
| Server | `apps/target-app` | Nghiệp vụ ứng dụng và các cơ chế phòng thủ trong ứng dụng |
| Server | `apps/god-view` | Thu thập, lưu trữ và trực quan hóa sự kiện |
| Server | `agents/host-agent` (dự kiến) | Đọc trạng thái thật và điều khiển có giới hạn các cấu hình host |
| Máy thực nghiệm | `attacker` | Thực thi kịch bản với mục tiêu được cấu hình cho phiên lab |
| Máy thực nghiệm | Client kiểm tra (dự kiến) | Đo tỷ lệ thành công, độ trễ và lỗi của truy cập hợp lệ |

Hai máy dùng chung LAN, không giả định dải `172.20.0.0/24` hoặc interface
`eth0` trong kiến trúc đích. Cấu hình IP, cổng và interface cần được thống nhất
ở bước triển khai LAN; refactor thư mục chưa thay đổi chúng trong runtime.

## Phạm vi các lớp

- **Mạng:** chính sách truy cập, lọc và giới hạn lưu lượng.
- **Hệ điều hành:** bảo vệ TCP, giới hạn tài nguyên và quyền dịch vụ.
- **Ứng dụng:** truy vấn an toàn, xác thực, phân quyền và giới hạn yêu cầu.

OSI dùng để giải thích vị trí giao thức hoặc tác động của kịch bản. Các phạm
vi trên không phải ba tầng OSI độc lập; một biện pháp có thể liên quan tới
nhiều phạm vi. Không đặt mục tiêu triển khai đủ bảy tầng OSI.

## Luồng dữ liệu dự kiến

1. Máy thực nghiệm gửi lưu lượng tới ứng dụng trên máy server.
2. Client kiểm tra tạo lưu lượng hợp lệ để đo khả năng phục vụ.
3. Ứng dụng và host-agent ghi nhận quan sát độc lập ở phía phòng thủ.
4. God-View tiếp nhận sự kiện, gắn với phiên thực nghiệm và cập nhật dashboard.
5. Kết quả của từng phiên được lưu để so sánh trước/sau và giữa các cấu hình.

Sự kiện do attacker phát ra chỉ chứng minh hành động đã được thực thi, không
tự chứng minh tấn công thành công hoặc phòng thủ hiệu quả. Sự kiện phía
server và phép đo client phải cung cấp bằng chứng tương ứng.

God-View cần phân biệt mất telemetry với dịch vụ mục tiêu bị lỗi. Việc đặt
chung máy không có nghĩa là khả năng quan sát sẽ luôn duy trì khi host quá tải.

## Ranh giới module

- `apps` chứa nghiệp vụ ứng dụng và quan sát; không nhúng quyền quản trị host
  vào ứng dụng mục tiêu.
- `agents/host-agent` dự kiến cung cấp thao tác quản trị giới hạn, kiểm tra
  trạng thái thực tế sau khi áp dụng và khả năng khôi phục cấu hình.
- `attacker` chứa runner và worker; không chứa logic quyết định kết quả phòng thủ.
- `packages/shared` chứa hợp đồng dữ liệu chung, tránh import xuyên vào mã
  nội bộ của ứng dụng khác.
- `deploy` chứa cách đóng gói và triển khai theo vai trò.
- `experiments` mô tả điều kiện, phép đo và cách đánh giá từng kịch bản.

## Phạm vi thực nghiệm

Ưu tiên các kịch bản chạy được trên hai máy: kiểm tra chính sách truy cập,
SYN Flood có giới hạn trong lab, HTTP load/DoS và SQL injection. Bộ kịch bản
cuối cùng phụ thuộc hệ điều hành và các cơ chế phòng thủ được nhóm chọn.

ARP MITM và các kịch bản cần theo dõi một luồng client nạn nhân riêng, bao gồm
TCP RST hiện tại, không phải yêu cầu bắt buộc. Mã cũ được giữ để tương thích,
không được dùng làm tiêu chí hoàn thành mô hình mới.

## Việc còn lại sau refactor

1. Chốt hệ điều hành, cách chạy dịch vụ và cấu hình LAN hai máy.
2. Thay địa chỉ/interface cố định bằng cấu hình phiên lab.
3. Thay OS Agent mô phỏng bằng dữ liệu và thao tác host thực tế.
4. Bổ sung các cơ chế phòng thủ cùng cấu hình thử nghiệm riêng biệt.
5. Mở rộng schema, lưu trữ sự kiện và giao diện theo từng lớp phòng thủ.
6. Chạy thử nghiệm có thể lặp lại và tổng hợp số liệu cho báo cáo.

Thiết kế cũ được lưu tại [legacy/system-architecture.md](legacy/system-architecture.md).
