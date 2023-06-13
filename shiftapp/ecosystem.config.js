module.exports = {
  apps: [
    {
      name: 'shiftapp',
      script: 'shiftapp01.sh',
      watch: ['app.js', 'routes', 'views', 'public', 'js', 'db'],
      ignore_watch: ['node_modules'],
      '--log-date-format': 'YYYY-MM-DD HH:mm Z',
      error_file: './.pm2/logs/shift_webapp-error.log',
      log_file: './.pm2/logs/shift_webapp-log.log',
      out_file: './.pm2/logs/shift_webapp-out.log',
    },
  ],
}
