# Attacker — chuẩn bị triển khai mô hình LAN hai máy

Phạm vi, cách chia việc và tiêu chí đánh giá nằm trong
[PROJECT_PLAN.md](PROJECT_PLAN.md).

## Trạng thái sau khi dọn thư mục

Bốn kịch bản đã chốt là chuỗi SSH theo năm giai đoạn, SYN Flood có giới hạn,
cạn file descriptor và truyền dữ liệu mẫu ra khỏi server. **Bước hiện tại
chỉ dọn mã cũ, chưa triển khai các kịch bản mới hoặc cấu hình LAN/hotspot.**

Giữ lại bộ chạy SYN Flood đã có và các thành phần nó đang dùng. Bộ chạy này
vẫn khóa mục tiêu `172.20.0.20`, interface `eth0` và địa chỉ telemetry của lab
Docker cũ; chưa dùng trực tiếp với IP do điện thoại cấp.

Đã xóa ARP/MITM, TCP RST, SQL Injection, HTTP DoS và mục recon chỉ gọi
`/health`, cùng menu, endpoint, helper và worker dành riêng cho chúng.
Mã cũ có thể tra lại trong lịch sử Git. Schema dùng chung và God-View chưa
được sửa trong đợt dọn riêng phần attacker này.

## Cấu trúc còn lại

```text
attacker/
├── PROJECT_PLAN.md
├── README.md
├── package.json
├── tsconfig.json
├── scripts/
│   └── syn_flood.py              # Worker SYN hiện có, chỉ dùng lab Docker cũ
└── src/
    ├── index.ts                 # Khởi động controller và health endpoint
    ├── cli.ts                   # Menu cho bộ chạy hiện có
    ├── config.ts                # Cấu hình và kiểm tra đầu vào của lab cũ
    ├── attacks/
    │   └── syn_flood.attack.ts   # Phần SYN tách khỏi module DoS cũ
    ├── routes/
    │   └── attack.routes.ts     # SYN, trạng thái và dừng
    └── services/
        ├── process.service.ts   # Quản lý worker và thời hạn chạy
        ├── worker.service.ts    # Kết nối controller với Python worker
        └── telemetry.service.ts # Gửi trạng thái tới God-View
```

`dist/` và `__pycache__/` là đầu ra sinh tự động, không thuộc mã nguồn và đã
được bỏ qua bởi `.gitignore` ở thư mục gốc. Chưa tạo thư mục rỗng hoặc module
giả cho SSH, file descriptor và truyền dữ liệu.

## Các lệnh và API còn tồn tại

Từ thư mục gốc, chạy `npm run build` để kiểm tra build; `npm run dev:attacker`
khởi động controller và `npm run attack:cli` mở menu. Chỉ bộ chạy trong lab
Docker cũ có thể thực hiện SYN ở thời điểm hiện tại.

| Endpoint | Trách nhiệm hiện tại |
| --- | --- |
| `GET /health` | Tình trạng controller; danh sách kịch bản chỉ có `SYN_FLOOD` |
| `POST /attack/syn-flood` | Bộ chạy SYN cũ, giữ giới hạn mục tiêu/tốc độ/thời gian |
| `GET /attack/status` | Xem worker đang chạy |
| `POST /attack/stop` | Dừng worker |

Bước triển khai tiếp theo bắt đầu bằng kiểm tra HTTP/SSH hai chiều qua
hotspot và thống nhất cấu hình IP với máy server, theo kế hoạch đã chốt.
