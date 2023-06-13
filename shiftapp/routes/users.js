const express = require('express')
const mysql = require('mysql2')
const router = express.Router()
const config = require('../config/mysql.config')

const mysqlPromise = require('../js/mysqlPromise')

const shiftfunc = require('../js/shiftfunc')

router.get('/', async function (req, res) {
  const connection = mysql.createConnection(config.connect)
  try {
    //reqはhttpリクエストの内容、resはそれに対するレスポンスを記述したもの
    //islatepost("2022-12-02T00:00:00.000Z");
    //console.log(req.session);
    if (!req.session.isChange) {
      req.session.isChange = false
    }

    let userId = req.session.userid
    await mysqlPromise.beginTransaction(connection)

    let userlist = await mysqlPromise.query(
      connection,
      'select * from users inner join user_icon on users.id = user_icon.id where active > 0'
    )
    let sort = await shiftfunc.getSortUser()
    userlist = shiftfunc.sortUser(userlist, req.session.user.data.name, sort)
    console.log()

    let user_shift = []
    for (let user_i in userlist) {
      let weektoshift = []
      for (let week_i = 0; week_i < 3; week_i++) {
        weektoshift[week_i] = await shiftfunc.getUserShiftToWeek(
          userlist[user_i].id,
          week_i
        )
      }
      user_shift[user_i] = weektoshift
    }
    // console.log(user_shift)
    // console.log(userlist)

    res.render('users', {
      userlist: userlist,
      shiftlist: user_shift,
      idnow: userId,
    })
  } catch (err) {
    return await mysqlPromise.rollback(connection, err)
  } finally {
    connection.end()
  }
})

router.get('/:idurl', async function (req, res, next) {
  const connection = mysql.createConnection(config.connect)
  try {
    mysqlPromise.beginTransaction(connection)
    const id = Number(req.params.idurl)
    if (isNaN(id)) {
      return next()
    }
    const founduser = await mysqlPromise.query(
      connection,
      'select * from users where id = ? and active > 0',
      [id]
    )
    if (!founduser || !founduser[0] || Number(founduser[0].id) != id) {
      return next()
    }
    res.locals.users = {}
    res.locals.users.viewid = id
    let shifts = []
    for (let week_i = 0; week_i < 3; week_i++) {
      shifts[week_i] = await shiftfunc.getUserShiftToWeek(id, week_i)
    }
    console.log(shifts)
    return res.render('user', { shifts: shifts })
  } catch (err) {
    await mysqlPromise.rollback(connection, err)
  } finally {
    connection.end()
  }
})

module.exports = router
