process.env.NODE_ENV = process.env.NODE_ENV || 'development'
const path = require('path')
const config = require(path.join(__dirname, '../config'))

const debug = require('debug')
const log = debug(`${config.slug}:crawler:meinBge`)
log.log = console.log.bind(console)
const error = debug(`${config.slug}:crawler:meinBge:error`)

const axios = require('axios')
const cheerio = require('cheerio')
const moment = require('moment-timezone')
const pLimit = require('p-limit')

moment.tz.setDefault('UTC')

const models = require('../database/models')
const pnotice = require('pushnotice')(`${config.slug}:crawler:meinBge`, { env: config.env, chat: config.pushnotice.chat, debug: true, disabled: config.pushnotice.disabled })

const urls = [
  {
    key: 'meinbge-de',
    url: 'https://www.mein-grundeinkommen.de/'
  }
]

const configParallelAccessPages = 1

const fetchModel = async (key, url) => {
  log('Loading data for meinBge')
  const crawlResult = await axios.get(url)
  const $ = cheerio.load(crawlResult.data)

  const dateNow = moment().startOf('day')
  const timeNow = moment().format('HH:mm:ss')

  const $selection = $('.container-fluid.fullbleed-sm.background-color--background .col-md-6 .h0')
  if (!$selection) {
    pnotice(`${key} — could not find web site element with values for stats`)
    log(`Crawler ended early for ${key}`)
    return;
  }
  let numberDonors
  let numberGrundeinkommen

  await $selection.map(async function (i, el) {
    const number = parseInt($(el).html().replace('.', ''))
    switch (i) {
      case 0:
        log(`Logging ${number} for meinbge-de-donors`)
        numberDonors = number
        break
      case 1:
        log(`Logging ${number} for meinbge-de-grundeinkommen`)
        numberGrundeinkommen = number
        break
    }
  })

  if (numberDonors) {
    await models.ValuesInt.create({
      key: 'meinbge-de-donors',
      date: dateNow,
      time: timeNow,
      value: numberDonors
    })
  } else {
    log(`No valid value for donors for ${key}`)
    pnotice(`${key} — Crawler could not find value for numberDonors`)
  }
  if (numberGrundeinkommen) {
    await models.ValuesInt.create({
      key: 'meinbge-de-grundeinkommen',
      date: dateNow,
      time: timeNow,
      value: numberGrundeinkommen
    })

    log(`Crawled and put it in Database ${key}`)
  } else {
    log(`No valid value for grundeinkommen count for ${key}`)
    pnotice(`${key} — Crawler could not find value for numberGrundeinkommen`)
  }
}

const start = async () => {
  log(`Running meinBge Crawler in ${process.env.NODE_ENV} environment`)

  const pLimiter = pLimit(configParallelAccessPages)

  const promises = urls.map((url) => {
    return pLimiter(async () => fetchModel(url.key, url.url))
  })

  await Promise.all(promises)

  // TODO: DO not understand why this is firing before the actual create / already have logs appear
  log('Finished running meinBge crawler')
}

module.exports = {
  start
}
