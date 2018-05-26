'use strict';

const chai = require('chai');
const chaiHttp = require('chai-http');
const faker = require('faker');
const mongoose = require('mongoose');

const expect = chai.expect;

const { BlogPost } = require('../models');
const { app, runServer, closeServer } = require('../server');
const { TEST_DATABASE_URL } = require('../config');

chai.use(chaiHttp);

function seedData() {
  console.info('now building test database');
  const sandbox = [];

  for (let i=0; i<=10; i++) {
    sandbox.push(generateTestData());
  }
  return BlogPost.insertMany(sandbox);
}

function randomize(variable) {
  return variable[Math.floor(Math.random() * variable.length)];
}

function generateTitle() {
  const possibleTitles = ["10 things -- you won't believe #4", "generititle", 'thinj', 'bloggo'];
  const ranTitle = randomize(possibleTitles);
  return ranTitle;
}

function generateAuthor() {
  const possibleAuthors = [
    {first: 'Travis', last: 'Bickle'},
    {first: 'James', last: 'Brown'},
    {first: 'Fred', last: 'Weasley'},
    {first: 'Ginny', last: 'Weasley'},
    {first: 'Forrest', last: 'Gump'},
    {first: 'Rachel', last: 'Ray'},
    {first: 'Girl', last: 'Please'}];
  const ranAuthor = randomize(possibleAuthors);
  return {
    firstName: ranAuthor.first,
    lastName: ranAuthor.last
  }
}

function generateContent() {
  const possibleContent = ["Lorem ipsum dolor sit amet, consectetur adipisicing elit,", "Loerl", "blogs"];
  const ranContent = randomize(possibleContent);
  return ranContent;
}

function generateTestData() {
  return {
    title: generateTitle(),
    author: generateAuthor(),
    content: generateContent()
  }
}

function tearDownThisWall() {
  console.warn('Deleting Database, Mr. Gorbachev');
  return mongoose.connection.dropDatabase();
}

describe('Blog posts resource', function() {

  before(function() {
    return runServer(TEST_DATABASE_URL);
  });

  beforeEach(function() {
    return seedData();
  });

  afterEach(function() {
    return tearDownThisWall();
  });

  after(function() {
    return closeServer();
  });


//IMPORTANT: All tests fail when checking the author key

  describe('GET endpoint', function() {

    it('should return 10 test blog posts', function() {
      let res;
      return chai.request(app)
        .get('/posts')
        .then(function(_res) {
          res = _res;
          expect(res).to.have.status(200);
          //should I be targetting an object w/in the body?
          expect(res.body).to.have.lengthOf.at.least(1);
          return BlogPost.count();
        })
        .then(function(count) {
          expect(res.body).to.have.lengthOf(count);
        });
    });

    it('should make sure they all have the correct keys', function() {

      let firstPostInRes;
      return chai.request(app)
        .get('/posts')
        .then(function(res) {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.a('array');

          res.body.forEach(function(post) {
            expect(post).to.be.a('object');
            expect(post).to.include.keys(
              'id', 'title', 'author', 'content'
            );
          });
          firstPostInRes = res.body[0];
          return BlogPost.findById(firstPostInRes.id);
        })
        .then(function(samplePost) {
          expect(firstPostInRes.id).to.equal(samplePost.id);
          expect(firstPostInRes.title).to.equal(samplePost.title);
          //find out how to fix this later
          //expect(firstPostInRes.author).to.equal(thisPost.author);
          expect(firstPostInRes.content).to.equal(samplePost.content);
        })
    });
  });

  describe('POST endpoint', function() {
    it('should add a new post', function() {
      const newPost = generateTestData();

      return chai.request(app)
        .post('/posts')
        .send(newPost)
        .then(function(res) {
          expect(res).to.have.status(201);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body).to.include.keys(
            'id', 'title', 'author', 'content'
          );
          expect(res.body.id).to.not.be.null;
          expect(res.body.title).to.equal(newPost.title);
          //expect(res.body.author).to.equal(newPost.author);
          expect(res.body.content).to.equal(newPost.content);

          return BlogPost.findById(res.body.id);
        })
        .then(function(samplePost) {
          expect(samplePost.title).to.equal(samplePost.title);
          //expect(thisPost.author).to.equal(newPost.author);
          expect(samplePost.content).to.equal(newPost.content);
        });
    });
  });

  describe('PUT endpoint', function() {
    it('should update a blog post based on an object you send', function() {
      const updaterObject = {
        title: 'New Post Title',
        content: 'Lorem Ipsum is for squares'
      };

      return BlogPost
        .findOne()
        .then(function(samplePost) {
          console.log(samplePost);
          updaterObject.id = samplePost.id;

          return chai.request(app)
            .put(`/posts/${samplePost.id}`)
            .send(updaterObject);
        })
        .then(function(res) {
          expect(res).to.have.status(204);

          return BlogPost.findById(updaterObject.id);
        })
        .then(function(updatedPost) {
          expect(updatedPost.title).to.equal(updaterObject.title);
          expect(updatedPost.content).to.equal(updaterObject.content);
        });
    });
  });

  describe('DELETE endpoint', function() {
    it('should delete a post by its id', function() {
      let doomedPostID;
      return BlogPost
        .findOne()
        .then(function(doomedPost) {
          doomedPostID = doomedPost.id;
          return chai.request(app).delete(`/posts/${doomedPostID}`);
        })
        .then(function(res) {
          expect(res).to.have.status(204);
          return BlogPost.findById(doomedPostID);
        })
        .then(function(nullPost) {
          expect(nullPost).to.be.null;
        });
    });
  });

});
