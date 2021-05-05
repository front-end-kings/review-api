const config = require('../../../config/config.js');
const { Client, Pool } = require('pg');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const readFile = require('../readFile');
const pgp = require('pg-promise')({
  /* initialization options */
  capSQL: true // capitalize all generated SQL
});

//Truncated but keep for reference

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'Reviews',
  password: config.TOKEN,
  port: 5432,
});
pool.connect(()=> console.log('Connected!'));

const jsonPath = path.join(__dirname, 'reviews_photos.csv');
const truncate = `TRUNCATE reviews_photos`
const insertQuery = `INSERT INTO reviews_photos (id, review_id, url) VALUES ($1, $2, $3)`;
const copy = `COPY reviews_photos FROM ${jsonPath}`;

// const db = pgp({
//   user: 'postgres',
//   host: 'localhost',
//   database: 'Reviews',
//   password: config.TOKEN,
//   port: 5432,
// });
// const cs = new pgp.helpers.ColumnSet(['id', 'review_id', 'url'], {table: 'reviews_photos'});

(async () => {
  const start = Date.now();
  const data = await readFile(jsonPath);
  let formattedData = data.map(row => [row.id, row.review_id, row.url]);
  // const pgQuery = pgp.helpers.insert(data, cs);
  // await db.none(pgQuery);
  console.log('Formatted data', formattedData.length);
  pool.query(truncate)
  .then(res => console.log('Table successfully truncated!'))
  .then(() => {
    console.log('Inserting data...');
      // pool.query(copy)
      // .catch(e => {console.error(e.stack);})
    for (const row of formattedData.slice(0, 250000)) {
      // console.log('Did it work?');
      pool.query(insertQuery, row)
      .catch(e => {console.error(e.stack);});
    }
    console.log('Query execution time:', Date.now() - start, 'ms');
  }
  )
  .then(() => {
    console.log('Query execution finished');
  });
})();