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

    const maxnum = 10
    const pagerange = 2
    let shiftlist = await shiftfunc.getAllSift()
    const maxpage = Math.ceil(Number(shiftlist.length) / maxnum)
    if (!req.session.tableId) {
      req.session.tableId = 1
    }
    let startpage = Number(req.session.tableId) - pagerange
    let endpage = Number(req.session.tableId) + pagerange
    // ページナビの範囲
    if (startpage < 1) {
      endpage += 1 - startpage
      startpage = 1
      if (endpage > maxpage) {
        endpage = maxpage
      }
    } else {
      if (endpage > maxpage) {
        startpage -= endpage - maxpage
        endpage = maxpage
        if (startpage < 1) {
          startpage = 1
        }
      }
    }
    console.log(`now ${req.session.tableId} start ${startpage} end ${endpage}`)

    res.render('table', {
      userlist: userlist,
      shiftlist: shiftlist,
      idnow: userId,
      startpage: startpage,
      endpage: endpage,
      nowpage: req.session.tableId,
      viewrange: maxnum,
      finallypage: maxpage,
    })
  } catch (err) {
    return await mysqlPromise.rollback(connection, err)
  } finally {
    connection.end()
  }
})

router.get('/:pageid', function (req, res) {
  req.session.tableId = Number(req.params.pageid)
  res.redirect('/table')
})

module.exports = router
