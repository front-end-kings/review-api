const config = require('../../../config/config.js');
const { Client, Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'Reviews',
  password: config.TOKEN,
  port: 5432,
});

/*
Things to incorporate limit size (count) default to 5
Sorting
Product_ID
Sort
*/
const getReviews = (req, res) => {
  const product_id = parseInt(req.query.product_id);
  // const limit = req.query.count === undefined ? 5 : parseInt(req.query.count);
  const limit = req.query.count || 5;
  const page = req.query.page || 1;
  const offset = limit * page - limit;
  const sort = req.query.sort || 'relevant';
  const createRevIndex = 'CREATE INDEX IF NOT EXISTS review_idx ON reviews (review_id);';
  const createPhotoIndex = 'CREATE INDEX IF NOT EXISTS photo_idx ON reviews_photos (id, reviews_id);'
  const dropRevIndex = 'DROP INDEX review_idx;';
  const dropPhotoIndex = 'DROP INDEX photo_idx';
  let query ='';
  switch(sort) {
    case 'newest':
      query = `
        select rev.review_id, rev.rating, rev.date, rev.summary,\
        rev.body, rev.recommend, rev.reported, rev.reviewer_name,\
        rev.reviewer_email,\
        CASE\
          WHEN rev.response = 'null' then ''\
          ELSE rev.response\
        END response,\
        rev.helpfulness,\
        photos.photos\
        FROM reviews as rev\
        left join (\
          SELECT reviews_id, array_remove(array_agg(url::TEXT), NULL) as photos\
          from reviews_photos GROUP BY reviews_id ) as photos\
        on rev.review_id = photos.reviews_id\
        where rev.product_id = ${product_id}\
        ORDER BY rev.date DESC
        LIMIT ${limit}
        OFFSET ${offset};
      `;
      break;
    case 'helpful':
      query = `
        select rev.review_id, rev.rating, rev.date, rev.summary,\
        rev.body, rev.recommend, rev.reported, rev.reviewer_name,\
        rev.reviewer_email,\
        CASE\
          WHEN rev.response = 'null' then ''\
          ELSE rev.response\
        END response,\
        rev.helpfulness,\
        photos.photos\
        FROM reviews as rev\
        left join (\
          SELECT reviews_id, array_remove(array_agg(url::TEXT), NULL) as photos\
          from reviews_photos GROUP BY reviews_id ) as photos\
        on rev.review_id = photos.reviews_id\
        where rev.product_id = ${product_id}\
        ORDER BY rev.helpfulness DESC
        LIMIT ${limit}
        OFFSET ${offset};
      `;
      break;
    default:
      query = `
        select rev.review_id, rev.rating, rev.date, rev.summary,\
        rev.body, rev.recommend, rev.reported, rev.reviewer_name,\
        rev.reviewer_email,\
        CASE\
          WHEN rev.response = 'null' then ''\
          ELSE rev.response\
        END response,\
        rev.helpfulness,\
        photos.photos\
        FROM reviews as rev\
        left join (\
          SELECT reviews_id, array_remove(array_agg(url::TEXT), NULL) as photos\
          from reviews_photos GROUP BY reviews_id ) as photos\
        on rev.review_id = photos.reviews_id\
        where rev.product_id = ${product_id}
        LIMIT ${limit}
        OFFSET ${offset};
      `;
  }
  pool.query(createRevIndex)
  .then(() => pool.query(createPhotoIndex))
  .then(() =>
    pool.query(query, (err, results) => {
    if (err) {
      console.log(err);
    }
    res.status(200).json({page: page, product: product_id, count: limit, results: results.rows});
  }))
  //.then(() => pool.query(dropRevIndex))
  //.then(() => pool.query(dropPhotoIndex))
  .catch(e => console.error(e));
}

const getMeta = (req, res) => {
  const product_id = parseInt(req.query.product_id);
  const query = `SELECT * FROM reviews LIMIT 5;`
  pool.query(query, (err, results) => {
    if (err) {
      console.log(err);
    }
    res.status(200).json(results.rows)
  })
}

const addReview = (req, res) => {
  const query = `SELECT * FROM reviews LIMIT 5;`
  pool.query(query, (err, results) => {
    if (err) {
      console.log(err);
    }
    res.status(200).json(results.rows)
  })
}

const upHelpful = (req, res) => {
  const query = `SELECT * FROM reviews LIMIT 5;`
  pool.query(query, (err, results) => {
    if (err) {
      console.log(err);
    }
    res.status(200).json(results.rows)
  })
}

module.exports = {
  getReviews,
  getMeta,
  addReview,
  upHelpful,
}