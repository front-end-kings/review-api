const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const app = express();
const db = require('./database/reviews/dbQueries');
const config = require('../config/config');
const PORT = 3000;

app.use(morgan('dev'));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded( { extended: true } ));

app.listen(PORT, () => {
  console.log(`listening at port ${PORT}`);
});

app.get('/reviews/', db.getReviews);
app.get('/reviews/meta', db.getMeta);
app.post('/reviews', db.addReview);
app.put('/reviews/:review_id/helpful', db.upHelpful);
app.put('/reviews/:review_id/report', db.report);
app.put('/reviews/:review_id/unreport', db.unReport);
app.get(`/${config.loaderio}`, (req, res) => {
  res.send(`${config.loaderio}`);
});