process.env.NODE_ENV = process.env.NODE_ENV || 'development'
const path = require('path')
const config = require(path.join(__dirname, '../config'))

const debug = require('debug')
const log = debug(`${config.slug}:crawler`)
log.log = console.log.bind(console)
const error = debug(`${config.slug}:crawler:error`)

const moment = require('moment-timezone')
moment.tz.setDefault('UTC')

const crawlers = [
  require('./meinbge'),
  require('./changeOrg')
]

const models = require('../database/models')

const start = async () => {
  log('Starting Crawler')
  await models.init()

  for (crawler of crawlers) {
    await crawler.start()
  }

  log('Finished Crawling All')
  process.exit()
}

start()
