const express = require('express');
const xss = require('xss');
const { isWebUri } = require('valid-url');

const bookmarksRouter = express.Router();
const BookmarksService = require('./bookmarks-service');

// middleware setup
bookmarksRouter.use(express.json());

// sanitizing person data before it goes out
const sanitizeBookmark = bookmark => {
  return {
    id: bookmark.id,
    url: bookmark.url,
    title: xss(bookmark.title),
    description: xss(bookmark.description),
    rating: bookmark.rating
  };
};


// bookmark validation
const validateBookmark = (requestBody, required=true) => {
  const { url, rating } = requestBody;

  if (required === true) {
    const requiredFields = ['title', 'url', 'rating'];
    for (let field of requiredFields) {
      if (!requestBody[field]) {
        return { error: `'${field}' is required` };
      }
    }
  }

  // check that rating is a number
  if (rating && !Number.isInteger(rating) || rating < 1 || rating > 5 ) {
    return { error: 'Rating must be a number between 1 and 5' };
  }

  // check that the URI is valid
  if (url && !isWebUri(url)) {
    return { error: 'Url must be a valid HTTP/HTTPS link' };
  }

  const bookmark = {};

  const fields = ['title', 'url', 'rating', 'description'];
  fields.forEach(field => {
    if (requestBody[field]) bookmark[field] = requestBody[field];
  });
  
  return bookmark;
};


// POST requests (CREATE)
bookmarksRouter.post('/', (req, res, next) => {
  const db = req.app.get('db');
  const bookmarkToAdd = validateBookmark(req.body);

  if (bookmarkToAdd.error) {
    return res
      .status(400)
      .send(bookmarkToAdd.error);
  }

  BookmarksService.addBookmark(db, bookmarkToAdd)
    .then(bookmark => {
      return res
        .status(201)
        .location(`/bookmarks/${bookmark.id}`)
        .json(sanitizeBookmark(bookmark));
    })
    .catch(next);
  
});


// GET requests (READ)
bookmarksRouter.get('/', (req, res, next) => {
  const db = req.app.get('db');
  BookmarksService.getAllBookmarks(db)
    .then(bookmarks => {
      return res
        .status(200)
        .json(bookmarks.map(sanitizeBookmark));
    })
    .catch(next);
});

bookmarksRouter.get('/:id', (req, res, next) => {
  const { id } = req.params;
  const db = req.app.get('db');

  BookmarksService.getBookmarkByID(db, id)
    .then(bookmark => {
      if (!bookmark) {
        return res
          .status(404)
          .send('Bookmark Not Found');
      }

      return res
        .status(200)
        .json(sanitizeBookmark(bookmark));

    })
    .catch(next);
});


// DELETE requests (DELETE)
bookmarksRouter.delete('/:id', (req, res, next) => {
  const { id } = req.params;
  const db = req.app.get('db');

  BookmarksService.getBookmarkByID(db, id)
    .then(bookmark => {
      if (!bookmark) {
        return res
          .status(404)
          .send('Bookmark Not Found');
      }

      BookmarksService.deleteBookmark(db, id)
        .then(() => {
          return res
            .status(204)
            .end();
        });
    })
    .catch(next);
});

module.exports = bookmarksRouter;