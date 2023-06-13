const moment = require('moment')
const jwt = require('jsonwebtoken')
const SECRET_KEY = 'lkj12345BMC'

const week = ['日', '月', '火', '水', '木', '金', '土', '日']

exports.shiftview = function (shift, noname = false) {
  if (!shift || !shift.date || !shift.intime || !shift.outtime || !shift.name) {
    return
  }
  const m = moment(shift.date)
  let view =
    m.format('YYYY/MM/DD') +
    ' ' +
    week[m.day()] +
    ' ' +
    shift.intime +
    ' ' +
    shift.outtime +
    (noname ? '' : ' @' + shift.name) +
    '   ' +
    (shift.comment ? shift.comment : '')
  return view
}

exports.getdate = function (_date) {
  const m = moment(_date)
  let view = m.format('YYYY/MM/DD') + ' ' + week[m.day()]

  return view
}

exports.formatDateTime = function (_date) {
  const m = moment(_date)
  let view = m.format('YYYY/MM/DD HH:mm:ss') + ' ' + week[m.day()]

  return view
}

exports.listToText = function (list) {
  let text = ''
  for (let status of list) {
    text += status.name + '\n'
  }
  return text
}

exports.getToken = function (_id) {
  const payload = {
    id: Number(_id),
  }
  const option = {
    expiresIn: '1days',
  }
  const token = jwt.sign(payload, SECRET_KEY, option)
  return 'https://shift.bmcomp.net/setting/repass/' + token
}
