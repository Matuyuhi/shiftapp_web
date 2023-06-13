const jwt = require('jsonwebtoken')
const express = require('express')
const mysql = require('mysql2')
const moment = require('moment')
const router = express.Router()
const config = require('../config/mysql.config')

const SECRET_KEY = 'lkj12345BMC'
const shiftfunc = require('../js/shiftfunc')
const mysqlPromise = require('../js/mysqlPromise')

router.post('/login', async function (req, res) {
  try {
    if (!req.body || !req.body.username || !req.body.password) {
      return res.json({ verify: false, message: '情報が足りません' })
    }
    const username = req.body.username
    const password = req.body.password

    const results = await shiftfunc.foundUser(username, password)
    if (results) {
      const payload = {
        user: username,
        password: password,
        id: Number(results.id),
      }
      const option = {
        expiresIn: '365days',
      }
      const token = jwt.sign(payload, SECRET_KEY, option)
      res.json({
        verify: true,
        message: 'create token',
        token: token,
      })
    } else {
      return res.json({ verify: false, message: 'ユーザーが見つかりません' })
    }
  } catch (err) {
    console.log(err)
    return res.json({ verify: false, Message: [err.sqlMessage] })
  }
})

router.get('/get', async function (req, res) {
  const connection = mysql.createConnection(config.connect)
  try {
    let token = req.get('token')
    // tokenがない場合、アクセスを拒否
    if (!token) {
      return res.json({ verify: false, Message: 'tokenがありません' })
    }
    const decoded = jwt.verify(token, SECRET_KEY)
    req.session.userid = decoded.id
    if (!decoded) {
      //token内のデータ無し
      console.log(decoded)
      return res.json({ verify: false, Message: 'tokenを再発行してください' })
    } else {
      let restoken = decoded
      await mysqlPromise.beginTransaction(connection)
      const shiftlist = await mysqlPromise.query(
        connection,
        'select post_id, name, users.id user_id, date, intime, outtime, comment, islate \
            from posts inner join users on posts.user_id = users.id \
            where ena=1 and date >= (CURRENT_DATE - interval WEEKDAY(CURRENT_DATE) day) order by date, intime, name'
      )
      if (!shiftlist) {
        return res.json()
      }
      //format
      for (let num in shiftlist) {
        const date = moment(shiftlist[num].date)
        shiftlist[num].date =
          date.year() +
          '-' +
          shiftfunc.set2fig(Number(date.month()) + 1) +
          '-' +
          shiftfunc.set2fig(Number(date.date()))
      }
      //iconとsort済みのlist
      let sort_list = []
      // とりあえずactive中とmanagerのみ表示
      // let sort = await shiftfunc.getSortUser()
      let sort = await shiftfunc.getActiveUserToSort()
      for (let i_list in sort) {
        sort_list[i_list] = {}
        sort_list[i_list].name = sort[i_list].name
        let url = await mysqlPromise.query(
          connection,
          'select * from user_icon inner join users on users.id = user_icon.id \
                    where name = ?',
          [sort_list[i_list].name]
        )
        let url_string = ''
        if (url[0] && url[0].url) {
          url_string = url[0].url
        }
        sort_list[i_list].icon = url_string
      }

      return res.json({
        verify: true,
        Message: 'OK',
        user: restoken.user,
        userid: restoken.id,
        shift: shiftlist,
        userlist: sort_list,
      })
    }
  } catch (err) {
    await mysqlPromise.rollback(connection, err)
    console.log(err)
    return res.json({ verify: false, Message: err })
  } finally {
    connection.end()
  }
})

//misslistを渡す
router.get('/miss', async function (req, res) {
  const connection = mysql.createConnection(config.connect)
  try {
    let token = req.get('token')
    // tokenがない場合、アクセスを拒否
    if (!token) {
      return res.json({ verify: false, Message: 'tokenがありません' })
    }
    const decoded = jwt.verify(token, SECRET_KEY)
    req.session.userid = decoded.id
    if (!decoded) {
      //token内のデータ無し
      console.log(decoded)
      return res.json({ verify: false, Message: 'tokenを再発行してください' })
    } else {
      let restoken = decoded
      //miss
      const current = shiftfunc.getCurrentTerm()
      let misslist = await mysqlPromise.query(
        connection,
        'select id, missweek, name \
            from misslist inner join users on misslist.user_id = users.id \
            where ena = 1 and active > 0 and missweek >= ? and missweek < ? \
            order by missweek ASC',
        [current[0], current[1]]
      )
      for (let miss of misslist) {
        if (miss.missweek) {
          miss.missweek = moment(miss.missweek).format('YYYY-MM-DD')
        }
      }
      return res.json({
        verify: true,
        Message: 'OK',
        user: restoken.user,
        userid: restoken.id,
        list: misslist,
      })
    }
  } catch (err) {
    await mysqlPromise.rollback(connection, err)
    console.log(err)
    return res.json({ verify: false, Message: err })
  } finally {
    connection.end()
  }
})
//時間確認
function iscollecttime(checktime) {
  if (!checktime || !String(checktime).match(/[0-9]{2}:[0-9]{2}/)) {
    return 0
  }
  const splittedtime = String(checktime).split(':')
  if (!splittedtime[0] || !splittedtime[1]) {
    return 0
  }
  let flag = 0

  if (
    (0 <= Number(splittedtime[0]) && Number(splittedtime[0]) < 24) ||
    Number(splittedtime[0]) == 99
  ) {
    if (
      (0 <= Number(splittedtime[1]) && Number(splittedtime[1]) < 60) ||
      Number(splittedtime[1]) == 99
    ) {
      flag = 1
    }
  }
  return flag
}
//日付の前後確認
// function datecheck(_date) {
//   if (!_date) {
//     return 0
//   }
//   let checkdate = _date.split(/\/|-/)
//   if (checkdate.length != 3) {
//     return 0
//   }
//   let checkcount =
//     Number(checkdate[0]) * 10000 +
//     Number(checkdate[1]) * 100 +
//     Number(checkdate[2])
//   //月曜日
//   let today = new Date()
//   let this_year = today.getFullYear()
//   let this_month = today.getMonth() + 1
//   let date = today.getDate()
//   let day_num = today.getDay()
//   let this_monday = date - day_num + 1
//   let nowcount = this_year * 10000 + this_month * 100 + this_monday
//   // console.log("now=" + nowcount)
//   // console.log("checktime=" + checkcount)
//   // console.log(Number(checkcount) >= Number(nowcount))
//   if (Number(checkcount) >= Number(nowcount)) {
//     return 1 //true
//   } else {
//     return 0 //false
//   }
// }

router.post('/post', async function (req, res) {
  try {
    if (!req || !req.body) {
      return res.json({ verify: false, Message: ['bodyにデータがありません'] })
    }
    //入力の判定
    let msg = []
    const spliteddate = String(req.body.date).split('/')
    const date = spliteddate.join('-')
    const intime = String(req.body.intime)
    const outtime = String(req.body.outtime)
    let comment
    if (req.body.comment) {
      comment = String(req.body.comment)
    } else {
      comment = ''
    }

    //判定
    // if (datecheck(date) == 0) {
    //   msg.push('日付が正しくないです')
    // }
    if (iscollecttime(intime) == 0) {
      msg.push('出勤時間が正しくないです')
    }
    if (iscollecttime(outtime) == 0) {
      msg.push('退勤時間が正しくないです')
    }
    let token = req.get('token')
    // tokenがない場合、アクセスを拒否
    if (!token) {
      msg.push('tokenがありません')
      return res.json({ verify: false, Message: msg })
    }
    const decoded = jwt.verify(token, SECRET_KEY)
    req.session.userid = decoded.id
    if (!decoded) {
      return res.json({ verify: false, Message: 'tokenを作り直してください' })
    }
    let restoken = decoded
    if (!restoken.id) {
      return res.json({ verify: false, Message: 'tokenを作り直してください' })
    }
    if (msg[0]) {
      return res.json({ verify: false, Message: msg })
    } else {
      console.log(restoken.id)
      if (req.body.post_id) {
        //post_idの指定があれば更新モード
        await shiftfunc.Request(
          restoken.id,
          date,
          intime,
          outtime,
          comment,
          req.body.post_id
        )
      } else {
        await shiftfunc.Request(restoken.id, date, intime, outtime, comment)
      }
      return res.json({
        verify: true,
        Message:
          'userid=' +
          restoken.id +
          ', date:' +
          date +
          ', intime:' +
          intime +
          ', outtime:' +
          outtime +
          ', comment:' +
          comment,
      })
    }
  } catch (err) {
    console.log(err)
    return res.json({ verify: false, Message: err })
  } finally {
    console.log('ios post')
  }
})
router.post('/delete', async function (req, res) {
  const connection = mysql.createConnection(config.connect)
  try {
    if (!req.body.post_id) {
      return res.json({ verify: false, Message: 'post_idが見つかりません' })
    }
    let token = req.get('token')
    console.log(token)
    // tokenがない場合、アクセスを拒否
    if (!token) {
      return res.json({ verify: false, Message: 'tokenがありません' })
    }
    const decoded = jwt.verify(token, SECRET_KEY)
    req.session.userid = decoded.id
    let restoken = decoded
    const changeid = req.body.post_id
    await mysqlPromise.beginTransaction(connection)
    const this_post = await mysqlPromise.query(
      connection,
      'select * from posts where ena = 1 and user_id = ? and post_id = ?',
      [restoken.id, changeid]
    )
    // console.log(this_post)
    if (this_post && this_post[0].post_id) {
      await mysqlPromise.query(
        connection,
        'UPDATE posts SET ena = 0 WHERE user_id = ? and post_id = ?',
        [restoken.id, changeid]
      )
    } else {
      throw '有効なpost_idではありません'
    }
    await mysqlPromise.commit(connection)
    return res.json({
      verify: true,
      Message: 'post_id:' + this_post[0].post_id + 'を削除しました',
    })
  } catch (err) {
    console.log(err)
    return res.json({ verify: false, Message: err })
  } finally {
    connection.end()
  }
})

router.post('/setting/password', async function (req, res) {
  try {
    let token = req.get('token')
    if (!token) {
      return res.json({ verify: false, Message: 'tokenがありません' })
    }
    const decoded = jwt.verify(token, SECRET_KEY)
    const user = await shiftfunc.getUserToId(decoded.id)
    if (user && req.body.password && req.body.repassword) {
      await shiftfunc.updatePassword(
        decoded.id,
        req.body.password,
        req.body.repassword
      )
      return res.json({ verify: true, Message: 'パスワードを変更しました' })
    }
    return res.json({
      verify: false,
      Message: 'パラメーターが足りません (password & repassword)',
    })
  } catch (err) {
    console.log(err)
    return res.json({ verify: false, Message: err })
  }
})

module.exports = router
