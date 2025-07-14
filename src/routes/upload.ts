import { Router } from 'express';
import multer from 'multer';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';

export const router = Router();

// Multer設定
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads');
    await fs.mkdir(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|xls|xlsx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('サポートされていないファイル形式です'));
    }
  }
});

// 画像アップロード（背景削除付き）
router.post('/image', upload.single('image'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'ファイルがアップロードされていません' });
    }

    const { removeBackground } = req.body;
    let processedPath = req.file.path;

    if (removeBackground === 'true') {
      // 背景削除処理（実際のAPIを使用する場合はここを修正）
      const outputPath = path.join(
        path.dirname(req.file.path),
        `processed_${req.file.filename}`
      );
      
      // 仮の処理（実際はremove.bg APIなどを使用）
      await sharp(req.file.path)
        .png()
        .toFile(outputPath);
      
      processedPath = outputPath;
    }

    const fileUrl = `/uploads/${path.basename(processedPath)}`;
    
    res.json({
      success: true,
      file: {
        url: fileUrl,
        originalName: req.file.originalname,
        size: req.file.size
      }
    });
  } catch (error) {
    next(error);
  }
});

// ドキュメントアップロード
router.post('/document', upload.single('document'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'ファイルがアップロードされていません' });
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    
    res.json({
      success: true,
      file: {
        url: fileUrl,
        originalName: req.file.originalname,
        size: req.file.size,
        type: req.file.mimetype
      }
    });
  } catch (error) {
    next(error);
  }
}); 