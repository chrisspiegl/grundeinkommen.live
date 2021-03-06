module.exports = {
  /**
   * Application configuration section
   * http://pm2.keymetrics.io/docs/usage/application-declaration/
   */
  apps: [
    {
      name: "ubi-web",
      append_env_to_name: true,
      script: "./server/index.js",
      watch: false,
      exec_mode: "cluster",
      // instances: (process.env.NODE_ENV == "production" || process.env.NODE_ENV == "development") ? "max" : 1,
      instances: 1,
      log_date_format: "YYYY-MM-DD HH:mm Z",
      env: {
        NODE_ENV: "local",
        NODE_PATH: '.',
        DEBUG: "siubi:*",
      },
      env_production : {
        NODE_ENV: "production",
        NODE_PATH: '.',
        DEBUG: "siubi:*",
      },
      env_development: {
        NODE_ENV: "development",
        NODE_PATH: '.',
        DEBUG: "siubi:*",
      },
    },
    {
      name: "ubi-crawler",
      append_env_to_name: true,
      script: "./crawler/index.js",
      watch: false,
      exec_mode: "fork",
      autorestart: false,
      // instances: (process.env.NODE_ENV == "production" || process.env.NODE_ENV == "development") ? "max" : 1,
      instances: 1,
      log_date_format: "YYYY-MM-DD HH:mm Z",
      env: {
        NODE_ENV: "local",
        NODE_PATH: '.',
        DEBUG: "siubi:*",
      },
      env_production : {
        NODE_ENV: "production",
        NODE_PATH: '.',
        DEBUG: "siubi:*",
      },
      env_development: {
        NODE_ENV: "development",
        NODE_PATH: '.',
        DEBUG: "siubi:*",
      },
    },
  ],

  /**
   * Deployment section
   * http://pm2.keymetrics.io/docs/usage/deployment/
   */
  deploy : {
    production : {
      user: "deploy",
      host: "swMain",
      ref: "origin/master",
      repo: "git@github.com:chrisspiegl/grundeinkommen.live.git",
      path: "/home/deploy/grundeinkommen.live-production",
      "post-deploy": "NODE_ENV=production pm2 reload ecosystem.config.js --only ubi-web --env production",
      env: {},
    },
    // dev : {
    //   user: "node",
    //   host: "doSpieglCO-node",
    //   // ref: "origin/development",
    //   ref: "origin/master",
    //   repo: "git@github.com:chrisspiegl/NetworkPersonalConnections.git",
    //   path: "/home/node/network.chrisspiegl.com/development",
    //   "post-deploy": "npm run nsinstall && npm run nsupdate && NODE_ENV=development pm2 reload ecosystem.config.js --env development --source-map-support",
    //   env: {}
    // }
  }
}
