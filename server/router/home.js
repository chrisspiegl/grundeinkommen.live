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
    let hourLast = moment().add(1, 'hour').startOf('hour')
    for (let change of response.changeOrgDe) {
      const hourCurrent = moment(change.createdAt).startOf('hour')
      if (hourLast.isSame(hourCurrent)) {
        continue
      }
      hourLast = hourCurrent
      chartChangeOrg.labels.push(hourLast.tz('Europe/Berlin').format('YYYY-MM-DD HH:mm'))
      chartChangeOrg.values.push(numeral(change.value).format('0.0'))
      chartChangeOrg.valuesRaw.push(change.value)
    }

    response.chartChangeOrg = chartChangeOrg

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
