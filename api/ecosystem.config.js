module.exports = {
  apps: [
    {
      name: 'stock-sense-api',
      script: 'src/index.js',
      cwd: __dirname,
      env: { NODE_ENV: 'development' },
      env_production: { NODE_ENV: 'production' },
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '500M',
      error_file: 'logs/err.log',
      out_file: 'logs/out.log',
      log_file: 'logs/combined.log',
      time: true,
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      restart_delay: 3000,
      max_restarts: 10,
      min_uptime: '10s',
    },
  ],
};
