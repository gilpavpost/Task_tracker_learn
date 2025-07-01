const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { JWT_SECRET } = process.env;

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Проверка существования пользователя
    const [users] = await pool.query(
      'SELECT * FROM users WHERE id = ?', 
      [decoded.userId]
    );
    
    if (users.length === 0) {
      return res.status(401).json({ message: 'User not found' });
    }

    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Not authorized', error: error.message });
  }
};

module.exports = auth;