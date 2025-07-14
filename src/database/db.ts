import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

let pool: Pool | null = null;

try {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });

  pool.on('error', (err) => {
    console.error('データベースエラー:', err);
    // データベースエラーでもサーバーを停止しない
  });

  console.log('データベース接続設定完了');
} catch (error) {
  console.warn('データベース接続をスキップしました:', error);
}

export { pool }; 