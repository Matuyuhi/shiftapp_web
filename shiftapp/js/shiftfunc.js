const moment = require('moment')
const mysql = require('mysql2')
const config = require('../config/mysql.config.js')
const crypto = require('crypto')
const mysqlPromise = require('./mysqlPromise.js')

exports.md5hex = function (str /*: string */) {
  const md5 = crypto.createHash('md5')
  return md5.update(str, 'binary').digest('hex')
}

function isbeforMonday(postsdate) {
  // console.log(postsdate)
  let isbefor = 0
  let postday = moment(postsdate)
  let thismonday = moment().startOf('weeks').add(1, 'd')
  if (postday.isBefore(thismonday)) {
    console.log('前の日のデータは入力できないよ')
    isbefor = 1
  }
  return isbefor
}
function islatepost(postsdate) {
  let islate = 0
  //月曜8時
  let today = moment()
  //let today = moment();
  let outTime = moment().startOf('weeks').add(1, 'd').add(8, 'h')
  if (moment().isBefore(outTime)) {
    outTime = today.startOf('weeks').subtract(3, 'd')
  }
  let outStart = outTime.startOf('weeks')
  //console.log(outStart.format('YYYY-MM-DD'));
  let outEnd = outTime.endOf('weeks')
  //console.log(outEnd.format('YYYY-MM-DD'));
  today = new Date() //Dateをインスタンス化
  let post = moment(postsdate).subtract(1, 'd')
  let postsStart = post.startOf('weeks')
  let postsEnd = post.endOf('weeks')
  // console.log(postsStart.format('YYYY-MM-DD'))
  // console.log(postsEnd.format('YYYY-MM-DD'))
  // console.log(postsStart.isSame(outStart))
  // console.log(postsEnd.isSame(outEnd))
  if (postsStart.isSame(outStart) && postsEnd.isSame(outEnd)) {
    console.log('遅れたね')
    islate = 1
  }
  return islate
}
exports.islatepost = function (type) {
  return islatepost(type)
}
function iscollecttime(checktime) {
  if (!checktime || !String(checktime).match(/[0-9]{2}:[0-9]{2}/)) {
    return 0
  }
  const splittedtime = String(checktime).split(':')
  if (!splittedtime[0] || !splittedtime[1]) {
    return 0
  }
  let flag = 0
  //console.log(Number(splittedtime[0]))
  //console.log(Number(splittedtime[1]))

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
  //console.log(flag)
  return flag
}

//二つの時間を比較する関数
function timecheck(intime, outtime) {
  if (iscollecttime(intime) == 0 || iscollecttime(outtime) == 0) {
    return 0
  }
  if (intime == '99:99' || outtime == '99:99') {
    return 1
  }

  const splittedintime = String(intime).split(':')
  const splittedouttime = String(outtime).split(':')
  const intimesec = Number(splittedintime[0]) * 60 + Number(splittedintime[1])
  const outtimesec =
    Number(splittedouttime[0]) * 60 + Number(splittedouttime[1])

  let istrue = 0
  if (intimesec < outtimesec) {
    istrue = 1
  }
  //console.log(istrue)

  return istrue
}

exports.set2fig = function (num) {
  // 桁数が1桁だったら先頭に0を加えて2桁に調整する
  let ret
  if (num < 10) {
    ret = '0' + num
  } else {
    ret = num
  }
  return ret
}

exports.getUserShift = async function (_id) {
  const connection = mysql.createConnection(config.connect)
  try {
    let viewmode
    //shift取得
    let data = {}
    let shifts = []
    for (let i = 0; i < 3; i++) {
      if (i == 2) {
        //今日以降
        viewmode = 'date >= (CURRENT_DATE - interval WEEKDAY(CURRENT_DATE) day)'
      } else if (i == 0) {
        //今週
        viewmode =
          'date >= (CURRENT_DATE - interval WEEKDAY(CURRENT_DATE) day) and date < (CURRENT_DATE - interval WEEKDAY(CURRENT_DATE) day + interval 7 day)'
      } else if (i == 1) {
        //来週
        viewmode =
          'date >= (CURRENT_DATE - interval WEEKDAY(CURRENT_DATE) day + interval 7 day) \
                and date < (CURRENT_DATE - interval WEEKDAY(CURRENT_DATE) day + interval 14 day)'
      }
      let sqltext =
        'select post_id, name, users.id user_id, date, intime, outtime, comment, islate, active \
            from posts inner join users on posts.user_id = users.id \
            where ' +
        viewmode +
        ' and ena = 1 and active > 0 and user_id = ? order by date, intime'
      data.shift = await mysqlPromise.query(connection, sqltext, [_id])
      data.workcount = 0
      data.latecount = 0
      for (let shift of data.shift) {
        if (shift.islate == 1) {
          data.latecount++
        }
        data.workcount++
      }
      shifts.push(data)
      data = {}
    }
    return shifts
  } catch (err) {
    await mysqlPromise.rollback(connection, err)
    console.log(err)
  } finally {
    connection.end()
  }
}

exports.weekup = async function () {
  const connection = mysql.createConnection(config.connect)
  try {
    await mysqlPromise.beginTransaction(connection)
    let postcount = []
    //user取得
    const userlist = await mysqlPromise.query(
      connection,
      'select * from users where active = 1'
    )
    //今週のデータ
    const postlist = await mysqlPromise.query(
      connection,
      'select * from posts inner join users on posts.user_id = users.id \
        where date >= (CURRENT_DATE - interval WEEKDAY(CURRENT_DATE) day)'
    )
    //console.log(results2);
    //今週に提出しているかuserごとに確認
    for (const user of userlist) {
      //console.log(user.id);
      if (!user.id) {
        continue
      }
      let id = user.id
      if (!postcount[Number(id)]) {
        postcount[Number(id)] = 0
      }
      for (let post of postlist) {
        if (String(id) == String(post.user_id)) {
          postcount[Number(id)] += 1
        }
      }
      //console.log(postcount[Number(id)]);
      //今週データがなければ
      if (postcount[Number(id)] == 0) {
        await mysqlPromise.query(
          connection,
          'insert into misslist (user_id, missweek) values (?, CURRENT_DATE - interval WEEKDAY(CURRENT_DATE) day)',
          [id]
        )
      }
    }
    await mysqlPromise.commit(connection)
  } catch (err) {
    await mysqlPromise.rollback(connection, err)
    console.log(err)
  } finally {
    connection.end()
  }
}

exports.Request = async function (
  _id,
  _date,
  _intime,
  _outtime,
  _comment,
  _post_id = 0
) {
  const connection = mysql.createConnection(config.connect)
  try {
    //前日以前は入力不可
    //入力時に判定済み
    if (new Date(_date) == 'Invalid Date') {
      return
    }
    let split_date = _date.split(/-|\//)
    split_date[0] = exports.set2fig(Number(split_date[0]))
    split_date[1] = exports.set2fig(Number(split_date[1]))
    split_date[2] = exports.set2fig(Number(split_date[2]))
    _date = split_date.join('-')

    if (isbeforMonday(_date) == 1) {
      return
    }
    if (timecheck(_intime, _outtime) == 0) {
      return
    }
    //
    const nowuserId = _id
    const date = String(_date)
    const intime = _intime
    const outtime = _outtime
    const comment = _comment
    let duplication = 0

    await mysqlPromise.beginTransaction(connection)
    ///月曜までに入力しているか
    let islate = islatepost(_date)
    //console.log(islate);
    //まずかぶりがあるかどうかを調べる
    const res = await mysqlPromise.query(
      connection,
      `select * from posts where user_id = ? and date = ? and ena = 1`,
      [nowuserId, date]
    )
    if (res && res.length != 0) {
      duplication = res[0].post_id
      if (
        res[0].intime == intime &&
        res[0].outtime == outtime &&
        res[0].islate == 0
      ) {
        //console.log("コメントのみ変更です")
        islate = 0
      }
    } else {
      duplication = 0
    }
    if (_post_id) {
      //post_id指定
      let findpost = await mysqlPromise.query(
        connection,
        `select * from posts where user_id = ? and post_id = ? and ena = 1`,
        [nowuserId, _post_id]
      )
      //console.log(findpost);
      if (findpost && findpost.length != 0) {
        duplication = _post_id
      } else {
        throw '存在しないpostidです'
      }
    }

    if (duplication == '0') {
      await mysqlPromise.query(
        connection,
        'insert into posts (user_id, date, intime, outtime, comment, islate) values (?, ?, ?, ?, ?, ?)',
        [nowuserId, date, intime, outtime, comment, islate]
      )
    }
    //被ってた場合はupdateする
    else {
      await mysqlPromise.query(
        connection,
        'UPDATE posts SET date = ?, intime = ?, outtime = ?, comment = ?, islate = ? WHERE post_id = ? and ena = 1',
        [date, intime, outtime, comment, islate, duplication]
      )
      if (res[0] && res[0].post_id != _post_id && _post_id && _post_id != 0) {
        //同じ日が複数存在する時に古い方を削除
        await mysqlPromise.query(
          connection,
          'UPDATE posts SET ena = 0 WHERE post_id = ?',
          [res[0].post_id]
        )
      }
    }
    await mysqlPromise.commit(connection)
  } catch (err) {
    await mysqlPromise.rollback(connection, err)
    console.log('shiftfunc.js for this.Request error\n' + err)
  } finally {
    connection.end()
  }
}

exports.WeekWorkCount = async function (_week) {
  const connection = mysql.createConnection(config.connect)
  try {
    await mysqlPromise.beginTransaction(connection)
    const userlist = await mysqlPromise.query(
      connection,
      'select id, name from users where active > 0'
    )
    const search =
      'select name, islate from posts inner join users on posts.user_id = users.id \
        where  ' +
      _week +
      ' \
        and ena = 1 and active > 0 order by date'
    const usershift = await mysqlPromise.query(connection, search)
    for (let users of userlist) {
      users.work = 0
      users.late = 0
      for (let posts of usershift) {
        if (users.name != posts.name) {
          continue
        }
        users.work += 1
        if (posts.islate == 1) {
          users.late += 1
        }
      }
    }
    return userlist
  } catch (err) {
    await mysqlPromise.rollback(connection, err)
    console.log('shiftfunc.js for this.WeekWorkCount error\n' + err)
  } finally {
    connection.end()
  }
}

//今期の範囲取得用
exports.getCurrentTerm = function () {
  let today = moment()
  let start = moment(new Date().getFullYear() + '-04-01')
  // console.log(start)
  let end = moment(new Date().getFullYear() + '-11-01')

  if (today.isSameOrAfter(start) && today.isBefore(end)) {
    return [start.format('YYYY-MM-DD'), end.format('YYYY-MM-DD')]
  } else {
    //console.log(today.isBefore(end))
    if (today.isBefore(start)) {
      return [
        end.subtract(1, 'y').format('YYYY-MM-DD'),
        start.format('YYYY-MM-DD'),
      ]
    } else {
      return [end.format('YYYY-MM-DD'), start.add(1, 'y').format('YYYY-MM-DD')]
    }
  }
}

exports.getUserShiftToWeek = async function (_id, _week) {
  const connection = mysql.createConnection(config.connect)
  try {
    let viewmode
    //shift取得
    let data = {}
    if (_week > 1) {
      viewmode = `date >= (CURRENT_DATE - interval WEEKDAY(CURRENT_DATE) day + interval 14 day )`
    } else {
      let query = await mysqlPromise.query(
        connection,
        `select CURRENT_DATE - interval WEEKDAY(CURRENT_DATE) day + interval ${
          _week * 7
        } day day`
      )
      const startweek = moment(query[0].day).format('YYYY-MM-DD')
      data.startday = startweek

      viewmode = `date >= (CURRENT_DATE - interval WEEKDAY(CURRENT_DATE) day + interval 
      ${_week * 7} 
      day ) and date < (CURRENT_DATE - interval WEEKDAY(CURRENT_DATE) day + interval 
      ${(_week + 1) * 7} day)`
    }

    let sqltext =
      'select post_id, name, users.id user_id, date, intime, outtime, comment, islate, active \
          from posts inner join users on posts.user_id = users.id \
          where ' +
      viewmode +
      ' and ena = 1 and active > 0 and user_id = ? order by date, intime'
    // console.log(sqltext)
    data.shift = await mysqlPromise.query(connection, sqltext, [_id])
    data.workcount = 0
    data.latecount = 0
    //data.worktime = 0
    for (let shift of data.shift) {
      if (shift.islate == 1) {
        data.latecount++
      }
      data.workcount++
      // let st = (moment("2023-01-01 "+shift.intime))
      // console.log(st.format('YYYY-MM-DD HH:mm:ss'))
      // console.log(shift.outtime)
      // let ed = moment("2023-01-01 "+shift.outtime)
      // console.log(ed.format('YYYY-MM-DD HH:mm:ss'))
      // console.log(st.diff(ed,'hours'))
    }
    return data
  } catch (err) {
    await mysqlPromise.rollback(connection, err)
    console.log(err)
  } finally {
    connection.end()
  }
}

exports.getAllSift = async function (order = 'updated_at DESC') {
  const connection = mysql.createConnection(config.connect)
  try {
    //shift取得
    let data = {}

    let sqltext =
      'select users.id id, name, date, intime, outtime, comment, updated_at, islate, active, ena, url \
      from posts inner join users on posts.user_id = users.id \
      inner join user_icon on users.id = user_icon.id \
      order by ' + order
    // console.log(sqltext)
    data = await mysqlPromise.query(connection, sqltext)
    return data
  } catch (err) {
    await mysqlPromise.rollback(connection, err)
    console.log(err)
  } finally {
    connection.end()
  }
}

exports.getAllUser = async function () {
  const connection = mysql.createConnection(config.connect)
  try {
    //shift取得
    let data = {}

    let sqltext =
      'select * from users inner join user_icon on users.id = user_icon.id'
    data = await mysqlPromise.query(connection, sqltext)
    return data
  } catch (err) {
    await mysqlPromise.rollback(connection, err)
    console.log(err)
  } finally {
    connection.end()
  }
}

exports.updatePassword = async function (_id, _password, _retype) {
  const connection = mysql.createConnection(config.connect)
  try {
    if (String(_password) != String(_retype)) {
      return false
    }
    if (!exports.getUser(_id)) {
      return false
    }
    await mysqlPromise.beginTransaction(connection)

    const pass = exports.md5hex(String(_password))
    await mysqlPromise.query(
      connection,
      'update users set password = ? where id = ?',
      [pass, _id]
    )
    await mysqlPromise.commit(connection)
    return true
  } catch (err) {
    await mysqlPromise.rollback(connection, err)
    console.log(err)
  } finally {
    connection.end()
  }
}

exports.updateFunc = async function (_id, _url) {
  const connection = mysql.createConnection(config.connect)
  try {
    if (!exports.getUser(_id)) {
      return false
    }
    await mysqlPromise.beginTransaction(connection)

    await mysqlPromise.query(
      connection,
      'update users set active = ? where id = ?',
      [_url, _id]
    )
    await mysqlPromise.commit(connection)
    return true
  } catch (err) {
    await mysqlPromise.rollback(connection, err)
    console.log(err)
  } finally {
    connection.end()
  }
}

exports.updateIconUrl = async function (_id, _url) {
  const connection = mysql.createConnection(config.connect)
  try {
    if (!exports.getUser(_id)) {
      return false
    }
    await mysqlPromise.beginTransaction(connection)

    await mysqlPromise.query(
      connection,
      'update user_icon set url = ? where id = ?',
      [_url, _id]
    )
    await mysqlPromise.commit(connection)
    return true
  } catch (err) {
    await mysqlPromise.rollback(connection, err)
    console.log(err)
  } finally {
    connection.end()
  }
}

exports.getUser = async function (_id) {
  const connection = mysql.createConnection(config.connect)
  try {
    await mysqlPromise.beginTransaction(connection)
    const results = await mysqlPromise.query(
      connection,
      'select * from users inner join user_icon on users.id = user_icon.id where users.id = ?',
      [_id]
    )
    if (!results || !results[0]) {
      return false
    }
    return results[0]
  } catch (err) {
    await mysqlPromise.rollback(connection, err)
  } finally {
    connection.end()
  }
}

exports.getUserToId = async function (_id) {
  const connection = mysql.createConnection(config.connect)
  try {
    await mysqlPromise.beginTransaction(connection)
    const results = await mysqlPromise.query(
      connection,
      'select * from users where id = ? and active > 0',
      [_id]
    )
    if (!results || !results[0]) {
      return false
    }
    return results[0]
  } catch (err) {
    await mysqlPromise.rollback(connection, err)
  } finally {
    connection.end()
  }
}

exports.getUserToName = async function (_username) {
  const connection = mysql.createConnection(config.connect)
  try {
    await mysqlPromise.beginTransaction(connection)
    const results = await mysqlPromise.query(
      connection,
      'select * from users where name = ? and active > 0',
      [String(_username)]
    )
    if (!results || !results[0]) {
      return false
    }
    return results[0]
  } catch (err) {
    await mysqlPromise.rollback(connection, err)
  } finally {
    connection.end()
  }
}

exports.foundUser = async function (_username, _password) {
  const connection = mysql.createConnection(config.connect)
  try {
    await mysqlPromise.beginTransaction(connection)
    const results = await mysqlPromise.query(
      connection,
      'select * from users where name = ? and password = ? and active > 0',
      [String(_username), exports.md5hex(_password)]
    )
    if (!results || !results[0]) {
      return false
    }
    return results[0]
  } catch (err) {
    await mysqlPromise.rollback(connection, err)
  } finally {
    connection.end()
  }
}

exports.sortUser = function (list, user, sort) {
  try {
    return list.sort((a, b) => {
      let a_num = 0
      let b_num = 0
      if (a.name != user) {
        for (let list of sort) {
          a_num++
          if (list.name == a.name) {
            break
          }
        }
      }
      if (b.name != user) {
        for (let list of sort) {
          b_num++
          if (list.name == b.name) {
            break
          }
        }
      }
      return a_num < b_num ? -1 : 1
    })
  } catch (err) {
    console.error(err)
  }
}

exports.getAddUser = async function () {
  const connection = mysql.createConnection(config.connect)
  try {
    await mysqlPromise.beginTransaction(connection)
    const results = await mysqlPromise.query(
      connection,
      'select * from adduser'
    )
    if (!results || !results[0]) {
      return false
    }
    return results
  } catch (err) {
    await mysqlPromise.rollback(connection, err)
  } finally {
    connection.end()
  }
}

exports.setAddUser = async function (_username) {
  const connection = mysql.createConnection(config.connect)
  try {
    await mysqlPromise.beginTransaction(connection)
    const results = await mysqlPromise.query(
      connection,
      'insert into adduser value (?)',
      [_username]
    )
    await mysqlPromise.commit(connection)
    return results
  } catch (err) {
    await mysqlPromise.rollback(connection, err)
  } finally {
    connection.end()
  }
}

exports.deleteAddUser = async function (_username) {
  const connection = mysql.createConnection(config.connect)
  try {
    await mysqlPromise.beginTransaction(connection)
    const results = await mysqlPromise.query(
      connection,
      'delete from adduser where name=?',
      [_username]
    )
    await mysqlPromise.commit(connection)
    return results
  } catch (err) {
    await mysqlPromise.rollback(connection, err)
  } finally {
    connection.end()
  }
}

exports.getSortUser = async function () {
  const connection = mysql.createConnection(config.connect)
  try {
    await mysqlPromise.beginTransaction(connection)
    const results = await mysqlPromise.query(
      connection,
      'select * from sortuser order by id asc'
    )
    if (!results || !results[0]) {
      return false
    }
    return results
  } catch (err) {
    await mysqlPromise.rollback(connection, err)
  } finally {
    connection.end()
  }
}

exports.getActiveUserToSort = async function () {
  const connection = mysql.createConnection(config.connect)
  try {
    await mysqlPromise.beginTransaction(connection)
    const results = await mysqlPromise.query(
      connection,
      'select sortuser.id id, sortuser.name name from \
      sortuser inner join users on users.name = sortuser.name \
      where active = 1 or active = 3 order by sortuser.id asc'
    )
    if (!results || !results[0]) {
      return false
    }
    return results
  } catch (err) {
    await mysqlPromise.rollback(connection, err)
  } finally {
    connection.end()
  }
}

exports.addSortUser = async function (id, name) {
  const connection = mysql.createConnection(config.connect)
  try {
    await mysqlPromise.beginTransaction(connection)
    const results = await mysqlPromise.query(
      connection,
      'insert into sortuser (id, name) value (?,?)',
      [id, name]
    )
    await mysqlPromise.commit(connection)
    return results
  } catch (err) {
    await mysqlPromise.rollback(connection, err)
  } finally {
    connection.end()
  }
}

exports.setSortUser = async function (list) {
  const connection = mysql.createConnection(config.connect)
  try {
    await mysqlPromise.beginTransaction(connection)
    await mysqlPromise.query(connection, 'DELETE FROM sortuser')
    await mysqlPromise.commit(connection)
    connection.end()
    for (let name_i in list) {
      if (!list[name_i]) {
        continue
      }
      await exports.addSortUser(name_i, list[name_i])
    }
    return true
  } catch (err) {
    await mysqlPromise.rollback(connection, err)
    return false
  }
}
/*
jmatuda
tsuya
KikuchiTomo
nakanishi
MorimotoRyuu
abe
kawamata
Kawana
SasakiGenta
yamane
iori ikeda
Rikuto Ito
NagoshiYuki
nasu mahiro
Haruaki Tanaka
asada
Takayanagi
nakajima
morita
ichihara
KOGUCHI HIDENARI
yamada
onoakihiro
tuna
Yugo
Iwasaki
Ando
Fukada
*/
