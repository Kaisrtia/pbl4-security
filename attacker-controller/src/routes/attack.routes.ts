import { Router, type Request, type Response } from 'express';
import { toggleArpSpoof } from '../attacks/mitm.attack.js';
import { startHttpDosAttack, startSynFloodAttack } from '../attacks/dos.attack.js';
import { runTcpRstInjection } from '../attacks/tcp_rst.attack.js';
import { runSqlInjectionAttack } from '../attacks/sqli.attack.js';
import { inspectTargetContract } from '../attacks/recon.attack.js';
import { processes } from '../services/process.service.js';
import { InputError, ConflictError } from '../config.js';
export const attackRouter = Router();
type Handler = (req: Request, res: Response) => Promise<unknown> | unknown;
const handle = (fn: Handler) => async (req: Request, res: Response) => {
  try { return res.json(await fn(req, res)); }
  catch (error) {
    const status = error instanceof InputError ? 400 : error instanceof ConflictError ? 409 : 500;
    return res.status(status).json({ error: (error as Error).message, labRestricted: true });
  }
};
// Aliases from the Week 1 handover remain available for the dashboard and CLI.
attackRouter.post('/recon', handle(req => {
  const b = req.body ?? {};
  return inspectTargetContract(b.targetIp);
}));

attackRouter.post('/arp-spoof', handle(req => {
  const b = req.body ?? {};
  return toggleArpSpoof(b.enable ?? true, b.clientIp, b.serverIp, b.durationSec ?? 60);
}));
attackRouter.post('/mitm', handle(req => {
  const b = req.body ?? {};
  return toggleArpSpoof(b.enable ?? true, b.clientIp, b.serverIp, b.durationSec ?? 60);
}));
attackRouter.post('/syn-flood', handle(req => {
  const b = req.body ?? {};
  return startSynFloodAttack(b.targetIp, b.port ?? 8080, b.durationSec ?? 10, b.packetsPerSec ?? 50);
}));
attackRouter.post('/dos', handle(req => {
  const b = req.body ?? {};
  return startHttpDosAttack(
    b.targetUrl ?? 'http://172.20.0.20:8080/api/login',
    b.ratePerSec ?? 50,
    b.durationSec ?? 10
  );
}));
attackRouter.post('/tcp-rst', handle(req => {
  const b = req.body ?? {};
  return runTcpRstInjection(b.clientIp, b.targetIp, b.port ?? 8080, b.durationSec ?? 10);
}));
attackRouter.post('/sqli', handle(req => {
  const b = req.body ?? {};
  return runSqlInjectionAttack(b.targetUrl ?? 'http://172.20.0.20:8080/api/login',
    b.payload ?? "' OR '1'='1' --");
}));
attackRouter.get('/status', (_req, res) => res.json({ labRestricted: true, running: processes.snapshot() }));

attackRouter.post('/stop', (_req, res) => {
  processes.stopAll();
  return res.json({ status: 'stopped', labRestricted: true });
});
