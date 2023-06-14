const express = require('express')
const router = express.Router()

const shiftfunc = require('../js/shiftfunc')
router.use(function (req, res, next) {
  if (!req.session.user.data.id || req.session.user.data.active != 3) {
    return res.redirect('/demo/shift/')
  } else {
    next()
  }
})

router.get('/', async function (req, res) {
  try {
    let userlist = await shiftfunc.getAllUser()
    let addlist = await shiftfunc.getAddUser()
    if (!addlist) {
      addlist = []
    }
    let sortlist = await shiftfunc.getSortUser()
    if (!sortlist) {
      sortlist = []
    }
    let sort = await shiftfunc.getSortUser()
    userlist = shiftfunc.sortUser(userlist, req.session.user.data.name, sort)
    return res.render('setting', {
      userlist: userlist,
      addlist: addlist,
      sortlist: sortlist,
    })
  } catch (err) {
    console.log(err)
  }
})

router.post('/', async function (req, res) {
  try {
    for (let key in req.body) {
      if (String(key.split('-')[0]) == 'func') {
        if (String(key.split('-')[2]) != String(req.body[key])) {
          console.log(String(key.split('-')[1]) + ': ' + req.body[key])
          await shiftfunc.updateFunc(Number(key.split('-')[1]), req.body[key])
        }
      } else if (String(key.split('#')[0]) == 'url') {
        if (String(key.split('#')[2]) != String(req.body[key])) {
          console.log(String(key.split('#')[1]) + ': ' + req.body[key])
          await shiftfunc.updateIconUrl(
            String(key.split('#')[1]),
            req.body[key]
          )
        }
      }
    }
    res.redirect('/demo/shift/setting')
  } catch (err) {
    console.log(err)
  }
})

router.post('/adduser', async function (req, res) {
  try {
    if (req.body.adduser) {
      await shiftfunc.setAddUser(req.body.adduser)
    }
    res.redirect('/demo/shift/setting')
  } catch (err) {
    console.log(err)
  }
})

router.get('/deleteuser/:name', async function (req, res) {
  try {
    if (req.params.name) {
      await shiftfunc.deleteAddUser(req.params.name)
    }
    res.redirect('/demo/shift/setting')
  } catch (err) {
    console.log(err)
  }
})

router.post('/sort', async function (req, res) {
  try {
    if (req.body.sort) {
      await shiftfunc.setSortUser(req.body.sort.split('\r\n'))
    }
    res.redirect('/demo/shift/setting')
  } catch (err) {
    console.log(err)
  }
})

module.exports = router
