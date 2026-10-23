import { Router, Request, Response } from 'express';
import { runSqlInjectionAttack } from '../attacks/sqli.attack.js';
import { startDosAttack } from '../attacks/dos.attack.js';
import { toggleMitmAttack } from '../attacks/mitm.attack.js';

export const attackRouter = Router();

/**
 * POST /attack/mitm
 * Bật / tắt chế độ nghe lén trên đường truyền
 */
attackRouter.post('/mitm', async (req: Request, res: Response) => {
  const { enable = true, proxyPort = 8080, targetHost = 'http://localhost:3000' } = req.body;
  const result = await toggleMitmAttack(Boolean(enable), Number(proxyPort), String(targetHost));
  return res.json(result);
});

/**
 * POST /attack/sqli
 * Kích hoạt bắn payload SQL Injection vào cổng 3000
 */
attackRouter.post('/sqli', async (req: Request, res: Response) => {
  const { targetUrl = 'http://localhost:3000/api/login', payload = "' OR '1'='1" } = req.body;
  const result = await runSqlInjectionAttack(String(targetUrl), String(payload));
  return res.json(result);
});

/**
 * POST /attack/dos
 * Kích hoạt bắn 50 requests/giây vào cổng 3000
 */
attackRouter.post('/dos', async (req: Request, res: Response) => {
  const {
    targetUrl = 'http://localhost:3000/api/login',
    ratePerSec = 50,
    durationSec = 10
  } = req.body;

  const result = await startDosAttack(String(targetUrl), Number(ratePerSec), Number(durationSec));
  return res.json(result);
});
