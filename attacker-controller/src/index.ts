import express from 'express';
import cors from 'cors';
import { attackRouter } from './routes/attack.routes.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Routes tấn công
app.use('/attack', attackRouter);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'Attacker Controller', port: PORT });
});

app.listen(PORT, () => {
  console.log(`[Attacker Controller] Đang chạy tại http://localhost:${PORT}`);
  console.log(`[Attacker Controller] Các endpoint bắt buộc:`);
  console.log(`  - POST /attack/mitm: Bật/tắt nghe lén`);
  console.log(`  - POST /attack/sqli: Kích hoạt SQLi`);
  console.log(`  - POST /attack/dos:  Kích hoạt DoS 50 req/s`);
});
