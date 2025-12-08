#!/usr/bin/env node
// Health check script for Docker
const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/healthz',
  method: 'GET',
  timeout: 3000
};

const req = http.request(options, (res) => {
  res.on('data', () => {});
  res.on('end', () => {
    if (res.statusCode === 200) {
      process.exit(0);
    } else {
      console.error(`Health check failed with status: ${res.statusCode}`);
      process.exit(1);
    }
  });
});

req.on('error', (error) => {
  console.error(`Health check error: ${error.message}`);
  process.exit(1);
});

req.on('timeout', () => {
  console.error('Health check timeout');
  req.destroy();
  process.exit(1);
});

req.end();




