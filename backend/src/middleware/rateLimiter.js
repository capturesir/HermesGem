const rateLimit = require('express-rate-limit');

// 一般 API 限流：每分鐘 100 請求
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 分鐘
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: '請求太頻繁，請稍後再試' },
  skip: (req) => {
    return process.env.NODE_ENV === 'development';
  }
});

// 登入 API 限流：每 5 分鐘 10 次（防止暴力破解）
const authLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 分鐘
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: '登入嘗試過多，請 5 分鐘後再試' },
  skip: (req) => process.env.NODE_ENV === 'development'
});

module.exports = { apiLimiter, authLimiter };
