import { Router } from 'express';
import { pool } from '../database/db';
import { v4 as uuidv4 } from 'uuid';

export const router = Router();

// デザイン保存
router.post('/', async (req, res, next) => {
  try {
    if (!pool) {
      return res.json({ 
        success: true, 
        design: { id: uuidv4(), ...req.body },
        message: 'データベース未接続のため、メモリに保存されました'
      });
    }

    const {
      projectId,
      paperType,
      titleText,
      titleFont,
      schoolLogoUrl,
      foilType,
      previewUrl,
      isDraft
    } = req.body;

    const result = await pool!.query(
      `INSERT INTO cover_designs 
       (project_id, paper_type, title_text, title_font, school_logo_url, foil_type, preview_url, is_draft)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [projectId, paperType, titleText, titleFont, schoolLogoUrl, foilType, previewUrl, isDraft]
    );

    res.json({ success: true, design: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

// デザイン取得
router.get('/:projectId', async (req, res, next) => {
  try {
    if (!pool) {
      return res.json({ 
        design: {
          id: req.params.projectId,
          paper_type: 'レザック66_白',
          title_text: 'サンプル',
          title_font: 'ゴシック体',
          school_logo_url: '',
          foil_type: 'none'
        }
      });
    }

    const { projectId } = req.params;
    
    const result = await pool!.query(
      'SELECT * FROM cover_designs WHERE project_id = $1 ORDER BY created_at DESC LIMIT 1',
      [projectId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'デザインが見つかりません' });
    }

    res.json({ design: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

// 過去デザイン検索
router.get('/search/:schoolName', async (req, res, next) => {
  try {
    if (!pool) {
      return res.json({ designs: [] });
    }

    const { schoolName } = req.params;
    
    const result = await pool!.query(
      `SELECT cd.*, c.school_name, dp.year 
       FROM cover_designs cd
       JOIN design_projects dp ON cd.project_id = dp.id
       JOIN customers c ON dp.customer_id = c.id
       WHERE c.school_name ILIKE $1
       ORDER BY dp.year DESC`,
      [`%${schoolName}%`]
    );

    res.json({ designs: result.rows });
  } catch (error) {
    next(error);
  }
}); 