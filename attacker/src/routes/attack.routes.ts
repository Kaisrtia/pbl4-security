import { Router, type Request, type Response } from 'express';
import { startSynFloodAttack } from '../attacks/syn_flood.attack.js';
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
attackRouter.post('/syn-flood', handle(req => {
  const b = req.body ?? {};
  return startSynFloodAttack(b.targetIp, b.port ?? 8080, b.durationSec ?? 10, b.packetsPerSec ?? 50);
}));
attackRouter.get('/status', (_req, res) => res.json({ labRestricted: true, running: processes.snapshot() }));

attackRouter.post('/stop', (_req, res) => {
  processes.stopAll();
  return res.json({ status: 'stopped', labRestricted: true });
});
