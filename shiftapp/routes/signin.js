const express = require('express')
const mysql = require('mysql2')
const config = require('../config/mysql.config')
const router = express.Router()
const crypto = require('crypto')
const mysqlPromise = require('../js/mysqlPromise')

function md5hex(str /*: string */) {
  const md5 = crypto.createHash('md5')
  return md5.update(str, 'binary').digest('hex')
}
//for signin
router.get('/', function (req, res) {
  res.render('signin', {
    title: 'Sign in',
  })
})
router.post('/', async function (req, res) {
  const username = req.body.username
  const password = md5hex(req.body.password)
  const connection = mysql.createConnection(config.connect)
  try {
    await mysqlPromise.beginTransaction(connection)
    let results = await mysqlPromise.query(
      connection,
      'select * from users where name=? and password=? and active > 0',
      [username, password]
    )
    if (results.length === 0) {
      //ログイン失敗時の処理
      //req.session.msgToLogin = "ログインに失敗しました";
      return res.render('signin', {
        title: 'Sign in',
        errorMessage: ['ログインに失敗しました'],
      })
    } else {
      //ログイン成功時の処理
      req.session.userid = results[0].id
      req.session.user = null
      return res.redirect('/demo/shift/')
    }
  } catch (err) {
    console.log(err)
    res.render('signin', {
      title: 'Sign in',
      errorMessage: [err.sqlMessage],
      isAuth: false,
      //mysqlのエラーが出たらfalseで渡して再ログイン必須にする
    })
    return await mysqlPromise.rollback(connection, err)
  } finally {
    connection.end()
  }
})

module.exports = router
