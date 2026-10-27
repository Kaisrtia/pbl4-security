# Thực nghiệm phòng thủ đa lớp

Thư mục dành cho kịch bản và kết quả có thể tái lập; hiện chưa có runner
thực nghiệm mới. Mỗi kịch bản sau này cần ghi rõ:

- Mục tiêu, phạm vi phòng thủ và điều kiện máy/LAN.
- Cấu hình dịch vụ, cấu hình phòng thủ và tham số tạo lưu lượng.
- Cách tạo truy cập hợp lệ song song với lưu lượng tấn công.
- Phép đo nền, khi tấn công, khi bật từng lớp và khi phối hợp các lớp.
- Nguồn bằng chứng: client, ứng dụng, hệ điều hành hoặc bộ lọc mạng.
- Tiêu chí kết quả, giới hạn của phép đo và cách đưa lab về trạng thái ban đầu.

Số liệu dự kiến gồm tỷ lệ request hợp lệ thành công, độ trễ, lỗi, tài nguyên
host và các bộ đếm phù hợp với từng cơ chế. Không suy ra kết quả chỉ từ thông
báo của attacker hoặc từ trạng thái ON/OFF trên dashboard.

ARP MITM và TCP RST của lab cũ không phải yêu cầu bắt buộc cho demo hai máy.
Chỉ đưa dữ liệu mẫu hoặc kết quả đã được nhóm chọn vào Git; không commit
database, dependency hoặc bản build sinh tự động.
