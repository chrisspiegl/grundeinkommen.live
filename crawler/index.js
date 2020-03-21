process.env.NODE_ENV = process.env.NODE_ENV || 'development'
const path = require('path')
const config = require(path.join(__dirname, '../config'))

const debug = require('debug')
const log = debug(`${config.slug}:crawler`)
log.log = console.log.bind(console)
const error = debug(`${config.slug}:crawler:error`)

const pLimit = require('p-limit')
const moment = require('moment-timezone')
moment.tz.setDefault('UTC')

const crawlers = [
  require('./changeOrg'),
  require('./meinbge'),
  require('./youmove'),
]

const models = require('../database/models')

const configParallelAccessPages = 1

const start = async () => {
  log('Starting Crawler')
  await models.init()

  const pLimiter = pLimit(configParallelAccessPages)

  const promises = crawlers.map((crawler) => {
    return pLimiter(async () => crawler.start())
  })

  await Promise.all(promises)

  log('Finished Crawling All')
  process.exit()
}


const CronJob = require('cron').CronJob;
const job = new CronJob('0 */5 * * * *', function() {
  log('Running Crawler by Cron')
  start()
}, null, true, 'Europe/Berlin', this, true);
job.start();
