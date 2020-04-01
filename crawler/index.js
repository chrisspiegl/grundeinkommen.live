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
  require('./bundestag'),
  require('./changeOrg'),
  require('./meinbge'),
  require('./youmove'),
]

const pnotice = require('pushnotice')(`${config.slug}:crawler:meinBge`, { env: config.env, chat: config.pushnotice.chat, debug: true, disabled: config.pushnotice.disabled })
const models = require('../database/models')

const configParallelAccessPages = 1

const run = async () => {
  log('Running Crawler')

  const pLimiter = pLimit(configParallelAccessPages)

  const promises = crawlers.map((crawler) => {
    return pLimiter(async () => crawler.start())
  })

  await Promise.all(promises)

  log('Finished Crawling All')
}

const start = async () => {
  log('Starting Crawler')
  await models.init()
  const CronJob = require('cron').CronJob;
  const job = new CronJob('0 */5 * * * *', run, null, true, 'Europe/Berlin', this, true);
  job.start();
}
start()


// Graceful shutdown
process.on('SIGINT', async () => {
  const cleanUp = async () => {
    // Clean up other resources like DB connections
    log('closing database connection')
    await models.sequelize.close()
  }

  // Force close server after 5secs
  setTimeout(async (e) => {
    log('Forcing server close !!!', e)

    await cleanUp()
    process.exit(1)
  }, 10000) // 10 seconds

  log('Closing crawler...')

  await cleanUp()
  process.exit()
})

process.on('unhandledRejection', async (reason, promise) => {
  error('unhandledRejection', reason.stack || reason, promise)
  pnotice(`unhandledRejection:\n${JSON.stringify(reason)}`, 'ERROR')
})
