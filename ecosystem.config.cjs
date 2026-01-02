module.exports = {
  apps: [{
    name: 'facilita-adv',
    script: './node_modules/.bin/tsx',
    args: 'server/index.ts',
    cwd: '/var/www/facilitaadv',
    interpreter: 'none',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    env_file: './.env',  // Força carregar .env
    instances: 1,
    exec_mode: 'fork',
    autorestart: true,
    watch: false,
    max_memory_restart: '1G'
  }]
};
