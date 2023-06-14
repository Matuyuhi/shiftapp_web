const express = require('express')
const mysql = require('mysql2')
const moment = require('moment')
const router = express.Router()
const config = require('../config/mysql.config')
const crypto = require('crypto')
const jwt = require('jsonwebtoken')
const SECRET_KEY = 'lkj12345BMC'

const mysqlPromise = require('../js/mysqlPromise')

const shiftfunc = require('../js/shiftfunc')

let post_request = false

function md5hex(str /*: string */) {
  const md5 = crypto.createHash('md5')
  return md5.update(str, 'binary').digest('hex')
}

/*
今週: now
来週: next
全て: all
*/

//for index 閲覧
router.get('/', async function (req, res) {
  const connection = mysql.createConnection(config.connect)
  try {
    //reqはhttpリクエストの内容、resはそれに対するレスポンスを記述したもの
    //islatepost("2022-12-02T00:00:00.000Z");
    //console.log(req.session);
    if (!req.session.isChange) {
      req.session.isChange = false
    }
    let isChange = req.session.isChange
    if (!req.session.changeid) {
      req.session.changeid = 0
    }

    let changeid = req.session.changeid
    let userId = req.session.userid
    let isAuth = Boolean(userId)
    let loginuser
    if (!req.session.shift_viewmode) {
      req.session.shift_viewmode = 'now'
    }
    let shift_viewmode = req.session.shift_viewmode
    await mysqlPromise.beginTransaction(connection)

    if (isAuth) {
      const results = await mysqlPromise.query(
        connection,
        'select * from users where id = ? and active  > 0',
        [userId]
      )
      if (!results || !results[0]) {
        res.redirect('/demo/shift/logout')
      } else {
        loginuser = results[0].name
      }
    }
    let viewmode
    if (shift_viewmode == 'all') {
      //今日以降
      viewmode = 'date >= (CURRENT_DATE - interval WEEKDAY(CURRENT_DATE) day)'
    } else if (shift_viewmode == 'now') {
      //今週
      viewmode =
        'date >= (CURRENT_DATE - interval WEEKDAY(CURRENT_DATE) day) and date < (CURRENT_DATE - interval WEEKDAY(CURRENT_DATE) day + interval 7 day)'
    } else {
      //来週
      viewmode =
        'date >= (CURRENT_DATE - interval WEEKDAY(CURRENT_DATE) day + interval 7 day) \
            and date < (CURRENT_DATE - interval WEEKDAY(CURRENT_DATE) day + interval 14 day)'
    }
    let weekcount = await shiftfunc.WeekWorkCount(viewmode)
    const sqltext =
      'select post_id, name, users.id user_id, date, intime, outtime, comment, islate, active \
        from posts inner join users on posts.user_id = users.id \
        where ' +
      viewmode +
      ' and ena = 1 and active > 0 order by date, posts.user_id = ? DESC, intime'
    //shift取得
    let shiftlist = await mysqlPromise.query(connection, sqltext, [userId])
    //weekcountを繋げたusersを取得
    let userlist = await mysqlPromise.query(
      connection,
      'select * from users where active > 0 order by id = ? DESC',
      [userId]
    )
    for (let user of userlist) {
      for (let count of weekcount) {
        if (user.id == count.id) {
          user.latecount = count.late
          user.workcount = count.work
        }
      }
    }
    //ミスリストの取得
    const misslist = await mysqlPromise.query(
      connection,
      'select * from misslist inner join users on misslist.user_id = users.id where ena = 1'
    )
    await mysqlPromise.commit(connection)

    //formのdateの初期値
    //前回の次の日 or 今週の月曜日 の新しい方
    //sessonがなければ月曜日
    let olddate
    if (req.session && req.session.olddate) {
      let nextdate = moment(String(req.session.olddate)).add(1, 'd')
      let thismonday = moment().startOf('weeks').add(1, 'd')
      olddate = nextdate
      if (thismonday.isAfter(nextdate)) {
        olddate = thismonday
      }
    } else {
      olddate = moment().startOf('weeks').add(1, 'd')
    }
    olddate =
      olddate.year() +
      '-' +
      shiftfunc.set2fig(Number(olddate.month()) + 1) +
      '-' +
      shiftfunc.set2fig(Number(olddate.date()))

    //自分だけ先頭にする処理
    // let userlistsorted = [loginuser]
    // let tempnamelist = await shiftfunc.getSortUser()
    // for (let i = 0; i < tempnamelist.length; i++) {
    //   if (tempnamelist[i].name != loginuser) {
    //     userlistsorted.push(tempnamelist[i].name)
    //   }
    // }
    // userlistsorted[0] = loginuser

    //iconとsort済みのlist
    let sort_list = []
    let u_list = await shiftfunc.getAllUser()
    let sort = await shiftfunc.getSortUser()
    //console.log(sort)
    sort_list = shiftfunc.sortUser(u_list, req.session.user.data.name, sort)
    //{name: "", url:""}の最終的なリスト
    // console.log(sort_list)

    if (!req.session.shift_viewuser || req.session.shift_viewuser == '0') {
      req.session.shift_viewuser = userId
    }

    let after_post = false
    if (post_request) {
      after_post = true
      post_request = false
      console.log('post!')
    }
    const today_moment = moment().format('YYYY-MM-DD')
    res.render('index', {
      loginuser: loginuser,
      title: 'Kinmu App',
      info: shiftlist,
      isAuth: isAuth,
      idnow: userId,
      olddate: olddate,
      oldintime: req.session.oldintime,
      oldouttime: req.session.oldouttime,
      isChange: isChange,
      changeid: changeid,
      shift_viewmode: shift_viewmode,
      shift_viewuser: req.session.shift_viewuser,
      users: userlist,
      _weekcount: weekcount,
      misslist: misslist,
      sorteduserlist: sort_list, //歴順でソート後のuserlist
      after_post: after_post, //入力後のバー表示用
      today_moment: today_moment, //全体shiftの今日のボーダー用
    })
  } catch (err) {
    return await mysqlPromise.rollback(connection, err)
  } finally {
    connection.end()
  }
})
router.post('/', async function (req, res) {
  try {
    req.session.shift_viewuser = req.session.userid
    req.session.olddate = req.body.date
    req.session.oldintime = req.body.intime
    req.session.oldouttime = req.body.outtime
    await shiftfunc.Request(
      req.session.userid,
      String(req.body.date),
      req.body.intime,
      req.body.outtime,
      req.body.comment
    )
    post_request = true
  } catch (err) {
    console.log('index.js router.post error\n' + err)
  } finally {
    res.redirect('/demo/shift/')
  }
})

/*
//表示モード変更
now: 今日から日曜日
thisweek: 今週の月曜日から日曜日
*/
router.post('/view_change', function (req, res) {
  if (req.body.option) {
    req.session.shift_viewmode = req.body.option
  }
  // console.log(req.body.view_user);
  if (req.body.view_user && req.body.view_user != 0) {
    req.session.shift_viewuser = req.body.view_user
  }
  res.redirect('/demo/shift/')
})

//投稿の修正ボタンを押したときの処理
router.post('/updatebutton', function (req, res) {
  req.session.isChange = true
  req.session.changeid = req.body.id
  req.session.shift_viewuser = req.session.userid
  res.redirect('/demo/shift/')
})

//投稿の修正
router.post('/update', async function (req, res) {
  const connection = mysql.createConnection(config.connect)
  try {
    req.session.isChange = false
    req.session.changeid = 0
    await mysqlPromise.beginTransaction(connection)
    const changeid = req.body.changeid
    const date = req.body.date
    const intime = req.body.intime
    const outtime = req.body.outtime
    const comment = req.body.comment
    await shiftfunc.Request(
      req.session.userid,
      String(date),
      intime,
      outtime,
      comment,
      changeid
    )
    res.redirect('/demo/shift/')
  } catch (err) {
    console.log(err)
  } finally {
    connection.end()
  }
})

//もとに戻るボタンを押したときの処理
router.get('/backbutton', function (req, res) {
  req.session.isChange = false
  req.session.shift_viewuser = req.session.userid
  res.redirect('/demo/shift/')
})

//投稿の削除
router.post('/delete', async function (req, res) {
  const connection = mysql.createConnection(config.connect)
  try {
    req.session.shift_viewuser = req.session.userid
    await mysqlPromise.beginTransaction(connection)
    const changeid = req.body.id
    await mysqlPromise.query(
      connection,
      'UPDATE posts SET ena = 0 WHERE post_id = ?',
      [changeid]
    )
    await mysqlPromise.commit(connection)
    res.redirect('/demo/shift/')
  } catch (err) {
    console.log(err)
  } finally {
    connection.end()
  }
})

router.post('/update/password', async function (req, res) {
  if (!req.body || !req.body.id || !req.body.password) {
    return res.json({ verify: false, message: '情報が足りません' })
  }
  const connection = mysql.createConnection(config.connect)
  try {
    req.session.shift_viewuser = req.session.userid
    await mysqlPromise.beginTransaction(connection)
    const id = req.body.id
    const pass = md5hex(req.body.password)
    await mysqlPromise.query(
      connection,
      'UPDATE users SET password = ? WHERE id = ?',
      [pass, id]
    )
    await mysqlPromise.commit(connection)
    return res.json({ verify: true, message: '変更しました' })
  } catch (err) {
    console.log(err)
  } finally {
    connection.end()
  }
})

//for logout
router.get('/logout', function (req, res) {
  //セッション情報を破棄
  req.session = null
  res.locals.user = {}
  res.redirect('/demo/shift/signin')
})

// router.get('/err', function (req, res) {
//   res.end(err)
// })

router.get('/hello/get', function (req, res) {
  res.json({
    status: 'true',
    res: 'hello/get',
  })
})
router.post('/hello/post', function (req, res) {
  res.json({
    status: 'true',
    res: 'hello/post',
    body: req.body,
  })
})

router.get('/setting/repass/gettoken/:id', async function (req, res) {
  try {
    // const payload = {
    //   id: Number(req.params.id),
    // }
    // const option = {
    //   expiresIn: '1days',
    // }
    // const token = jwt.sign(payload, SECRET_KEY, option)
    return res.redirect('/demo/shift/')
  } catch (err) {
    console.log(err)
  }
})

router.get('/setting/repass/:token', async function (req, res) {
  try {
    console.log(req.params.token)
    const decoded = jwt.verify(req.params.token, SECRET_KEY)
    const user = await shiftfunc.getUserToId(decoded.id)
    if (user) {
      return res.render('password', {
        user: user,
        token: req.params.token,
      })
    } else {
      return res.redirect('/demo/shift/')
    }
  } catch (err) {
    //console.log(err)
    return res.redirect('/demo/shift/')
  }
})

router.post('/setting/repass/:token', async function (req, res) {
  try {
    const decoded = jwt.verify(req.params.token, SECRET_KEY)
    const user = await shiftfunc.getUserToId(decoded.id)
    if (user && req.body.password && req.body.repassword) {
      await shiftfunc.updatePassword(
        decoded.id,
        req.body.password,
        req.body.repassword
      )
    }
  } catch (err) {
    console.log(err)
  } finally {
    res.redirect('/demo/shift/')
  }
})

module.exports = router
