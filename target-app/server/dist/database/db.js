import Database from 'better-sqlite3';
import path from 'path';
const dbPath = path.resolve(process.cwd(), 'target_database.sqlite');
// Khai báo kiểu tường minh để TypeScript có thể phát sinh file declaration.
export const db = new Database(dbPath);
export function initDatabase() {
    // Bảng Users theo yêu cầu Chặng 1
    db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user'
    );
  `);
    // Bảng Resources chứa tài nguyên mật theo yêu cầu Chặng 1
    db.exec(`
    CREATE TABLE IF NOT EXISTS resources (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      secret_content TEXT NOT NULL,
      classification_level TEXT NOT NULL
    );
  `);
    // Thêm dữ liệu mẫu nếu chưa có
    const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
    if (userCount.count === 0) {
        const insertUser = db.prepare('INSERT INTO users (username, password, role) VALUES (?, ?, ?)');
        insertUser.run('admin', 'Admin@123456', 'administrator');
        insertUser.run('user1', 'Password@123', 'standard_user');
    }
    const resCount = db.prepare('SELECT COUNT(*) as count FROM resources').get();
    if (resCount.count === 0) {
        const insertRes = db.prepare('INSERT INTO resources (title, secret_content, classification_level) VALUES (?, ?, ?)');
        insertRes.run('Project Top Secret Plan', 'CONFIDENTIAL: Financial Report & Master Keys', 'TOP_SECRET');
        insertRes.run('Server Credentials', 'SSH Key: ssh-rsa AAAAB3NzaC1yc2E...', 'RESTRICTED');
    }
    console.log('Database initialized successfully with Users & Resources.');
}
//# sourceMappingURL=db.js.map