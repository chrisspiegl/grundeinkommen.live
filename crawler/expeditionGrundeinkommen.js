process.env.NODE_ENV = process.env.NODE_ENV || 'development'
const config = require('config')

const debug = require('debug')
const log = debug(`${config.slug}:crawler:expeditionGrundeinkommen`)
log.log = console.log.bind(console)
const error = debug(`${config.slug}:crawler:expeditionGrundeinkommen:error`)

const axios = require('axios')
const cheerio = require('cheerio')
const moment = require('moment-timezone')
const pLimit = require('p-limit')

moment.tz.setDefault('UTC')

const models = require('database/models')
const pnotice = require('pushnotice')(`${config.slug}:crawler:expeditionGrundeinkommen`, {
  env: config.env,
  chat: config.pushnotice.chat,
  debug: true,
  disabled: config.pushnotice.disabled
})

const urls = [{
  key: 'expeditionGrundeinkommen',
  url: 'https://ag5gu1z06h.execute-api.eu-central-1.amazonaws.com/prod/analytics/signatures'
}]

const configParallelAccessPages = 1

const fetchModel = async (key, url) => {
  log('Loading data for expeditionGrundeinkommen')
  try {
    const crawlResult = await axios.get(url)
    const crawlData = crawlResult.data

    const dateNow = moment().startOf('day')
    const timeNow = moment().format('HH:mm:ss')

    for (const state in crawlData) {
      log(`found ${key}-${state} with ${crawlData[state].withContentful} signatures`);
      await models.ValuesInt.create({
        key: `${key}-${state}`,
        date: dateNow,
        time: timeNow,
        value: crawlData[state].withContentful
      })
    }


  } catch (err) {
    error(`${key} — fetchModel — Unrecognized Error`, err)
    pnotice(`${key} — fetchModel — Unrecognized Error\n${JSON.stringify(err)}`, 'ERROR')
  }
}

const start = async () => {
  log(`Running expeditionGrundeinkommen Crawler in ${process.env.NODE_ENV} environment`)

  const pLimiter = pLimit(configParallelAccessPages)

  const promises = urls.map((url) => {
    return pLimiter(async () => fetchModel(url.key, url.url))
  })

  await Promise.all(promises)

  // TODO: DO not understand why this is firing before the actual create / already have logs appear
  log('Finished running expeditionGrundeinkommen crawler')
}

module.exports = {
  start
}
