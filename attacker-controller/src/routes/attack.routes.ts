import { Router, Request, Response } from 'express';
import { toggleArpSpoof } from '../attacks/mitm.attack.js';
import { startSynFloodAttack } from '../attacks/dos.attack.js';
import { runTcpRstInjection } from '../attacks/tcp_rst.attack.js';
import { runSqlInjectionAttack } from '../attacks/sqli.attack.js';

export const attackRouter = Router();

/**
 * Kịch bản 1: ARP Spoofing + Sniffing (Lớp 2)
 */
attackRouter.post('/arp-spoof', async (req: Request, res: Response) => {
  const { enable = true, clientIp = '172.20.0.10', serverIp = '172.20.0.20' } = req.body;
  const result = await toggleArpSpoof(Boolean(enable), String(clientIp), String(serverIp));
  return res.json(result);
});

// Giữ alias /attack/mitm để tương thích
attackRouter.post('/mitm', async (req: Request, res: Response) => {
  const { enable = true, clientIp = '172.20.0.10', serverIp = '172.20.0.20' } = req.body;
  const result = await toggleArpSpoof(Boolean(enable), String(clientIp), String(serverIp));
  return res.json(result);
});

/**
 * Kịch bản 2: TCP SYN Flood (Lớp 4)
 */
attackRouter.post('/syn-flood', async (req: Request, res: Response) => {
  const { targetIp = '172.20.0.20', port = 8080, durationSec = 10 } = req.body;
  const result = await startSynFloodAttack(String(targetIp), Number(port), Number(durationSec));
  return res.json(result);
});

// Giữ alias /attack/dos để tương thích
attackRouter.post('/dos', async (req: Request, res: Response) => {
  const { targetIp = '172.20.0.20', port = 8080, durationSec = 10 } = req.body;
  const result = await startSynFloodAttack(String(targetIp), Number(port), Number(durationSec));
  return res.json(result);
});

/**
 * Kịch bản 3: TCP RST Injection (Lớp 4)
 */
attackRouter.post('/tcp-rst', async (req: Request, res: Response) => {
  const { clientIp = '172.20.0.10', targetIp = '172.20.0.20', port = 8080 } = req.body;
  const result = await runTcpRstInjection(String(clientIp), String(targetIp), Number(port));
  return res.json(result);
});

/**
 * Kịch bản mở rộng: SQL Injection
 */
attackRouter.post('/sqli', async (req: Request, res: Response) => {
  const { targetUrl = 'http://172.20.0.20:8080/api/login', payload = "' OR '1'='1" } = req.body;
  const result = await runSqlInjectionAttack(String(targetUrl), String(payload));
  return res.json(result);
});
