import express from 'express';
import bcrypt from 'bcrypt';

const router = express.Router();

export default function createAuthRouter(promisePool) {
  // 注册接口
  router.post('/register', async (req, res) => {
    try {
      const { username, email, password, phone, department, company } = req.body;

      // 检查邮箱是否已存在
      const [existingUser] = await promisePool.query(
        'SELECT * FROM users.users1 WHERE email = ?',
        [email]
      );

      if (existingUser.length > 0) {
        return res.status(400).json({ message: '该邮箱已被注册' });
      }

      // 加密密码
      const hashedPassword = await bcrypt.hash(password, 10);

      // 生成随机的avatar_seed
      const avatarSeed = Math.random().toString(36).substring(2, 15);

      // 插入新用户
      await promisePool.query(
        'INSERT INTO users.users1 (username, email, password, phone, department, company, avatar_seed, status) VALUES (?, ?, ?, ?, ?, ?, ?, 1)',
        [username, email, hashedPassword, phone, department, company, avatarSeed]
      );

      res.status(201).json({ message: '注册成功' });
    } catch (error) {
      console.error('注册失败:', error);
      res.status(500).json({ message: '服务器错误' });
    }
  });

  // 登录接口
  router.post('/login', async (req, res) => {
    try {
      const { email, password } = req.body;

      // 查找用户
      const [users] = await promisePool.query(
        'SELECT * FROM users.users1 WHERE email = ? AND status = 1',
        [email]
      );

      if (users.length === 0) {
        return res.status(401).json({ message: '邮箱或密码错误' });
      }

      const user = users[0];

      // 验证密码
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ message: '邮箱或密码错误' });
      }

      res.json({
        message: '登录成功',
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          phone: user.phone,
          department: user.department,
          avatar_seed: user.avatar_seed,
          company: user.company
        }
      });
    } catch (error) {
      console.error('登录失败:', error);
      res.status(500).json({ message: '服务器错误' });
    }
  });

  // 更新用户信息接口
  router.put('/users/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { avatar_seed } = req.body;

      // 更新用户信息
      await promisePool.query(
        'UPDATE users.users1 SET avatar_seed = ? WHERE id = ?',
        [avatar_seed, id]
      );

      // 获取更新后的用户信息
      const [users] = await promisePool.query('SELECT * FROM users.users1 WHERE id = ?', [id]);
      if (users.length === 0) {
        return res.status(404).json({ message: '用户不存在' });
      }

      const updatedUser = users[0];
      res.json({
        message: '更新成功',
        user: {
          id: updatedUser.id,
          username: updatedUser.username,
          email: updatedUser.email,
          phone: updatedUser.phone,
          department: updatedUser.department,
          avatar_seed: updatedUser.avatar_seed,
          company: updatedUser.company
        }
      });
    } catch (error) {
      console.error('更新用户信息失败:', error);
      res.status(500).json({ message: '服务器错误' });
    }
  });

  return router;
}