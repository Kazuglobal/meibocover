import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { router as designRouter } from './routes/design';
import { router as uploadRouter } from './routes/upload';
import { router as projectRouter } from './routes/project';
import { errorHandler } from './middleware/errorHandler';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// ミドルウェア
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 静的ファイル
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ヘルスチェック
app.get('/', (req, res) => {
  res.json({ 
    message: 'Cover Preview API Server',
    status: 'running',
    version: '1.0.0',
    endpoints: [
      'GET /api/designs/:projectId',
      'POST /api/designs',
      'GET /api/projects/by-url/:url',
      'POST /api/projects',
      'POST /api/upload'
    ]
  });
});

// ルート
app.use('/api/designs', designRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/projects', projectRouter);

// エラーハンドリング
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`サーバーが起動しました: http://localhost:${PORT}`);
}); 