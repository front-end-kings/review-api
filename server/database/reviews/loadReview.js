const config = require('../../../config/config.js');
const { Client, Pool } = require('pg');
const copyFrom = require('pg-copy-streams').from
const fs = require('fs');
const path = require('path');

const csv = require('csv-parser');

// const client = new Client({
//   user: 'postgres',
//   host: 'localhost',
//   database: 'Reviews',
//   password: config.TOKEN,
//   port: 5432,
// });
const client = new Client({
  user: config.AWSUSER,
  host: config.AWS,
  database: 'Reviews',
  password: config.AWSPW,
  port: 5432,
});

client.connect()
.then(()=> console.log('Connected!'))
.catch(err => console.log(err));

//Join csv path file
const jsonPath = path.join(__dirname, 'reviews.csv');
const table_name = 'reviews';
// Create your queries here
const create_table = `
DROP TABLE IF EXISTS ${table_name};
CREATE TABLE IF NOT EXISTS ${table_name} (
  ID BIGSERIAL,
  PRODUCT_ID INT NOT NULL,
  RATING INT NOT NULL,
  DATE DATE NOT NULL,
  SUMMARY TEXT,
  BODY TEXT NOT NULL,
  RECOMMEND BOOLEAN,
  REPORTED BOOLEAN,
  REVIEWER_NAME TEXT NOT NULL,
  REVIEWER_EMAIL TEXT NOT NULL,
  RESPONSE TEXT,
  HELPFULNESS INT
);
`;

//Table creation & deletion
client.query(create_table).then(res => console.log('Table successfully created!'));

//To do learn more options about the COPY function
const stream = client.query(copyFrom(`COPY ${table_name} (
  ID,
  PRODUCT_ID,
  RATING,
  DATE,
  SUMMARY,
  BODY,
  RECOMMEND,
  REPORTED,
  REVIEWER_NAME,
  REVIEWER_EMAIL,
  RESPONSE,
  HELPFULNESS
  ) FROM STDIN DELIMITER ',' CSV HEADER;`));

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

const alterTable = `
ALTER TABLE ${table_name}
DROP COLUMN ID,
ADD COLUMN REVIEW_ID SERIAL PRIMARY KEY;
DROP INDEX IF EXISTS rev_idx;
CREATE INDEX IF NOT EXISTS rev_idx ON ${table_name} (review_id, product_id, helpfulness, date, response, reported);
`;

stream.on('finish', () => {
    console.log(`Completed loading data into ${table_name} `)
    console.log('Starting alter table and creating index...');
    console.time('Alter execution time');
    client.query(alterTable).then(() => {
      console.log('Altered successfully!');
      console.timeEnd('Alter execution time');
      client.end();
    })
    .catch(e => console.error(e));
});
/* ************************************ */

fileStream.on('open', () => fileStream.pipe(stream));
fileStream.on('end', () => {
  console.log('Stream ended');
  console.timeEnd('Execution Time');
});