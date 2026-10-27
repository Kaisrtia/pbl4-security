# Đóng gói máy thực nghiệm

`Dockerfile` build workspace `@pbl4/attacker-controller` từ thư mục `attacker`
và cài các dependency Python phục vụ worker hiện tại. Build context là thư
mục gốc repository.

Image hiện được dùng trong lab Docker cũ. Địa chỉ và interface trong mã
chưa được chuyển sang cấu hình LAN hai máy. Thư mục này chưa cung cấp
một bản triển khai máy thực nghiệm độc lập trên LAN.
