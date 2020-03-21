process.env.NODE_ENV = process.env.NODE_ENV || 'development'
const path = require('path')
const config = require(path.join(__dirname, '../config'))

const debug = require('debug')
const log = debug(`${config.slug}:crawler:changeOrg`)
log.log = console.log.bind(console)
const error = debug(`${config.slug}:crawler:changeOrg:error`)

const cheerio = require('cheerio')
const moment = require('moment-timezone')
const pLimit = require('p-limit')
const puppeteer = require('puppeteer')

moment.tz.setDefault('UTC')

const models = require('../database/models')

const urls = [
  {
    key: 'change-org-bge-de',
    url: 'https://www.change.org/p/finanzminister-olaf-scholz-und-wirtschaftsminister-peter-altmaier-mit-dem-bedingungslosen-grundeinkommen-durch-die-coronakrise-coronavirusde-olafscholz-peteraltmaier'
  }
]

const configParallelAccessPages = 1
const configPuppeteerHeadless = true

const startBrowser = async () => {
  return puppeteer.launch({
    headless: configPuppeteerHeadless // set to false to see the browser actions live
  })
}

const fetchModel = async (browser, key, url) => {
  log(`Loading data for change-org-grundeinkommen ${key}`)
  const page = await browser.newPage().catch((e) => {
    log(e)
  })
  await page.goto(url, {
    waitUntil: 'load' // can also be set to `networkidle0` or `networkidle2` or `domcontentloaded`
  })
  const changeTargetingData = await page.evaluate(() => window.changeTargetingData)
  page.close()

  const petitionData = changeTargetingData.petition
  const signatureTotal = petitionData.signatureCount.total
  const signatureGoal = petitionData.signatureCount.goal

  log(`Logging ${signatureTotal} for change-org-grundeinkommen`)

  const dateNow = moment().startOf('day')
  const timeNow = moment().format('HH:mm:ss')

  const dbObject = {
    key: key,
    date: dateNow,
    time: timeNow,
    value: signatureTotal
  }
  await models.ValuesInt.create(dbObject)
  log(`Crawled and put it in Database ${key}`)
}

const start = async () => {
  log(`Running change-org-grundeinkommen Crawler in ${process.env.NODE_ENV} environment`)

  log('Starting headless browser for change-org-grundeinkommen')
  const browser = await startBrowser()

  const pLimiter = pLimit(configParallelAccessPages)

  const promises = urls.map((url) => {
    return pLimiter(async () => fetchModel(browser, url.key, url.url))
  })

  await Promise.all(promises)

  // TODO: DO not understand why this is firing before the actual create / already have logs appear
  log('Finished running change-org-grundeinkommen crawler')

  log('Closing headless browser for change-org-grundeinkommen')
  await browser.close()
}

module.exports = {
  start
}
