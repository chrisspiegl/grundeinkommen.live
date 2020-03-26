process.env.NODE_ENV = process.env.NODE_ENV || 'development'
const path = require('path')
const config = require(path.join(__dirname, '../../config'))

const debug = require('debug')
const log = debug(`${config.slug}:router:home`)
log.log = console.log.bind(console)
const error = debug(`${config.slug}:router:home:error`)

const express = require('express')
const numeral = require('numeral')
const moment = require('moment-timezone')
const sequelize = require('sequelize')

const models = require('../../database/models')
const middleware = require('../middleware')

module.exports = () => {
  const router = express.Router()
  router.get('/', middleware.catchErrors(async (req, res) => {
    const response = {
      bodyClasses: 'pageHome'
    }


    /**
    changeOrg =======================================
    */
    response.changeOrgDe = await models.ValuesInt.findAll({
      where: {
        key: 'change-org-bge-de'
      },
      order: [['createdAt', 'ASC']]
    })

    response.changeOrgDeCurrent = response.changeOrgDe.slice(-1)[0]

    const chartChangeOrg = {
      labels: [],
      values: [],
      valuesRaw: []
    }
    const chartChangeOrgDay = {
      labels: [],
      values: [],
      valuesRaw: []
    }
    let hourLast = moment().add(1, 'hour').startOf('hour')
    let dayLast = moment().add(1, 'day').startOf('day')
    for (let change of response.changeOrgDe) {
      const hourCurrent = moment(change.createdAt).startOf('hour')
      const dayCurrent = moment(change.createdAt).startOf('day')

      if (hourLast.isSame(hourCurrent)) {
      } else {
        hourLast = hourCurrent
        chartChangeOrg.labels.push(hourLast.tz('Europe/Berlin').format('YYYY-MM-DD HH:mm'))
        chartChangeOrg.values.push(numeral(change.value).format('0.0'))
        chartChangeOrg.valuesRaw.push(change.value)
      }
      if (dayLast.isSame(dayCurrent)) {
      } else {
        dayLast = dayCurrent
        chartChangeOrgDay.labels.push(dayLast.tz('Europe/Berlin').format('YYYY-MM-DD'))
        chartChangeOrgDay.values.push(numeral(change.value).format('0.0'))
        chartChangeOrgDay.valuesRaw.push(change.value)
      }
    }

    response.chartChangeOrg = chartChangeOrg
    response.chartChangeOrgDay = chartChangeOrgDay

    let hourLast1 = moment().subtract(2, 'hours').startOf('hour')
    let hourLast24 = moment().subtract(24, 'hours').startOf('hour')
    let changeOrg24h, changeOrg1h;
    for (let change of response.changeOrgDe) {
      if (!changeOrg1h && moment(change.createdAt).startOf('hour').isAfter(hourLast1)) {
        changeOrg1h = change
      }
      if (!changeOrg24h && moment(change.createdAt).startOf('hour').isAfter(hourLast24)) {
        changeOrg24h = change
      }
    }

    response.changeOrg1h = (changeOrg1h) ? response.changeOrgDeCurrent.value - changeOrg1h.value : 0
    response.changeOrg24h = (changeOrg24h) ? response.changeOrgDeCurrent.value - changeOrg24h.value : 0


    /**
    youmove =======================================
    */

    response.youMove = await models.ValuesInt.findAll({
      where: {
        key: 'youMove-eu-grundeinkommen'
      },
      order: [['createdAt', 'ASC']]
    })

    response.youMoveCurrent = response.youMove.slice(-1)[0]

    const chartYouMove = {
      labels: [],
      values: [],
      valuesRaw: []
    }
    const chartYouMoveDay = {
      labels: [],
      values: [],
      valuesRaw: []
    }
    hourLast = moment().add(1, 'hour').startOf('hour')
    dayLast = moment().add(1, 'day').startOf('day')
    for (let change of response.youMove) {
      const hourCurrent = moment(change.createdAt).startOf('hour')
      const dayCurrent = moment(change.createdAt).startOf('day')
      if (hourLast.isSame(hourCurrent)) {
      } else {
        hourLast = hourCurrent
        chartYouMove.labels.push(hourLast.tz('Europe/Berlin').format('YYYY-MM-DD HH:mm'))
        chartYouMove.values.push(numeral(change.value).format('0.0'))
        chartYouMove.valuesRaw.push(change.value)
      }
      if (dayLast.isSame(dayCurrent)) {
      } else {
        dayLast = dayCurrent
        chartYouMoveDay.labels.push(dayLast.tz('Europe/Berlin').format('YYYY-MM-DD'))
        chartYouMoveDay.values.push(numeral(change.value).format('0.0'))
        chartYouMoveDay.valuesRaw.push(change.value)
      }
    }

    response.chartYouMove = chartYouMove
    response.chartYouMoveDay = chartYouMoveDay

    let youMove24h, youMove1h;
    for (let change of response.youMove) {
      if (!youMove1h && moment(change.createdAt).startOf('hour').isAfter(hourLast1)) {
        youMove1h = change
      }
      if (!youMove24h && moment(change.createdAt).startOf('hour').isAfter(hourLast24)) {
        youMove24h = change
      }
    }
    response.youMove1h = (youMove1h) ? response.youMoveCurrent.value - youMove1h.value : 0
    response.youMove24h = (youMove24h) ? response.youMoveCurrent.value - youMove24h.value : 0


    /**
    meinbge =======================================
    */
    response.meinbgeGrundeinkommen = await models.ValuesInt.findOne({
      where: {
        key: 'meinbge-de-grundeinkommen'
      },
      order: [['createdAt', 'DESC']]
    })

    response.meinbgeDonors = await models.ValuesInt.findOne({
      where: {
        key: 'meinbge-de-donors'
      },
      order: [['createdAt', 'DESC']]
    })

    return res.format({
      html: () => {
        return res.render('home', response)
      },
      json: () => {
        return res.send(response)
      }
    })
  }))

  return router
}
