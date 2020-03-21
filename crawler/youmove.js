process.env.NODE_ENV = process.env.NODE_ENV || 'development'
const path = require('path')
const config = require(path.join(__dirname, '../config'))

const debug = require('debug')
const log = debug(`${config.slug}:crawler:youmove`)
log.log = console.log.bind(console)
const error = debug(`${config.slug}:crawler:youmove:error`)

const axios = require('axios')
const cheerio = require('cheerio')
const moment = require('moment-timezone')
const pLimit = require('p-limit')

moment.tz.setDefault('UTC')

const models = require('../database/models')

const urls = [
  {
    key: 'youmove-eu-grundeinkommen',
    url: 'https://you.wemove.eu/campaigns/notfall-grundeinkommen'
  }
]

const configParallelAccessPages = 1

const fetchModel = async (key, url) => {
  log(`Loading data for youmove - ${url}`)
  const crawlResult = await axios.get(url)
  const $ = cheerio.load(crawlResult.data)

  const dateNow = moment().startOf('day')
  const timeNow = moment().format('HH:mm:ss')

  const $selection = $('.signature-counter')

  const numberSignatures = parseInt($selection.html().replace('.', ''))
  log(`Logging ${numberSignatures} for youmove-eu-grundeinkommen`)
  await models.ValuesInt.create({
    key: 'youmove-eu-grundeinkommen',
    date: dateNow,
    time: timeNow,
    value: numberSignatures
  })

  log(`Crawled and put it in Database ${key}`)
}

const start = async () => {
  log(`Running youmove Crawler in ${process.env.NODE_ENV} environment`)

  const pLimiter = pLimit(configParallelAccessPages)

  const promises = urls.map((url) => {
    return pLimiter(async () => fetchModel(url.key, url.url))
  })

  await Promise.all(promises)

  // TODO: DO not understand why this is firing before the actual create / already have logs appear
  log('Finished running youmove crawler')
}

module.exports = {
  start
}
