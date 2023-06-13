/* eslint-disable no-irregular-whitespace */
const express = require('express')
const engine = require('ejs-mate')
const path = require('path')
const cookieParser = require('cookie-parser')
const morgan = require('morgan')
const cookieSession = require('cookie-session')
const secret = 'secretCuisine123'
const mysql = require('mysql2')
const config = require('./config/mysql.config')
const app = express()
const port = process.env.PORT || 3000
const cron = require('node-cron')
const moment = require('moment')
const mysqlPromise = require('./js/mysqlPromise')
const { exec } = require('child_process')

const shiftfunc = require('./js/shiftfunc')
const ejsfunc = require('./js/ejsfunc.js')

//router
const indexRouter = require('./routes/index')
const signinRouter = require('./routes/signin')
const signupRouter = require('./routes/signup')
const multiRouter = require('./routes/multi')
const missRouter = require('./routes/miss')
const usersRouter = require('./routes/users')
const tableRouter = require('./routes/table')
const profileRouter = require('./routes/profile')
const settingRouter = require('./routes/setting')
//ios app
const iosRouter = require('./routes/ios')

let userlist = []
app.locals.eslint = ''
// app.locals.hostname = 'http://localhost:3000'
app.locals.hostname = 'https://shift.bmcomp.net'

//listen
app.listen(port, () => {
  console.log(
    '[DATE: ' + String(moment()) + ']' + `Example app listening on port ${port}`
  )
  const connection = mysql.createConnection(config.connect)
  connection.connect()
  connection.query('select id, name from users', function (error, results) {
    userlist = results
  })
  connection.end()
  exec('npm run eslint', (err, stdout) => {
    if (process.env.SHIFTAPP_DEV == 'dev' && err) {
      app.locals.eslint = stdout
      console.error(`stderr: ${stdout}`)
      //throw 'Look at .eslintrc & .prettierrc.js and fix your code'
    }
  })
})
//cookie setup
app.use(
  cookieSession({
    name: 'session',
    keys: [secret],
    maxAge: 365 * 24 * 60 * 60 * 1000, // 1 Year
  })
  //cookiesessionのモジュールを使うことで他のスクリプトの中でもreq.sessionで使えるようになる
)

// view engine setup
app.set('views', path.join(__dirname, 'views/pages'))
app.use(express.static(path.join(__dirname, 'public')))
app.set('view engine', 'ejs')
app.engine('ejs', engine)
app.locals.func = ejsfunc

morgan.token('nowdate', function () {
  return '[DATE: ' + String(moment()) + ']'
})
morgan.token('userid', function (req) {
  let id
  if (!req || !req.session || !req.session.userid) {
    id = 'NONE'
  } else {
    id = req.session.userid
  }
  let name
  for (let list_i in userlist) {
    if (userlist[list_i].id == id) {
      name = userlist[list_i].name
      break
    }
  }
  if (name) {
    return 'user:' + String(name)
  }
  return 'id:' + String(id)
})
app.use(morgan(':nowdate :userid :method :url :response-time'))

app.use(express.json())
app.use(express.urlencoded({ extended: false }))

app.use(cookieParser())
app.use(express.static(path.join(__dirname, 'public')))

app.use(async function (req, res, next) {
  const connection = mysql.createConnection(config.connect)
  try {
    res.locals.originalurl = String(req.originalUrl).replace('/', '')
    await mysqlPromise.beginTransaction(connection)
    res.locals.session = req.session
    if (
      String(req.originalUrl).match('/ios') ||
      String(req.originalUrl).match('/hello') ||
      String(req.originalUrl).match('/setting/repass') ||
      req.originalUrl == '/logout' ||
      req.originalUrl == '/signin' ||
      req.originalUrl == '/signup'
    ) {
      return next()
    }
    let userid = req.session.userid
    if (!userid || userid == 0) {
      return res.redirect('/logout')
    }
    //console.log(res.locals)
    const results = await mysqlPromise.query(
      connection,
      'select * from users inner join user_icon on users.id = user_icon.id where users.id = ? and active > 0',
      [userid]
    )
    //console.log(results)
    if (!results || !results[0]) {
      return res.redirect('/logout')
    } else {
      //console.log(results)
      req.session.user = {}
      req.session.user.data = results[0]
    }
    res.locals.session = req.session
    return next()
  } catch (err) {
    res.render('error', { error: err })
  } finally {
    connection.end()
  }
})

app.use('/signup', signupRouter)

app.use('/ios', iosRouter)

app.use('/signin', signinRouter)

app.use('/', indexRouter)
//app.use('/2', index2Router);
app.use('/multi', multiRouter)

app.use('/miss', missRouter)

app.use('/users', usersRouter)

app.use('/table', tableRouter)

app.use('/profile', profileRouter)

app.use('/setting', settingRouter)

/*
ここで月曜の8時にして、misslistにカウントしていく
          //('秒 分 時 日 月　opt')
          毎週　1..月曜日　2..火曜日　etc...
*/
cron.schedule('00 00 08 * * 1', async () => {
  // const connection = mysql.createConnection(config.connect)
  try {
    console.log('おはよう！朝ご飯、ちゃんと食べた？( ﾟДﾟ)')
    // await mysqlPromise.beginTransaction(connection)
    // await mysqlPromise.query(connection, 'delete from posts where ena=0')
    // await mysqlPromise.commit(connection)
    await shiftfunc.weekup()
  } catch (err) {
    console.log('cron function error\n' + err)
  } finally {
    // connection.end()
    console.log('週カウント完了')
  }
})

// catch 404 and forward to error handler
app.use(function (req, res) {
  res.status(404)
  return res.render('404', {
    url: req.protocol + '://' + req.get('host') + req.originalUrl,
  })
  //console.log(req)
  // console.log(req.protocol + '://' + req.get('host') + req.originalUrl)
})

// error handler
app.use(function (err, req, res, next) {
  if (process.env.SHIFTAPP_DEV == 'dev' || err) {
    res.locals.err = {}
    // set locals, only providing error in development
    res.locals.err = err

    // render the error page
    res.status(err.status || 500)
    console.warn('get error!!!')
    console.log(err)
    return res.render('error', { error: err })
  } else {
    next()
  }
})

exports.app = app
