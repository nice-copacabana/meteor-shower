module.exports = {
  apps: [
    {
      name: 'meteor-shower-cloud-hub',
      script: 'packages/cloud-hub/dist/index.js',
      cwd: './',
      instances: 1,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      log_file: 'logs/cloud-hub.log',
      error_file: 'logs/cloud-hub-error.log',
      out_file: 'logs/cloud-hub-out.log',
      time: true
    },
    {
      name: 'meteor-shower-ui',
      script: 'packages/ui/dist/server.js',
      cwd: './',
      instances: 1,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        UI_PORT: 3001
      },
      log_file: 'logs/ui.log',
      error_file: 'logs/ui-error.log',
      out_file: 'logs/ui-out.log',
      time: true
    },
    {
      name: 'meteor-shower-rag',
      script: 'examples/rag-server/dist/index.js',
      cwd: './',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3002
      },
      log_file: 'logs/rag.log',
      error_file: 'logs/rag-error.log',
      out_file: 'logs/rag-out.log',
      time: true
    }
  ]
};
