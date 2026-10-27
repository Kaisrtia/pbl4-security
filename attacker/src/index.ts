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
  allowedTargets: [LAB.server],
  scenarios: ['SYN_FLOOD']
}));
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`[Attacker Controller] Lab API at http://${LAB.hacker}:${PORT}`);
  console.log(`[Attacker Controller] Restricted target: ${LAB.server}`);
});
function shutdown() {
  processes.stopAll();
  server.close(() => process.exit(0));
}
process.once('SIGTERM', shutdown);
process.once('SIGINT', shutdown);
