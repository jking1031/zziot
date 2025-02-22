import express from 'express';

const router = express.Router();

export default function createAORouter(pool) {
  // 提交AO池数据接口
  router.post('/submit', (req, res) => {
    console.log('=== /submit_ao API 调用开始 ===');
    console.log('接收到的AO池数据:', JSON.stringify(req.body, null, 2));
    const { tableName, aoData } = req.body;

    if (!aoData || aoData.length === 0) {
      console.error('未提供AO池数据');
      return res.status(400).json({ message: 'No AO data provided.' });
    }

    const insertPromises = [];
    console.log('开始处理AO池数据插入...');

    aoData.forEach(ao => {
      ao.pools.forEach(poolInfo => {
        const promise = new Promise((resolve, reject) => {
          pool.getConnection((err, connection) => {
            if (err) {
              console.error('数据库连接错误:', err);
              return reject(err);
            }

            const sql = `INSERT INTO ${tableName} (aoName, poolName, doValue) VALUES (?, ?,?)`;
            console.log('执行SQL:', sql);
            console.log('参数值:', [ao.aoName, poolInfo.poolName, poolInfo.do]);

            connection.query(
              sql, 
              [ao.aoName, poolInfo.poolName, poolInfo.do],
              (err, result) => {
                connection.release();
                if (err) {
                  console.error('数据库查询错误:', err);
                  return reject(err);
                }
                console.log('插入成功，ID:', result.insertId);
                resolve(result);
              }
            );
          });
        });
        insertPromises.push(promise);
      });
    });

    Promise.all(insertPromises)
      .then(() => {
        console.log('所有AO池数据插入成功');
        console.log('=== /submit_ao API 调用结束 ===');
        res.json({ message: 'AO池数据提交成功！' });
      })
      .catch(err => {
        console.error('插入数据时发生错误:', err);
        res.status(500).json({ message: '数据提交失败' });
      });
  });

  // 获取子池数据接口
  router.get('/sub-pools', (req, res) => {
    console.log('=== /api/sub-pools API 调用开始 ===');
    console.log('请求参数:', JSON.stringify(req.query, null, 2));
    const { aoName, startDate, endDate } = req.query;

    // 参数验证
    if (!aoName) {
      console.error('缺少必要参数: aoName');
      return res.status(400).json({ error: '缺少必要参数: aoName' });
    }

    // 构建基础SQL
    let baseQuery = `
      SELECT p.aoName, p.poolName, p.doValue, p.submit_time
      FROM ao_data p
      WHERE p.aoName = ?
    `;

    // 参数绑定
    const params = [aoName];

    // 处理日期过滤
    if (startDate && endDate) {
      baseQuery += ' AND DATE(p.submit_time) BETWEEN ? AND ?';
      params.push(startDate, endDate);
    } else if (startDate) {
      baseQuery += ' AND DATE(p.submit_time) >= ?';
      params.push(startDate);
    } else if (endDate) {
      baseQuery += ' AND DATE(p.submit_time) <= ?';
      params.push(endDate);
    }

    // 添加排序条件
    baseQuery += ' ORDER BY p.submit_time DESC, p.poolName';

    console.log('生成的SQL查询:', baseQuery);
    console.log('查询参数:', params);

    // 执行查询
    pool.query(baseQuery, params, (err, results) => {
      if (err) {
        console.error('数据库错误:', err);
        return res.status(500).json({
          error: '数据获取失败',
          details: err.message
        });
      }

      console.log('查询结果数量:', results.length);
      console.log('查询结果示例:', results.slice(0, 2));

      // 优化数据格式化
      const formatted = results.map(item => ({
        aoName: item.aoName,
        poolName: item.poolName,
        doValue: Number(item.doValue),
        submit_time: item.submit_time
      }));

      console.log('=== /api/sub-pools API 调用结束 ===');
      res.json(formatted);
    });
  });

  // 获取AO池列表接口
  router.get('/ao-pools', (req, res) => {
    console.log('=== /api/ao-pools API 调用开始 ===');
    const query = `
      SELECT DISTINCT aoName 
      FROM nodered.ao_data 
      ORDER BY aoName 
    `;
    console.log('生成的SQL查询:', query);

    pool.query(query, (err, results) => {
      if (err) {
        console.error('数据库错误:', err);
        return res.status(500).json({
          error: '获取AO池列表失败',
          details: err.message
        });
      }

      console.log('查询结果:', results);
      console.log('=== /api/ao-pools API 调用结束 ===');
      res.json(results);
    });
  });

  return router;
}