const config = require('../../../config/config.js');
const { Client, Pool } = require('pg');
const copyFrom = require('pg-copy-streams').from
const fs = require('fs');
const path = require('path');

const csv = require('csv-parser');

const client = new Client({
  user: 'postgres',
  host: 'localhost',
  database: 'Reviews',
  password: config.TOKEN,
  port: 5432,
});

client.connect()
.then(()=> console.log('Connected!'))
.catch(err => console.log(err));

//Join csv path file
const jsonPath = path.join(__dirname, 'characteristic_reviews.csv');
const table_name = 'characteristics_review';
//Create your queries here
const create_table = `
DROP TABLE IF EXISTS ${table_name};
CREATE TABLE IF NOT EXISTS ${table_name} (
  ID SERIAL,
  CHARACTERISTIC_ID INT NOT NULL,
  REVIEW_ID INT NOT NULL,
  VALUE INT NOT NULL
);`;

//Table creation & deletion
client.query(create_table).then(res => console.log('Table successfully created!'));

//To do learn more options about the COPY function
const stream = client.query(copyFrom(`COPY ${table_name} FROM STDIN DELIMITER ',' CSV HEADER;`));

//Create file stream reading object
const fileStream = fs.createReadStream(jsonPath);

console.time('Execution Time'); // Time it

/* Trouble shooting where in file reading went wrong*/
fileStream.on('error', (error) =>{
  console.log(`Error in reading file: ${error}`)
});
stream.on('error', (error) => {
  console.log(`Error in copy command: ${error}`)
});

const alterTable = `
ALTER TABLE ${table_name}
DROP COLUMN ID,
ADD COLUMN ID SERIAL PRIMARY KEY;
DROP INDEX IF EXISTS charRev_idx;
CREATE INDEX IF NOT EXISTS charRev_idx ON ${table_name} (characteristic_id, value);
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

