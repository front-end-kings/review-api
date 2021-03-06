const config = require('../../../config/config.js');
const { Client, Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const pool = require('./index');

const getReviews = (req, res) => {
  const product_id = parseInt(req.query.product_id);
  const limit = req.query.count || 5;
  const page = req.query.page || 1;
  const offset = limit * page - limit;
  const sort = req.query.sort || 'relevant';
  let query ='';
  switch(sort) {
    case 'newest':
      query = `
        SELECT rev.review_id, rev.rating, rev.date, rev.summary,
        rev.body, rev.recommend, rev.reported, rev.reviewer_name,
        rev.reviewer_email,
        CASE
          WHEN rev.response = 'null' then ''
          ELSE rev.response
        END response,
        rev.helpfulness,
        CASE
	        WHEN photos.photos IS NULL then ARRAY[]::text[]
	        ELSE photos.photos
        END
        FROM reviews as rev
        LEFT JOIN (
          SELECT reviews_id, array_remove(array_agg(url::TEXT), NULL) as photos
          FROM reviews_photos GROUP BY reviews_id ) as photos
        on rev.review_id = photos.reviews_id
        where rev.product_id = ${product_id} and rev.reported = false
        ORDER BY rev.date DESC
        LIMIT ${limit}
        OFFSET ${offset};
      `;
      break;
    case 'helpful':
      query = `
        SELECT rev.review_id, rev.rating, rev.date, rev.summary,
        rev.body, rev.recommend, rev.reported, rev.reviewer_name,
        rev.reviewer_email,
        CASE
          WHEN rev.response = 'null' then ''
          ELSE rev.response
        END response,
        rev.helpfulness,
        CASE
	        WHEN photos.photos IS NULL then ARRAY[]::text[]
	        ELSE photos.photos
        END
        FROM reviews as rev
        LEFT JOIN (
          SELECT reviews_id, array_remove(array_agg(url::TEXT), NULL) as photos
          from reviews_photos GROUP BY reviews_id ) as photos
        on rev.review_id = photos.reviews_id
        where rev.product_id = ${product_id} and rev.reported = false
        -- ORDER BY rev.helpfulness DESC
        LIMIT ${limit}
        OFFSET ${offset};
      `;
      break;
    default:
      query = `
        SELECT rev.review_id, rev.rating, rev.date, rev.summary,
        rev.body, rev.recommend, rev.reported, rev.reviewer_name,
        rev.reviewer_email,
        CASE
          WHEN rev.response = 'null' then ''
          ELSE rev.response
        END response,
        rev.helpfulness,
        CASE
	        WHEN photos.photos IS NULL then ARRAY[]::text[]
	        ELSE photos.photos
        END
        FROM reviews as rev
        LEFT JOIN (
          SELECT reviews_id, array_remove(array_agg(url::TEXT), NULL) as photos
          from reviews_photos GROUP BY reviews_id ) as photos
        on rev.review_id = photos.reviews_id
        where rev.product_id = ${product_id} and rev.reported = false
        LIMIT ${limit}
        OFFSET ${offset};
      `;
  }
  pool.query(query, (err, results) => {
  if (err) {
    console.log(err);
  }
  res.status(200).json({page: page, product: product_id, count: limit, results: results.rows});
  // pool.end();
  });
};

const getMeta = async (req, res) => {
  const product_id = parseInt(req.query.product_id);
  const ratings = `
    SELECT
    count (rating) filter (where rating = 1) as "1",
    count (rating) filter (where rating = 2) as "2",
    count (rating) filter (where rating = 3) as "3",
    count (rating) filter (where rating = 4) as "4",
    count (rating) filter (where rating = 5) as "5"
    from reviews
    where product_id = ${product_id}
    ;
  `;
  const recommend = `
    SELECT
    count (recommend) filter (where recommend = false) as "0",
    count (recommend) filter (where recommend = true) as "1"
    from reviews
    where product_id = ${product_id}
    ;
  `;
  const charQuery = `
    SELECT char.name, row_to_json(char_review) as "characteristics"
    from characteristics as char
    INNER JOIN (
      SELECT characteristic_id as id, AVG(VALUE) as VALUE from characteristics_review
      GROUP BY characteristics_review.characteristic_id
    ) as char_review
    on char.id = char_review.id
    where char.product_id = ${product_id}
    ORDER BY char_review.id
    ;
  `;
  const ratingObj = await pool.query(ratings);
  const recommendObj = await pool.query(recommend);
  const charObj = await pool.query(charQuery);
  let traitObj= {};
  charObj.rows.map(trait => {
    traitObj[trait.name] = trait.characteristics;
  });
  res.status(200).json({rating: ratingObj.rows[0], recommend: recommendObj.rows[0], characteristics: traitObj});
};

const addReview = async (req, res) => {
  // Write reviewQuery first in order to get a new review id

  // Make sure to handle single quotes in strings
  const reviewQuery = `
    INSERT INTO reviews (product_id, rating, date, summary,
      body, recommend, reported, reviewer_name,
      reviewer_email, response, helpfulness)
      VALUES (
      ${req.body.product_id},
      ${req.body.rating},
      current_timestamp,
      '${req.body.summary.split("'").join("''")}',
      '${req.body.body.split("'").join("''")}',
      ${req.body.recommend},
      false,
      '${req.body.reviewer_name}',
      '${req.body.reviewer_email}',
      'null',
      0
      )
  `;

  // Query to get review ID once new review has been submitted. To do - research currval
  const getReviewID = `
  SELECT review_id FROM reviews
  WHERE product_id = ${req.body.product_id}
  AND rating =${req.body.rating}
  AND reviewer_name= '${req.body.reviewer_name}'
  ORDER BY review_id DESC;
  `;
  await pool.query(reviewQuery);
  const reviewArr = await pool.query(getReviewID);
  const reviewID = reviewArr.rows[0].review_id;

  // Now review id is received move onto photos
  let photoInserts = ``;
  req.body.photos.map( (url, index) => {
    if (index === req.body.photos.length -1 ) {
      photoInserts += `(${reviewID}, '${url}');`;
    } else {
      photoInserts += `(${reviewID}, '${url}'),\n`;
    }
  });
  const photoQuery = `INSERT INTO reviews_photos (reviews_id, url) VALUES\n`
  + photoInserts;
  await pool.query(photoQuery);

  // Now process characteristics
  let charInserts = ``;
  const lastTrait = Object.keys(req.body.characteristics).reverse();
  for ( const [key, value] of Object.entries(req.body.characteristics)) {
    if (key === lastTrait[0]) {
      charInserts += `(${key}, ${reviewID}, ${value});`;
    } else {
      charInserts += `(${key}, ${reviewID}, ${value}),`;
    }
  }
  const charQuery = `INSERT INTO characteristics_review (characteristic_id, review_id, value) VALUES\n` + charInserts;
  await pool.query(charQuery);

  // Ending process
  res.status(204);
  res.end();
};

const upHelpful = (req, res) => {
  const review_id = parseInt(req.params.review_id);
  const query = `UPDATE reviews SET helpfulness = helpfulness + 1
  where review_id = ${review_id};`
  pool.query(query, (err, results) => {
    if (err) {
      console.log(err);
    }
    res.status(204);
    res.end();
  })
};

const report = (req, res) => {
  const review_id = parseInt(req.params.review_id);
  const query = `UPDATE reviews SET reported = true
  where review_id = ${review_id};`
  pool.query(query, (err, results) => {
    if (err) {
      console.log(err);
    }
    res.status(204);
    res.end();
  })
};

const unReport = (req, res) => {
  const review_id = parseInt(req.params.review_id);
  const query = `UPDATE reviews SET reported = false
  where review_id = ${review_id};`
  pool.query(query, (err, results) => {
    if (err) {
      console.log(err);
    }
    res.status(204);
    res.end();
  })
};

module.exports = {
  getReviews,
  getMeta,
  addReview,
  upHelpful,
  report,
  unReport
}