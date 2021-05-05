const config = require('../../../config/config.js');
const { Client, Pool } = require('pg');
const copyFrom = require('pg-copy-streams').from
const fs = require('fs');
const path = require('path');

const csv = require('csv-parser');

const pool = new Client({
  user: 'postgres',
  host: 'localhost',
  database: 'Reviews',
  password: config.TOKEN,
  port: 5432,
});

pool.connect(()=> console.log('Connected!'));

//Join csv path file
const jsonPath = path.join(__dirname, 'reviews_photos.csv');
const table_name = 'reviews_photos'
//Create your queries here
const create_table = `
DROP TABLE ${table_name};
CREATE TABLE IF NOT EXISTS ${table_name} (
  ID INT,
  REVIEWS_ID INT,
  URL TEXT
);`;

//Table creation & deletion
pool.query(create_table).then(res => console.log('Table successfully created!'));

//To do learn more options about the COPY function
const stream = pool.query(copyFrom(`COPY ${table_name} FROM STDIN DELIMITER ',' CSV HEADER;`));

//Create file stream reading object
const fileStream = fs.createReadStream(jsonPath);

console.time('Execution Time'); // Time it

/* Trouble shooting where in file reading went wrong*/
fileStream.on('error', (error) =>{
  console.log(`Error in reading file: ${error}`)
})
stream.on('error', (error) => {
  console.log(`Error in copy command: ${error}`)
})
stream.on('finish', () => {
    console.log(`Completed loading data into ${table_name} `)
    pool.end();
})
/* ************************************ */

fileStream.on('open', () => fileStream.pipe(stream));
fileStream.on('end', () => {
  console.log('Stream ended');
  console.timeEnd('Execution Time');
});

