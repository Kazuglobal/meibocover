import { Router } from 'express';
import { pool } from '../database/db';
import { v4 as uuidv4 } from 'uuid';

export const router = Router();

// プロジェクト作成
router.post('/', async (req, res, next) => {
  try {
    const { customerId, year } = req.body;
    
    // URL生成
    const customerUrl = `${uuidv4()}-customer`;
    const salesUrl = `${uuidv4()}-sales`;
    const productionUrl = `${uuidv4()}-production`;

    if (!pool) {
      const mockProject = {
        id: uuidv4(),
        customer_id: customerId,
        year,
        status: 'draft',
        customer_url: customerUrl,
        sales_url: salesUrl,
        production_url: productionUrl,
        created_at: new Date(),
        updated_at: new Date()
      };

      return res.json({ 
        success: true, 
        project: mockProject,
        urls: {
          customer: `${process.env.PUBLIC_URL}/edit/${customerUrl}`,
          sales: `${process.env.PUBLIC_URL}/view/${salesUrl}`,
          production: `${process.env.PUBLIC_URL}/download/${productionUrl}`
        }
      });
    }

    const result = await pool!.query(
      `INSERT INTO design_projects 
       (customer_id, year, customer_url, sales_url, production_url)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [customerId, year, customerUrl, salesUrl, productionUrl]
    );

    res.json({ 
      success: true, 
      project: result.rows[0],
      urls: {
        customer: `${process.env.PUBLIC_URL}/edit/${customerUrl}`,
        sales: `${process.env.PUBLIC_URL}/view/${salesUrl}`,
        production: `${process.env.PUBLIC_URL}/download/${productionUrl}`
      }
    });
  } catch (error) {
    next(error);
  }
});

// プロジェクト取得（URLベース）
router.get('/by-url/:url', async (req, res, next) => {
  try {
    const { url } = req.params;
    
    if (!pool) {
      // モックデータを返す
      const mockProject = {
        id: uuidv4(),
        school_name: 'サンプル学校',
        contact_name: 'テスト太郎',
        email: 'test@example.com',
        year: 2024,
        status: 'draft',
        customer_url: url,
        sales_url: url,
        production_url: url,
        created_at: new Date(),
        updated_at: new Date()
      };

      let accessLevel = 'customer';
      if (url.includes('sales')) accessLevel = 'sales';
      else if (url.includes('production')) accessLevel = 'production';

      return res.json({ 
        project: mockProject,
        accessLevel
      });
    }

    const result = await pool!.query(
      `SELECT dp.*, c.school_name, c.contact_name, c.email 
       FROM design_projects dp
       JOIN customers c ON dp.customer_id = c.id
       WHERE dp.customer_url = $1 OR dp.sales_url = $1 OR dp.production_url = $1`,
      [url]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'プロジェクトが見つかりません' });
    }

    const project = result.rows[0];
    
    // アクセス権限を判定
    let accessLevel = 'none';
    if (project.customer_url === url) accessLevel = 'customer';
    else if (project.sales_url === url) accessLevel = 'sales';
    else if (project.production_url === url) accessLevel = 'production';

    res.json({ 
      project,
      accessLevel
    });
  } catch (error) {
    next(error);
  }
});

// ステータス更新
router.put('/:projectId/status', async (req, res, next) => {
  try {
    if (!pool) {
      return res.json({ success: true, status: req.body.status });
    }

    const { projectId } = req.params;
    const { status, changedBy, comment } = req.body;

    // トランザクション開始
    const client = await pool!.connect();
    
    try {
      await client.query('BEGIN');

      // プロジェクトステータス更新
      await client.query(
        'UPDATE design_projects SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [status, projectId]
      );

      // 履歴追加
      await client.query(
        `INSERT INTO progress_history (project_id, status, changed_by, comment)
         VALUES ($1, $2, $3, $4)`,
        [projectId, status, changedBy, comment]
      );

      await client.query('COMMIT');
      
      res.json({ success: true, status });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    next(error);
  }
}); 