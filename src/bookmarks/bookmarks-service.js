const BookmarksService = {
  getAllBookmarks(db) {
    return db 
      .from('bookmarks')
      .select();
  },

  getBookmarkByID(db, id) {
    return db 
      .from('bookmarks')
      .select()
      .where({ id })
      .first();
  },

  addBookmark(db, bookmark) {
    return db
      .into('bookmarks')
      .insert(bookmark)
      .returning('*')
      .then(rows => rows[0]);
  },

  updateBookmark(db, id, data) {
    return db
      .from('bookmarks')
      .where({ id })
      .update(data);
  },

  deleteBookmark(db, id) {
    return db
      .from('bookmarks')
      .where( { id })
      .delete();
  },

};


module.exports = BookmarksService;