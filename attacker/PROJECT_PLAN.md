# Định hướng dự án và kế hoạch phần máy thực nghiệm

Tài liệu này chốt những quyết định đã trao đổi **trước khi triển khai các kịch bản mới**. Nó mô tả mô hình đích, phạm vi phần `attacker/`, các kịch bản đã chọn, cách đánh giá và khoảng cách so với mã hiện tại. Cấu trúc và trạng thái sau khi dọn mã cũ nằm trong [README.md](README.md).

## 1. Mục tiêu chung

**Tên đề tài:** Nghiên cứu và triển khai mô hình phòng thủ đa lớp kết hợp trực quan hóa sự kiện thời gian thực cho kiến trúc Client–Server.

Kết quả cần trình diễn là một ứng dụng client–server có thể quan sát được, một máy thực nghiệm tạo các hành vi tấn công đã xác định, và God-View hiển thị sự kiện từ cả hai phía. Nhóm so sánh trạng thái **bình thường → chịu tác động → bật từng biện pháp phòng thủ → phối hợp các biện pháp**. Kết luận phải dựa trên số liệu và kết quả quan sát được, không dựa riêng vào thông báo “đã chạy” từ máy thực nghiệm.

Phòng thủ không chỉ là tường lửa. Nhóm xét ba **phạm vi triển khai**:

| Phạm vi | Ví dụ biện pháp | Người phụ trách chính |
| --- | --- | --- |
| Mạng | Chính sách truy cập, lọc/giới hạn lưu lượng, kiểm soát kết nối ra | Phối hợp máy thực nghiệm và máy server |
| Hệ điều hành/host | Cấu hình TCP, tài khoản và dịch vụ SSH, quyền tệp, giới hạn tài nguyên, giám sát tiến trình | Partner phụ trách server/host-agent; máy thực nghiệm tạo tình huống kiểm thử |
| Ứng dụng | Xác thực, phân quyền, truy vấn an toàn, giới hạn yêu cầu | Partner phụ trách ứng dụng |

Mô hình OSI dùng để giải thích vị trí của giao thức và tác động kỹ thuật; mạng, hệ điều hành và ứng dụng là các phạm vi triển khai phòng thủ, không phải ba tầng OSI ngang hàng. SSH là giao thức tầng ứng dụng, nhưng trong kế hoạch này được khảo sát như **dịch vụ quản trị của host**, tách khỏi ứng dụng web do partner phụ trách.

## 2. Hình thức demo và kiến trúc đích

Demo dùng **hai máy vật lý trong cùng LAN**:

| Máy | Thành phần và vai trò |
| --- | --- |
| Máy partner | Chạy Linux trực tiếp; host ứng dụng server, các cơ chế phòng thủ và God-View. Host-agent dự kiến đọc trạng thái thật và thực hiện các thao tác quản trị được giới hạn. |
| Máy của mình | Chạy controller/kịch bản thực nghiệm và client kiểm tra truy cập hợp lệ. Tiếp nhận dữ liệu mẫu trong kịch bản truyền dữ liệu ra ngoài. |

IP, interface và cổng sẽ được **cấu hình theo môi trường LAN tại lúc triển khai**. Dải `172.20.0.0/24` và interface `eth0` trong mã hiện tại chỉ thuộc lab Docker cũ. Có thể tiếp tục dùng Docker cho phát triển, nhưng mạng bridge Docker một máy không tự biến thành LAN hai máy.

### Điều kiện mạng đã chốt: hotspot điện thoại

Nhóm hiện chỉ dùng điện thoại phát Wi-Fi cho hai máy. Giữ nguyên bốn kịch bản, nhưng đưa kiểm chứng mạng lên đầu: nhận IP bằng DHCP, ghi nhận IP/interface thực tế, thử HTTP/SSH tới server và thử kết nối chiều server → máy thực nghiệm. IP có thể đổi sau khi kết nối lại. Nếu hotspot cô lập các thiết bị và không thể tắt chế độ đó, đổi IP hoặc sửa code không tự giải quyết được kết nối trực tiếp.

Các phép thử SSH, quyền tệp và truyền dữ liệu mẫu được ưu tiên trước; SYN Flood được đo sau khi đã biết độ ổn định của Wi-Fi. Cần đối chiếu gói thực sự đến server, bộ đếm phòng thủ và truy cập hợp lệ để tránh quy lỗi nghẽn hotspot thành hiệu quả hoặc thất bại của phòng thủ. Không đặt tiêu chí bắt buộc làm server sập.

God-View cần trình bày: giai đoạn hiện tại, hành động từ máy thực nghiệm, quan sát độc lập từ server, lớp phòng thủ đã tác động, số liệu trước/sau, và truy cập hợp lệ còn hoạt động hay không. Nếu server quá tải khiến telemetry dừng, giao diện phải phân biệt **mất dữ liệu quan sát** với **dịch vụ mục tiêu lỗi**.

## 3. Bốn kịch bản được chọn

| Mã | Kịch bản | Mục đích và bằng chứng tối thiểu |
| --- | --- | --- |
| S1 | **Chuỗi xâm nhập qua dịch vụ SSH của lab** | Trinh sát → kiểm tra cấu hình yếu → truy cập tài khoản thử nghiệm → thử duy trì quyền truy cập → thử xóa dấu vết trong dữ liệu mẫu. Mỗi bước có kết quả được server xác nhận. |
| S2 | **TCP SYN Flood có giới hạn** | Đo tác động lên khả năng thiết lập kết nối TCP và truy cập hợp lệ; đối chiếu với lọc lưu lượng và `tcp_syncookies`. Đây là thí nghiệm tính sẵn sàng riêng, không phải một bước dẫn đến truy cập trái phép. |
| S3 | **Cạn kiệt file descriptor có giới hạn** | Sau khi có quyền chạy tiến trình lab trên máy server, tạo áp lực lên giới hạn file descriptor; đo tác động và hiệu quả của `ulimit`/giới hạn tiến trình hoặc cgroups. |
| S4 | **Truyền dữ liệu mẫu ra khỏi server** | Sau khi có quyền đọc tệp mẫu, thử đưa nó sang máy thực nghiệm bằng một kênh được xác định trước; đo kết quả trước/sau quyền tệp và chính sách kết nối đi ra. |

S1 là câu chuyện demo chính. S3 và S4 có thể được đưa vào nhánh **sau khi truy cập**; S2 là phép thử riêng về khả năng phục vụ. Nếu phòng thủ chặn S1 ở bước đăng nhập, các bước sau phải ghi **“chưa thực hiện”**. Khi muốn đánh giá riêng S3/S4, nhóm mở một phiên thực nghiệm khác với điều kiện đầu vào rõ ràng: tài khoản lab đã có quyền truy cập.

### Chuỗi S1 và vị trí của S4

| Bước thầy yêu cầu | Cách làm trong lab | Kết quả cần ghi |
| --- | --- | --- |
| **Trinh sát** | Xác định máy server được chỉ định, cổng và dịch vụ có thể tiếp cận. | Cổng/dịch vụ thực sự quan sát được; không suy diễn rằng cổng mở là lỗ hổng. |
| **Quét điểm yếu/lỗ hổng** | Kiểm tra có chọn lọc phiên bản và cấu hình của dịch vụ lab, đặc biệt cách xác thực SSH. | Phát hiện kèm bằng chứng và độ chắc chắn; cấu hình yếu cần được chứng minh, không gán nhãn CVE nếu chưa xác thực. |
| **Truy cập** | Kiểm tra tài khoản lab có mật khẩu yếu được chuẩn bị cho lượt đối chứng; xác nhận bằng thao tác vô hại. | Log xác thực ở server và trạng thái phiên đăng nhập, không chỉ phản hồi từ controller. |
| **Duy trì truy cập** | Trong phạm vi tài khoản lab, thử một thay đổi cho phép truy cập lại, có thời hạn và có cách hoàn tác; đóng phiên ban đầu rồi kiểm tra lại. | Thay đổi được ghi nhận, quyền truy cập lại thành công hoặc bị chặn, khả năng phát hiện và thu hồi. |
| **Mở rộng: lấy và truyền dữ liệu mẫu (S4)** | Thử đọc tệp được bảo vệ và chuyển bản sao nhỏ sang máy thực nghiệm. | Quyền đọc, kết nối ra, đích nhận và lượng dữ liệu; phân biệt “đã thử gửi” với “máy kia đã nhận”. |
| **Xóa dấu vết** | Thử sửa/xóa **tệp nhật ký riêng của bài thực nghiệm**. So sánh với sự kiện đã được God-View tiếp nhận. | Hành động thành công hay bị từ chối; bằng chứng còn lại trong nơi lưu sự kiện mà tài khoản lab không được sửa. |

Kịch bản đọc tệp sử dụng **tệp dữ liệu mẫu có chủ đích**. Không dùng việc đọc `/etc/passwd` làm bằng chứng vượt quyền: trên Linux, tệp này thường được phép đọc công khai và mật khẩu băm nằm ở `/etc/shadow` với quyền truy cập khác. Bước xóa dấu vết nhằm kiểm tra khả năng phát hiện và giữ bằng chứng, không đặt mục tiêu xóa log hệ thống thật. Việc duy trì quyền truy cập chỉ được coi là thành công khi đã đóng phiên cũ và kiểm tra được phiên mới.

## 4. Ghép kỹ thuật với phòng thủ

| Tình huống | Biện pháp dự kiến | Bằng chứng so sánh |
| --- | --- | --- |
| Trinh sát và tiếp cận dịch vụ | Chỉ mở cổng cần thiết; nftables giới hạn nguồn/cổng truy cập | Cổng nhìn thấy từ máy thực nghiệm; bộ đếm chặn phía server |
| Cấu hình SSH yếu và thử đăng nhập | Cấu hình phương thức đăng nhập/tài khoản, khóa SSH và giới hạn thử xác thực phù hợp | Log xác thực, số lần thất bại, kết quả đăng nhập của tài khoản lab |
| Thử duy trì truy cập | Quyền tài khoản tối thiểu, giám sát thay đổi, thu hồi thay đổi thử nghiệm | Dấu vết thay đổi và trạng thái truy cập lại; không khẳng định mọi thay đổi của chính chủ tài khoản đều có thể bị chặn bằng DAC |
| Đọc tệp mẫu | DAC: owner, group và quyền tệp; chạy dịch vụ bằng user riêng | Truy cập bị từ chối/thành công và sự kiện phía host |
| Truyền dữ liệu mẫu ra ngoài | Quyền đọc tệp, chính sách lưu lượng ra của host, giám sát kết nối | Có/không có dữ liệu ở máy nhận, lưu lượng ra và bộ đếm lọc. Chặn một kênh riêng không chứng minh đã chặn mọi đường truyền. |
| Sửa/xóa nhật ký mẫu | Quyền ghi/xóa, thu thập sự kiện tách khỏi tài khoản lab | Tệp mẫu thay đổi ra sao; bản ghi đối chiếu còn hay mất |
| SYN Flood | Lọc/giới hạn lưu lượng bằng nftables, cấu hình TCP `tcp_syncookies` | `SYN_RECV`, bộ đếm liên quan, tỷ lệ kết nối hợp lệ thành công và độ trễ |
| Cạn file descriptor | Giới hạn theo tiến trình/user; cô lập bằng cgroups hoặc service unit | File descriptor đang dùng, lỗi đạt giới hạn, tác động tới dịch vụ khác |

`tcp_syncookies` là cơ chế dự phòng khi hàng đợi SYN bị tràn, không phải lời giải cho mọi loại DoS. `ulimit` áp dụng cho tiến trình và các tiến trình kế thừa; giới hạn cgroups bảo vệ theo nhóm tiến trình. `nologin` ngăn tài khoản đăng nhập qua shell phù hợp, không thay thế cô lập tiến trình hay bảo vệ một phiên đã được cấp quyền.

## 5. Những gợi ý đã xem xét nhưng chưa chọn

| Kỹ thuật trong ảnh/cuộc trao đổi | Quyết định và lý do |
| --- | --- |
| ARP Spoofing + Static ARP | Để mở rộng. Demo nghe lén/MITM cần client nạn nhân tách khỏi attacker và server, cùng đường đi mạng phù hợp; có thể bổ sung VM nhưng không cần cho hai máy ban đầu. Static ARP chỉ bảo vệ các ánh xạ đã cấu hình. |
| TCP RST Injection | Chưa chọn. Mã cũ cần ARP Spoofing để nhìn thấy luồng TCP; hai máy thuần túy khó chứng minh bên thứ ba đã chèn RST hợp lệ vào một phiên thật. |
| Reverse Shell | Chưa chọn. Cần có điều kiện thực thi lệnh trên server trước; reverse shell không tự tạo quyền truy cập ban đầu và dễ mở rộng sang phần ứng dụng của partner. |
| Fork Bomb không giới hạn | Không dùng trong demo. Nếu muốn khảo sát số task, dùng tiến trình tạo số lượng hữu hạn trong môi trường có giới hạn thay vì gây mất ổn định cho máy host. |
| Đọc `/etc/passwd` | Thay bằng tệp mẫu có quyền được thiết kế cho đối chứng. Đọc `/etc/passwd` không chứng minh đã vượt quyền. |
| HTTP DoS, SQL Injection của mã cũ | Chưa thuộc bốn kịch bản chốt của phần máy thực nghiệm. SQL Injection và phòng thủ ứng dụng do partner phụ trách; có thể tích hợp sau nếu nhóm thống nhất. |

ARP MITM, TCP RST, SQL Injection, HTTP DoS và mục recon chỉ gọi `/health` đã được xóa khỏi phần attacker. Bộ chạy SYN Flood cũ được giữ để tái sử dụng. Có thể tra các phần đã xóa trong lịch sử Git; schema dùng chung và giao diện God-View vẫn còn các kiểu/hiệu ứng của mô hình trước.

## 6. Phân công và vị trí công việc trong repository

| Vị trí | Trách nhiệm |
| --- | --- |
| [`attacker/src/`](src/) | Controller, menu/API, quản lý phiên và tiến trình, các kịch bản đã chọn, telemetry phía máy thực nghiệm. `src/config.ts` hiện vẫn khóa IP của lab Docker. |
| [`attacker/scripts/`](scripts/) | Worker packet-level hiện có; chỉ mở rộng khi kịch bản thực sự cần xử lý gói tin. |
| [`deploy/attacker/`](../deploy/attacker/) | Cách đóng gói và chạy công cụ trên máy thực nghiệm. `deploy/local/` là lab Docker một máy để phát triển. |
| [`experiments/`](../experiments/) | Định nghĩa điều kiện thử, phép đo, kết quả và cách lặp lại; phần attacker chịu trách nhiệm tham số tấn công và đầu ra của mình. |
| [`packages/shared/`](../packages/shared/) | Hợp đồng sự kiện dùng chung, cần thống nhất với partner trước khi thay schema. |
| [`apps/target-app/`](../apps/target-app/) | Ứng dụng server và phòng thủ ứng dụng do partner phụ trách. |
| [`agents/host-agent/`](../agents/host-agent/) | Chương trình host phía server sẽ thu số liệu thật và quản lý các thao tác phòng thủ được cho phép; hiện mới có README. |
| [`apps/god-view/`](../apps/god-view/) | Thu nhận, lưu trữ và trực quan hóa sự kiện phía server. |

`deploy/` trả lời **chạy và cấu hình các thành phần trên máy nào, bằng cách nào**. `agents/host-agent/` là **chương trình chạy trên máy server để đọc trạng thái host và áp dụng cấu hình phòng thủ đã định nghĩa**. Phần của mình chủ yếu ở `attacker/`, `deploy/attacker/` và phần tham số thực nghiệm trong `experiments/`; vẫn phải phối hợp với partner về schema, trạng thái server và phép đo.

## 7. Cách đánh giá và nguyên tắc trình bày kết quả

Mỗi kịch bản cần ít nhất một lượt **đối chứng** và một lượt **có phòng thủ**, với điều kiện đầu vào giống nhau: máy, cấu hình, thời lượng, tốc độ tạo lưu lượng và client hợp lệ. Nếu đo phòng thủ phối hợp, ghi thêm lượt bật nhiều lớp. Mỗi lần chạy có mã phiên để ghép sự kiện từ máy thực nghiệm, server và client theo cùng một dòng thời gian.

Những phép đo quan trọng:

- **Tính sẵn sàng:** tỷ lệ thao tác hợp lệ thành công, độ trễ và số lỗi trước/sau tấn công.
- **Mạng/TCP:** kết nối đang mở, `SYN_RECV`, bộ đếm lọc, cấu hình TCP thực tế; phân biệt gói đã gửi với gói server đã nhận.
- **Host:** CPU, RAM, số tiến trình/task, file descriptor và các lần chạm giới hạn.
- **Truy cập:** xác thực thành công/thất bại, quyền đọc tệp, thay đổi quyền hoặc cấu hình và lần truy cập lại.
- **Truyền dữ liệu:** bản sao có thực sự đến máy nhận không, kích thước bao nhiêu, kênh nào bị chặn.
- **Quan sát:** sự kiện có nguồn nào phát ra, được God-View nhận/lưu lúc nào, có khoảng trống telemetry hay không.

Không kết luận “tấn công thành công” chỉ vì controller đã phát lệnh; không kết luận “được bảo vệ” chỉ vì badge hiển thị ON. Khi bị chặn ở một bước của chuỗi, các bước phụ thuộc sau đó phải được đánh dấu **chưa thực hiện**. Nếu muốn đánh giá riêng một bước sau truy cập, tạo phiên thử khác và ghi rõ điều kiện ban đầu.

## 8. Đánh giá khả thi và khoảng cách hiện tại

**Khả thi với hai máy**, nhất là khi máy server có thể chạy Linux trực tiếp và nhóm có thời gian để kiểm thử. Quét dịch vụ, SSH lab, SYN Flood có giới hạn và kênh truyền dữ liệu mẫu đều phù hợp hai máy. Kịch bản cạn file descriptor cần một tài khoản/tiến trình lab trên server; không phải tấn công từ xa độc lập. Sự ổn định của demo phụ thuộc chất lượng cấu hình LAN, trạng thái dịch vụ SSH, quyền của host-agent và phép đo phía server.

Những thứ đã có trong repository:

- Controller TypeScript, CLI và một worker Python `scripts/syn_flood.py` cho SYN Flood trong lab Docker cũ; chưa có worker cho ba kịch bản còn lại.
- Target App, God-View, API telemetry và WebSocket cơ bản.
- Cấu trúc thư mục mới tách `apps/`, `attacker/`, `packages/`, `agents/`, `deploy/`, `experiments/`.

Những thứ **chưa có hoặc chưa đúng mô hình đích**:

- [`src/config.ts`](src/config.ts) và worker vẫn dùng IP/interface cố định của Docker; mục `recon` chỉ gọi `/health` đã được xóa; chưa có bộ quét dịch vụ và điểm yếu mới.
- [`deploy/local/compose.yaml`](../deploy/local/compose.yaml) vẫn là lab bốn container trên **một** máy, chưa phải triển khai LAN hai máy.
- [`agents/host-agent/`](../agents/host-agent/) chưa có runtime. OS Agent trong Target App đang phát dữ liệu ARP/TCP mô phỏng; API bật SYN Cookies chỉ đổi biến trong chương trình.
- Chưa có kịch bản SSH theo năm bước, cạn file descriptor, truyền dữ liệu mẫu ra ngoài hoặc đo client hợp lệ theo phiên.
- [Schema telemetry hiện tại](../packages/shared/src/telemetry.types.ts) và God-View chưa diễn đạt đầy đủ giai đoạn, phiên thử, lớp phòng thủ, nguồn bằng chứng và kết quả trước/sau. Lịch sử God-View hiện chỉ giữ trong bộ nhớ.

Vì vậy, **refactor thư mục đã xong; triển khai, đo lường và xác minh phòng thủ đa lớp là công việc tiếp theo**. Trước khi trình diễn, cần chứng minh cả hai máy đang dùng đúng địa chỉ LAN, dữ liệu host là dữ liệu thật, và chính sách phòng thủ tác động đúng nơi được báo cáo.

## 9. Thứ tự triển khai đề xuất

1. **Kiểm chứng hotspot:** thử kết nối hai chiều, địa chỉ DHCP, cổng dịch vụ, điều kiện firewall và khả năng kết nối lại trước khi chạy kịch bản.
2. **Cấu hình và dữ liệu:** thống nhất cấu hình phiên lab, mã phiên, nguồn quan sát và các phép đo với partner; chuẩn bị host-agent thu số liệu thật và God-View thể hiện trạng thái mất kết nối.
3. **Chuỗi S1 và dữ liệu mẫu S4:** triển khai từng bước có đầu ra kiểm chứng được, phép thử quyền tệp và truyền dữ liệu nhỏ; bảo đảm có thể reset và chạy lại.
4. **Tài nguyên S3:** triển khai phép thử file descriptor có giới hạn; đo tác động lên tiến trình lab và dịch vụ hợp lệ.
5. **SYN Flood S2:** triển khai/chuyển đổi bộ chạy cho LAN sau khi đã biết giới hạn đường truyền; tăng tải có giới hạn và so sánh số liệu trước/sau phòng thủ.
6. **Tổng hợp nghiên cứu:** chạy lặp lại với cùng điều kiện, lưu theo phiên, trình bày dòng thời gian và bảng số liệu; ghi giới hạn của hotspot và những trường hợp phòng thủ không chặn được.

Không cần ép mọi kỹ thuật vào một chuỗi duy nhất. Một chuỗi xâm nhập dễ theo dõi cộng với các thí nghiệm độc lập về khả năng phục vụ và tài nguyên sẽ làm rõ giá trị của từng lớp phòng thủ.

## Tài liệu nền để kiểm chứng khi triển khai

- [Linux: cấu hình TCP và SYN Cookies](https://docs.kernel.org/networking/ip-sysctl.html)
- [Linux: giới hạn file descriptor](https://man7.org/linux/man-pages/man2/getrlimit.2.html) và [cgroups v2](https://docs.kernel.org/admin-guide/cgroup-v2.html)
- [Linux: ý nghĩa quyền đọc `/etc/passwd`](https://man7.org/linux/man-pages/man5/passwd.5.html)
- [nftables: lọc lưu lượng vào/ra](https://wiki.nftables.org/wiki-nftables/index.php/Configuring_chains)
- [MITRE ATT&CK: Exfiltration](https://attack.mitre.org/tactics/TA0010/) và [Indicator Removal](https://attack.mitre.org/techniques/T1070/)
