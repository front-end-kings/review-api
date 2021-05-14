const config = require('../../../config/config.js');
const { Pool } = require('pg');

// Local host version
// const pool = new Pool({
//   user: 'postgres',
//   host: 'localhost',
//   database: 'Reviews',
//   password: config.TOKEN,
//   port: 5432,
// });

// AWS server version
const pool = new Pool({
  user: config.AWSUSER,
  host: config.AWS,
  database: 'Reviews',
  password: config.AWSPW,
  port: 5432,
});

// // AWS postgres version
// const pool = new Pool({
//   user: config.AWSUSER,
//   host: 'localhost',
//   database: 'Reviews',
//   password: config.AWSPW,
//   port: 5432,
// });

pool.connect((err, res) => {
  if (err) {
    throw err;
  } else {
    console.log('Connected to database');
  }
});
module.exports = pool;