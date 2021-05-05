const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');

readFile = async (Filepath) => {
  console.time('Execution Time');
  console.log('Reading in file...');

  return new Promise((resolve,reject) => {
    const output = [];
    fs.createReadStream(Filepath)
    .pipe(csv())
    .on('data', (data) => output.push(data))
    .on('end', () => {
      console.log('Finished!');
      console.log('File records read', output.length);
      console.timeEnd('Execution Time');
      resolve(output);
    })
    .on('error', reject);
  });
}

module.exports = readFile;