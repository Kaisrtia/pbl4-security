import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDatabase } from './database/db.js';
import { telemetryMiddleware } from './middlewares/telemetry.middleware.js';
import { authRouter } from './routes/auth.routes.js';
import { resourceRouter } from './routes/resource.routes.js';
import { startOsAgent, setSynCookiesConfig, setArpEntrySpoofed } from './services/os-agent.service.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = process.env.PORT || 8080;
// Khởi tạo Database SQLite (Users & Resources)
initDatabase();
// Middlewares
app.use(cors());
app.use(express.json());
// Logger Telemetry Middleware
app.use(telemetryMiddleware);
// API Endpoints
app.use('/api', authRouter);
app.use('/api', resourceRouter);
// Endpoint điều khiển phòng thủ (Demo Bước 4: Trung bật syn_cookies = 1)
app.post('/api/defense/syn-cookies', (req, res) => {
    const { enabled = true } = req.body;
    setSynCookiesConfig(enabled ? 1 : 0);
    console.log(`[OS Config] Đã cập nhật sysctl net.ipv4.tcp_syncookies = ${enabled ? 1 : 0}`);
    res.json({ success: true, syn_cookies: enabled ? 1 : 0 });
});
// Endpoint mô phỏng trạng thái ARP khi bị tấn công
app.post('/api/simulation/arp-state', (req, res) => {
    const { is_spoofed = false } = req.body;
    setArpEntrySpoofed(Boolean(is_spoofed));
    res.json({ success: true, is_spoofed });
});
// Serve Client Static Files
const clientPath = path.resolve(__dirname, '../../client');
app.use(express.static(clientPath));
app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'Target Server', ip: '172.20.0.20', port: PORT });
});
app.listen(PORT, () => {
    console.log(`[Target Server] Đang chạy tại http://172.20.0.20:${PORT}`);
    console.log(`[Target Server] Các endpoint bắt buộc:`);
    console.log(`  - POST /api/login (Lỗ hổng SQLi)`);
    console.log(`  - GET  /api/resources (Tài nguyên mật)`);
    // Khởi chạy OS Agent đọc bảng mạng gửi về God-View
    startOsAgent(2000);
});
//# sourceMappingURL=index.js.map