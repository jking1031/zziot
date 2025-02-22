import express from 'express';

const router = express.Router();

export default function createReportsRouter(promisePool) {
  // 添加日报提交接口
  router.post('/', async (req, res) => {
    try {
      console.log('=== /submit_report API 调用开始 ===');
      console.log('接收到的日报数据:', JSON.stringify(req.body, null, 2));
      const {
        date, operator, inflow, outflow, in_quality, out_quality, water_quality_anomalies,
        equipment_status, equipment_issues, carbon_source, phosphorus_removal, disinfectant,
        chemical_effect, sludge_quantity, other_notes
      } = req.body;

      // 构建SQL查询
      const query = `
        INSERT INTO nodered.daily_report (
          date, operator, inflow, outflow, in_quality, out_quality, water_quality_anomalies,
          equipment_status, equipment_issues, carbon_source, phosphorus_removal, disinfectant,
          chemical_effect, sludge_quantity, other_notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      console.log('生成的SQL查询:', query);
      console.log('插入参数:', [date, operator, inflow, outflow]);

      // 执行SQL插入操作
      const [result] = await promisePool.query(query, [
        date, operator, inflow, outflow, in_quality, out_quality, water_quality_anomalies,
        equipment_status, equipment_issues, carbon_source, phosphorus_removal, disinfectant,
        chemical_effect, sludge_quantity, other_notes
      ]);

      console.log('日报数据插入成功，ID:', result.insertId);
      console.log('=== /submit_report API 调用结束 ===');
      res.status(201).json({ message: '日报数据已成功提交', reportId: result.insertId });

    } catch (error) {
      console.error('报告提交失败:', error);
      res.status(500).json({ message: '服务器错误' });
    }
  });

  // 日报查询接口
  router.get('/', async (req, res) => {
    try {
      console.log('=== /api/reports 查询接口调用开始 ===');
      const { startDate, endDate } = req.query;

      // 验证日期参数
      if (!startDate || !endDate) {
        return res.status(400).json({ message: '请提供开始和结束日期' });
      }

      console.log('查询参数:', { startDate, endDate });

      // 构建查询SQL
      const query = `
        SELECT * FROM nodered.daily_report
        WHERE date BETWEEN ? AND ?
        ORDER BY date DESC
      `;

      // 执行查询
      const [reports] = await promisePool.query(query, [startDate, endDate]);
      
      console.log(`查询到 ${reports.length} 条日报记录`);
      console.log('=== /api/reports 查询接口调用结束 ===');
      
      res.json(reports);
    } catch (error) {
      console.error('日报查询失败:', error);
      res.status(500).json({ message: '服务器错误' });
    }
  });

  return router;
}