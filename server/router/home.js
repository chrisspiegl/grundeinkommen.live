process.env.NODE_ENV = process.env.NODE_ENV || 'development'
const path = require('path')
const config = require(path.join(__dirname, '../../config'))

const debug = require('debug')
const log = debug(`${config.slug}:router:home`)
log.log = console.log.bind(console)
const error = debug(`${config.slug}:router:home:error`)

const express = require('express')
const numeral = require('numeral')
const _ = require('lodash')
const moment = require('moment-timezone')
const sequelize = require('sequelize')

const models = require('../../database/models')
const middleware = require('../middleware')

const CacheService = require('../cache.service');
const cache = new CacheService(60 * 5); // 5min ttl / Create a new cache service instance

module.exports = () => {
  const router = express.Router()
  router.get('/', middleware.catchErrors(async (req, res) => {
    const response = {
      bodyClasses: 'pageHome'
    }

    response.changeorg = await cache.get('change-org-bge-de', () => chartGrouping('change-org-bge-de'))
    response.bundestag = await cache.get('bundestag-108191', () => chartGrouping('bundestag-108191'))
    response.youmove = await cache.get('youMove-eu-grundeinkommen', () => chartGrouping('youMove-eu-grundeinkommen'))

    /**
    meinbge =======================================
    */

    response.meinbge = {}
    response.meinbge.grundeinkommen = await cache.get('meinbge-de-grundeinkommen', () => chartGrouping('meinbge-de-grundeinkommen'))
    response.meinbge.donors = await cache.get('meinbge-de-donors', () => chartGrouping('meinbge-de-donors'))

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



async function chartGrouping(key) {
  const allValues = await models.ValuesInt.findAll({
    where: {
      key: key
    },
    order: [['createdAt', 'ASC']]
  })

  const current = allValues.slice(-1)[0]

  const chartHourly = {
    labels: [],
    valuesRaw: []
  }
  const chartDaily = {
    labels: [],
    valuesRaw: []
  }

  // Grouped by Day Values
  const groupedByDay = _.groupBy(allValues, (el) => moment(el.createdAt).startOf('day').format())
  const maxByDay = _.map(groupedByDay, (el) => {
    return _.maxBy(el, 'value')
  })
  for (let el of maxByDay) {
    chartDaily.labels.push(moment(el.createdAt).tz('Europe/Berlin').startOf('day').format('YYYY-MM-DD'))
    chartDaily.valuesRaw.push(el.value)
  }

  // Grouped by Hour Values
  const groupedByHour = _.groupBy(allValues, (el) => moment(el.createdAt).startOf('hour').format())
  const maxByHour = _.map(groupedByHour, (el) => {
    return _.maxBy(el, 'value')
  })

  for (let el of maxByHour) {
    chartHourly.labels.push(moment(el.createdAt).tz('Europe/Berlin').startOf('hour').format('YYYY-MM-DD  HH:mm'))
    chartHourly.valuesRaw.push(el.value)
  }

  // Last 1 Hour Values
  const last1h = Math.abs(_.nth(maxByHour, -1).value - _.nth(maxByHour, -2).value)

  // Last 24 Hours Values
  time24hoursago = moment(_.last(maxByHour).createdAt).startOf('hour').subtract(24, 'hours')
  const val24hago = _.find(maxByHour, (el) => {
    return moment(el.createdAt).tz('Europe/Berlin').startOf('hour').isAfter(time24hoursago)
  })
  const last24h = Math.abs(val24hago.value - _.nth(maxByDay, -1).value)

  return {allValues, current, chartDaily, chartHourly, last1h, last24h}
}

