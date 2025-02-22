import express from 'express';

const router = express.Router();

export default function createDataRouter(pool, promisePool) {
  // 数据查询接口
  router.get('/query/:tableName', async (req, res) => {
    try {
      const { tableName } = req.params;
      const { startDate, endDate, interval = '1hour' } = req.query;

      // 验证表名是否存在
      const [tables] = await promisePool.query(
        'SELECT table_name FROM information_schema.tables WHERE table_schema = "nodered" AND table_name = ?',
        [tableName]
      );

      if (tables.length === 0) {
        return res.status(404).json({ message: '表不存在' });
      }

      // 根据时间间隔设置分组时间单位
      let timeFormat;
      switch (interval) {
        case '1min':
          timeFormat = '%Y-%m-%d %H:%i:00';
          break;
        case '30min':
          timeFormat = '%Y-%m-%d %H:%i:00';
          break;
        case '2hour':
          timeFormat = '%Y-%m-%d %H:00:00';
          break;
        case '1hour':
        default:
          timeFormat = '%Y-%m-%d %H:00:00';
          break;
      }

      // 构建查询SQL
      let query = `
        SELECT *
        FROM nodered.${tableName}
        WHERE 1=1
      `;
      const params = [];

      if (startDate && endDate) {
        query += ' AND time BETWEEN ? AND ?';
        params.push(startDate, endDate);
      }

      // 根据时间间隔筛选数据
      if (interval === '30min') {
        query += ' AND MINUTE(time) % 30 = 0';
      } else if (interval === '1hour') {
        query += ' AND MINUTE(time) = 0';
      } else if (interval === '2hour') {
        query += ' AND HOUR(time) % 2 = 0 AND MINUTE(time) = 0';
      }

      query += ' ORDER BY time DESC';

      // 执行查询
      const [results] = await promisePool.query(query, params);
      res.json(results);

    } catch (error) {
      console.error('数据查询失败:', error);
      res.status(500).json({ message: '服务器错误' });
    }
  });

  // 数据提交接口
  router.post('/submit', (req, res) => {
    console.log('=== /submit API 调用开始 ===');
    console.log('接收到的提交数据:', JSON.stringify(req.body, null, 2));
    const { dbName, tableName, samples } = req.body;

    // 确保 samples 是一个对象数组
    if (!Array.isArray(samples) || samples.length === 0) {
      console.error('无效的samples格式或为空');
      return res.status(400).json({ error: 'Invalid samples format or empty' });
    }

    const insertPromises = samples.map(sample => {
      const { sampleName, cod, nh3, tn, tp, ph, ss, sw, testDate } = sample;
      
      // 如果没有填写 sampleName 或 testDate，返回错误
      if (!sampleName || !testDate) {
        console.error('缺少必要字段:', { sampleName, testDate });
        return Promise.reject({ error: 'Sample name and test date are required' });
      }

      // 处理 null 值：如果某些字段是 undefined 或空字符串，则设为 null
      const values = [
        sampleName || null,
        cod || null,
        nh3 || null,
        tp || null,
        tn || null,
        ss || null,
        ph || null,
        sw || null,
        testDate || null
      ];

      const query = `INSERT INTO ${dbName}.${tableName} (sample_name, cod, nh3, tp, tn, ss, ph, sw, time) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;

      console.log('执行插入查询:', query);
      console.log('插入值:', values);

      return new Promise((resolve, reject) => {
        pool.query(query, values, (err, result) => {
          if (err) {
            console.error('插入错误:', err);
            reject({ error: 'Database insert error' });
          } else {
            console.log('插入成功，ID:', result.insertId);
            resolve(result.insertId);
          }
        });
      });
    });

    // 批量插入所有数据
    Promise.all(insertPromises)
      .then(insertIds => {
        console.log('所有数据插入成功，插入ID:', insertIds);
        console.log('=== /submit API 调用结束 ===');
        res.json({ message: '数据提交成功，请刷新页面', insertIds });
      })
      .catch(err => {
        console.error('数据插入失败:', err);
        res.status(500).json(err);
      });
  });

  return router;
}