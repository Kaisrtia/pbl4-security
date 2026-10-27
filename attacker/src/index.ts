import express from 'express';
import cors from 'cors';
import { attackRouter } from './routes/attack.routes.js';
import { processes } from './services/process.service.js';
import { LAB } from './config.js';
const app = express();
const PORT = Number(process.env.PORT || 5000);
app.use(cors());
app.use(express.json({ limit: '16kb' }));
app.use('/attack', attackRouter);
app.get('/health', (_req, res) => res.json({
  status: 'ok',
  service: 'Attacker Controller',
  port: PORT,
  labRestricted: true,
  allowedTargets: [LAB.client, LAB.server],
  scenarios: ['RECON', 'ARP_SPOOF', 'SYN_FLOOD', 'DOS_FLOOD', 'TCP_RST', 'SQL_INJECTION']
}));
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`[Attacker Controller] Lab API at http://${LAB.hacker}:${PORT}`);
  console.log(`[Attacker Controller] Restricted targets: ${LAB.client}, ${LAB.server}`);
});
function shutdown() {
  processes.stopAll();
  server.close(() => process.exit(0));
}
process.once('SIGTERM', shutdown);
process.once('SIGINT', shutdown);
