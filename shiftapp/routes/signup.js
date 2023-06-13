const express = require('express')
const crypto = require('crypto')
const router = express.Router()
const config = require('../config/mysql.config')
const mysql = require('mysql2')
const shiftFunc = require('../js/shiftfunc')

const mysqlPromise = require('../js/mysqlPromise')

//for singnup
function md5hex(str /*: string */) {
  const md5 = crypto.createHash('md5')
  return md5.update(str, 'binary').digest('hex')
}

router.get('/', function (req, res) {
  res.render('signup', {
    title: 'Sign up',
  })
})
router.post('/', async function (req, res) {
  const username = req.body.username
  const password = req.body.password
  const repassword = req.body.repassword
  let type = 1
  let url = ''
  const connection = mysql.createConnection(config.connect)
  try {
    await mysqlPromise.beginTransaction(connection)
    const users = await mysqlPromise.query(
      connection,
      'select * from adduser where name=?',
      [username]
    )
    if (!users || !users[0]) {
      return res.render('signup', {
        title: 'Sign up',
        errorMessage: ['お前は誰だ??'],
      })
    }
    let result = await mysqlPromise.query(
      connection,
      'select * from users where name=? and active > 0',
      [username]
    )
    //名前が取得できた時は新規の登録を行わない
    if (result.length !== 0) {
      //console.log("既にあります");
      return res.render('signup', {
        title: 'Sign up',
        errorMessage: ['このユーザ名は既に使われています'],
      })
    } else if (password === repassword) {
      await mysqlPromise.query(
        connection,
        'insert into users (name, password, active) values (?, ?, ?)',
        [username, md5hex(password), type]
      )
      await mysqlPromise.commit(connection)
      const getuser = await mysqlPromise.query(
        connection,
        'select * from users where name = ?',
        [username]
      )
      let id = 0
      if (getuser[0] && getuser[0].id) {
        id = Number(getuser[0].id)
        await mysqlPromise.query(
          connection,
          'insert into user_icon (id, url) values (?, ?)',
          [id, url]
        )
        let list = await shiftFunc.getSortUser()
        await shiftFunc.addSortUser(
          Number(list[list.length - 1].id) + 1,
          username
        )
        await mysqlPromise.commit(connection)
      }

      //セッション情報を導入
      return res.redirect('/signin')
    } else {
      return res.render('signup', {
        title: 'Sign up',
        errorMessage: ['パスワードが一致しません'],
      })
    }
  } catch (err) {
    console.error(err)
    return res.render('signup', {
      title: 'Sign up',
      errorMessage: [err.sqlMessage],
    })
  } finally {
    connection.end()
  }
})

module.exports = router
