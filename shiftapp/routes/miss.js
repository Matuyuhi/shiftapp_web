const express = require('express')
const mysql = require('mysql2')
const moment = require('moment')
const router = express.Router()
const config = require('../config/mysql.config')

const mysqlPromise = require('../js/mysqlPromise')

const shiftfunc = require('../js/shiftfunc')

router.get('/', async function (req, res) {
  const connection = mysql.createConnection(config.connect)
  try {
    let userId = req.session.userid
    let loginuser
    await mysqlPromise.beginTransaction(connection)

    //usersを取得
    let userlist = await shiftfunc.getAllUser()
    //ミスリストの取得
    const current = shiftfunc.getCurrentTerm()
    const misslist = await mysqlPromise.query(
      connection,
      'select missweek date, id, name, active \
            from misslist inner join users on misslist.user_id = users.id \
            where ena = 1 and active > 0 and missweek >= ? and missweek < ? \
        order by missweek ASC',
      [current[0], current[1]]
    )
    await mysqlPromise.commit(connection)
    let sort = await shiftfunc.getSortUser()
    //console.log(sort)
    userlist = shiftfunc.sortUser(userlist, req.session.user.data.name, sort)
    let nowuser = {}
    //userlistにmisscountとiconを追加
    for (let user_i of userlist) {
      user_i.misscount = 0
      //data分カウントする
      for (const miss_num of misslist) {
        if (user_i.id == miss_num.id) {
          user_i.misscount++
        }
      }
      //自分を取り出す
      if (user_i.id == userId) {
        nowuser = user_i
      }
    }
    //misscountでsort
    userlist.sort((a, b) => b.misscount - a.misscount)

    let miss_hash = {}
    for (const miss of misslist) {
      let missdate = moment(miss.date).format('YYYY-MM-DD')
      if (!miss_hash[missdate]) {
        miss_hash[missdate] = ''
      }
      miss_hash[missdate] += miss.name + '/'
    }

    res.render('miss', {
      loginuser: loginuser,
      title: 'Kinmu App',
      idnow: userId,
      userlist: userlist,
      misslist: miss_hash,
      nowuser: nowuser,
    })
  } catch (err) {
    await mysqlPromise.rollback(connection, err)
  } finally {
    connection.end()
  }
})

module.exports = router
