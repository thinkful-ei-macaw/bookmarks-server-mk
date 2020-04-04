const knex = require('knex');
const app = require('../src/app');
const { TEST_DB_URL } = require('../src/config');
const BASE_URL = '/api/bookmarks/';

const { makeBookmarksArray, randomBookmark } = require('./bookmarks.fixtures');

describe('Bookmarks endpoints', () => {
  let db;

  before('set up db instance', () => {
    db = knex({
      client: 'pg',
      connection: TEST_DB_URL
    });

    app.set('db', db);
  });

  const cleanBookmarks = () => db.from('bookmarks').truncate();
  before('clean the table', cleanBookmarks);
  afterEach('clean the table', cleanBookmarks);

  after('disconnect from the db', () => db.destroy());


  // POST requests (CREATE)
  describe('POST /bookmarks', () => {
    before('clean the table', cleanBookmarks);

    context('Given correct data', () => {
      it('responds with 201 and inserts bookmark', () => {
        const testBookmark = randomBookmark();
        return supertest(app)
          .post(BASE_URL)
          .send(testBookmark)
          .expect(201)
          .expect(res => {
            expect(res.body.title).to.equal(testBookmark.title);
            expect(res.body.url).to.equal(testBookmark.url);
            expect(res.body.rating).to.equal(testBookmark.rating);
            expect(res.body).to.have.property('id');
            expect(res.headers.location).to.equal(BASE_URL + res.body.id);
  
            if (testBookmark.description) expect(res.body.description).to.equal(testBookmark.description);
          })
          .then(res => {
            return supertest(app)
              .get(BASE_URL + res.body.id)
              .expect(res.body);
          });
      });
    });

    context('Given invalid data', () => {
      const requiredFields = ['title', 'url', 'rating'];
      requiredFields.forEach(field => {
        
        it(`returns 400 when required field '${field}' is omitted`, () => {
          const testBookmark = randomBookmark();
          delete testBookmark[field];

          return supertest(app)
            .post(BASE_URL)
            .send(testBookmark)
            .expect(400, `'${field}' is required`);

        });

      });

      it('returns 400 when rating provided is not a number between 1 and 5', () => {
        const testBookmark = randomBookmark();
        testBookmark.rating = 21;

        return supertest(app)
          .post(BASE_URL)
          .send(testBookmark)
          .expect(400, 'Rating must be a number between 1 and 5');
      });

      it('returns 400 when url is not a valid url', () => {
        const testBookmark = randomBookmark();
        testBookmark.url = 'some-invalid-url';

        return supertest(app)
          .post(BASE_URL)
          .send(testBookmark)
          .expect(400, 'Url must be a valid HTTP/HTTPS link');
      });
    });

  });


  // GET requests (READ)
  describe('GET /bookmarks', () => {
    context('Given bookmarks exist in the table', () => {
      const testBookmarks = makeBookmarksArray();
      beforeEach(() => {
        return db
          .into('bookmarks')
          .insert(testBookmarks);
      });
  
      it('responds with 200 and an array of bookmarks', () => {
        return supertest(app)
          .get(BASE_URL)
          .expect(200, testBookmarks);
      });
    });

    context('Given no bookmarks', () => {
      it('responds with 200 and an empty array', () => {
        return supertest(app)
          .get(BASE_URL)
          .expect(200, []);
      });
    });
  });

  describe('GET /bookmarks/:id', () => {
    context('Given bookmarks exist in the table', () => {
      const testBookmarks = makeBookmarksArray();
      beforeEach(() => {
        return db
          .into('bookmarks')
          .insert(testBookmarks);
      });
  
      it('responds with 200 and the specified bookmark', () => {
        const testBookmark = randomBookmark();
        const { id } = testBookmark;
  
        return supertest(app)
          .get(BASE_URL + id)
          .expect(200, testBookmark);
      });
    });

    context('Given an XSS attack bookmark', () => {
      const testBookmark = randomBookmark();
      testBookmark.description = '<img src="https://website.com/no-image.jpg" onerror="console.log(document.cookie)">';
  
      before('insert bookmark with XSS attack description', () => {
        return db
          .into('bookmarks')
          .insert(testBookmark);
      });
  
      it('removes XSS attack content', () => {
        const { id } = testBookmark;
  
        return supertest(app)
          .get(BASE_URL + id)
          .expect(200)
          .expect(res => {
            expect(res.body.description).to.equal('<img src="https://website.com/no-image.jpg">');
          });
      });
    });
  
    context('Given no bookmarks', () => {  
      it('responds with 404', () => {
        const id = makeBookmarksArray()[0].id;
  
        return supertest(app)
          .get(BASE_URL + id)
          .expect(404, 'Bookmark Not Found');
      });
    });
  });


  // PATCH requests (UPDATE)
  describe('PATCH /bookmarks/:id', () => {
    context('Given bookmark exists in the table', () => {
      const testBookmark = randomBookmark();
      const { id } = testBookmark;

      beforeEach('insert record to update', () => {
        return db
          .into('bookmarks')
          .insert(testBookmark);
      });

      it('responds with 204 and updates the bookmark', () => {
        return supertest(app)
          .patch(BASE_URL + id)
          .send({ title: 'Updated title' })
          .expect(204)
          .then(() => {
            return supertest(app)
              .get(BASE_URL + id)
              .expect(res => {
                expect(res.body.title).to.equal('Updated title');
              });
          });
      });

      it('responds with 204 when updating a subset of fields', () => {
        return supertest(app)
          .patch(BASE_URL + id)
          .send({ ...testBookmark, extraValue: 'should not be in GET response' })
          .expect(204)
          .then(() => {
            return supertest(app)
              .get(BASE_URL + id)
              .expect(testBookmark);
          });
      });

      it('responds 400 when no required fields are supplied', () => {
        return supertest(app)
          .patch(BASE_URL + id)
          .send({ irrelevantField: 'foo' })
          .expect(400, 'Must provide at least one of title, url, rating or description');
      });
    });

    context('Given no bookmarks', () => {
      it('responds with 404', () => {
        const { id } = randomBookmark();
        return supertest(app)
          .patch(BASE_URL + id)
          .expect(404);
      });
    });
  });


  // DELETE requests (DELETE)
  describe('DELETE /bookmarks/:id', () => {
    context('Given bookmarks exist in the table', () => {
      const testBookmark = randomBookmark();

      before('insert record to delete', () => {
        return db
          .into('bookmarks')
          .insert(testBookmark);
      });

      it('returns 204 and deletes bookmark', () => {
        const { id } = testBookmark;
        return supertest(app)
          .delete(BASE_URL + id)
          .expect(204)
          .then(() => {

            // make a call for the same bookmark
            return supertest(app)
              .get(BASE_URL + id)
              .expect(404, 'Bookmark Not Found');
          });
      });
    });
    
    context('Given no bookmarks', () => {
      it('responds with 404', () => {
        const testBookmark = randomBookmark();
        const { id } = testBookmark;
        return supertest(app)
          .delete(BASE_URL + id)
          .expect(404, 'Bookmark Not Found');
      });
    });
  });


});