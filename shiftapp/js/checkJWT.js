const JWT = require('jsonwebtoken')

module.exports = async (req, res, next) => {
  // JWTを持っているか確認->リクエストヘッダの中の x-auth-token を確認
  const token = req.header('x-auth-token')

  if (!token) {
    res.status(400).json([{ message: '権限がありません' }])
  } else {
    try {
      let user = await JWT.verify(token, 'SECRET_KEY')
      console.log(user)
      req.user = user.email
      next()
    } catch {
      return res.status(400).json([
        {
          message: 'トークンが一致しません',
        },
      ])
    }
  }
}
