const express = require('express')
const router = express.Router()
const mysql = require('mysql2')
const config = require('../config/mysql.config')
const shiftfunc = require('../js/shiftfunc')
const mysqlPromise = require('../js/mysqlPromise')

router.get('/', async function (req, res) {
  let userId = req.session.userid
  let isAuth = Boolean(userId)
  let loginuser
  const connection = mysql.createConnection(config.connect)
  try {
    await mysqlPromise.beginTransaction(connection)
    if (isAuth) {
      const results = await mysqlPromise.query(
        connection,
        'select * from users where id = ? and active  > 0',
        [userId]
      )
      if (!results || !results[0]) {
        res.redirect('/logout')
      } else {
        loginuser = results[0].name
      }
    }
    res.render('multi', {
      loginuser: loginuser,
      title: 'Kinmu App',
      isAuth: isAuth,
    })
  } catch (err) {
    return await mysqlPromise.rollback(connection, err)
  } finally {
    connection.end()
  }
})
router.post('/', async function (req, res) {
  try {
    if (!req.body || !req.body.shifttext) {
      return res.redirect('/multi')
    }
    let inputValue = req.body.shifttext
    let text = String(inputValue).replace(/\r\n|\r/g, '\n')
    let lines = text.split('\n')

    for (let i = 0; i < lines.length; i++) {
      // 空行は無視する
      let contents = lines[i].split(',')
      if (lines[i] == '') {
        continue
      }
      if (!contents[0]) {
        continue
      }
      const tempdate = contents[0].match(/[0-9]{4}\/[0-9]{2}\/[0-9]{2}/)
      //dataの形を変える
      const spliteddate = tempdate[0].split('/')
      const date = spliteddate.join('-')
      if (!contents[1]) {
        continue
      }
      const intime = contents[1].match(/[0-9]{2}:[0-9]{2}/)
      if (!contents[2]) {
        continue
      }
      const outtime = contents[2].match(/[0-9]{2}:[0-9]{2}/)
      let comment
      if (contents.length != 3) {
        comment = String(contents[3])
      } else {
        comment = ''
      }
      await shiftfunc.Request(
        req.session.userid,
        date,
        String(intime),
        String(outtime),
        comment
      )
    }
  } catch (err) {
    console.log(err)
  } finally {
    res.redirect('/')
  }
})

module.exports = router
