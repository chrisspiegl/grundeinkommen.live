process.env.NODE_ENV = process.env.NODE_ENV || 'development'
const path = require('path')
const config = require(path.join(__dirname, '../config'))

const debug = require('debug')
const log = debug(`${config.slug}:crawler:bundestag`)
log.log = console.log.bind(console)
const error = debug(`${config.slug}:crawler:bundestag:error`)

const axios = require('axios')
const axiosCookieJarSupport = require('axios-cookiejar-support').default;
const cheerio = require('cheerio')
const moment = require('moment-timezone')
const pLimit = require('p-limit')
const tough = require('tough-cookie');

axiosCookieJarSupport(axios)
moment.tz.setDefault('UTC')

const models = require('../database/models')

const urls = [
  {
    key: 'bundestag-108191',
    url: 'https://epetitionen.bundestag.de/petitionen/_2020/_03/_14/Petition_108191.nc.html'
  }
]

const configParallelAccessPages = 1

const fetchModel = async (key, url) => {
  log('Loading data for bundestag')
  const cookieJar = new tough.CookieJar();
  const crawlResult = await axios.get(url, {
    jar: cookieJar, // tough.CookieJar or boolean
    withCredentials: true, // If true, send cookie stored in jar
  })
  const $ = cheerio.load(crawlResult.data)

  const dateNow = moment().startOf('day')
  const timeNow = moment().format('HH:mm:ss')

  const $selection = $('.mzanzahl')
  let numberGrundeinkommen = parseInt($selection.html().trim())

  log(`Logging ${numberGrundeinkommen} for bundestag-108191`)

  await models.ValuesInt.create({
    key: 'bundestag-108191',
    date: dateNow,
    time: timeNow,
    value: numberGrundeinkommen
  })

  log(`Crawled and put it in Database ${key}`)
}

const start = async () => {
  log(`Running bundestag Crawler in ${process.env.NODE_ENV} environment`)

  const pLimiter = pLimit(configParallelAccessPages)

  const promises = urls.map((url) => {
    return pLimiter(async () => fetchModel(url.key, url.url))
  })

  await Promise.all(promises)

  // TODO: DO not understand why this is firing before the actual create / already have logs appear
  log('Finished running bundestag crawler')
}

module.exports = {
  start
}
