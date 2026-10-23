import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDatabase } from './database/db.js';
import { telemetryMiddleware } from './middlewares/telemetry.middleware.js';
import { authRouter } from './routes/auth.routes.js';
import { resourceRouter } from './routes/resource.routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Khởi tạo Database SQLite
initDatabase();

// Middlewares
app.use(cors());
app.use(express.json());

// Logger Telemetry Middleware (Chặng 1 - Bước 1.4)
app.use(telemetryMiddleware);

// API Endpoints (Bắt buộc theo tài liệu)
app.use('/api', authRouter);
app.use('/api', resourceRouter);

// Serve Client Static Files (HTML / JS giao diện đăng nhập)
const clientPath = path.resolve(__dirname, '../../client');
app.use(express.static(clientPath));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'Target App & Server', port: PORT });
});

app.listen(PORT, () => {
  console.log(`[Target Server] Đang chạy tại http://localhost:${PORT}`);
  console.log(`[Target Server] Các endpoint bắt buộc:`);
  console.log(`  - POST /api/login (Lỗ hổng SQLi)`);
  console.log(`  - GET  /api/resources (Tài nguyên mật)`);
});
