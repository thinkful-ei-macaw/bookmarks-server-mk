const express = require('express');
const xss = require('xss');
const path = require('path');
const { isWebUri } = require('valid-url');

const bookmarksRouter = express.Router();
const BookmarksService = require('./bookmarks-service');

// middleware setup
bookmarksRouter.use(express.json());

// sanitizing person data before it goes out
const serializeBookmark = bookmark => {
  return {
    id: bookmark.id,
    url: bookmark.url,
    title: xss(bookmark.title),
    description: xss(bookmark.description),
    rating: bookmark.rating
  };
};


// bookmark validation
const validateBookmark = (requestBody, inserting=true) => {
  const { url, rating } = requestBody;

  if (inserting === true) {
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
  
  // if no fields provided
  if (inserting === false && Object.keys(bookmark).length === 0) {
    return { error: 'Must provide at least one of title, url, rating or description' };
  }

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
        .location(path.posix.join(req.originalUrl, '/' + bookmark.id))
        .json(serializeBookmark(bookmark));
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
        .json(bookmarks.map(serializeBookmark));
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
        .json(serializeBookmark(bookmark));

    })
    .catch(next);
});


// PATCH requests (UPDATE)
bookmarksRouter.patch('/:id', (req, res, next) => {
  const { id } = req.params;
  const db = req.app.get('db');

  // check that bookmark with matching id exists
  BookmarksService.getBookmarkByID(db, id)
    .then(bookmark => {
      if (!bookmark) {
        return res
          .status(404)
          .send('Bookmark Not Found');
      }

      // get fields to update
      const bookmarkToUpdate = validateBookmark(req.body, false);
      if (bookmarkToUpdate.error) {
        return res
          .status(400)
          .send(bookmarkToUpdate.error);
      }

      BookmarksService.updateBookmark(db, id, bookmarkToUpdate)
        .then(() => {
          return res
            .status(204)
            .end();
        });

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