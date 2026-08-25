const Redis = require('ioredis');

const redis = new Redis({
  host: 'marmalade-ochreous-chance-99208.db.redis.io',
  port: 17146,
  username: 'default',
  password: process.env.REDIS_PASSWORD, 
});

redis.ping()
  .then((res) => {
    console.log('✅ Connected! Response:', res);
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Connection failed:', err.message);
    process.exit(1);
  });