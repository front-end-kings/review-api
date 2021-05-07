const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const app = express();
const db = require('./database/reviews/dbQueries');
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