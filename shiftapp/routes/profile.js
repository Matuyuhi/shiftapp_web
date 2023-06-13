const express = require('express')
// const mysql = require('mysql')
const router = express.Router()
// const config = require('../config/mysql.config')

// const mysqlPromise = require('../js/mysqlPromise')

const shiftfunc = require('../js/shiftfunc')

router.use(function (req, res, next) {
  if (!req.session.user.data.id) {
    return res.redirect('/')
  } else {
    next()
  }
})

router.get('/', async function (req, res) {
  try {
    const id = req.session.user.data.id
    let shift = []
    for (let week_i = 0; week_i < 3; week_i++) {
      shift[week_i] = await shiftfunc.getUserShiftToWeek(id, week_i)
    }
    return res.render('profile', {
      shiftlist: shift,
    })
  } catch (err) {
    console.log(err)
  }
})

router.post('/:set', async function (req, res) {
  try {
    const id = req.session.user.data.id
    if (req.params.set == 'password') {
      if (req.body.password && req.body.retype) {
        console.log(
          await shiftfunc.updatePassword(id, req.body.password, req.body.retype)
        )
      }
    } else if (req.params.set == 'icon') {
      if (req.body.updateurl) {
        console.log(await shiftfunc.updateIconUrl(id, req.body.updateurl))
        req.session.user = {}
      }
    }
    return res.redirect('/profile')
  } catch (err) {
    console.log(err)
  }
})

module.exports = router
