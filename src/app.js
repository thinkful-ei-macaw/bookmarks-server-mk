require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const helmet = require('helmet');

const { NODE_ENV } = require('./config');
const bookmarksRouter = require('./bookmarks/bookmarks-router');

const app = express();
const morganOption = (NODE_ENV === 'production') ?
  'tiny' :
  'common';


// set up middleware
app.use(morgan(morganOption));
app.use(helmet());
app.use(cors());
// app.use(validateBearerToken);


// token validation
// eslint-disable-next-line no-unused-vars
function validateBearerToken(req, res, next) {
  const apiToken = process.env.API_TOKEN;
  const authToken = req.get('Authorization');

  if (!authToken || authToken.split(' ')[1] !== apiToken) {
    return res.status(401).json({
      error: 'Unauthorized request'
    });
  }
  next();
}


// request handling
app.get('/', (req, res) => {
  res.status(200).send('Hello, world!');
});

app.use('/bookmarks', bookmarksRouter);


// error handling
// eslint-disable-next-line no-unused-vars
const errorHandler = (error, req, res, next) => {
  let response;
  if (NODE_ENV === 'production') {
    response = {
      error: {
        message: 'Server error'
      }
    };
  } else {
    response = {
      message: error.message,
      error
    };
  }

  res.status(500).json(response);
};

app.use(errorHandler);


// the bottom line, literally
module.exports = app;