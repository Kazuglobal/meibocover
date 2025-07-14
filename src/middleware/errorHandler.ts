import { Request, Response, NextFunction } from 'express';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('エラー:', err);

  if (err.code === '23505') {
    // PostgreSQL unique violation
    return res.status(409).json({
      error: '既に存在するデータです',
      details: err.detail
    });
  }

  if (err.code === '23503') {
    // PostgreSQL foreign key violation
    return res.status(400).json({
      error: '参照エラー',
      details: err.detail
    });
  }

  if (err.message && err.message.includes('サポートされていない')) {
    return res.status(400).json({
      error: err.message
    });
  }

  res.status(500).json({
    error: 'サーバーエラーが発生しました',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
}; 