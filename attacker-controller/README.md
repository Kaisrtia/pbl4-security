# Attacker Controller - Trí (T1-TV2)

Phân hệ này thực hiện Chặng 2 của tuần 1 trong mạng Docker cô lập
`cyber_net`. Tất cả mục tiêu được khóa cứng ở hai container của đồ án:

- Client: `172.20.0.10`
- Target Server: `172.20.0.20`
- Hacker Node: `172.20.0.66`

API không chấp nhận IP hoặc URL ngoài mạng lab. Các kịch bản có tác động thật
lên hai container của đồ án, nhưng không có đường dẫn điều khiển tới máy chủ
Internet hoặc địa chỉ tùy ý.

## Phạm vi Chặng 2

| Yêu cầu | Triển khai |
| --- | --- |
| Bước 2.1 - Khảo sát | Gọi `GET /health` để xác nhận Target Server phản hồi |
| Bước 2.2 - MitM | Scapy đầu độc ARP hai chiều, chuyển luồng qua Hacker và bắt HTTP login |
| Bước 2.3 - SQLi | Gửi payload tới `POST /api/login`, sau đó xác minh quyền đọc `/api/resources` |
| Bước 2.3 - DoS | Gửi tối đa 50 HTTP request/giây tới API đăng nhập |
| SYN Flood | Scapy gửi SYN với source IP ngẫu nhiên, tối đa 1000 gói/giây |
| TCP RST | Scapy đọc sequence number rồi bơm RST hai chiều vào kết nối đang có |
| Bước 2.4 - Telemetry | Gửi `ATTACK_STATUS` và `PACKET_EVENT` tới God-View |

Các worker packet-level nằm tại `scripts/lab_attack.py`. Khi dừng ARP Spoofing,
worker gửi lại ánh xạ MAC thật cho Client và Server trước khi thoát.

## Khởi chạy

Từ thư mục gốc dự án:

```sh
docker compose up --build -d
docker compose logs -f hacker_node
```

Mở menu của Trí:

```sh
docker exec -it hacker_node npm run attack:cli --workspace=@pbl4/attacker-controller
```

Control API lắng nghe tại `http://172.20.0.66:5000` trong `cyber_net`.
Cổng 5000 không được publish ra host theo kiến trúc tuần 1.

## API điều khiển

### Khảo sát Target Server

```http
POST /attack/recon
Content-Type: application/json

{}
```

Controller gọi duy nhất `http://172.20.0.20:8080/health` và trả về trạng thái
kết nối cùng danh sách endpoint bàn giao.

### ARP Spoofing và bắt HTTP login

```http
POST /attack/mitm
Content-Type: application/json

{
  "enable": true,
  "durationSec": 60
}
```

Alias: `POST /attack/arp-spoof`. Worker đầu độc ARP hai chiều và tìm trường
`username/password` trong HTTP request từ Client tới Server. Dừng bằng cùng
endpoint với body `{"enable": false}`.

Để tạo một request đăng nhập trực tiếp từ `client_node` trong lúc MitM đang
chạy:

```sh
docker exec client_node node -e "fetch('http://172.20.0.20:8080/api/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:'student',password:'student123'})}).then(r=>r.text()).then(console.log)"
```

### TCP SYN Flood

```http
POST /attack/syn-flood
Content-Type: application/json

{
  "durationSec": 10,
  "packetsPerSec": 100,
  "port": 8080
}
```

`packetsPerSec` được giới hạn từ 1 đến 1000 và thời gian tối đa là 30 giây.

### HTTP DoS

```http
POST /attack/dos
Content-Type: application/json

{
  "durationSec": 10,
  "ratePerSec": 50
}
```

Controller gửi request đăng nhập với tài khoản thử nghiệm không hợp lệ. Tốc độ
được giới hạn tối đa 50 request/giây và thời gian tối đa 30 giây.

### TCP RST Injection

```http
POST /attack/tcp-rst
Content-Type: application/json

{
  "durationSec": 10,
  "port": 8080
}
```

Worker chỉ bơm RST sau khi quan sát được luồng TCP giữa đúng Client và Server.
Vì kết nối HTTP thường tồn tại rất ngắn, hãy kích hoạt RST trước rồi tạo request
từ `client_node` trong khoảng thời gian đã chọn.

### SQL Injection

```http
POST /attack/sqli
Content-Type: application/json

{
  "payload": "' OR '1'='1' --"
}
```

Controller gửi payload tới API đăng nhập cố định. Nếu nhận token, nó dùng token
đó gọi `GET /api/resources` để xác minh việc vượt quyền. Token không được đưa
vào telemetry hoặc phản hồi API của Attacker Controller.

### Trạng thái và dừng

- `GET /health`: trạng thái controller, mục tiêu được phép và các kịch bản.
- `GET /attack/status`: danh sách kịch bản đang chạy.
- `POST /attack/stop`: dừng tất cả worker và request đang chạy.

## Telemetry bàn giao cho Nguyên

Telemetry được gửi tới `http://172.20.0.99:4000/api/telemetry` theo envelope
dùng chung. Ví dụ sự kiện bắt được HTTP login:

```json
{
  "timestamp": 1761143705000,
  "source_node": "HACKER",
  "source_ip": "172.20.0.66",
  "event_type": "PACKET_EVENT",
  "severity": "DANGER",
  "payload": {
    "attack_mode": "ARP_SPOOF",
    "action": "INTERCEPTED",
    "packet_info": {
      "protocol": "HTTP",
      "src": "172.20.0.10:54322",
      "dst": "172.20.0.20:8080",
      "extracted_data": "username=...&password=..."
    },
    "terminal_log": "[ARP-SPOOF] Bắt được thông tin đăng nhập..."
  }
}
```

God-View dùng `attack_mode` để đổi hiệu ứng topology và `terminal_log` để
hiển thị nhật ký của Hacker.
