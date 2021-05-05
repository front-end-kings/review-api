const config = require('../../../config/config.js');
const { Client, Pool } = require('pg');
// const review_photos = require('./reviews_photo');
const copyFrom = require('pg-copy-streams').from

const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'Reviews',
  password: config.TOKEN,
  port: 5432,
});

// pool.connect(()=> console.log('Connected!'));

const jsonPath = path.join(__dirname, 'reviews_photos.csv');

pool.connect(function (err, client, done) {
  var stream = client.query(copyFrom('COPY reviews_photos FROM STDIN CSV'));
  var fileStream = fs.createReadStream(jsonPath);
  fileStream.on('error', done);
  stream.on('error', done);
  stream.on('finish', done);
  fileStream.pipe(stream);
});

